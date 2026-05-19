'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FASCICULES, MODULE_MAP } from '@/lib/modules'
import { A } from '@/lib/theme'
import Icon from '@/components/ui/Icon'
import type { ModuleId } from '@/types/database'

type Step = 'select' | 'processing' | 'done'

const PROCESSING_STEPS = [
  'Extraction du texte (OCR)…',
  'Analyse des concepts clés…',
  'Génération des flashcards…',
  'Création du quiz…',
]

export default function UploadPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [fasciculeN, setFasciculeN] = useState<number>(6)
  const [moduleId, setModuleId] = useState<ModuleId>('M1')
  const [files, setFiles] = useState<File[]>([])
  const [step, setStep] = useState<Step>('select')
  const [processingStep, setProcessingStep] = useState(0)
  const [result, setResult] = useState<{ flashcardsCount: number; questionsCount: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const selectedFascicule = FASCICULES.find(f => f.n === fasciculeN)!

  function selectFascicule(n: number) {
    const f = FASCICULES.find(f => f.n === n)!
    setFasciculeN(n)
    setModuleId(f.modules[0])
  }

  function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) setFiles(Array.from(e.target.files))
  }

  async function handleUpload() {
    if (!files.length) return
    setStep('processing')
    setProcessingStep(0)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non connecté')

      const { data: course, error: courseError } = await supabase
        .from('courses')
        .insert({
          user_id: user.id,
          module_id: moduleId,
          title: `Fascicule ${fasciculeN} — ${selectedFascicule.title}`,
          page_count: files.length,
          storage_path: `${user.id}/`,
        })
        .select()
        .single()

      if (courseError || !course) throw new Error(courseError?.message ?? 'Erreur création cours')
      setProcessingStep(1)

      for (let i = 0; i < files.length; i++) {
        const formData = new FormData()
        formData.append('file', files[i])
        formData.append('moduleId', moduleId)
        formData.append('courseId', course.id)
        formData.append('pageNumber', String(i + 1))
        const ocrRes = await fetch('/api/ocr', { method: 'POST', body: formData })
        if (!ocrRes.ok) throw new Error('Erreur OCR page ' + (i + 1))
      }

      setProcessingStep(2)

      const genRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: course.id, moduleId }),
      })
      if (!genRes.ok) throw new Error('Erreur génération')

      setProcessingStep(3)
      const genData = await genRes.json()
      setResult(genData)
      setStep('done')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
      setStep('select')
    }
  }

  if (step === 'processing') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 32px', background: A.bg, fontFamily: A.font }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', border: `4px solid ${A.primarySoft}`, borderTop: `4px solid ${A.primary}`, marginBottom: 28, animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        <div style={{ fontSize: 18, fontWeight: 700, color: A.text, marginBottom: 6 }}>Traitement en cours…</div>
        <div style={{ fontSize: 13, color: A.textMuted, marginBottom: 28 }}>Fascicule {fasciculeN} · {selectedFascicule.title}</div>
        <div style={{ width: '100%', maxWidth: 300, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {PROCESSING_STEPS.map((label, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 24, height: 24, borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: i < processingStep ? A.green : i === processingStep ? A.primary : '#E9ECF2' }}>
                {i < processingStep && <Icon name="check" size={12} color="#fff" strokeWidth={2.5} />}
                {i === processingStep && <div style={{ width: 8, height: 8, borderRadius: 4, background: '#fff' }} />}
              </div>
              <div style={{ fontSize: 13, fontWeight: 500, color: i <= processingStep ? A.text : A.textDim }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (step === 'done' && result) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', background: A.bg, fontFamily: A.font, textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, borderRadius: 28, background: `linear-gradient(135deg, ${A.green} 0%, #0E8C3E 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, boxShadow: '0 12px 32px rgba(22,163,74,0.32)' }}>
          <Icon name="check" size={40} color="#fff" strokeWidth={2.5} />
        </div>
        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.6, color: A.text, marginBottom: 8 }}>Fascicule traité !</div>
        <div style={{ fontSize: 14, color: A.textMuted, marginBottom: 4 }}>Fascicule {fasciculeN} — {selectedFascicule.title}</div>
        <div style={{ fontSize: 14, color: A.textMuted, marginBottom: 28, lineHeight: 1.5 }}>
          <span style={{ color: A.green, fontWeight: 600 }}>{result.flashcardsCount} flashcards</span> · <span style={{ color: A.primary, fontWeight: 600 }}>{result.questionsCount} questions</span> générées
        </div>
        <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 320 }}>
          <button onClick={() => router.push(`/flashcards/${moduleId}`)} style={{ flex: 1, height: 50, borderRadius: 14, background: A.primary, border: 'none', color: '#fff', fontSize: 15, fontWeight: 600, fontFamily: A.font, cursor: 'pointer', boxShadow: '0 4px 14px rgba(10,102,224,0.28)' }}>
            Réviser
          </button>
          <button onClick={() => { setStep('select'); setFiles([]) }} style={{ flex: 1, height: 50, borderRadius: 14, background: A.surface, border: `0.5px solid ${A.borderStrong}`, color: A.text, fontSize: 15, fontWeight: 600, fontFamily: A.font, cursor: 'pointer' }}>
            + Fascicule
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100%', background: A.bg, color: A.text, fontFamily: A.font, paddingBottom: 40 }}>
      <div style={{ padding: '62px 20px 0' }}>
        <button onClick={() => router.back()} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: A.textMuted, fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', fontFamily: A.font, marginBottom: 16, padding: 0 }}>
          <Icon name="chevronL" size={14} color={A.textMuted} /> Retour
        </button>
        <div style={{ fontSize: 13, color: A.textMuted, fontWeight: 500 }}>Importer</div>
        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.6, marginTop: 2 }}>Ajouter un fascicule</div>
        <div style={{ fontSize: 13, color: A.textMuted, marginTop: 4 }}>Scanne tes pages → flashcards + quiz générés par IA</div>
      </div>

      {/* Fascicule selector */}
      <div style={{ padding: '24px 20px 0' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: A.textMuted, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10 }}>Fascicule</div>
        <div style={{ background: A.surface, borderRadius: 16, overflow: 'hidden', border: `0.5px solid ${A.border}`, boxShadow: '0 1px 0 rgba(15,27,45,0.04), 0 1px 3px rgba(15,27,45,0.06)' }}>
          {FASCICULES.map((f, i) => {
            const active = fasciculeN === f.n
            return (
              <button
                key={f.n}
                onClick={() => selectFascicule(f.n)}
                style={{
                  width: '100%', padding: '12px 16px', textAlign: 'left', cursor: 'pointer',
                  fontFamily: A.font, background: active ? A.primarySoft : 'transparent',
                  border: 'none', borderBottom: i < FASCICULES.length - 1 ? `0.5px solid ${A.border}` : 'none',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}
              >
                <div style={{ width: 28, height: 28, borderRadius: 8, background: active ? A.primary : '#E9ECF2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: active ? '#fff' : A.textMuted }}>{f.n}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: active ? A.primary : A.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.title}</div>
                  <div style={{ fontSize: 11, color: A.textMuted, marginTop: 1 }}>{f.modules.join(' · ')}</div>
                </div>
                {active && <Icon name="check" size={14} color={A.primary} strokeWidth={2.5} />}
              </button>
            )
          })}
        </div>
      </div>

      {/* Module override si multi-module */}
      {selectedFascicule.modules.length > 1 && (
        <div style={{ padding: '14px 20px 0' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: A.textMuted, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 }}>Tagger dans le module</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {selectedFascicule.modules.map(mid => {
              const m = MODULE_MAP[mid]
              const active = moduleId === mid
              return (
                <button key={mid} onClick={() => setModuleId(mid)} style={{ padding: '8px 14px', borderRadius: 10, border: active ? `1.5px solid ${A.primary}` : `0.5px solid ${A.border}`, background: active ? A.primarySoft : A.surface, cursor: 'pointer', fontFamily: A.font }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: active ? A.primary : A.textMuted }}>{mid}</span>
                  <span style={{ fontSize: 12, color: active ? A.primary : A.textMuted }}> — {m.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* File picker */}
      <div style={{ padding: '16px 20px 0' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: A.textMuted, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 }}>Photos des pages</div>
        <button
          onClick={() => fileRef.current?.click()}
          style={{
            width: '100%', boxSizing: 'border-box', padding: '28px 20px',
            border: `2px dashed ${files.length > 0 ? A.primary : A.border}`,
            borderRadius: 16, background: files.length > 0 ? A.primarySoft : A.surface,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
            cursor: 'pointer', fontFamily: A.font,
          }}
        >
          <Icon name="camera" size={28} color={files.length > 0 ? A.primary : A.textDim} />
          <div style={{ fontSize: 14, fontWeight: 600, color: files.length > 0 ? A.primary : A.textMuted }}>
            {files.length > 0 ? `${files.length} page${files.length > 1 ? 's' : ''} sélectionnée${files.length > 1 ? 's' : ''}` : 'Appuyer pour scanner les pages'}
          </div>
          <div style={{ fontSize: 12, color: A.textDim }}>Plusieurs photos possibles</div>
        </button>
        <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleFilePick} />
      </div>

      {/* Preview */}
      {files.length > 0 && (
        <div style={{ padding: '10px 20px 0', display: 'flex', gap: 8, overflowX: 'auto' }}>
          {files.map((f, i) => (
            <img key={i} src={URL.createObjectURL(f)} alt={`Page ${i + 1}`} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 10, flexShrink: 0, border: `0.5px solid ${A.border}` }} />
          ))}
        </div>
      )}

      {error && (
        <div style={{ margin: '12px 20px 0', padding: '12px 14px', borderRadius: 12, background: '#FEF2F2', border: `0.5px solid ${A.red}30`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon name="warn" size={16} color={A.red} />
          <div style={{ fontSize: 13, color: A.red, fontWeight: 500 }}>{error}</div>
        </div>
      )}

      {/* CTA */}
      <div style={{ padding: '20px 20px 0' }}>
        <button
          onClick={handleUpload}
          disabled={!files.length}
          style={{
            width: '100%', height: 52, borderRadius: 14, border: 'none',
            background: files.length > 0 ? A.primary : A.surface,
            color: files.length > 0 ? '#fff' : A.textMuted,
            fontSize: 16, fontWeight: 600, fontFamily: A.font,
            cursor: files.length > 0 ? 'pointer' : 'default',
            opacity: files.length > 0 ? 1 : 0.5,
            boxShadow: files.length > 0 ? '0 4px 14px rgba(10,102,224,0.28)' : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          <Icon name="sparkle" size={18} color={files.length > 0 ? '#fff' : A.textMuted} />
          Traiter avec l&apos;IA
        </button>
      </div>
    </div>
  )
}
