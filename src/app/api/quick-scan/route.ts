import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getGroq, VISION_MODEL, TEXT_MODEL } from '@/lib/groq'

export const maxDuration = 60

function extractJson(raw: string): unknown {
  const stripped = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  return JSON.parse(stripped)
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const form = await req.formData()
    const files = form.getAll('file') as File[]
    if (!files.length) return NextResponse.json({ error: 'No files' }, { status: 400 })

    // OCR all pages
    const ocrParts = await Promise.all(files.map(async (file) => {
      const buffer = Buffer.from(await file.arrayBuffer())
      const base64 = buffer.toString('base64')
      const mimeType = file.type || 'image/jpeg'

      const completion = await getGroq().chat.completions.create({
        model: VISION_MODEL,
        messages: [{
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
            { type: 'text', text: `Tu es un expert en formation d'assistant dentaire (CNQAOS).
Analyse cette image et extrait tout son contenu pédagogique.
- Texte : retranscris fidèlement avec sa structure.
- Schéma/illustration : décris en détail toutes les parties nommées.
Réponds uniquement avec le contenu extrait, sans commentaire.` },
          ],
        }],
        max_tokens: 2048,
      })
      return completion.choices[0]?.message?.content ?? ''
    }))

    const fullText = ocrParts.join('\n\n---\n\n').slice(0, 12000)

    // Generate flashcards + quiz in parallel
    const [flashcardsCompletion, quizCompletion] = await Promise.all([
      getGroq().chat.completions.create({
        model: TEXT_MODEL,
        messages: [
          {
            role: 'system',
            content: `Tu es un expert en préparation au CNQAOS.
Génère des flashcards de révision à partir du texte fourni.
Réponds UNIQUEMENT avec un JSON valide, sans markdown.
Format : {"flashcards":[{"concept":"...","definition":"..."}]}`,
          },
          { role: 'user', content: `Texte :\n\n${fullText}\n\nGénère 6 à 10 flashcards.` },
        ],
        max_tokens: 2000,
      }),
      getGroq().chat.completions.create({
        model: TEXT_MODEL,
        messages: [
          {
            role: 'system',
            content: `Tu es un expert en préparation au CNQAOS.
Génère des questions QCM à partir du texte fourni.
Réponds UNIQUEMENT avec un JSON valide, sans markdown.
Format : {"questions":[{"question":"?","choices":["A","B","C","D"],"correct_index":0,"explanation":"..."}]}`,
          },
          { role: 'user', content: `Texte :\n\n${fullText}\n\nGénère 4 à 6 questions QCM.` },
        ],
        max_tokens: 2000,
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

    return NextResponse.json({ flashcards, questions, ocrText: fullText })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[QUICK-SCAN ERROR]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
