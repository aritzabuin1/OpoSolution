import { Sidebar } from '@/components/layout/Sidebar'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Mobile navbar — visible en <768px */}
      <Navbar />

      <div className="flex flex-1">
        {/* Desktop sidebar — visible en ≥768px */}
        <div className="hidden md:flex">
          <Sidebar />
        </div>

        {/* Main content */}
        <main className="flex-1 p-6">{children}</main>
      </div>

      <Footer />
    </div>
  )
}
