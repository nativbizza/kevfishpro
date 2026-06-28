import { Routes, Route, NavLink, Link, Navigate } from 'react-router-dom'
import LogDay from './pages/LogDay'
import History from './pages/History'
import Home from './pages/Home'
import { useSessions } from './hooks/useSessions'

export default function App() {
  const { sessions, loading, addSession, updateSession, deleteSession } = useSessions()

  const handleSave = async (data, editId) => {
    if (editId) {
      await updateSession(editId, data)
    } else {
      await addSession(data)
    }
  }

  const navLink = (to, label) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `px-3 py-1.5 rounded-lg text-sm font-medium transition ${
          isActive ? 'bg-ocean-600' : 'hover:bg-ocean-700'
        }`
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
          <div className="flex gap-1">
            {navLink('/log', '+ Log Day')}
            {navLink('/history', 'History')}
          </div>
        </div>
      </nav>

      <main className="pb-12">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/log" element={<LogDay onSave={handleSave} />} />
          <Route
            path="/history"
            element={
              <History sessions={sessions} loading={loading} onDelete={deleteSession} />
            }
          />
        </Routes>
      </main>

      <footer className="text-center text-xs text-ocean-400 py-4">
        KevFishPro · Powered by Stormglass & tides4fishing
      </footer>
    </div>
  )
}
