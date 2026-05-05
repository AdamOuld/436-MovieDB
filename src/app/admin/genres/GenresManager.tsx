'use client'

import { useState, useTransition } from 'react'
import { addGenre, updateGenre, deleteGenre } from '../actions'

interface Genre { id: number; name: string }

interface Props {
  initialGenres: Genre[]
  titleCountByGenre: Record<number, number>
}

export default function GenresManager({ initialGenres, titleCountByGenre }: Props) {
  const [genres, setGenres] = useState(initialGenres)
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  function handleAdd() {
    if (!newName.trim()) return
    startTransition(async () => {
      const res = await addGenre(newName)
      if (res.error) { setError(res.error); return }
      setGenres((prev) => [...prev, { id: Date.now(), name: newName.trim() }].sort((a, b) => a.name.localeCompare(b.name)))
      setNewName('')
      setError(null)
      // Reload to get real IDs
      window.location.reload()
    })
  }

  function startEdit(genre: Genre) {
    setEditingId(genre.id)
    setEditingName(genre.name)
    setError(null)
  }

  function handleUpdate(id: number) {
    if (!editingName.trim()) return
    startTransition(async () => {
      const res = await updateGenre(id, editingName)
      if (res.error) { setError(res.error); return }
      setGenres((prev) => prev.map((g) => g.id === id ? { ...g, name: editingName.trim() } : g))
      setEditingId(null)
      setError(null)
    })
  }

  function handleDelete(id: number) {
    startTransition(async () => {
      const res = await deleteGenre(id)
      if (res.error) { setError(res.error); return }
      setGenres((prev) => prev.filter((g) => g.id !== id))
      setError(null)
    })
  }

  return (
    <div className="max-w-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-purple-300">Genres</h2>
        <span className="text-sm text-purple-600">{genres.length} total</span>
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-400 bg-red-950/30 border border-red-900/50 rounded-lg px-3 py-2">{error}</p>
      )}

      {/* Add genre */}
      <div className="flex gap-2 mb-6">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="New genre name…"
          className="flex-1 px-3 py-2 bg-purple-950/40 border border-purple-900/50 rounded-lg text-sm text-white placeholder-purple-700 focus:outline-none focus:border-purple-500 transition-colors"
        />
        <button
          onClick={handleAdd}
          disabled={!newName.trim()}
          className="px-4 py-2 bg-purple-700 hover:bg-purple-600 disabled:opacity-40 rounded-lg text-sm font-medium transition-colors cursor-pointer"
        >
          Add
        </button>
      </div>

      {/* Genre list */}
      <div className="flex flex-col gap-1">
        {genres.map((genre) => (
          <div
            key={genre.id}
            className="flex items-center gap-3 px-4 py-3 bg-purple-950/30 border border-purple-900/40 rounded-lg"
          >
            {editingId === genre.id ? (
              <>
                <input
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleUpdate(genre.id); if (e.key === 'Escape') setEditingId(null) }}
                  autoFocus
                  className="flex-1 px-2 py-1 bg-black/40 border border-purple-600 rounded text-sm text-white focus:outline-none"
                />
                <button onClick={() => handleUpdate(genre.id)} className="text-xs text-purple-400 hover:text-white transition-colors cursor-pointer">Save</button>
                <button onClick={() => setEditingId(null)} className="text-xs text-purple-700 hover:text-white transition-colors cursor-pointer">Cancel</button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm">{genre.name}</span>
                <span className="text-xs text-purple-700 mr-2">
                  {titleCountByGenre[genre.id] ?? 0} titles
                </span>
                <button onClick={() => startEdit(genre)} className="text-xs text-purple-500 hover:text-purple-300 transition-colors cursor-pointer">Edit</button>
                <button
                  onClick={() => handleDelete(genre.id)}
                  className="text-xs text-red-700 hover:text-red-400 transition-colors cursor-pointer"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
