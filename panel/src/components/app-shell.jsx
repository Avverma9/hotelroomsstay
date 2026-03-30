import { Outlet } from 'react-router-dom'
import Header from './header'
import Sidebar from './sidebar'

function AppShell() {
  return (
    <div className="min-h-screen bg-slate-50/60">
      <div className="flex min-h-screen">
        <Sidebar className="hidden shrink-0 border-r border-slate-200 md:flex" />

        <div className="flex h-screen w-full flex-1 flex-col overflow-hidden">
          <Header />

          <main className="flex-1 overflow-x-hidden overflow-y-auto [&::-webkit-scrollbar]:hidden">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}

export default AppShell
