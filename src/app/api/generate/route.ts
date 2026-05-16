import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getGroq, TEXT_MODEL } from '@/lib/groq'
import type { ModuleId } from '@/types/database'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { courseId, moduleId }: { courseId: string; moduleId: ModuleId } = await req.json()
  if (!courseId || !moduleId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  // Fetch all OCR text for this course
  const { data: pages } = await supabase
    .from('course_pages')
    .select('ocr_text, page_number')
    .eq('course_id', courseId)
    .order('page_number')

  if (!pages?.length) return NextResponse.json({ error: 'No pages found' }, { status: 404 })

  const fullText = pages.map(p => p.ocr_text).join('\n\n---\n\n')

  // Generate flashcards
  const flashcardsCompletion = await getGroq().chat.completions.create({
    model: TEXT_MODEL,
    messages: [
      {
        role: 'system',
        content: `Tu es un expert en préparation au CNQAOS (examen d'assistant dentaire français).
Génère des flashcards de révision à partir du texte de cours fourni.
Réponds UNIQUEMENT avec un JSON valide, sans markdown ni commentaire.`,
      },
      {
        role: 'user',
        content: `Texte du cours :\n\n${fullText}\n\nGénère 8 à 12 flashcards sous ce format JSON exact :
[{"concept": "terme ou question courte", "definition": "réponse ou définition claire et complète"}]`,
      },
    ],
    max_tokens: 3000,
    response_format: { type: 'json_object' },
  })

  // Generate quiz questions
  const quizCompletion = await getGroq().chat.completions.create({
    model: TEXT_MODEL,
    messages: [
      {
        role: 'system',
        content: `Tu es un expert en préparation au CNQAOS.
Génère des questions QCM de révision à partir du texte de cours fourni.
Réponds UNIQUEMENT avec un JSON valide, sans markdown ni commentaire.`,
      },
      {
        role: 'user',
        content: `Texte du cours :\n\n${fullText}\n\nGénère 6 à 8 questions QCM sous ce format JSON exact :
{"questions": [{"question": "Question?", "choices": ["A", "B", "C", "D"], "correct_index": 0, "explanation": "Explication courte"}]}`,
      },
    ],
    max_tokens: 3000,
    response_format: { type: 'json_object' },
  })

  let flashcards: { concept: string; definition: string }[] = []
  let questions: { question: string; choices: string[]; correct_index: number; explanation: string }[] = []

  try {
    const fRaw = JSON.parse(flashcardsCompletion.choices[0]?.message?.content ?? '[]')
    flashcards = Array.isArray(fRaw) ? fRaw : fRaw.flashcards ?? []
  } catch { flashcards = [] }

  try {
    const qRaw = JSON.parse(quizCompletion.choices[0]?.message?.content ?? '{}')
    questions = qRaw.questions ?? []
  } catch { questions = [] }

  // Save to DB
  const [flashcardsResult, quizResult] = await Promise.all([
    flashcards.length > 0
      ? supabase.from('flashcards').insert(
          flashcards.map(f => ({
            user_id: user.id,
            course_id: courseId,
            module_id: moduleId,
            concept: f.concept,
            definition: f.definition,
          }))
        )
      : Promise.resolve({ error: null }),
    questions.length > 0
      ? supabase.from('quiz_questions').insert(
          questions.map(q => ({
            user_id: user.id,
            course_id: courseId,
            module_id: moduleId,
            question: q.question,
            choices: q.choices,
            correct_index: q.correct_index,
            explanation: q.explanation,
          }))
        )
      : Promise.resolve({ error: null }),
  ])

  if (flashcardsResult.error || quizResult.error) {
    return NextResponse.json({ error: 'DB insert failed' }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    flashcardsCount: flashcards.length,
    questionsCount: questions.length,
  })
}
