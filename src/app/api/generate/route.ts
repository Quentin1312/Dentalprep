import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getGroq, TEXT_MODEL } from '@/lib/groq'
import type { ModuleId } from '@/types/database'

export const maxDuration = 60

function extractJson(raw: string): unknown {
  // Strip markdown code fences if present
  const stripped = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  return JSON.parse(stripped)
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { courseId, moduleId }: { courseId: string; moduleId: ModuleId } = await req.json()
    if (!courseId || !moduleId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const { data: pages } = await supabase
      .from('course_pages')
      .select('ocr_text, page_number')
      .eq('course_id', courseId)
      .order('page_number')

    if (!pages?.length) return NextResponse.json({ error: 'No pages found' }, { status: 404 })

    // Limit text to ~12 000 chars to stay within context window
    const fullText = pages.map(p => p.ocr_text).join('\n\n---\n\n').slice(0, 12000)

    const [flashcardsCompletion, quizCompletion] = await Promise.all([
      getGroq().chat.completions.create({
        model: TEXT_MODEL,
        messages: [
          {
            role: 'system',
            content: `Tu es un expert en préparation au CNQAOS (examen d'assistant dentaire français).
Génère des flashcards de révision à partir du texte de cours fourni.
Réponds UNIQUEMENT avec un JSON valide, sans markdown ni balise de code.
Format attendu : {"flashcards":[{"concept":"...","definition":"..."}]}`,
          },
          {
            role: 'user',
            content: `Texte du cours :\n\n${fullText}\n\nGénère 8 à 12 flashcards.`,
          },
        ],
        max_tokens: 3000,
      }),
      getGroq().chat.completions.create({
        model: TEXT_MODEL,
        messages: [
          {
            role: 'system',
            content: `Tu es un expert en préparation au CNQAOS.
Génère des questions QCM de révision à partir du texte de cours fourni.
Réponds UNIQUEMENT avec un JSON valide, sans markdown ni balise de code.
Format attendu : {"questions":[{"question":"?","choices":["A","B","C","D"],"correct_index":0,"explanation":"..."}]}`,
          },
          {
            role: 'user',
            content: `Texte du cours :\n\n${fullText}\n\nGénère 6 à 8 questions QCM.`,
          },
        ],
        max_tokens: 3000,
      }),
    ])

    let flashcards: { concept: string; definition: string }[] = []
    let questions: { question: string; choices: string[]; correct_index: number; explanation: string }[] = []

    try {
      const fRaw = extractJson(flashcardsCompletion.choices[0]?.message?.content ?? '{}') as Record<string, unknown>
      const arr = fRaw.flashcards ?? fRaw
      flashcards = Array.isArray(arr) ? arr : []
    } catch { flashcards = [] }

    try {
      const qRaw = extractJson(quizCompletion.choices[0]?.message?.content ?? '{}') as Record<string, unknown>
      questions = Array.isArray(qRaw.questions) ? qRaw.questions as typeof questions : []
    } catch { questions = [] }

    if (flashcards.length === 0 && questions.length === 0) {
      return NextResponse.json({ error: 'AI returned no content' }, { status: 500 })
    }

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
      const msg = flashcardsResult.error?.message ?? quizResult.error?.message
      return NextResponse.json({ error: `DB insert failed: ${msg}` }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      flashcardsCount: flashcards.length,
      questionsCount: questions.length,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[GENERATE ERROR]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
