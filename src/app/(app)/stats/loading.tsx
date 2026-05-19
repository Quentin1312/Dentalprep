import { A } from '@/lib/theme'

function Skeleton({ w, h, radius = 8 }: { w: string | number; h: number; radius?: number }) {
  return <div style={{ width: w, height: h, borderRadius: radius, background: 'linear-gradient(90deg, #E9ECF2 25%, #F4F6F8 50%, #E9ECF2 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
}

export default function StatsLoading() {
  return (
    <div style={{ minHeight: '100%', background: A.bg, fontFamily: A.font, paddingBottom: 120 }}>
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }`}</style>
      <div style={{ padding: '62px 20px 0' }}>
        <Skeleton w={80} h={13} /><div style={{ marginTop: 8 }}><Skeleton w={160} h={28} radius={10} /></div>
      </div>
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ background: A.surface, borderRadius: 16, height: 90, border: `0.5px solid ${A.border}` }} />
      </div>
      <div style={{ padding: '14px 20px 0' }}>
        <div style={{ background: A.surface, borderRadius: 16, height: 180, border: `0.5px solid ${A.border}` }} />
      </div>
      <div style={{ padding: '14px 20px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div style={{ background: A.surface, borderRadius: 16, height: 110, border: `0.5px solid ${A.border}` }} />
        <div style={{ background: A.surface, borderRadius: 16, height: 110, border: `0.5px solid ${A.border}` }} />
      </div>
    </div>
  )
}
