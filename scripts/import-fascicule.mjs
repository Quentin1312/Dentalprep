/**
 * Import d'un fascicule PDF → Supabase
 * Usage : node scripts/import-fascicule.mjs <chemin_pdf> <numero_fascicule>
 * Exemple : node scripts/import-fascicule.mjs "C:\Users\quent\Downloads\Cours bb\Communication.pdf" 6
 */

import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'
import Groq from 'groq-sdk'
import sharp from 'sharp'
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs'

// ── Config ──────────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL ?? ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY ?? ''
const GROQ_API_KEY = process.env.GROQ_API_KEY ?? ''
const VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct'
const TEXT_MODEL = 'llama-3.3-70b-versatile'

const FASCICULES = [
  { n: 5,  title: 'Anatomie tête et cou',                            modules: ['M1','M2','M3','M4'] },
  { n: 6,  title: 'Communication - Accueil',                         modules: ['M1'] },
  { n: 7,  title: 'Éducation Promotion à la santé Bucco-dentaire',   modules: ['M1','M4'] },
  { n: 8,  title: 'Douleur et anesthésie',                           modules: ['M2'] },
  { n: 9,  title: 'Pharmacologie',                                   modules: ['M2'] },
  { n: 10, title: 'Pathologies dentaires et buccales',               modules: ['M1','M2','M6'] },
  { n: 11, title: 'Microbiologie',                                   modules: ['M2','M4'] },
  { n: 12, title: 'Travail au fauteuil',                             modules: ['M2'] },
  { n: 13, title: 'Imagerie médicale',                               modules: ['M3'] },
  { n: 14, title: 'AFGSU 1 + 2',                                     modules: ['M3'] },
  { n: 15, title: 'Gestion des stocks',                              modules: ['M4','M5'] },
  { n: 16, title: 'Évaluation et prévention des risques au travail', modules: ['M5'] },
  { n: 17, title: 'Créer et suivre un dossier patient',              modules: ['M6'] },
  { n: 18, title: 'CCAM - Honoraires et nomenclatures',              modules: ['M6'] },
]

const MODULE_FOCUS = {
  M1: 'communication patient, accueil, relation soignant-soigné, éducation bucco-dentaire',
  M2: 'assistance clinique au fauteuil, instruments dentaires, actes techniques, pharmacologie, pathologies buccales',
  M3: 'urgences médicales, gestes d\'urgence, AFGSU, anatomie appliquée',
  M4: 'hygiène, asepsie, stérilisation, microbiologie, prévention des infections',
  M5: 'risques professionnels, prévention des risques au travail, gestion des stocks',
  M6: 'gestion administrative, CCAM, dossier patient, remboursements, nomenclatures',
}

function extractJson(raw) {
  const stripped = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  return JSON.parse(stripped)
}

/** Convertit une page PDF en JPEG base64 via pdfjs-dist + sharp */
async function pageToJpegBase64(pdfDoc, pageNum) {
  const page = await pdfDoc.getPage(pageNum)
  await page.getOperatorList()

  // Récupère la clé de l'image embarquée (scanned PDF = 1 image par page)
  const imgKey = `img_p${pageNum - 1}_1`
  const imgData = await new Promise(resolve => page.objs.get(imgKey, resolve))

  if (!imgData?.data) return null

  const { width, height, data, kind } = imgData
  // kind 2 = RGB (3ch), kind 3 = RGBA (4ch)
  const channels = kind === 2 ? 3 : 4

  const jpegBuf = await sharp(Buffer.from(data), { raw: { width, height, channels } })
    .resize({ width: 1000, withoutEnlargement: true }) // réduit pour l'API
    .jpeg({ quality: 82 })
    .toBuffer()

  return jpegBuf.toString('base64')
}

