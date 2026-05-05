'use client'

import { useState } from 'react'
import {
  addTitle, updateTitle, deleteTitle,
  getTitleDetails, addCredit, deleteCredit, searchPeopleByName,
  type TitleDetails,
} from '../actions'
import SeasonsManager from './SeasonsManager'

type CreditRole = 'actor' | 'director' | 'writer' | 'producer' | 'composer'

interface Title {
  id: number
  title: string
  kind: 'movie' | 'tv'
  release_date: string | null
  poster_url: string | null
  overview: string | null
  runtime_min: number | null
  end_date: string | null
  language: string | null
  original_title: string | null
  backdrop_url: string | null
  trailer_url: string | null
}

interface Genre { id: number; name: string }

type Modal = 'add' | 'edit' | 'delete' | null

const emptyForm = {
  title: '', kind: 'movie' as 'movie' | 'tv', overview: '',
  release_date: '', end_date: '', runtime_min: '',
  language: '', original_title: '', poster_url: '', backdrop_url: '', trailer_url: '',
}

const ROLES: CreditRole[] = ['actor', 'director', 'writer', 'producer', 'composer']

export default function TitlesManager({ initialTitles, genres }: { initialTitles: Title[]; genres: Genre[] }) {
  const [titles, setTitles] = useState(initialTitles)
  const [search, setSearch] = useState('')
  const [kindFilter, setKindFilter] = useState<'all' | 'movie' | 'tv'>('all')
  const [modal, setModal] = useState<Modal>(null)
  const [target, setTarget] = useState<Title | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [selectedGenreIds, setSelectedGenreIds] = useState<number[]>([])
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [seasonsTarget, setSeasonsTarget] = useState<Title | null>(null)

  // Edit modal — credits state
  const [details, setDetails] = useState<TitleDetails | null>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)

  // Add credit sub-form
  const [personQuery, setPersonQuery] = useState('')
  const [personResults, setPersonResults] = useState<{ id: number; name: string }[]>([])
  const [personSearching, setPersonSearching] = useState(false)
  const [selectedPerson, setSelectedPerson] = useState<{ id: number; name: string } | null>(null)
  const [newRole, setNewRole] = useState<CreditRole>('actor')
  const [newCharacter, setNewCharacter] = useState('')
  const [addingCredit, setAddingCredit] = useState(false)

  const filtered = titles.filter((t) =>
    (kindFilter === 'all' || t.kind === kindFilter) &&
    t.title.toLowerCase().includes(search.toLowerCase())
  )

  function openAdd() {
    setForm(emptyForm); setSelectedGenreIds([]); setError(null); setModal('add')
  }

  async function openEdit(t: Title) {
    setTarget(t)
    setForm({
      title: t.title, kind: t.kind, overview: t.overview ?? '',
      release_date: t.release_date ?? '', end_date: t.end_date ?? '',
      runtime_min: t.runtime_min?.toString() ?? '', language: t.language ?? '',
      original_title: t.original_title ?? '', poster_url: t.poster_url ?? '',
      backdrop_url: t.backdrop_url ?? '', trailer_url: t.trailer_url ?? '',
    })
    setSelectedGenreIds([]); setDetails(null); setError(null)
    setPersonQuery(''); setPersonResults([]); setSelectedPerson(null)
    setNewRole('actor'); setNewCharacter('')
    setModal('edit')
    setDetailsLoading(true)
    const res = await getTitleDetails(t.id)
    setDetailsLoading(false)
    if ('error' in res) { setError(res.error); return }
    setDetails(res)
    setSelectedGenreIds(res.genreIds)
  }

  function openDelete(t: Title) { setTarget(t); setError(null); setModal('delete') }

  function closeModal() {
    setModal(null); setTarget(null); setError(null)
    setDetails(null); setPersonResults([]); setSelectedPerson(null)
  }

  function toggleGenre(id: number) {
    setSelectedGenreIds((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    )
  }

  async function handleSaveAdd() {
    if (!form.title.trim()) { setError('Title is required.'); return }
    setSaving(true)
    const res = await addTitle({
      title: form.title.trim(), kind: form.kind,
      overview: form.overview || null,
      release_date: form.release_date || null,
      end_date: form.end_date || null,
      runtime_min: form.runtime_min ? parseInt(form.runtime_min) : null,
      language: form.language || null,
      original_title: form.original_title || null,
      poster_url: form.poster_url || null,
      backdrop_url: form.backdrop_url || null,
      trailer_url: form.trailer_url || null,
    }, selectedGenreIds)
    setSaving(false)
    if ('error' in res) { setError(res.error); return }
    closeModal()
    window.location.reload()
  }

  async function handleSaveEdit() {
    if (!target || !form.title.trim()) { setError('Title is required.'); return }
    setSaving(true)
    const res = await updateTitle(target.id, {
      title: form.title.trim(), kind: form.kind,
      overview: form.overview || null,
      release_date: form.release_date || null,
      end_date: form.end_date || null,
      runtime_min: form.runtime_min ? parseInt(form.runtime_min) : null,
      language: form.language || null,
      original_title: form.original_title || null,
      poster_url: form.poster_url || null,
      backdrop_url: form.backdrop_url || null,
      trailer_url: form.trailer_url || null,
    }, selectedGenreIds)
    setSaving(false)
    if (res.error) { setError(res.error); return }
    setTitles((prev) => prev.map((t) =>
      t.id === target.id ? { ...t, ...form, title: form.title.trim(), runtime_min: form.runtime_min ? parseInt(form.runtime_min) : null } : t
    ))
    closeModal()
  }

  async function handleDelete() {
    if (!target) return
    const res = await deleteTitle(target.id)
    if (res.error) { setError(res.error); return }
    setTitles((prev) => prev.filter((t) => t.id !== target.id))
    closeModal()
  }

  async function handlePersonSearch() {
    if (!personQuery.trim()) return
    setPersonSearching(true)
    const res = await searchPeopleByName(personQuery)
    setPersonSearching(false)
    if ('error' in res) return
    setPersonResults(res.results)
  }

  async function handleAddCredit() {
    if (!target || !selectedPerson) return
    setAddingCredit(true)
    const res = await addCredit({
      title_id: target.id,
      person_id: selectedPerson.id,
      role: newRole,
      character_name: newCharacter.trim() || null,
    })
    setAddingCredit(false)
    if ('error' in res) { setError(res.error); return }
    setDetails((prev) => prev ? {
      ...prev,
      credits: [...prev.credits, {
        id: res.id,
        person_id: selectedPerson.id,
        person_name: selectedPerson.name,
        role: newRole,
        character_name: newCharacter.trim() || null,
        billing_order: null,
      }],
    } : prev)
    setSelectedPerson(null); setPersonQuery(''); setPersonResults([])
    setNewRole('actor'); setNewCharacter('')
  }

  async function handleDeleteCredit(creditId: number) {
    const res = await deleteCredit(creditId)
    if (res.error) { setError(res.error); return }
    setDetails((prev) => prev ? { ...prev, credits: prev.credits.filter((c) => c.id !== creditId) } : prev)
  }

  const kindBadge = (kind: 'movie' | 'tv') => (
    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${kind === 'movie' ? 'bg-blue-900/50 text-blue-300' : 'bg-green-900/50 text-green-300'}`}>
      {kind === 'movie' ? 'Movie' : 'TV'}
    </span>
  )

  const inputCls = 'w-full px-3 py-2 bg-black/40 border border-purple-900/50 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500 transition-colors'
  const labelCls = 'block text-xs text-purple-500 mb-1'

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search titles…"
          className="flex-1 min-w-48 max-w-sm px-3 py-2 bg-purple-950/40 border border-purple-900/50 rounded-lg text-sm text-white placeholder-purple-700 focus:outline-none focus:border-purple-500 transition-colors" />
        <div className="flex rounded-lg overflow-hidden border border-purple-900/50">
          {(['all', 'movie', 'tv'] as const).map((k) => (
            <button key={k} onClick={() => setKindFilter(k)}
              className={`px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${kindFilter === k ? 'bg-purple-700 text-white' : 'bg-purple-950/40 text-purple-400 hover:bg-purple-900/40'}`}>
              {k === 'all' ? 'All' : k === 'movie' ? 'Movies' : 'TV'}
            </button>
          ))}
        </div>
        <button onClick={openAdd} className="ml-auto px-4 py-2 bg-purple-700 hover:bg-purple-600 rounded-lg text-sm font-medium transition-colors cursor-pointer">
          + Add Title
        </button>
      </div>
      <p className="text-xs text-purple-600 mb-4">{filtered.length} of {titles.length} titles</p>

      {/* Table */}
      <div className="border border-purple-900/40 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-purple-950/60 border-b border-purple-900/40">
              <th className="text-left px-4 py-3 text-xs font-semibold text-purple-400 uppercase">Poster</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-purple-400 uppercase">Title</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-purple-400 uppercase hidden sm:table-cell">Kind</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-purple-400 uppercase hidden md:table-cell">Year</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-purple-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id} className="border-b border-purple-900/20 hover:bg-purple-900/10 transition-colors">
                <td className="px-4 py-3">
                  <div className="w-8 h-12 rounded overflow-hidden bg-purple-900/30 border border-purple-900/50">
                    {t.poster_url
                      ? <img src={t.poster_url} alt={t.title} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-purple-700 text-xs">?</div>}
                  </div>
                </td>
                <td className="px-4 py-3 font-medium max-w-xs truncate">{t.title}</td>
                <td className="px-4 py-3 hidden sm:table-cell">{kindBadge(t.kind)}</td>
                <td className="px-4 py-3 text-purple-500 hidden md:table-cell">{t.release_date?.slice(0, 4) ?? '—'}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  {t.kind === 'tv' && (
                    <button onClick={() => setSeasonsTarget(t)} className="text-xs text-green-700 hover:text-green-400 transition-colors cursor-pointer mr-3">Seasons</button>
                  )}
                  <button onClick={() => openEdit(t)} className="text-xs text-purple-400 hover:text-white transition-colors cursor-pointer mr-3">Edit</button>
                  <button onClick={() => openDelete(t)} className="text-xs text-red-700 hover:text-red-400 transition-colors cursor-pointer">Delete</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-purple-700">No titles found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {modal === 'add' && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div className="bg-gray-950 border border-purple-900/50 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-purple-400 mb-4">Add Title</h2>
            <div className="flex flex-col gap-3">
              <div>
                <label className={labelCls}>Kind</label>
                <div className="flex gap-2">
                  {(['movie', 'tv'] as const).map((k) => (
                    <button key={k} type="button" onClick={() => setForm((f) => ({ ...f, kind: k }))}
                      className={`flex-1 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${form.kind === k ? 'bg-purple-700 text-white' : 'bg-purple-950/40 text-purple-400 border border-purple-900/50 hover:bg-purple-900/40'}`}>
                      {k === 'movie' ? 'Movie' : 'TV Show'}
                    </button>
                  ))}
                </div>
              </div>
              {([
                { label: 'Title *', key: 'title' as const, type: 'text' },
                { label: 'Original title', key: 'original_title' as const, type: 'text' },
                { label: 'Release date', key: 'release_date' as const, type: 'date' },
                ...(form.kind === 'movie' ? [{ label: 'Runtime (minutes)', key: 'runtime_min' as const, type: 'number' }] : []),
                { label: 'Language', key: 'language' as const, type: 'text' },
                { label: 'Poster URL', key: 'poster_url' as const, type: 'url' },
                { label: 'Backdrop URL', key: 'backdrop_url' as const, type: 'url' },
                { label: 'Trailer URL', key: 'trailer_url' as const, type: 'url' },
              ]).map(({ label, key, type }) => (
                <div key={key}>
                  <label className={labelCls}>{label}</label>
                  <input type={type} value={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} className={inputCls} />
                </div>
              ))}
              {form.kind === 'tv' && (
                <div>
                  <label className={labelCls}>End date</label>
                  <input type="date" value={form.end_date} onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))} className={inputCls} />
                </div>
              )}
              <div>
                <label className={labelCls}>Overview</label>
                <textarea value={form.overview} rows={3} onChange={(e) => setForm((f) => ({ ...f, overview: e.target.value }))} className={`${inputCls} resize-none`} />
              </div>
              <div>
                <label className={labelCls}>Genres</label>
                <div className="flex flex-wrap gap-2 p-3 bg-black/20 border border-purple-900/40 rounded-lg">
                  {genres.map((g) => (
                    <button key={g.id} type="button" onClick={() => toggleGenre(g.id)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${selectedGenreIds.includes(g.id) ? 'bg-purple-700 text-white' : 'bg-purple-950/60 text-purple-400 border border-purple-900/50 hover:border-purple-600'}`}>
                      {g.name}
                    </button>
                  ))}
                  {genres.length === 0 && <p className="text-xs text-purple-700">No genres yet — add them in the Genres tab.</p>}
                </div>
              </div>
            </div>
            {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
            <div className="flex gap-3 mt-5 justify-end">
              <button onClick={closeModal} className="px-4 py-2 text-sm text-purple-500 hover:text-white transition-colors cursor-pointer">Cancel</button>
              <button onClick={handleSaveAdd} disabled={saving}
                className="px-4 py-2 bg-purple-700 hover:bg-purple-600 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors cursor-pointer">
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {modal === 'edit' && target && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div className="bg-gray-950 border border-purple-900/50 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-purple-400 mb-4">Edit Title</h2>

            <div className="flex flex-col gap-3">
              <div>
                <label className={labelCls}>Kind</label>
                <div className="flex gap-2">
                  {(['movie', 'tv'] as const).map((k) => (
                    <button key={k} type="button" onClick={() => setForm((f) => ({ ...f, kind: k }))}
                      className={`flex-1 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${form.kind === k ? 'bg-purple-700 text-white' : 'bg-purple-950/40 text-purple-400 border border-purple-900/50 hover:bg-purple-900/40'}`}>
                      {k === 'movie' ? 'Movie' : 'TV Show'}
                    </button>
                  ))}
                </div>
              </div>
              {([
                { label: 'Title *', key: 'title' as const, type: 'text' },
                { label: 'Original title', key: 'original_title' as const, type: 'text' },
                { label: 'Release date', key: 'release_date' as const, type: 'date' },
                ...(form.kind === 'movie' ? [{ label: 'Runtime (minutes)', key: 'runtime_min' as const, type: 'number' }] : []),
                { label: 'Language', key: 'language' as const, type: 'text' },
                { label: 'Poster URL', key: 'poster_url' as const, type: 'url' },
                { label: 'Backdrop URL', key: 'backdrop_url' as const, type: 'url' },
                { label: 'Trailer URL', key: 'trailer_url' as const, type: 'url' },
              ]).map(({ label, key, type }) => (
                <div key={key}>
                  <label className={labelCls}>{label}</label>
                  <input type={type} value={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} className={inputCls} />
                </div>
              ))}
              {form.kind === 'tv' && (
                <div>
                  <label className={labelCls}>End date</label>
                  <input type="date" value={form.end_date} onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))} className={inputCls} />
                </div>
              )}
              <div>
                <label className={labelCls}>Overview</label>
                <textarea value={form.overview} rows={3} onChange={(e) => setForm((f) => ({ ...f, overview: e.target.value }))} className={`${inputCls} resize-none`} />
              </div>
              <div>
                <label className={labelCls}>Genres</label>
                <div className="flex flex-wrap gap-2 p-3 bg-black/20 border border-purple-900/40 rounded-lg">
                  {genres.map((g) => (
                    <button key={g.id} type="button" onClick={() => toggleGenre(g.id)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${selectedGenreIds.includes(g.id) ? 'bg-purple-700 text-white' : 'bg-purple-950/60 text-purple-400 border border-purple-900/50 hover:border-purple-600'}`}>
                      {g.name}
                    </button>
                  ))}
                  {genres.length === 0 && <p className="text-xs text-purple-700">No genres yet — add them in the Genres tab.</p>}
                </div>
              </div>
            </div>

            {/* Credits */}
            <div className="mt-6 pt-5 border-t border-purple-900/30">
              <h3 className="text-sm font-semibold text-purple-400 mb-3">Credits</h3>

              {detailsLoading && <p className="text-xs text-purple-600 mb-3">Loading…</p>}

              {details && (
                <>
                  {details.credits.length > 0 && (
                    <div className="mb-3 flex flex-col gap-1">
                      {details.credits.map((c) => (
                        <div key={c.id} className="flex items-center gap-2 px-3 py-2 bg-purple-950/30 border border-purple-900/30 rounded-lg text-sm">
                          <span className="font-medium flex-1 truncate">{c.person_name}</span>
                          <span className="text-xs text-purple-500 capitalize">{c.role}</span>
                          {c.character_name && <span className="text-xs text-purple-700 truncate max-w-24">as {c.character_name}</span>}
                          <button onClick={() => handleDeleteCredit(c.id)}
                            className="text-red-800 hover:text-red-500 transition-colors cursor-pointer text-xs ml-1 shrink-0">✕</button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add credit form */}
                  <div className="p-3 bg-black/20 border border-purple-900/30 rounded-lg">
                    <p className="text-xs text-purple-500 mb-2 font-medium">Add credit</p>

                    {selectedPerson ? (
                      <div className="flex items-center gap-2 mb-2 px-2 py-1.5 bg-purple-900/30 rounded text-sm">
                        <span className="flex-1">{selectedPerson.name}</span>
                        <button onClick={() => { setSelectedPerson(null); setPersonResults([]) }}
                          className="text-xs text-purple-600 hover:text-white cursor-pointer">✕</button>
                      </div>
                    ) : (
                      <div className="flex gap-2 mb-2">
                        <input value={personQuery} onChange={(e) => setPersonQuery(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handlePersonSearch()}
                          placeholder="Search person by name…"
                          className="flex-1 px-2 py-1.5 bg-black/40 border border-purple-900/50 rounded text-xs text-white placeholder-purple-700 focus:outline-none focus:border-purple-500" />
                        <button onClick={handlePersonSearch} disabled={personSearching}
                          className="px-3 py-1.5 bg-purple-800 hover:bg-purple-700 rounded text-xs transition-colors cursor-pointer disabled:opacity-50">
                          {personSearching ? '…' : 'Search'}
                        </button>
                      </div>
                    )}

                    {personResults.length > 0 && !selectedPerson && (
                      <div className="mb-2 flex flex-col gap-1 max-h-28 overflow-y-auto">
                        {personResults.map((p) => (
                          <button key={p.id} onClick={() => { setSelectedPerson(p); setPersonResults([]) }}
                            className="text-left px-2 py-1.5 text-xs rounded hover:bg-purple-900/40 transition-colors cursor-pointer">
                            {p.name}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2 mt-1">
                      <select value={newRole} onChange={(e) => setNewRole(e.target.value as CreditRole)}
                        className="px-2 py-1.5 bg-black/40 border border-purple-900/50 rounded text-xs text-white focus:outline-none focus:border-purple-500 capitalize">
                        {ROLES.map((r) => <option key={r} value={r} className="capitalize">{r}</option>)}
                      </select>
                      {newRole === 'actor' && (
                        <input value={newCharacter} onChange={(e) => setNewCharacter(e.target.value)}
                          placeholder="Character name (optional)"
                          className="flex-1 px-2 py-1.5 bg-black/40 border border-purple-900/50 rounded text-xs text-white placeholder-purple-700 focus:outline-none focus:border-purple-500" />
                      )}
                      <button onClick={handleAddCredit} disabled={!selectedPerson || addingCredit}
                        className="px-3 py-1.5 bg-purple-700 hover:bg-purple-600 disabled:opacity-40 rounded text-xs font-medium transition-colors cursor-pointer shrink-0">
                        {addingCredit ? '…' : 'Add'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
            <div className="flex gap-3 mt-5 justify-end">
              <button onClick={closeModal} className="px-4 py-2 text-sm text-purple-500 hover:text-white transition-colors cursor-pointer">Cancel</button>
              <button onClick={handleSaveEdit} disabled={saving}
                className="px-4 py-2 bg-purple-700 hover:bg-purple-600 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors cursor-pointer">
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Seasons Modal */}
      {seasonsTarget && (
        <SeasonsManager
          titleId={seasonsTarget.id}
          titleName={seasonsTarget.title}
          onClose={() => setSeasonsTarget(null)}
        />
      )}

      {/* Delete Modal */}
      {modal === 'delete' && target && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div className="bg-gray-950 border border-purple-900/50 rounded-xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-red-400 mb-2">Delete Title</h2>
            <p className="text-sm text-gray-400 mb-1">Delete <span className="text-white font-medium">{target.title}</span>?</p>
            <p className="text-xs text-purple-600 mb-5">This will also remove all credits, reviews, favorites, and episodes.</p>
            {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
            <div className="flex gap-3 justify-end">
              <button onClick={closeModal} className="px-4 py-2 text-sm text-purple-500 hover:text-white transition-colors cursor-pointer">Cancel</button>
              <button onClick={handleDelete} className="px-4 py-2 bg-red-800 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors cursor-pointer">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
