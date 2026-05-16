import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { MODULES } from '@/lib/modules'
import { A } from '@/lib/theme'
import Icon from '@/components/ui/Icon'

const BLOC_LABELS: Record<number, string> = {
  1: 'Prise en charge du patient',
  2: 'Assistance au praticien',
  3: 'Gestion du risque infectieux',
  4: 'Gestion des données',
}

export default async function LibraryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: courses } = await supabase
    .from('courses')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const grouped = MODULES.map(m => ({
    module: m,
    courses: courses?.filter(c => c.module_id === m.id) ?? [],
  })).filter(g => g.courses.length > 0)

  return (
    <div style={{ minHeight: '100%', background: A.bg, color: A.text, fontFamily: A.font, paddingBottom: 120 }}>
      <div style={{ padding: '62px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 13, color: A.textMuted, fontWeight: 500 }}>Bibliothèque</div>
            <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.6, marginTop: 2 }}>Mes cours</div>
          </div>
          <Link href="/upload" style={{
            width: 40, height: 40, borderRadius: 12, background: A.primary,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            textDecoration: 'none', boxShadow: '0 4px 14px rgba(10,102,224,0.28)',
          }}>
            <Icon name="plus" size={20} color="#fff" strokeWidth={2.2} />
          </Link>
        </div>
      </div>

      {!grouped.length ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: 24, background: A.primarySoft, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <Icon name="fileText" size={32} color={A.primary} />
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: A.text, marginBottom: 8 }}>Aucun cours</div>
          <div style={{ fontSize: 14, color: A.textMuted, marginBottom: 28, lineHeight: 1.5 }}>
            Importez vos premiers cours pour commencer à réviser.
          </div>
          <Link href="/upload" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: A.primary, color: '#fff', fontFamily: A.font,
            fontSize: 15, fontWeight: 600, padding: '14px 24px',
            borderRadius: 14, textDecoration: 'none',
            boxShadow: '0 4px 14px rgba(10,102,224,0.28)',
          }}>
            <Icon name="plus" size={16} color="#fff" /> Ajouter un cours
          </Link>
        </div>
      ) : (
        <div style={{ padding: '20px 20px 0' }}>
          {grouped.map(({ module: m, courses: mCourses }) => (
            <div key={m.id} style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, paddingLeft: 2 }}>
                <div style={{ width: 20, height: 20, borderRadius: 6, background: A.text, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: '#fff' }}>{m.bloc}</span>
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: A.primary, padding: '2px 7px', borderRadius: 6, background: A.primarySoft }}>{m.id}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: A.textMuted }}>{m.label}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {mCourses.map(course => (
                  <div key={course.id} style={{
                    background: A.surface, borderRadius: 16, padding: 14,
                    boxShadow: '0 1px 0 rgba(15,27,45,0.04), 0 1px 3px rgba(15,27,45,0.06)',
                    border: `0.5px solid ${A.border}`,
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: A.primarySoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon name="fileText" size={18} color={A.primary} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: A.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{course.title}</div>
                      <div style={{ fontSize: 12, color: A.textMuted, marginTop: 2 }}>{course.page_count} page{(course.page_count ?? 0) > 1 ? 's' : ''}</div>
                    </div>
                    <Icon name="chevronR" size={14} color={A.textDim} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
