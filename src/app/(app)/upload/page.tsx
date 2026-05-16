'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { MODULES } from '@/lib/modules'
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
  const [moduleId, setModuleId] = useState<ModuleId>('M1')
  const [files, setFiles] = useState<File[]>([])
  const [step, setStep] = useState<Step>('select')
  const [processingStep, setProcessingStep] = useState(0)
  const [result, setResult] = useState<{ flashcardsCount: number; questionsCount: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

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

      // Create course record
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .insert({
          user_id: user.id,
          module_id: moduleId,
          title: files[0].name.replace(/\.[^/.]+$/, ''),
          page_count: files.length,
          storage_path: `${user.id}/`,
        })
        .select()
        .single()

      if (courseError || !course) throw new Error(courseError?.message ?? 'Erreur création cours')

      setProcessingStep(1)

      // OCR each page
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

      // Generate flashcards + quiz
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
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="w-16 h-16 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin mb-6" />
        <h2 className="text-lg font-bold text-gray-900 mb-2">Traitement en cours…</h2>
        <div className="space-y-3 w-full max-w-xs">
          {PROCESSING_STEPS.map((label, i) => (
            <div key={i} className={`flex items-center gap-3 text-sm transition-all ${i <= processingStep ? 'text-gray-900' : 'text-gray-300'}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${i < processingStep ? 'bg-green-500' : i === processingStep ? 'bg-blue-600' : 'bg-gray-200'}`}>
                {i < processingStep ? (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20,6 9,17 4,12"/></svg>
                ) : i === processingStep ? (
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                ) : null}
              </div>
              {label}
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (step === 'done' && result) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20,6 9,17 4,12"/>
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Cours traité !</h2>
        <p className="text-gray-500 text-sm mb-6">
          {result.flashcardsCount} flashcards et {result.questionsCount} questions générées pour le module {moduleId}.
        </p>
        <div className="flex gap-3 w-full max-w-xs">
          <button onClick={() => router.push(`/flashcards/${moduleId}`)} className="flex-1 bg-blue-600 text-white font-semibold py-3.5 rounded-2xl hover:bg-blue-700 transition-colors text-sm">
            Réviser
          </button>
          <button onClick={() => router.push('/dashboard')} className="flex-1 border-2 border-gray-200 text-gray-700 font-semibold py-3.5 rounded-2xl hover:bg-gray-50 transition-colors text-sm">
            Accueil
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 pt-12 pb-6">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 text-sm mb-6">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15,18 9,12 15,6"/></svg>
        Retour
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">Ajouter un cours</h1>
      <p className="text-gray-500 text-sm mb-6">Photographiez vos cours pour générer des flashcards et un quiz.</p>

      {/* Module selector */}
      <div className="mb-5">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Module</label>
        <div className="grid grid-cols-2 gap-2">
          {MODULES.map(m => (
            <button
              key={m.id}
              onClick={() => setModuleId(m.id)}
              className={`py-3 px-4 rounded-2xl text-sm font-medium text-left transition-all ${moduleId === m.id ? 'ring-2' : 'bg-gray-100 text-gray-600'}`}
              style={moduleId === m.id ? { backgroundColor: m.colorSoft, color: m.color, outline: `2px solid ${m.color}` } : {}}
            >
              <span className="font-bold">{m.id}</span> — {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* File picker */}
      <div className="mb-5">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Photos du cours</label>
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full border-2 border-dashed border-gray-300 rounded-2xl py-8 flex flex-col items-center gap-2 hover:border-blue-400 hover:bg-blue-50 transition-colors"
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/>
          </svg>
          <span className="text-sm font-medium text-gray-500">
            {files.length > 0 ? `${files.length} photo(s) sélectionnée(s)` : 'Appuyez pour choisir des photos'}
          </span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFilePick}
        />
      </div>

      {/* Preview */}
      {files.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
          {files.map((f, i) => (
            <img
              key={i}
              src={URL.createObjectURL(f)}
              alt={`Page ${i + 1}`}
              className="w-20 h-20 object-cover rounded-xl flex-shrink-0"
            />
          ))}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
          {error}
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!files.length}
        className="w-full bg-blue-600 text-white font-semibold py-4 rounded-2xl hover:bg-blue-700 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a9 9 0 0 1 9 9c0 4.97-4 9-9 9a9 9 0 0 1-9-9 9 9 0 0 1 9-9z"/><path d="M12 8v8"/><path d="M8 12l4-4 4 4"/>
        </svg>
        Traiter avec l&apos;IA
      </button>
    </div>
  )
}
