import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getGroq, TEXT_MODEL } from '@/lib/groq'

export const maxDuration = 30

type ChatMessage = { role: 'user' | 'assistant'; content: string }

type Body = {
  question: string
  userAnswer?: string
  correctAnswer?: string
  explanation?: string
  history?: ChatMessage[]
  followUp?: string
}

const SYSTEM = `Tu es un assistant pédagogique pour des étudiants en odontologie préparant l'examen CNQAOS (assistant dentaire).

Règles strictes :
- Réponds en français, ton chaleureux, tutoiement.
- Sois concis : 2-4 phrases maximum par réponse, sauf si on te demande explicitement plus.
- Reformule simplement quand l'explication officielle est trop technique.
- Si c'est pertinent : donne un moyen mnémotechnique ou un exemple concret.
- N'ajoute pas de blabla type "bien sûr, voici…". Va droit au but.
- Si l'élève pose une question hors-sujet : ramène-le gentiment au cours.
- Pas de markdown lourd. Tirets simples acceptés, pas de gras.`

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json() as Body
    if (!body.question) return NextResponse.json({ error: 'Missing question' }, { status: 400 })

    // Construit le contexte (toujours envoyé en system) :
    const ctx = `Contexte de la question :
Question : ${body.question}
${body.userAnswer ? `Réponse de l'élève (fausse) : ${body.userAnswer}` : ''}
${body.correctAnswer ? `Bonne réponse : ${body.correctAnswer}` : ''}
${body.explanation ? `Explication officielle : ${body.explanation}` : ''}`

    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: SYSTEM },
      { role: 'system', content: ctx },
    ]

    // Si c'est la première interaction (pas d'historique), on injecte une demande implicite
    if (!body.history || body.history.length === 0) {
      messages.push({
        role: 'user',
        content: "Je n'ai pas compris pourquoi je me suis trompé. Tu peux m'expliquer simplement ?",
      })
    } else {
      // Append history then the new follow-up
      for (const m of body.history) messages.push(m)
      if (body.followUp) messages.push({ role: 'user', content: body.followUp })
    }

    const groq = getGroq()
    const completion = await groq.chat.completions.create({
      model: TEXT_MODEL,
      messages,
      temperature: 0.4,
      max_tokens: 280,
    })

    const reply = completion.choices[0]?.message?.content?.trim() ?? ''
    return NextResponse.json({ reply })
  } catch (err) {
    console.error('explain error', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
