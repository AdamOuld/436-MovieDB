'use client'

import { useState, useEffect } from 'react'
import {
  getSeasonsWithEpisodes, addSeason, updateSeason, deleteSeason,
  addEpisode, updateEpisode, deleteEpisode,
  type SeasonWithEpisodes,
} from '../actions'

const emptySeasonForm = { season_number: '', name: '', overview: '', air_date: '' }
const emptyEpisodeForm = { episode_number: '', name: '', overview: '', air_date: '', runtime_min: '' }

const inputCls = 'px-2 py-1.5 bg-black/40 border border-purple-900/50 rounded text-xs text-white focus:outline-none focus:border-purple-500 transition-colors'

export default function SeasonsManager({ titleId, titleName, onClose }: {
  titleId: number
  titleName: string
  onClose: () => void
}) {
  const [seasons, setSeasons] = useState<SeasonWithEpisodes[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const [showAddSeason, setShowAddSeason] = useState(false)
  const [newSeasonForm, setNewSeasonForm] = useState(emptySeasonForm)
  const [addingSeason, setAddingSeason] = useState(false)

  const [editingSeasonId, setEditingSeasonId] = useState<number | null>(null)
  const [editingSeasonForm, setEditingSeasonForm] = useState(emptySeasonForm)

  const [addingEpisodeSeasonId, setAddingEpisodeSeasonId] = useState<number | null>(null)
  const [newEpisodeForm, setNewEpisodeForm] = useState(emptyEpisodeForm)
  const [addingEpisode, setAddingEpisode] = useState(false)

  const [editingEpisodeId, setEditingEpisodeId] = useState<number | null>(null)
  const [editingEpisodeForm, setEditingEpisodeForm] = useState(emptyEpisodeForm)

  useEffect(() => {
    getSeasonsWithEpisodes(titleId).then((res) => {
      setLoading(false)
      if ('error' in res) { setError(res.error); return }
      setSeasons(res.seasons)
    })
  }, [titleId])

  async function handleAddSeason() {
    if (!newSeasonForm.season_number) { setError('Season number is required.'); return }
    setAddingSeason(true); setError(null)
    const res = await addSeason({
      title_id: titleId,
      season_number: parseInt(newSeasonForm.season_number),
      name: newSeasonForm.name || null,
      overview: newSeasonForm.overview || null,
      air_date: newSeasonForm.air_date || null,
    })
    setAddingSeason(false)
    if ('error' in res) { setError(res.error); return }
    setSeasons((prev) => [...prev, {
      id: res.id,
      season_number: parseInt(newSeasonForm.season_number),
      name: newSeasonForm.name || null,
      overview: newSeasonForm.overview || null,
      air_date: newSeasonForm.air_date || null,
      episodes: [],
    }].sort((a, b) => a.season_number - b.season_number))
    setNewSeasonForm(emptySeasonForm)
    setShowAddSeason(false)
  }

  async function handleUpdateSeason(id: number) {
    setError(null)
    const res = await updateSeason(id, {
      season_number: parseInt(editingSeasonForm.season_number),
      name: editingSeasonForm.name || null,
      overview: editingSeasonForm.overview || null,
      air_date: editingSeasonForm.air_date || null,
    })
    if (res.error) { setError(res.error); return }
    setSeasons((prev) => prev.map((s) => s.id === id ? {
      ...s,
      season_number: parseInt(editingSeasonForm.season_number),
      name: editingSeasonForm.name || null,
      overview: editingSeasonForm.overview || null,
      air_date: editingSeasonForm.air_date || null,
    } : s).sort((a, b) => a.season_number - b.season_number))
    setEditingSeasonId(null)
  }

  async function handleDeleteSeason(id: number) {
    setError(null)
    const res = await deleteSeason(id)
    if (res.error) { setError(res.error); return }
    setSeasons((prev) => prev.filter((s) => s.id !== id))
    if (expandedId === id) setExpandedId(null)
  }

  async function handleAddEpisode(seasonId: number) {
    if (!newEpisodeForm.episode_number || !newEpisodeForm.name.trim()) {
      setError('Episode number and name are required.'); return
    }
    setAddingEpisode(true); setError(null)
    const res = await addEpisode({
      season_id: seasonId,
      episode_number: parseInt(newEpisodeForm.episode_number),
      name: newEpisodeForm.name.trim(),
      overview: newEpisodeForm.overview || null,
      air_date: newEpisodeForm.air_date || null,
      runtime_min: newEpisodeForm.runtime_min ? parseInt(newEpisodeForm.runtime_min) : null,
    })
    setAddingEpisode(false)
    if ('error' in res) { setError(res.error); return }
    setSeasons((prev) => prev.map((s) => s.id === seasonId ? {
      ...s,
      episodes: [...s.episodes, {
        id: res.id,
        episode_number: parseInt(newEpisodeForm.episode_number),
        name: newEpisodeForm.name.trim(),
        overview: newEpisodeForm.overview || null,
        air_date: newEpisodeForm.air_date || null,
        runtime_min: newEpisodeForm.runtime_min ? parseInt(newEpisodeForm.runtime_min) : null,
      }].sort((a, b) => a.episode_number - b.episode_number),
    } : s))
    setNewEpisodeForm(emptyEpisodeForm)
    setAddingEpisodeSeasonId(null)
  }

  async function handleUpdateEpisode(id: number, seasonId: number) {
    if (!editingEpisodeForm.name.trim()) { setError('Name is required.'); return }
    setError(null)
    const res = await updateEpisode(id, {
      episode_number: parseInt(editingEpisodeForm.episode_number),
      name: editingEpisodeForm.name.trim(),
      overview: editingEpisodeForm.overview || null,
      air_date: editingEpisodeForm.air_date || null,
      runtime_min: editingEpisodeForm.runtime_min ? parseInt(editingEpisodeForm.runtime_min) : null,
    })
    if (res.error) { setError(res.error); return }
    setSeasons((prev) => prev.map((s) => s.id === seasonId ? {
      ...s,
      episodes: s.episodes.map((e) => e.id === id ? {
        ...e,
        episode_number: parseInt(editingEpisodeForm.episode_number),
        name: editingEpisodeForm.name.trim(),
        overview: editingEpisodeForm.overview || null,
        air_date: editingEpisodeForm.air_date || null,
        runtime_min: editingEpisodeForm.runtime_min ? parseInt(editingEpisodeForm.runtime_min) : null,
      } : e).sort((a, b) => a.episode_number - b.episode_number),
    } : s))
    setEditingEpisodeId(null)
  }

  async function handleDeleteEpisode(id: number, seasonId: number) {
    setError(null)
    const res = await deleteEpisode(id)
    if (res.error) { setError(res.error); return }
    setSeasons((prev) => prev.map((s) => s.id === seasonId
      ? { ...s, episodes: s.episodes.filter((e) => e.id !== id) }
      : s))
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-950 border border-purple-900/50 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-lg font-semibold text-purple-400">Seasons &amp; Episodes</h2>
            <p className="text-xs text-purple-600 mt-0.5">{titleName}</p>
          </div>
          <button onClick={onClose} className="text-purple-600 hover:text-white transition-colors cursor-pointer">✕</button>
        </div>

        {error && (
          <p className="mb-4 text-sm text-red-400 bg-red-950/30 border border-red-900/50 rounded px-3 py-2">{error}</p>
        )}

        {loading ? (
          <p className="text-sm text-purple-600">Loading…</p>
        ) : (
          <>
            {/* Season list */}
            <div className="flex flex-col gap-2 mb-4">
              {seasons.map((season) => (
                <div key={season.id} className="border border-purple-900/40 rounded-lg overflow-hidden">

                  {/* Season header — edit mode */}
                  {editingSeasonId === season.id ? (
                    <div className="px-4 py-3 bg-purple-950/50 flex flex-wrap gap-2 items-center">
                      <input type="number" value={editingSeasonForm.season_number} placeholder="Season #"
                        onChange={(e) => setEditingSeasonForm((f) => ({ ...f, season_number: e.target.value }))}
                        className={`${inputCls} w-20`} />
                      <input value={editingSeasonForm.name} placeholder="Name (optional)"
                        onChange={(e) => setEditingSeasonForm((f) => ({ ...f, name: e.target.value }))}
                        className={`${inputCls} flex-1 min-w-32`} />
                      <input type="date" value={editingSeasonForm.air_date}
                        onChange={(e) => setEditingSeasonForm((f) => ({ ...f, air_date: e.target.value }))}
                        className={inputCls} />
                      <div className="flex gap-3 ml-auto">
                        <button onClick={() => handleUpdateSeason(season.id)}
                          className="text-xs text-purple-400 hover:text-white transition-colors cursor-pointer">Save</button>
                        <button onClick={() => setEditingSeasonId(null)}
                          className="text-xs text-purple-700 hover:text-white transition-colors cursor-pointer">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    /* Season header — view mode */
                    <div className="flex items-center px-4 py-3 bg-purple-950/40">
                      <button className="flex-1 flex items-center gap-3 text-left cursor-pointer"
                        onClick={() => setExpandedId(expandedId === season.id ? null : season.id)}>
                        <span className={`text-purple-500 text-xs transition-transform ${expandedId === season.id ? 'rotate-90' : ''}`}>▶</span>
                        <span className="font-medium text-sm">{season.name ?? `Season ${season.season_number}`}</span>
                        <span className="text-xs text-purple-600">{season.episodes.length} episodes</span>
                        {season.air_date && <span className="text-xs text-purple-700">{season.air_date.slice(0, 4)}</span>}
                      </button>
                      <div className="flex items-center gap-3">
                        <button onClick={() => {
                          setEditingSeasonId(season.id)
                          setEditingSeasonForm({
                            season_number: season.season_number.toString(),
                            name: season.name ?? '',
                            overview: season.overview ?? '',
                            air_date: season.air_date ?? '',
                          })
                        }} className="text-xs text-purple-500 hover:text-white transition-colors cursor-pointer">Edit</button>
                        <button onClick={() => handleDeleteSeason(season.id)}
                          className="text-xs text-red-700 hover:text-red-400 transition-colors cursor-pointer">Delete</button>
                      </div>
                    </div>
                  )}

                  {/* Episodes — expanded */}
                  {expandedId === season.id && (
                    <div>
                      <div className="divide-y divide-purple-900/20">
                        {season.episodes.map((ep) => (
                          <div key={ep.id} className="px-4 py-2">
                            {editingEpisodeId === ep.id ? (
                              <div className="flex flex-wrap gap-2 items-center">
                                <input type="number" value={editingEpisodeForm.episode_number} placeholder="Ep #"
                                  onChange={(e) => setEditingEpisodeForm((f) => ({ ...f, episode_number: e.target.value }))}
                                  className={`${inputCls} w-16`} />
                                <input value={editingEpisodeForm.name} placeholder="Name *"
                                  onChange={(e) => setEditingEpisodeForm((f) => ({ ...f, name: e.target.value }))}
                                  className={`${inputCls} flex-1 min-w-32`} />
                                <input type="date" value={editingEpisodeForm.air_date}
                                  onChange={(e) => setEditingEpisodeForm((f) => ({ ...f, air_date: e.target.value }))}
                                  className={inputCls} />
                                <input type="number" value={editingEpisodeForm.runtime_min} placeholder="Min"
                                  onChange={(e) => setEditingEpisodeForm((f) => ({ ...f, runtime_min: e.target.value }))}
                                  className={`${inputCls} w-16`} />
                                <div className="flex gap-3 ml-auto">
                                  <button onClick={() => handleUpdateEpisode(ep.id, season.id)}
                                    className="text-xs text-purple-400 hover:text-white transition-colors cursor-pointer">Save</button>
                                  <button onClick={() => setEditingEpisodeId(null)}
                                    className="text-xs text-purple-700 hover:text-white transition-colors cursor-pointer">Cancel</button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-3">
                                <span className="text-xs text-purple-700 w-5 text-right font-mono shrink-0">{ep.episode_number}</span>
                                <span className="text-sm flex-1 truncate">{ep.name}</span>
                                {ep.air_date && <span className="text-xs text-purple-600 hidden sm:block shrink-0">{ep.air_date}</span>}
                                {ep.runtime_min && <span className="text-xs text-purple-700 shrink-0">{ep.runtime_min}m</span>}
                                <div className="flex gap-3 ml-auto shrink-0">
                                  <button onClick={() => {
                                    setEditingEpisodeId(ep.id)
                                    setEditingEpisodeForm({
                                      episode_number: ep.episode_number.toString(),
                                      name: ep.name,
                                      overview: ep.overview ?? '',
                                      air_date: ep.air_date ?? '',
                                      runtime_min: ep.runtime_min?.toString() ?? '',
                                    })
                                  }} className="text-xs text-purple-500 hover:text-white transition-colors cursor-pointer">Edit</button>
                                  <button onClick={() => handleDeleteEpisode(ep.id, season.id)}
                                    className="text-xs text-red-700 hover:text-red-400 transition-colors cursor-pointer">Delete</button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                        {season.episodes.length === 0 && (
                          <p className="px-4 py-2 text-xs text-purple-700">No episodes yet.</p>
                        )}
                      </div>

                      {/* Add episode */}
                      {addingEpisodeSeasonId === season.id ? (
                        <div className="px-4 py-3 border-t border-purple-900/30 bg-black/20 flex flex-wrap gap-2 items-center">
                          <input type="number" value={newEpisodeForm.episode_number} placeholder="Ep #"
                            onChange={(e) => setNewEpisodeForm((f) => ({ ...f, episode_number: e.target.value }))}
                            className={`${inputCls} w-16`} />
                          <input value={newEpisodeForm.name} placeholder="Name *"
                            onChange={(e) => setNewEpisodeForm((f) => ({ ...f, name: e.target.value }))}
                            className={`${inputCls} flex-1 min-w-32`} />
                          <input type="date" value={newEpisodeForm.air_date}
                            onChange={(e) => setNewEpisodeForm((f) => ({ ...f, air_date: e.target.value }))}
                            className={inputCls} />
                          <input type="number" value={newEpisodeForm.runtime_min} placeholder="Min"
                            onChange={(e) => setNewEpisodeForm((f) => ({ ...f, runtime_min: e.target.value }))}
                            className={`${inputCls} w-16`} />
                          <div className="flex gap-3 ml-auto">
                            <button onClick={() => handleAddEpisode(season.id)} disabled={addingEpisode}
                              className="text-xs px-3 py-1.5 bg-purple-700 hover:bg-purple-600 disabled:opacity-50 rounded transition-colors cursor-pointer">
                              {addingEpisode ? '…' : 'Add'}
                            </button>
                            <button onClick={() => { setAddingEpisodeSeasonId(null); setNewEpisodeForm(emptyEpisodeForm) }}
                              className="text-xs text-purple-700 hover:text-white transition-colors cursor-pointer">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setAddingEpisodeSeasonId(season.id); setNewEpisodeForm(emptyEpisodeForm) }}
                          className="w-full px-4 py-2 text-xs text-purple-600 hover:text-purple-400 border-t border-purple-900/20 text-left transition-colors cursor-pointer">
                          + Add Episode
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {seasons.length === 0 && !showAddSeason && (
                <p className="text-sm text-purple-700 py-2">No seasons yet.</p>
              )}
            </div>

            {/* Add season */}
            {showAddSeason ? (
              <div className="p-4 bg-purple-950/20 border border-purple-900/40 rounded-lg">
                <p className="text-xs font-semibold text-purple-400 mb-3">New Season</p>
                <div className="flex flex-wrap gap-2 items-center">
                  <input type="number" value={newSeasonForm.season_number} placeholder="Season # *"
                    onChange={(e) => setNewSeasonForm((f) => ({ ...f, season_number: e.target.value }))}
                    className={`${inputCls} w-24`} />
                  <input value={newSeasonForm.name} placeholder="Name (optional)"
                    onChange={(e) => setNewSeasonForm((f) => ({ ...f, name: e.target.value }))}
                    className={`${inputCls} flex-1 min-w-32`} />
                  <input type="date" value={newSeasonForm.air_date}
                    onChange={(e) => setNewSeasonForm((f) => ({ ...f, air_date: e.target.value }))}
                    className={inputCls} />
                  <div className="flex gap-3">
                    <button onClick={handleAddSeason} disabled={addingSeason}
                      className="px-3 py-1.5 bg-purple-700 hover:bg-purple-600 disabled:opacity-50 rounded text-xs font-medium transition-colors cursor-pointer">
                      {addingSeason ? '…' : 'Add Season'}
                    </button>
                    <button onClick={() => { setShowAddSeason(false); setNewSeasonForm(emptySeasonForm) }}
                      className="text-xs text-purple-700 hover:text-white transition-colors cursor-pointer">Cancel</button>
                  </div>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowAddSeason(true)}
                className="px-4 py-2 bg-purple-700 hover:bg-purple-600 rounded-lg text-sm font-medium transition-colors cursor-pointer">
                + Add Season
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
