import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { groq, VISION_MODEL } from '@/lib/groq'

export async function POST(req: NextRequest) {
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

  // Upload image to Supabase Storage
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const storagePath = `${user.id}/${courseId}/page-${pageNumber}.jpg`

  const { error: uploadError } = await supabase.storage
    .from('course-images')
    .upload(storagePath, buffer, { contentType: file.type, upsert: true })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  // Convert to base64 for Groq Vision
  const base64 = buffer.toString('base64')
  const mimeType = file.type || 'image/jpeg'

  const completion = await groq.chat.completions.create({
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
            text: 'Extrait tout le texte visible sur cette image de cours médical/dentaire. Conserve la structure (titres, listes, tableaux). Réponds uniquement avec le texte extrait, sans commentaire.',
          },
        ],
      },
    ],
    max_tokens: 4096,
  })

  const ocrText = completion.choices[0]?.message?.content ?? ''

  // Save page to DB
  const { error: dbError } = await supabase.from('course_pages').insert({
    course_id: courseId,
    page_number: pageNumber,
    ocr_text: ocrText,
    storage_path: storagePath,
  })

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, ocrText, storagePath })
}
