import { A } from '@/lib/theme'

function Skeleton({ w, h, radius = 8 }: { w: string | number; h: number; radius?: number }) {
  return (
    <div style={{ width: w, height: h, borderRadius: radius, background: 'linear-gradient(90deg, #E9ECF2 25%, #F4F6F8 50%, #E9ECF2 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
  )
}

export default function DashboardLoading() {
  return (
    <div style={{ minHeight: '100%', background: A.bg, fontFamily: A.font, paddingBottom: 100 }}>
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }`}</style>
      <div style={{ padding: '62px 20px 0' }}>
        <Skeleton w={80} h={13} />
        <div style={{ marginTop: 8 }}><Skeleton w={180} h={28} radius={10} /></div>
      </div>
      {/* Hero card skeleton */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ borderRadius: 20, background: '#C8D8F5', height: 160 }} />
      </div>
      {/* Quick action skeleton */}
      <div style={{ padding: '14px 20px 0' }}>
        <div style={{ borderRadius: 16, background: A.surface, height: 72, border: `0.5px solid ${A.border}` }} />
      </div>
      {/* Module skeletons */}
      <div style={{ padding: '24px 20px 0' }}>
        <Skeleton w={120} h={12} />
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{ borderRadius: 16, background: A.surface, height: 70, border: `0.5px solid ${A.border}` }} />
          ))}
        </div>
      </div>
    </div>
  )
}
