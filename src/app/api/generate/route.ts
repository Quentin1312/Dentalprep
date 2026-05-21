import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getGroq, TEXT_MODEL } from '@/lib/groq'
import type { ModuleId } from '@/types/database'

export const maxDuration = 60

const MODULE_FOCUS: Record<string, string> = {
  M1: 'communication patient, accueil, éducation bucco-dentaire, relation soignant-soigné',
  M2: 'assistance clinique au fauteuil, instruments, actes techniques, pharmacologie, pathologies',
  M3: 'urgences médicales, gestes d\'urgence, voies aériennes, circulation sanguine, AFGSU',
  M4: 'hygiène, asepsie, stérilisation, microbiologie, prévention des infections',
  M5: 'risques professionnels, prévention des risques au travail, gestion des stocks',
  M6: 'gestion administrative, CCAM, dossier patient, remboursements',
}

function extractJson(raw: string): unknown {
  const stripped = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  return JSON.parse(stripped)
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { courseId, moduleId, modules }: { courseId: string; moduleId: ModuleId; modules?: ModuleId[] } = await req.json()
    if (!courseId || !moduleId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const targetModules: ModuleId[] = modules?.length ? modules : [moduleId]

    const { data: pages } = await supabase
      .from('course_pages')
      .select('ocr_text, page_number')
      .eq('course_id', courseId)
      .order('page_number')

    if (!pages?.length) return NextResponse.json({ error: 'No pages found' }, { status: 404 })

    const fullText = pages.map(p => p.ocr_text).join('\n\n---\n\n').slice(0, 12000)

    const qPerModule = Math.max(4, Math.round(8 / targetModules.length))

    // Génération flashcards (module principal uniquement) + questions par module en parallèle
    const [flashcardsCompletion, ...quizCompletions] = await Promise.all([
      getGroq().chat.completions.create({
        model: TEXT_MODEL,
        messages: [
          {
            role: 'system',
            content: `Tu es un expert CNQAOS. Génère des flashcards de révision.
Réponds UNIQUEMENT avec un JSON valide.
Format : {"flashcards":[{"concept":"...","definition":"..."}]}`,
          },
          { role: 'user', content: `Texte :\n\n${fullText}\n\nGénère 8 à 12 flashcards.` },
        ],
        max_tokens: 3000,
      }),
      ...targetModules.map(mod =>
        getGroq().chat.completions.create({
          model: TEXT_MODEL,
          messages: [
            {
              role: 'system',
              content: `Tu es un expert CNQAOS. Génère des QCM spécifiquement orientés vers : ${MODULE_FOCUS[mod] ?? mod}.
Les questions doivent tester des connaissances directement utiles pour ce rôle.
Réponds UNIQUEMENT avec un JSON valide.
Format : {"questions":[{"question":"?","choices":["A","B","C","D"],"correct_index":0,"explanation":"..."}]}`,
            },
            {
              role: 'user',
              content: `Texte du cours :\n\n${fullText}\n\nGénère ${qPerModule} questions QCM pour le module ${mod} (${MODULE_FOCUS[mod] ?? mod}). Ne pas chevaucher avec d'autres modules.`,
            },
          ],
          max_tokens: 2000,
        })
      ),
    ])

    let flashcards: { concept: string; definition: string }[] = []
    try {
      const fRaw = extractJson(flashcardsCompletion.choices[0]?.message?.content ?? '{}') as Record<string, unknown>
      const arr = fRaw.flashcards ?? fRaw
      flashcards = Array.isArray(arr) ? arr : []
    } catch { flashcards = [] }

    const questionsByModule: { mod: ModuleId; questions: { question: string; choices: string[]; correct_index: number; explanation: string }[] }[] = []
    for (let i = 0; i < targetModules.length; i++) {
      try {
        const qRaw = extractJson(quizCompletions[i].choices[0]?.message?.content ?? '{}') as Record<string, unknown>
        const qs = Array.isArray(qRaw.questions) ? qRaw.questions as typeof questionsByModule[0]['questions'] : []
        questionsByModule.push({ mod: targetModules[i], questions: qs })
      } catch { questionsByModule.push({ mod: targetModules[i], questions: [] }) }
    }

    const totalQuestions = questionsByModule.reduce((s, e) => s + e.questions.length, 0)
    if (flashcards.length === 0 && totalQuestions === 0) {
      return NextResponse.json({ error: 'AI returned no content' }, { status: 500 })
    }

    const [flashcardsResult, ...quizResults] = await Promise.all([
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
      ...questionsByModule.map(({ mod, questions }) =>
        questions.length > 0
          ? supabase.from('quiz_questions').insert(
              questions.map(q => ({
                user_id: user.id,
                course_id: courseId,
                module_id: mod,
                question: q.question,
                choices: q.choices,
                correct_index: q.correct_index,
                explanation: q.explanation,
              }))
            )
          : Promise.resolve({ error: null })
      ),
    ])

    const dbError = flashcardsResult.error ?? quizResults.find(r => r.error)?.error
    if (dbError) return NextResponse.json({ error: `DB insert failed: ${dbError.message}` }, { status: 500 })

    return NextResponse.json({
      success: true,
      flashcardsCount: flashcards.length,
      questionsCount: totalQuestions,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[GENERATE ERROR]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
