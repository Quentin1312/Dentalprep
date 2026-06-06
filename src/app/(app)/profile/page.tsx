'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Icon from '@/components/ui/Icon'
import PetCompanion, { PET_NAMES } from '@/components/pet/PetCompanion'
import type { PetType } from '@/components/pet/PetCompanion'
import { computeXP, xpProgress, LEVEL_THRESHOLDS } from '@/lib/xp'
import { readFlashXP } from '@/lib/flash-store'
import { computeBadges } from '@/lib/badges'
import type { Badge } from '@/lib/badges'
import { useThemeBg, themeBgStyle, THEMES, type ThemeBgId } from '@/lib/theme-bg'
import { useAppData } from '@/lib/app-context'
import {
  PathSystemStyles, SectionLabel, shade, PathIcon,
} from '@/components/ui/PathSystem'
import {
  ACCESSORIES, SLOT_LABELS, SLOT_ORDER, isUnlocked, unlockRuleLabel,
  type AccessorySlot, type EquippedAccessories, type UnlockStats,
} from '@/lib/accessories'
import {
  checkSupport, getCurrentSubscription, subscribePush, unsubscribePush, sendTestNotification,
} from '@/lib/push'

type Profile = { full_name: string | null; exam_date: string | null; daily_goal_minutes: number; streak: number | null; pet_type: string | null; equipped_accessories: EquippedAccessories | null }
type Attempt = { module_id: string; is_correct: boolean; question_id: string }

