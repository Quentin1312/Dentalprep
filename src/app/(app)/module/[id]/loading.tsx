import { A } from '@/lib/theme'

export default function ModuleLoading() {
  return (
    <div style={{ minHeight: '100%', background: A.bg, fontFamily: A.font, paddingBottom: 120 }}>
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }`}</style>
      <div style={{ padding: '62px 20px 0' }}>
        <div style={{ width: 80, height: 13, borderRadius: 6, background: '#E9ECF2', marginBottom: 16 }} />
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <div style={{ width: 54, height: 54, borderRadius: 16, background: '#E9ECF2' }} />
          <div>
            <div style={{ width: 100, height: 12, borderRadius: 6, background: '#E9ECF2' }} />
            <div style={{ width: 180, height: 24, borderRadius: 8, background: '#E9ECF2', marginTop: 6 }} />
          </div>
        </div>
      </div>
      <div style={{ padding: '16px 20px 0' }}>
        <div style={{ borderRadius: 16, height: 110, background: A.surface, border: `0.5px solid ${A.border}` }} />
      </div>
      <div style={{ padding: '20px 20px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{ borderRadius: 16, height: 100, background: A.surface, border: `0.5px solid ${A.border}` }} />
        <div style={{ borderRadius: 16, height: 100, background: A.surface, border: `0.5px solid ${A.border}` }} />
      </div>
    </div>
  )
}
