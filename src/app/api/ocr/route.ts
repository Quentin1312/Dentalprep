import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getGroq, VISION_MODEL } from '@/lib/groq'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const form = await req.formData()
    const file = form.get('file') as File | null
    const moduleId = form.get('moduleId') as string
    const courseId = form.get('courseId') as string
    const pageNumber = parseInt(form.get('pageNumber') as string ?? '1')

    if (!file || !moduleId || !courseId) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const mimeType = file.type || 'image/jpeg'
    const base64 = buffer.toString('base64')

    // Try to upload to storage (optional — don't fail if it doesn't work)
    let storagePath: string | null = null
    try {
      const path = `${user.id}/${courseId}/page-${pageNumber}.jpg`
      const { error: uploadError } = await supabase.storage
        .from('course-images')
        .upload(path, buffer, { contentType: mimeType, upsert: true })
      if (!uploadError) storagePath = path
    } catch { /* storage is optional */ }

    // OCR + schema description via Groq Vision
    const completion = await getGroq().chat.completions.create({
      model: VISION_MODEL,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${base64}` },
            },
            {
              type: 'text',
              text: `Tu es un expert en formation d'assistant dentaire (CNQAOS).
Analyse cette page de cours et extrait tout son contenu pédagogique.

- Si la page contient du TEXTE : retranscris-le fidèlement avec sa structure (titres, listes, tableaux).
- Si la page contient un SCHÉMA ou une ILLUSTRATION ANATOMIQUE : décris-le en détail (toutes les parties nommées, leurs relations, leur position relative, les légendes). Par exemple pour un schéma de dent : "Schéma d'une dent en coupe transversale montrant : l'émail (couche externe), la dentine (couche intermédiaire), la pulpe (centre), le cément (sur la racine), le ligament alvéolo-dentaire...".
- Si la page contient LES DEUX : traite les deux parties.

Réponds uniquement avec le contenu extrait, sans commentaire ni introduction.`,
            },
          ],
        },
      ],
      max_tokens: 4096,
    })

    const ocrText = completion.choices[0]?.message?.content ?? ''

    // Save to DB
    const { error: dbError } = await supabase.from('course_pages').insert({
      course_id: courseId,
      page_number: pageNumber,
      ocr_text: ocrText,
      storage_path: storagePath ?? `${user.id}/${courseId}/page-${pageNumber}.jpg`,
    })

    if (dbError) {
      return NextResponse.json({ error: `DB error: ${dbError.message}` }, { status: 500 })
    }

    return NextResponse.json({ success: true, ocrText, storagePath })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[OCR ERROR]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
