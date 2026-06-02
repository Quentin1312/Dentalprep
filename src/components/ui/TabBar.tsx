'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { A } from '@/lib/theme'
import Icon from './Icon'

const TABS = [
  { id: 'dashboard', href: '/dashboard', icon: 'grid',     label: 'Accueil' },
  { id: 'library',   href: '/library',   icon: 'bookOpen', label: 'Mes cours' },
  { id: 'practice',  href: '/practice',  icon: 'edit',     label: 'Pratique' },
  { id: 'stats',     href: '/stats',     icon: 'target',   label: 'Stats' },
  { id: 'profile',   href: '/profile',   icon: 'user',     label: 'Profil' },
]

export default function TabBar() {
  const pathname = usePathname()

  return (
    <div style={{
      position: 'fixed', left: 0, right: 0, bottom: 0,
      paddingBottom: 28, paddingTop: 8,
      background: 'rgba(255,255,255,0.85)',
      backdropFilter: 'blur(24px) saturate(180%)',
      WebkitBackdropFilter: 'blur(24px) saturate(180%)',
      borderTop: `0.5px solid ${A.border}`,
      zIndex: 20,
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${TABS.length}, 1fr)`, alignItems: 'center', padding: '0 4px' }}>
        {TABS.map(tab => {
          const isActive = pathname === tab.href || (pathname.startsWith(tab.href + '/') && tab.href !== '/dashboard')
          return (
            <Link key={tab.id} href={tab.href} style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              padding: '6px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
              fontFamily: A.font, textDecoration: 'none', minWidth: 0,
            }}>
              <Icon name={tab.icon} size={22} color={isActive ? A.primary : A.textDim} strokeWidth={isActive ? 2.2 : 1.75} />
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.1, color: isActive ? A.primary : A.textDim, whiteSpace: 'nowrap' }}>
                {tab.label}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
