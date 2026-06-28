import { Routes, Route, NavLink, Navigate } from 'react-router-dom'
import LogDay from './pages/LogDay'
import History from './pages/History'
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

  return (
    <div className="min-h-screen bg-ocean-50">
      {/* Top nav */}
      <nav className="bg-ocean-800 text-white shadow-md">
        <div className="max-w-2xl mx-auto px-4 py-3 flex justify-between items-center">
          <span className="font-bold text-lg tracking-tight">🎣 Fishing Log</span>
          <div className="flex gap-1">
            <NavLink
              to="/log"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  isActive ? 'bg-ocean-600' : 'hover:bg-ocean-700'
                }`
              }
            >
              + Log Day
            </NavLink>
            <NavLink
              to="/history"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  isActive ? 'bg-ocean-600' : 'hover:bg-ocean-700'
                }`
              }
            >
              History
            </NavLink>
          </div>
        </div>
      </nav>

      {/* Routes */}
      <main className="pb-12">
        <Routes>
          <Route path="/" element={<Navigate to="/history" replace />} />
          <Route
            path="/log"
            element={<LogDay onSave={handleSave} />}
          />
          <Route
            path="/history"
            element={
              <History
                sessions={sessions}
                loading={loading}
                onDelete={deleteSession}
              />
            }
          />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-ocean-400 py-4">
        Fishing Log · tides4fishing integration coming soon
      </footer>
    </div>
  )
}
