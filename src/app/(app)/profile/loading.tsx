import { A } from '@/lib/theme'

export default function ProfileLoading() {
  return (
    <div style={{ minHeight: '100%', background: A.bg, fontFamily: A.font, paddingBottom: 120 }}>
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }`}</style>
      <div style={{ padding: '62px 20px 0' }}>
        <div style={{ width: 80, height: 13, borderRadius: 6, background: '#E9ECF2' }} />
        <div style={{ marginTop: 8, width: 120, height: 28, borderRadius: 10, background: '#E9ECF2' }} />
      </div>
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ borderRadius: 20, height: 180, background: '#C8D8F5' }} />
      </div>
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ borderRadius: 16, height: 220, background: A.surface, border: `0.5px solid ${A.border}` }} />
      </div>
    </div>
  )
}
