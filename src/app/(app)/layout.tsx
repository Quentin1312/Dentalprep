import TabBar from '@/components/ui/TabBar'
import { AppProvider } from '@/lib/app-context'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <div className="flex flex-col min-h-screen max-w-sm mx-auto relative">
        <div className="flex-1 pb-24">{children}</div>
        <TabBar />
      </div>
    </AppProvider>
  )
}
