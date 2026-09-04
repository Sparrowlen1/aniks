import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import AccountModal from '../components/AccountModal'
import { lightColors, darkColors } from '../theme'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'

function AdminLayout() {
  const [accountOpen, setAccountOpen] = useState(false)
  const [theme, setTheme] = useState(
    () => localStorage.getItem('admin-theme') || 'light'
  )

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('admin-theme', theme)
  }, [theme])

  return (
    <SidebarProvider className="h-screen overflow-hidden font-body text-ink dark:text-cream">
      <Sidebar onOpenAccount={() => setAccountOpen(true)} />

      <SidebarInset className="overflow-y-auto">
        <Topbar
          theme={theme}
          onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
        />
        <div className="p-6">
          <Outlet context={{ theme }} />
        </div>
      </SidebarInset>

      {accountOpen && (
        <AccountModal onClose={() => setAccountOpen(false)} colors={theme === 'dark' ? darkColors : lightColors} />
      )}
    </SidebarProvider>
  )
}

export default AdminLayout
