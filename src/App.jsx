import { Routes, Route, NavLink, Link, Navigate } from 'react-router-dom'
import LogDay from './pages/LogDay'
import History from './pages/History'
import Home from './pages/Home'
import Login from './pages/Login'
import { useSessions } from './hooks/useSessions'
import { useAuth } from './contexts/AuthContext'

function ProtectedApp() {
  const { user, loading: authLoading, isAdmin, logout } = useAuth()
  const { sessions, loading, addSession, updateSession, deleteSession } = useSessions()

  if (authLoading) {
    return (
      <div className="min-h-screen bg-ocean-50 flex items-center justify-center text-ocean-400 text-sm">
        Loading…
      </div>
    )
  }

  if (!user) return <Login />

  const handleSave = async (data, editId) => {
    if (editId) await updateSession(editId, data)
    else        await addSession(data)
  }

  const navLink = (to, label) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `px-3 py-1.5 rounded-lg text-sm font-medium transition ${isActive ? 'bg-ocean-600' : 'hover:bg-ocean-700'}`
      }
    >
      {label}
    </NavLink>
  )

  return (
    <div className="min-h-screen bg-ocean-50">
      <nav className="bg-ocean-800 text-white shadow-md">
        <div className="max-w-2xl mx-auto px-4 py-3 flex justify-between items-center">
          <Link to="/" className="font-bold text-lg tracking-tight hover:text-ocean-200 transition">
            🎣 KevFishPro
          </Link>
          <div className="flex items-center gap-1">
            {navLink('/log', '+ Log Day')}
            {navLink('/history', 'History')}
            <button
              onClick={logout}
              className="ml-2 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-ocean-700 transition text-ocean-300 hover:text-white"
              title={user.email}
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <main className="pb-12">
        <Routes>
          <Route path="/"        element={<Home isAdmin={isAdmin} />} />
          <Route path="/log"     element={<LogDay onSave={handleSave} />} />
          <Route path="/history" element={<History sessions={sessions} loading={loading} onDelete={deleteSession} />} />
          <Route path="*"        element={<Navigate to="/" />} />
        </Routes>
      </main>

      <footer className="text-center text-xs text-ocean-400 py-4">
        KevFishPro · A kpg_oira initiative
      </footer>
    </div>
  )
}

export default function App() {
  return <ProtectedApp />
}