/** OCR une image base64 via Groq Vision */
async function ocrPage(groq, base64Jpeg) {
  const res = await groq.chat.completions.create({
    model: VISION_MODEL,
    messages: [{
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Jpeg}` } },
        { type: 'text', text: `Tu es un expert en formation d'assistant dentaire (CNQAOS).
Analyse cette page et extrait tout son contenu pédagogique.
- Texte : retranscris fidèlement avec sa structure (titres, listes, tableaux).
- Schéma/illustration : décris en détail toutes les parties nommées.
Réponds uniquement avec le contenu extrait, sans commentaire.` },
      ],
    }],
    max_tokens: 2048,
  })
  return res.choices[0]?.message?.content ?? ''
}

/** Génère flashcards + questions à partir du texte OCR */
async function generateContent(groq, fullText, modules) {
  const qPerModule = Math.max(5, Math.round(20 / modules.length))

  const [fcRes, ...qRes] = await Promise.all([
    groq.chat.completions.create({
      model: TEXT_MODEL,
      messages: [
        { role: 'system', content: `Tu es un expert CNQAOS. Génère des flashcards de révision.
Réponds UNIQUEMENT avec un JSON valide, sans markdown.
Format : {"flashcards":[{"concept":"...","definition":"..."}]}` },
        { role: 'user', content: `Texte du cours :\n\n${fullText}\n\nGénère 10 à 15 flashcards précises et utiles pour le CNQAOS.` },
      ],
      max_tokens: 3000,
    }),
    ...modules.map(mod => groq.chat.completions.create({
      model: TEXT_MODEL,
      messages: [
        { role: 'system', content: `Tu es un expert CNQAOS. Génère des QCM orientés vers : ${MODULE_FOCUS[mod]}.
IMPORTANT : ne mets JAMAIS la réponse entre parenthèses dans les choix.
Réponds UNIQUEMENT avec un JSON valide, sans markdown.
Format : {"questions":[{"question":"?","choices":["A","B","C","D"],"correct_index":0,"explanation":"..."}]}` },
        { role: 'user', content: `Texte du cours :\n\n${fullText}\n\nGénère ${qPerModule} questions QCM variées pour le module ${mod} (${MODULE_FOCUS[mod]}). Sans réponses entre parenthèses.` },
      ],
      max_tokens: 3000,
    })),
  ])

  let flashcards = []
  try {
    const fRaw = extractJson(fcRes.choices[0]?.message?.content ?? '{}')
    flashcards = Array.isArray(fRaw.flashcards) ? fRaw.flashcards : []
  } catch {}

  const questionsByModule = []
  for (let i = 0; i < modules.length; i++) {
    try {
      const qRaw = extractJson(qRes[i].choices[0]?.message?.content ?? '{}')
      questionsByModule.push({ mod: modules[i], questions: Array.isArray(qRaw.questions) ? qRaw.questions : [] })
    } catch {
      questionsByModule.push({ mod: modules[i], questions: [] })
    }
  }

  return { flashcards, questionsByModule }
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const [,, pdfPath, fasciculeArg] = process.argv
  if (!pdfPath || !fasciculeArg) {
    console.error('Usage : node scripts/import-fascicule.mjs <chemin_pdf> <numero_fascicule>')
    process.exit(1)
  }

  const fasciculeN = parseInt(fasciculeArg)
  const fascicule = FASCICULES.find(f => f.n === fasciculeN)
  if (!fascicule) { console.error(`Fascicule ${fasciculeN} inconnu.`); process.exit(1) }

  console.log(`\n📚 Import : Fascicule ${fascicule.n} — ${fascicule.title}`)
  console.log(`   Modules : ${fascicule.modules.join(', ')}`)
  console.log(`   PDF     : ${pdfPath}\n`)

  // Supabase + Groq
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const groq = new Groq({ apiKey: GROQ_API_KEY })

  const { data: profiles } = await supabase.from('profiles').select('id').limit(1)
  const userId = profiles?.[0]?.id
  if (!userId) { console.error('❌ Aucun utilisateur trouvé.'); process.exit(1) }
  console.log(`✅ Utilisateur : ${userId}`)

  // Charger le PDF
  console.log('📄 Chargement du PDF…')
  const pdfBuf = readFileSync(pdfPath)
  const pdfDoc = await pdfjs.getDocument({ data: new Uint8Array(pdfBuf) }).promise
  const numPages = pdfDoc.numPages
  console.log(`   ${numPages} pages détectées`)

  // Créer le cours
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .insert({
      user_id: userId,
      module_id: fascicule.modules[0],
      title: `Fascicule ${fascicule.n} — ${fascicule.title}`,
      page_count: numPages,
      storage_path: `${userId}/`,
    })
    .select().single()

  if (courseError || !course) { console.error('❌ Erreur création cours :', courseError?.message); process.exit(1) }
  console.log(`✅ Cours créé : ${course.id}\n`)

  // OCR des pages (on prend 1 page sur 3 pour éviter de saturer l'API — les PDFs de cours sont répétitifs)
  // On prend max 10 pages réparties sur tout le document
  const step = Math.max(1, Math.floor(numPages / 10))
  const pageNums = []
  for (let p = 1; p <= numPages; p += step) pageNums.push(p)

  console.log(`🔍 OCR de ${pageNums.length} pages (échantillon)…`)
  const ocrTexts = []

  for (const p of pageNums) {
    process.stdout.write(`   Page ${p}/${numPages}… `)
    try {
      const b64 = await pageToJpegBase64(pdfDoc, p)
      if (!b64) { console.log('(pas d\'image)'); continue }
      const text = await ocrPage(groq, b64)
      ocrTexts.push(text)
      console.log(`✅ ${text.length} chars`)

      // Sauvegarder la page en DB (course_pages)
      await supabase.from('course_pages').insert({
        course_id: course.id,
        page_number: p,
        ocr_text: text,
        storage_path: `${userId}/${course.id}/page-${p}.jpg`,
      })
    } catch (e) {
      console.log(`⚠️  ${e.message}`)
    }
  }

  const fullText = ocrTexts.join('\n\n---\n\n').slice(0, 12000)
  console.log(`\n   Texte total OCR : ${fullText.length} chars`)

  // Génération flashcards + questions
  console.log('\n🤖 Génération IA…')
  const { flashcards, questionsByModule } = await generateContent(groq, fullText, fascicule.modules)

  console.log(`   ${flashcards.length} flashcards`)
  for (const { mod, questions } of questionsByModule) console.log(`   ${mod} : ${questions.length} questions`)

  // Insertion en base
  console.log('\n💾 Insertion en base…')

  if (flashcards.length > 0) {
    const { error } = await supabase.from('flashcards').insert(
      flashcards.map(f => ({
        user_id: userId,
        course_id: course.id,
        module_id: fascicule.modules[0],
        concept: f.concept,
        definition: f.definition,
      }))
    )
    if (error) console.error('⚠️  Flashcards:', error.message)
    else console.log(`   ✅ ${flashcards.length} flashcards insérées`)
  }

  for (const { mod, questions } of questionsByModule) {
    if (!questions.length) continue
    const { error } = await supabase.from('quiz_questions').insert(
      questions.map(q => ({
        user_id: userId,
        course_id: course.id,
        module_id: mod,
        question: q.question,
        choices: JSON.stringify(q.choices),
        correct_index: q.correct_index,
        explanation: q.explanation ?? '',
        type: 'QCM',
      }))
    )
    if (error) console.error(`⚠️  Questions ${mod}:`, error.message)
    else console.log(`   ✅ ${questions.length} questions ${mod}`)
  }

  console.log(`\n🎉 Fascicule ${fascicule.n} — ${fascicule.title} importé avec succès !`)
}

main().catch(e => { console.error('❌ Fatal:', e.message); process.exit(1) })
