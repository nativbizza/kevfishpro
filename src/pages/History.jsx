import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SA_FISH_SPECIES, SA_LOCATIONS } from '../constants'

export default function History({ sessions, loading, onDelete }) {
  const navigate = useNavigate()
  const [filterSpecies, setFilterSpecies] = useState('')
  const [filterLocation, setFilterLocation] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const filtered = sessions.filter((s) => {
    const matchSpecies =
      !filterSpecies ||
      s.catches?.some((c) => c.species === filterSpecies)
    const matchLocation =
      !filterLocation ||
      s.location?.includes(filterLocation.replace('Other', ''))
    return matchSpecies && matchLocation
  })

  const totalCatch = (catches = []) =>
    catches.reduce((sum, c) => sum + (parseInt(c.qty) || 0), 0)

  const handleDelete = async (id) => {
    await onDelete(id)
    setConfirmDelete(null)
    if (expandedId === id) setExpandedId(null)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-400">
        Loading sessions…
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-ocean-800">📋 Fishing History</h1>
        <button
          onClick={() => navigate('/log')}
          className="bg-ocean-700 hover:bg-ocean-800 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
        >
          + New Day
        </button>
      </div>

      {/* Stats bar */}
      {sessions.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <StatCard label="Total Sessions" value={sessions.length} emoji="🎣" />
          <StatCard
            label="Total Catches"
            value={sessions.reduce((s, sess) => s + totalCatch(sess.catches), 0)}
            emoji="🐟"
          />
          <StatCard
            label="Locations"
            value={new Set(sessions.map((s) => s.location)).size}
            emoji="📍"
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <select
          value={filterSpecies}
          onChange={(e) => setFilterSpecies(e.target.value)}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
        >
          <option value="">All species</option>
          {SA_FISH_SPECIES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={filterLocation}
          onChange={(e) => setFilterLocation(e.target.value)}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
        >
          <option value="">All locations</option>
          {[...new Set(sessions.map((s) => s.location))].map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
      </div>

      {/* Session list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🎣</p>
          <p className="text-lg font-medium">No sessions yet</p>
          <p className="text-sm mt-1">Log your first fishing day to get started</p>
          <button
            onClick={() => navigate('/log')}
            className="mt-4 bg-ocean-700 text-white px-5 py-2 rounded-lg text-sm font-semibold"
          >
            Log a Day
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              expanded={expandedId === session.id}
              onToggle={() =>
                setExpandedId(expandedId === session.id ? null : session.id)
              }
              onEdit={() => navigate('/log', { state: { session } })}
              onDelete={() => setConfirmDelete(session.id)}
              totalCatch={totalCatch(session.catches)}
            />
          ))}
        </div>
      )}

      {/* Delete confirm modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-lg mb-2">Delete session?</h3>
            <p className="text-sm text-gray-500 mb-5">This cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg font-semibold text-sm"
              >
                Delete
              </button>
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SessionCard({ session, expanded, onToggle, onEdit, onDelete, totalCatch }) {
  const date = session.date instanceof Date ? session.date : new Date(session.date)
  const dateStr = date.toLocaleDateString('en-ZA', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })
  const timeStr = date.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      {/* Header row */}
      <button
        onClick={onToggle}
        className="w-full text-left px-4 py-3 hover:bg-gray-50 transition"
      >
        <div className="flex justify-between items-start">
          <div>
            <p className="font-semibold text-gray-800">{dateStr} · {timeStr}</p>
            <p className="text-sm text-gray-500 mt-0.5">📍 {session.location}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-ocean-700 bg-ocean-50 px-2 py-1 rounded-full">
              {totalCatch} 🐟
            </span>
            <span className="text-gray-400 text-xs">{expanded ? '▲' : '▼'}</span>
          </div>
        </div>
        {/* Species chips */}
        <div className="flex flex-wrap gap-1 mt-2">
          {session.catches?.map((c, i) => (
            <span
              key={i}
              className="text-xs bg-ocean-100 text-ocean-700 px-2 py-0.5 rounded-full"
            >
              {c.species} ×{c.qty}
            </span>
          ))}
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 py-3 space-y-3 bg-gray-50">
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            {session.moonPhase && (
              <Detail label="Moon" value={session.moonPhase} />
            )}
            {session.tideType && (
              <Detail label="Tide" value={`${session.tideType}${session.tideHeight ? ` · ${session.tideHeight}m` : ''}`} />
            )}
            {session.surfConditions && (
              <Detail label="Surf" value={session.surfConditions} />
            )}
          </div>

          {/* Per-catch bait info */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Catches</p>
            {session.catches?.map((c, i) => (
              <div key={i} className="flex justify-between text-sm py-0.5">
                <span>{c.species} ×{c.qty}</span>
                {c.bait && <span className="text-gray-400">{c.bait}</span>}
              </div>
            ))}
          </div>

          {session.comments && (
            <p className="text-sm text-gray-600 italic border-t border-gray-200 pt-2">
              "{session.comments}"
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              onClick={onEdit}
              className="flex-1 text-sm border border-ocean-300 text-ocean-700 hover:bg-ocean-50 py-1.5 rounded-lg font-medium"
            >
              ✏️ Edit
            </button>
            <button
              onClick={onDelete}
              className="flex-1 text-sm border border-red-200 text-red-500 hover:bg-red-50 py-1.5 rounded-lg font-medium"
            >
              🗑 Delete
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, emoji }) {
  return (
    <div className="bg-ocean-50 rounded-xl p-3 text-center">
      <p className="text-2xl">{emoji}</p>
      <p className="text-xl font-bold text-ocean-800">{value}</p>
      <p className="text-xs text-ocean-600">{label}</p>
    </div>
  )
}

function Detail({ label, value }) {
  return (
    <div>
      <span className="text-gray-400 text-xs uppercase tracking-wide">{label} </span>
      <span className="text-gray-700">{value}</span>
    </div>
  )
}
