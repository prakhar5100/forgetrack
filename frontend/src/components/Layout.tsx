import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, TrendingUp, Dumbbell, Clock, Camera, LogOut, Zap } from 'lucide-react'
import { useState } from 'react'
import LogWorkoutModal from './LogWorkoutModal'

const nav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/progress', icon: TrendingUp, label: 'Progress' },
  { to: '/exercises', icon: Dumbbell, label: 'Library' },
  { to: '/history', icon: Clock, label: 'History' },
  { to: '/photos', icon: Camera, label: 'Photos' },
]

export default function Layout() {
  const navigate = useNavigate()
  const [logOpen, setLogOpen] = useState(false)

  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-surface border-r border-border shrink-0">
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center glow-accent">
              <Zap size={18} className="text-white" fill="white" />
            </div>
            <div>
              <div className="font-display font-800 text-lg text-text tracking-tight">FORGE<span className="text-accent">TRACK</span></div>
              <div className="text-xs text-muted font-body">Workout Tracker</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-accent/15 text-accent border border-accent/20'
                    : 'text-muted hover:text-text hover:bg-card'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Log button */}
        <div className="p-4 border-t border-border">
          <button
            onClick={() => setLogOpen(true)}
            className="w-full py-3 rounded-xl bg-accent hover:bg-accent/90 text-white font-display font-600 text-sm transition-all glow-accent flex items-center justify-center gap-2"
          >
            <span className="text-lg">+</span> Log Workout
          </button>
          <button
            onClick={() => { localStorage.removeItem('token'); navigate('/login') }}
            className="w-full mt-2 py-2 rounded-xl text-muted hover:text-text text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        {/* Mobile header */}
        <header className="md:hidden sticky top-0 z-10 bg-surface/80 backdrop-blur border-b border-border px-4 py-3 flex items-center justify-between">
          <div className="font-display font-800 text-lg">FORGE<span className="text-accent">TRACK</span></div>
          <button
            onClick={() => setLogOpen(true)}
            className="px-4 py-2 rounded-xl bg-accent text-white text-sm font-600"
          >
            + Log
          </button>
        </header>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-10 bg-surface border-t border-border px-2 py-2 flex">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center gap-1 py-1 rounded-lg text-xs transition-colors ${
                  isActive ? 'text-accent' : 'text-muted'
                }`
              }
            >
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 md:p-8 pb-24 md:pb-8">
          <Outlet />
        </div>
      </main>

      {logOpen && <LogWorkoutModal onClose={() => setLogOpen(false)} />}
    </div>
  )
}
