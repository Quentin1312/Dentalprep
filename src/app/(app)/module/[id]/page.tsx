import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { MODULE_MAP } from '@/lib/modules'
import { A } from '@/lib/theme'
import Icon from '@/components/ui/Icon'
import type { ModuleId } from '@/types/database'

const BLOC_LABELS: Record<number, string> = {
  1: 'Prise en charge du patient',
  2: 'Assistance au praticien',
  3: 'Gestion du risque infectieux',
  4: 'Gestion des données',
}

export default async function ModulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const mod = MODULE_MAP[id as ModuleId]
  if (!mod) redirect('/dashboard')

  const mid = id as ModuleId
  const [{ data: courses }, { data: flashcards }, { data: attempts }] = await Promise.all([
    supabase.from('courses').select('*').eq('user_id', user.id).eq('module_id', mid).order('created_at', { ascending: false }),
    supabase.from('flashcards').select('id').eq('user_id', user.id).eq('module_id', mid),
    supabase.from('quiz_attempts').select('is_correct').eq('user_id', user.id).eq('module_id', mid),
  ])

  const totalAttempts = attempts?.length ?? 0
  const correct = attempts?.filter(a => a.is_correct).length ?? 0
  const accuracy = totalAttempts > 0 ? Math.round((correct / totalAttempts) * 100) : null
  const flashcardCount = flashcards?.length ?? 0

  const r = (84 - 7) / 2
  const circ = 2 * Math.PI * r

  return (
    <div style={{ minHeight: '100%', background: A.bg, color: A.text, fontFamily: A.font, paddingBottom: 120 }}>
      {/* Header */}
      <div style={{ padding: '62px 20px 0' }}>
        <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: A.textMuted, fontWeight: 500, textDecoration: 'none', marginBottom: 16 }}>
          <Icon name="chevronL" size={14} color={A.textMuted} /> Accueil
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 54, height: 54, borderRadius: 16, background: A.primarySoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: A.primary }}>{mod.id}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: A.textMuted, fontWeight: 600, letterSpacing: 0.3, textTransform: 'uppercase' }}>Bloc {mod.bloc} · {BLOC_LABELS[mod.bloc]}</div>
            <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.5, marginTop: 2 }}>{mod.label}</div>
          </div>
        </div>
      </div>

      {/* Stats ring */}
      <div style={{ padding: '16px 20px 0' }}>
        <div style={{ background: A.surface, borderRadius: 16, padding: 18, boxShadow: '0 1px 0 rgba(15,27,45,0.04), 0 1px 3px rgba(15,27,45,0.06)', border: `0.5px solid ${A.border}`, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ position: 'relative', width: 84, height: 84, flexShrink: 0 }}>
            <svg width={84} height={84} style={{ transform: 'rotate(-90deg)' }}>
              <circle cx={42} cy={42} r={r} fill="none" stroke="#E9ECF2" strokeWidth={7} />
              <circle cx={42} cy={42} r={r} fill="none" stroke={accuracy !== null && accuracy >= 75 ? A.green : accuracy !== null ? A.amber : A.border} strokeWidth={7}
                strokeDasharray={circ} strokeDashoffset={circ * (1 - (accuracy ?? 0) / 100)} strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset .6s' }} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: A.text }}>{accuracy !== null ? `${accuracy}%` : '—'}</div>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: A.text, marginBottom: 4 }}>
              {accuracy === null ? 'Pas encore tenté' : accuracy >= 75 ? 'Module maîtrisé' : 'En progression'}
            </div>
            <div style={{ fontSize: 12, color: A.textMuted, marginBottom: 2 }}>{totalAttempts} questions tentées</div>
            <div style={{ fontSize: 12, color: A.textMuted }}>{flashcardCount} flashcards disponibles</div>
          </div>
        </div>
      </div>

      {/* Weak point alert */}
      {accuracy !== null && accuracy < 75 && (
        <div style={{ padding: '10px 20px 0' }}>
          <div style={{ background: A.amberSoft, borderRadius: 14, padding: 12, border: `0.5px solid ${A.amber}30`, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon name="warn" size={18} color={A.amber} />
            <div style={{ flex: 1, fontSize: 13, color: A.text, fontWeight: 500 }}>
              Score en dessous de 75% — continuez à réviser ce module.
            </div>
          </div>
        </div>
      )}

      {/* Mode cards 2x2 */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: A.textMuted, letterSpacing: 0.3, textTransform: 'uppercase', marginBottom: 10 }}>Modes de révision</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Link href={`/flashcards/${id}`} style={{ textDecoration: 'none' }}>
            <div style={{ background: A.surface, borderRadius: 16, padding: 16, boxShadow: '0 1px 0 rgba(15,27,45,0.04), 0 1px 3px rgba(15,27,45,0.06)', border: `0.5px solid ${A.border}` }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: A.primarySoft, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                <Icon name="cards" size={20} color={A.primary} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: A.text, marginBottom: 3 }}>Flashcards</div>
              <div style={{ fontSize: 11, color: A.textMuted }}>{flashcardCount} cartes</div>
            </div>
          </Link>
          <Link href={`/quiz/${id}`} style={{ textDecoration: 'none' }}>
            <div style={{ background: A.surface, borderRadius: 16, padding: 16, boxShadow: '0 1px 0 rgba(15,27,45,0.04), 0 1px 3px rgba(15,27,45,0.06)', border: `0.5px solid ${A.border}` }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: A.primarySoft, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                <Icon name="target" size={20} color={A.primary} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: A.text, marginBottom: 3 }}>Quiz QCM</div>
              <div style={{ fontSize: 11, color: A.textMuted }}>{accuracy !== null ? `${accuracy}% réussite` : 'Non tenté'}</div>
            </div>
          </Link>
        </div>
      </div>

      {/* Courses list */}
      <div style={{ padding: '24px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: A.textMuted, letterSpacing: 0.3, textTransform: 'uppercase' }}>Cours importés</div>
          <Link href="/upload" style={{ fontSize: 12, color: A.primary, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Icon name="plus" size={12} color={A.primary} /> Ajouter
          </Link>
        </div>
        {courses?.length ? (
          <div style={{ background: A.surface, borderRadius: 16, boxShadow: '0 1px 0 rgba(15,27,45,0.04), 0 1px 3px rgba(15,27,45,0.06)', border: `0.5px solid ${A.border}`, overflow: 'hidden' }}>
            {courses.map((c, i) => (
              <div key={c.id} style={{ padding: '14px 16px', borderBottom: i < (courses.length - 1) ? `0.5px solid ${A.border}` : 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: A.primarySoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name="fileText" size={16} color={A.primary} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: A.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</div>
                  <div style={{ fontSize: 12, color: A.textMuted, marginTop: 1 }}>{c.page_count} page{(c.page_count ?? 0) > 1 ? 's' : ''}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ background: A.surface, borderRadius: 16, padding: 24, textAlign: 'center', border: `0.5px solid ${A.border}` }}>
            <div style={{ fontSize: 13, color: A.textMuted, marginBottom: 12 }}>Aucun cours importé pour ce module.</div>
            <Link href="/upload" style={{ fontSize: 13, color: A.primary, fontWeight: 600, textDecoration: 'none' }}>
              + Ajouter un cours
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