export default function ProfilePage() {
  const router = useRouter()
  const { refresh: refreshAppData } = useAppData()
  const [themeId, setThemeBgFn] = useThemeBg()
  const theme = THEMES[themeId]

  const [userId, setUserId] = useState<string | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [email, setEmail] = useState('')
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [examDate, setExamDate] = useState('')
  const [goal, setGoal] = useState(30)
  const [petType, setPetType] = useState<PetType>('cat')
  const [equipped, setEquipped] = useState<EquippedAccessories>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [flashXpBonus, setFlashXpBonus] = useState(0)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace('/auth/login'); return }
      setUserId(user.id)
      setEmail(user.email ?? '')
      Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('quiz_attempts').select('module_id,is_correct,question_id').eq('user_id', user.id),
      ]).then(([p, a]) => {
        const prof = p.data as (Profile & { id: string }) | null
        setProfile(prof)
        setName(prof?.full_name ?? '')
        setExamDate(prof?.exam_date ?? '')
        setGoal(prof?.daily_goal_minutes ?? 30)
        if (prof?.pet_type) setPetType(prof.pet_type as PetType)
        setEquipped((prof?.equipped_accessories as EquippedAccessories | null) ?? {})
        setAttempts((a.data ?? []) as Attempt[])
        setLoading(false)
      })
    })
    setFlashXpBonus(readFlashXP())
  }, [router])

  async function handleEquippedChange(next: EquippedAccessories) {
    setEquipped(next)
    if (!userId) return
    const supabase = createClient()
    await (supabase.from('profiles') as any)
      .update({ equipped_accessories: next, updated_at: new Date().toISOString() })
      .eq('id', userId)
    // Invalide le cache pour que les autres pages voient l'équipement à jour
    void refreshAppData()
  }

  async function handleSave() {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await (supabase.from('profiles') as any).update({
      full_name: name, exam_date: examDate || null,
      daily_goal_minutes: goal,
      updated_at: new Date().toISOString(),
    }).eq('id', user.id)
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/auth/login')
  }

  const xp = computeXP(attempts) + flashXpBonus
  const xpInfo = xpProgress(xp)
  const badges: Badge[] = computeBadges(attempts, profile?.streak ?? 0)
  const accent = xpInfo.color
  const xpPct = Math.max(0, Math.min(100, xpInfo.pct))

  return (
    <div style={{
      minHeight: '100%', ...themeBgStyle(themeId),
      fontFamily: '-apple-system, "SF Pro Text", system-ui, sans-serif',
      paddingBottom: 120,
    }}>
      <PathSystemStyles />

      <div style={{ padding: '54px 16px 6px' }}>
        <div style={{ fontSize: 11, color: theme.textMuted, fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase' }}>
          Mon compte
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.6, color: theme.text, marginTop: 1 }}>
          Profil
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '12px 16px' }}>
          <div style={{
            height: 220, borderRadius: 22,
            background: 'linear-gradient(90deg,#E9ECF2 25%,#F4F6F8 50%,#E9ECF2 75%)',
            backgroundSize: '200% 100%', animation: 'dp-shimmer 1.4s infinite',
          }} />
        </div>
      ) : (
        <>
          {/* Hero — dark card with pet + level + XP */}
          <div style={{ padding: '8px 16px 0' }}>
            <div style={{
              borderRadius: 22,
              background: 'linear-gradient(135deg, #1B1730 0%, #0F1424 100%)',
              padding: '20px 18px 18px',
              boxShadow: '0 14px 30px -12px rgba(15,27,45,0.45), inset 0 1px 0 rgba(255,255,255,0.06)',
              color: '#fff',
            }}>
              <div style={{ marginBottom: 18 }}>
                <div style={{
                  fontSize: 26, fontWeight: 800, letterSpacing: -0.6, lineHeight: 1.1,
                  textShadow: '0 1px 2px rgba(0,0,0,0.20)',
                }}>{name || 'Mon profil'}</div>
                <div style={{
                  fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 4, fontWeight: 500,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{email}</div>
              </div>

              {/* XP bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: 8,
                    background: `linear-gradient(135deg, ${accent} 0%, ${shade(accent, -25)} 100%)`,
                    color: '#fff', fontSize: 12, fontWeight: 900,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.3), 0 2px 6px ${accent}66`,
                  }}>{xpInfo.level}</div>
                  <div style={{ fontSize: 13.5, fontWeight: 800, letterSpacing: -0.2 }}>
                    {xpInfo.name}
                  </div>
                </div>
                <div style={{
                  fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.85)',
                  fontVariantNumeric: 'tabular-nums',
                }}>{xp} XP</div>
              </div>
              <div style={{
                height: 10, borderRadius: 6, background: 'rgba(255,255,255,0.10)',
                overflow: 'hidden', boxShadow: 'inset 0 1px 1px rgba(0,0,0,0.30)',
              }}>
                <div style={{
                  width: `${xpPct}%`, height: '100%',
                  background: `linear-gradient(90deg, ${accent} 0%, ${shade(accent, 25)} 100%)`,
                  borderRadius: 6, boxShadow: `0 0 10px ${accent}88`,
                  transition: 'width 1s cubic-bezier(0.34,1.2,0.64,1)',
                }} />
              </div>
              <div style={{
                marginTop: 5, fontSize: 10.5, color: 'rgba(255,255,255,0.55)',
                fontWeight: 600, fontVariantNumeric: 'tabular-nums',
              }}>
                {xpInfo.level < LEVEL_THRESHOLDS.length
                  ? `${xpInfo.levelEnd - xp} XP avant niv. ${xpInfo.level + 1}`
                  : 'Niveau maximum atteint !'}
              </div>
            </div>
          </div>

          {/* Badges — horizontal scroll */}
          <BadgesRow badges={badges} />

          {/* Pet section */}
          <PetSection name={PET_NAMES[petType]} petType={petType} level={xpInfo.level} equipped={equipped} />

          {/* Wardrobe */}
          <WardrobeSection
            petType={petType}
            equipped={equipped}
            onChange={handleEquippedChange}
            stats={{
              xp,
              streak: profile?.streak ?? 0,
              attemptCount: attempts.length,
              badgeCount: badges.filter(b => b.unlocked).length,
              totalBadges: badges.length,
            }}
          />

          {/* Theme picker */}
          <ThemePicker active={themeId} onPick={setThemeBgFn} />

          {/* Settings */}
          <SettingsCard
            name={name} setName={setName}
            examDate={examDate} setExamDate={setExamDate}
            goal={goal} setGoal={setGoal}
          />

          {/* Rappels push */}
          <RemindersSection />

          {/* CTAs */}
          <div style={{ padding: '14px 16px 28px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button onClick={handleSave} disabled={saving} style={{
              height: 54, borderRadius: 16, border: 'none',
              background: saved ? '#16A34A' : '#0A66E0', color: '#fff',
              fontSize: 15, fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              letterSpacing: -0.1,
              boxShadow: saved
                ? '0 10px 24px -6px rgba(22,163,74,0.55), inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -3px 0 rgba(14,112,54,0.5)'
                : '0 10px 24px -6px rgba(10,102,224,0.55), inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -3px 0 rgba(8,80,181,0.5)',
            }}>
              {saved ? (
                <><Icon name="check" size={16} color="#fff" strokeWidth={2.6} /> Enregistré !</>
              ) : saving ? 'Enregistrement…' : (
                <><Icon name="check" size={16} color="#fff" strokeWidth={2.6} /> Enregistrer</>
              )}
            </button>
            <button onClick={handleLogout} style={{
              height: 50, borderRadius: 14,
              border: `1.5px solid #FCA5A5`,
              background: '#FEF2F2', color: '#DC2626',
              fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
            }}>
              Se déconnecter
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

function BadgesRow({ badges }: { badges: Badge[] }) {
  const unlocked = badges.filter(b => b.unlocked).length
  return (
    <div style={{ padding: '14px 0 0' }}>
      <div style={{ padding: '0 16px' }}>
        <SectionLabel right={`${unlocked} / ${badges.length}`}>Trophées</SectionLabel>
      </div>
      <div className="dp-rail" style={{
        display: 'flex', gap: 8, overflowX: 'auto', padding: '0 16px 4px',
      }}>
        {badges.map(b => (
          <div key={b.id} style={{
            flexShrink: 0, width: 60, height: 60, borderRadius: 14,
            background: b.unlocked ? '#fff' : '#F4F6F8',
            border: `1px solid ${b.unlocked ? '#E4E8EE' : '#E4E8EE'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26,
            opacity: b.unlocked ? 1 : 0.5,
            filter: b.unlocked ? undefined : 'grayscale(70%)',
            boxShadow: b.unlocked
              ? '0 1px 0 rgba(15,27,45,0.04), 0 4px 10px -8px rgba(15,27,45,0.30), inset 0 -2px 0 rgba(15,27,45,0.05)'
              : 'inset 0 -1px 0 rgba(0,0,0,0.04)',
            position: 'relative',
          }}>
            {b.emoji}
            {!b.unlocked && (
              <div style={{
                position: 'absolute', top: 4, right: 4,
                width: 14, height: 14, borderRadius: 7,
                background: '#fff', border: `1px solid #E4E8EE`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <PathIcon name="lock" size={7} color="#8A95A5" strokeWidth={2.8} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function PetSection({ name, petType, level, equipped }: { name: string; petType: PetType; level: number; equipped: EquippedAccessories }) {
  return (
    <div style={{ padding: '12px 16px 0' }}>
      <SectionLabel>Mon compagnon</SectionLabel>
      <div style={{
        position: 'relative',
        background: 'linear-gradient(135deg, #FFE5C2 0%, #FFD082 100%)',
        border: `1px solid #F59E0B40`,
        borderRadius: 18, padding: '14px 16px',
        boxShadow: '0 1px 2px rgba(15,27,45,0.04), 0 8px 20px -10px rgba(245,158,11,0.45), inset 0 -3px 0 rgba(180,80,9,0.15), inset 0 1px 0 rgba(255,255,255,0.5)',
        overflow: 'hidden', minHeight: 96,
      }}>
        <div style={{ position: 'absolute', right: 16, bottom: -2 }}>
          <PetCompanion petType={petType} state="idle" size={92} hideName level={level} equipped={equipped} />
        </div>
        <div style={{
          fontSize: 11, fontWeight: 800, color: '#9F5A04',
          letterSpacing: 0.6, textTransform: 'uppercase',
        }}>Niveau {level} · Compagnon</div>
        <div style={{
          fontSize: 22, fontWeight: 800, color: '#7A4F1F',
          letterSpacing: -0.4, marginTop: 4, lineHeight: 1.1,
        }}>{name}</div>
        <div style={{
          fontSize: 12, color: '#9F5A04', marginTop: 6, fontWeight: 600,
          maxWidth: 180, lineHeight: 1.35,
        }}>
          T&apos;accompagne dans ton parcours.<br/>Choix définitif.
        </div>
      </div>
    </div>
  )
}

function WardrobeSection({
  petType, equipped, onChange, stats,
}: {
  petType: PetType
  equipped: EquippedAccessories
  onChange: (next: EquippedAccessories) => void
  stats: UnlockStats
}) {
  const [activeSlot, setActiveSlot] = useState<AccessorySlot>('head')
  const slotAccessories = ACCESSORIES.filter(a => a.slot === activeSlot)

  function equip(slot: AccessorySlot, id: string | null) {
    const next = { ...equipped }
    if (id === null) delete next[slot]
    else next[slot] = id
    onChange(next)
  }

  return (
    <div style={{ padding: '12px 16px 0' }}>
      <SectionLabel>Garde-robe</SectionLabel>
      <div style={{
        background: '#fff', borderRadius: 18,
        border: `1px solid #E4E8EE`, overflow: 'hidden',
        boxShadow: '0 1px 2px rgba(15,27,45,0.04), 0 6px 16px -10px rgba(15,27,45,0.15)',
      }}>
        {/* Preview live */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '14px 16px',
          background: 'linear-gradient(135deg, #F2F5FA 0%, #E9EEF6 100%)',
          borderBottom: `1px solid #E4E8EE`,
        }}>
          <PetCompanion petType={petType} state="idle" size={96} hideName equipped={equipped} />
        </div>

        {/* Onglets par slot */}
        <div style={{
          display: 'flex', overflowX: 'auto', borderBottom: `1px solid #E4E8EE`,
          background: '#F9FAFC',
        }} className="dp-rail">
          {SLOT_ORDER.map(slot => {
            const isActive = slot === activeSlot
            const equippedHere = equipped[slot]
            return (
              <button
                key={slot} onClick={() => setActiveSlot(slot)}
                style={{
                  flexShrink: 0, padding: '11px 14px',
                  fontSize: 12.5, fontWeight: 800, letterSpacing: -0.1,
                  fontFamily: 'inherit', cursor: 'pointer',
                  background: 'transparent', border: 'none',
                  color: isActive ? '#0A66E0' : '#5A6675',
                  borderBottom: `2px solid ${isActive ? '#0A66E0' : 'transparent'}`,
                  marginBottom: -1,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                {SLOT_LABELS[slot]}
                {equippedHere && (
                  <span style={{
                    width: 7, height: 7, borderRadius: '50%', background: '#16A34A',
                  }} />
                )}
              </button>
            )
          })}
        </div>

        {/* Liste accessoires du slot */}
        <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Option "aucun" */}
          <WardrobeRow
            label="Aucun"
            sublabel="Slot vide"
            isEquipped={!equipped[activeSlot]}
            isLocked={false}
            onClick={() => equip(activeSlot, null)}
          />
          {slotAccessories.map(acc => {
            const unlocked = isUnlocked(acc, stats)
            const isEquipped = equipped[activeSlot] === acc.id
            return (
              <WardrobeRow
                key={acc.id}
                label={acc.name}
                sublabel={unlocked ? acc.description : `Verrouillé · ${unlockRuleLabel(acc.unlock)}`}
                isEquipped={isEquipped}
                isLocked={!unlocked}
                onClick={() => unlocked && equip(activeSlot, acc.id)}
              />
            )
          })}
          {slotAccessories.length === 0 && (
            <div style={{ fontSize: 12, color: '#8A95A5', textAlign: 'center', padding: 14 }}>
              Aucun accessoire pour ce slot.
            </div>
          )}
        </div>
      </div>
      <div style={{ fontSize: 11, color: '#8A95A5', marginTop: 6, padding: '0 4px' }}>
        Enregistré automatiquement.
      </div>
    </div>
  )
}

function WardrobeRow({
  label, sublabel, isEquipped, isLocked, onClick,
}: {
  label: string; sublabel: string
  isEquipped: boolean; isLocked: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={isLocked}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 10, padding: '10px 12px',
        background: isEquipped ? '#EEF4FF' : isLocked ? '#F4F6F8' : '#fff',
        border: `1.5px solid ${isEquipped ? '#0A66E0' : isLocked ? '#E4E8EE' : '#E4E8EE'}`,
        borderRadius: 12,
        cursor: isLocked ? 'not-allowed' : 'pointer',
        fontFamily: 'inherit', textAlign: 'left',
        opacity: isLocked ? 0.65 : 1,
        transition: 'background 0.12s, border-color 0.12s',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 14, fontWeight: 800, color: isLocked ? '#8A95A5' : '#0F1B2D',
          letterSpacing: -0.1,
        }}>{label}</div>
        <div style={{
          fontSize: 11.5, color: isLocked ? '#A0AAB8' : '#5A6675',
          marginTop: 2, fontWeight: 500,
        }}>{sublabel}</div>
      </div>
      {isLocked ? (
        <PathIcon name="lock" size={14} color="#A0AAB8" strokeWidth={2.4} />
      ) : isEquipped ? (
        <div style={{
          fontSize: 10.5, fontWeight: 900, color: '#0A66E0',
          background: '#fff', border: `1.5px solid #0A66E0`,
          padding: '3px 8px', borderRadius: 999,
          letterSpacing: 0.4, textTransform: 'uppercase',
        }}>Équipé</div>
      ) : null}
    </button>
  )
}

function ThemePicker({ active, onPick }: { active: ThemeBgId; onPick: (id: ThemeBgId) => void }) {
  const list: ThemeBgId[] = ['white', 'cream', 'lavender', 'mint']
  return (
    <div style={{ padding: '12px 16px 0' }}>
      <SectionLabel>Apparence</SectionLabel>
      <div style={{
        background: '#fff', border: `1px solid #E4E8EE`, borderRadius: 18,
        padding: '14px 14px 16px',
        boxShadow: '0 1px 2px rgba(15,27,45,0.04), 0 6px 16px -10px rgba(15,27,45,0.15)',
      }}>
        <div style={{ fontSize: 12, color: '#5A6675', marginBottom: 10, fontWeight: 600 }}>
          Choisis le fond de l&apos;application
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {list.map(id => {
            const t = THEMES[id]
            const isActive = id === active
            return (
              <div key={id} onClick={() => onPick(id)} style={{ position: 'relative', cursor: 'pointer' }}>
                <div style={{
                  height: 64, borderRadius: 12,
                  backgroundColor: t.bg,
                  backgroundImage: t.bgGradient,
                  border: isActive ? `2.5px solid #0A66E0` : `1px solid ${t.border}`,
                  boxShadow: isActive
                    ? `0 0 0 3px rgba(10,102,224,0.13), 0 6px 14px -6px rgba(15,27,45,0.20)`
                    : '0 1px 0 rgba(15,27,45,0.03)',
                  position: 'relative', overflow: 'hidden',
                }}>
                  {isActive && (
                    <div style={{
                      position: 'absolute', bottom: 4, right: 4,
                      width: 20, height: 20, borderRadius: 10,
                      background: '#0A66E0', color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 2px 5px rgba(10,102,224,0.45)',
                    }}>
                      <PathIcon name="check" size={12} color="#fff" strokeWidth={3.2} />
                    </div>
                  )}
                </div>
                <div style={{
                  marginTop: 5, textAlign: 'center', fontSize: 10.5, fontWeight: 700,
                  color: isActive ? '#0A66E0' : '#0F1B2D', letterSpacing: -0.1,
                }}>{t.name}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function SettingsCard({
  name, setName, examDate, setExamDate, goal, setGoal,
}: {
  name: string; setName: (v: string) => void
  examDate: string; setExamDate: (v: string) => void
  goal: number; setGoal: (v: number) => void
}) {
  return (
    <div style={{ padding: '12px 16px 0' }}>
      <SectionLabel>Préférences</SectionLabel>
      <div style={{
        background: '#fff', borderRadius: 18, overflow: 'hidden',
        border: `1px solid #E4E8EE`,
        boxShadow: '0 1px 2px rgba(15,27,45,0.04), 0 6px 16px -10px rgba(15,27,45,0.15)',
      }}>
        {/* Name */}
        <div style={{ padding: '14px 16px', borderBottom: `1px solid #E4E8EE` }}>
          <div style={{
            fontSize: 10.5, fontWeight: 700, color: '#5A6675',
            letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 8,
          }}>Prénom</div>
          <input
            type="text" value={name} onChange={e => setName(e.target.value)}
            placeholder="Votre prénom"
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '12px 14px', borderRadius: 12,
              background: '#F9FAFC', border: `1px solid #E4E8EE`,
              fontSize: 15, fontWeight: 600, color: '#0F1B2D',
              fontFamily: 'inherit', outline: 'none',
            }}
          />
        </div>
        {/* Exam date */}
        <div style={{ padding: '14px 16px', borderBottom: `1px solid #E4E8EE` }}>
          <div style={{
            fontSize: 10.5, fontWeight: 700, color: '#5A6675',
            letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 8,
          }}>Date d&apos;examen</div>
          <input
            type="date" value={examDate} onChange={e => setExamDate(e.target.value)}
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '12px 14px', borderRadius: 12,
              background: '#F9FAFC', border: `1px solid #E4E8EE`,
              fontSize: 15, fontWeight: 600, color: '#0F1B2D',
              fontFamily: 'inherit', outline: 'none',
            }}
          />
        </div>
        {/* Daily goal */}
        <div style={{ padding: '14px 16px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8,
          }}>
            <div style={{
              fontSize: 10.5, fontWeight: 700, color: '#5A6675',
              letterSpacing: 0.4, textTransform: 'uppercase',
            }}>Objectif quotidien</div>
            <div style={{
              fontSize: 13, fontWeight: 900, color: '#0A66E0',
              fontVariantNumeric: 'tabular-nums',
            }}>{goal} min</div>
          </div>
          <input
            type="range" min={10} max={120} step={5} value={goal}
            onChange={e => setGoal(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#0A66E0' }}
          />
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// RemindersSection — push notifications quotidiennes
// ─────────────────────────────────────────────────────────────────────────────

function RemindersSection() {
  const [supportInfo, setSupportInfo] = useState<{ supported: boolean; reason?: string } | null>(null)
  const [, setPermission] = useState<NotificationPermission | 'unknown'>('unknown')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [enabled, setEnabled] = useState(false)
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null)
  const [loaded, setLoaded] = useState(false)

  // Boot : check support, permission, subscription, et préférences serveur
  useEffect(() => {
    const s = checkSupport()
    setSupportInfo({ supported: s.supported, reason: s.reason })
    if (typeof Notification !== 'undefined') {
      setPermission(Notification.permission)
    }
    void (async () => {
      const sub = await getCurrentSubscription()
      setIsSubscribed(!!sub)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const supaAny = supabase as any
        const { data: prof } = await supaAny.from('profiles')
          .select('reminders_enabled')
          .eq('id', user.id).single()
        if (prof) setEnabled(!!prof.reminders_enabled)
      }
      setLoaded(true)
    })()
  }, [])

  async function persistPrefs(nextEnabled: boolean) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    const supaAny = supabase as any
    await supaAny.from('profiles').update({
      reminders_enabled: nextEnabled,
      reminder_tz: tz,
      updated_at: new Date().toISOString(),
    }).eq('id', user.id)
  }

  async function handleToggle(next: boolean) {
    if (busy) return
    setBusy(true)
    setFeedback(null)
    try {
      if (next) {
        const res = await subscribePush()
        if (!res.ok) {
          setFeedback({ kind: 'err', msg: res.error })
          setBusy(false)
          return
        }
        setIsSubscribed(true)
        setPermission(Notification.permission)
        setEnabled(true)
        await persistPrefs(true)
        setFeedback({ kind: 'ok', msg: 'Rappels activés.' })
      } else {
        await unsubscribePush()
        setIsSubscribed(false)
        setEnabled(false)
        await persistPrefs(false)
        setFeedback({ kind: 'ok', msg: 'Rappels désactivés.' })
      }
    } catch (e: any) {
      setFeedback({ kind: 'err', msg: e?.message ?? 'Erreur' })
    } finally {
      setBusy(false)
    }
  }

  async function handleTest() {
    if (busy) return
    setBusy(true)
    setFeedback(null)
    try {
      const ok = await sendTestNotification()
      setFeedback(ok
        ? { kind: 'ok', msg: 'Notification de test envoyée — vérifie ton écran.' }
        : { kind: 'err', msg: 'Échec d\'envoi (vérifie les VAPID keys côté serveur).' })
    } finally { setBusy(false) }
  }

  if (!loaded) return null

  return (
    <div style={{ padding: '12px 16px 0' }}>
      <SectionLabel>Rappels</SectionLabel>
      <div style={{
        background: '#fff', borderRadius: 18, overflow: 'hidden',
        border: `1px solid #E4E8EE`,
        boxShadow: '0 1px 2px rgba(15,27,45,0.04), 0 6px 16px -10px rgba(15,27,45,0.15)',
      }}>
        {!supportInfo?.supported ? (
          <div style={{ padding: '16px', fontSize: 13, color: '#5A6675', lineHeight: 1.5 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <Icon name="warn" size={18} color="#D97706" strokeWidth={2.2} />
              <div style={{ fontWeight: 800, color: '#0F1B2D' }}>Indisponible</div>
            </div>
            {supportInfo?.reason}
          </div>
        ) : (
          <>
            {/* Toggle */}
            <div style={{
              padding: '14px 16px', borderBottom: `1px solid #E4E8EE`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 14, fontWeight: 800, color: '#0F1B2D', marginBottom: 2,
                }}>Rappels intelligents</div>
                <div style={{ fontSize: 11.5, color: '#5A6675', lineHeight: 1.4 }}>
                  On te prévient en soirée seulement si tu n'as pas étudié dans la journée.
                </div>
              </div>
              <button
                onClick={() => handleToggle(!enabled)}
                disabled={busy}
                style={{
                  width: 48, height: 28, borderRadius: 999, border: 'none',
                  background: enabled ? '#0A66E0' : '#D1D7E0',
                  position: 'relative', cursor: busy ? 'wait' : 'pointer',
                  transition: 'background .2s ease',
                  flexShrink: 0,
                }}>
                <div style={{
                  position: 'absolute', top: 3,
                  left: enabled ? 23 : 3,
                  width: 22, height: 22, borderRadius: 999,
                  background: '#fff', transition: 'left .2s ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.18)',
                }} />
              </button>
            </div>

            {/* Info — comment ça marche */}
            <div style={{ padding: '12px 16px', borderBottom: `1px solid #E4E8EE`, opacity: enabled ? 1 : 0.5 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: '#E6EFFC', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon name="clock" size={14} color="#0A66E0" strokeWidth={2.2} />
                </div>
                <div style={{ flex: 1, fontSize: 11.5, color: '#5A6675', lineHeight: 1.5 }}>
                  Pas d'heure à choisir — si tu n'as pas étudié dans la journée, on
                  t'envoie un rappel entre <b>18h et 23h</b>. Le ton s'adapte à l'heure.
                  <br />
                  <span style={{ fontSize: 10.5, color: '#8A95A5' }}>
                    Fuseau : {Intl.DateTimeFormat().resolvedOptions().timeZone}
                  </span>
                </div>
              </div>
            </div>

            {/* Test button */}
            <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                onClick={handleTest}
                disabled={!isSubscribed || busy}
                style={{
                  flex: 1, height: 44, borderRadius: 12,
                  border: `1px solid ${isSubscribed ? '#0A66E0' : '#E4E8EE'}`,
                  background: isSubscribed ? '#E6EFFC' : '#F4F6FA',
                  color: isSubscribed ? '#0A66E0' : '#8A95A5',
                  fontSize: 13, fontWeight: 800, fontFamily: 'inherit',
                  cursor: isSubscribed && !busy ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>
                <Icon name="bell" size={14} color={isSubscribed ? '#0A66E0' : '#8A95A5'} strokeWidth={2.2} />
                Envoyer un test
              </button>
            </div>

            {feedback && (
              <div style={{
                padding: '10px 16px 14px', fontSize: 12, fontWeight: 700,
                color: feedback.kind === 'ok' ? '#16A34A' : '#DC2626',
                background: feedback.kind === 'ok' ? '#DCFCE7' : '#FEF2F2',
                borderTop: `1px solid #E4E8EE`,
              }}>
                {feedback.msg}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
