'use client'

import { useState, useTransition } from 'react'
import { addPerson, updatePerson, deletePerson } from '../actions'

interface Person {
  id: number; name: string; photo_url: string | null
  birth_date: string | null; death_date: string | null; bio: string | null
}

type Modal = 'add' | 'edit' | 'delete' | null

const emptyForm = { name: '', bio: '', birth_date: '', death_date: '', photo_url: '' }

export default function PeopleManager({ initialPeople }: { initialPeople: Person[] }) {
  const [people, setPeople] = useState(initialPeople)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<Modal>(null)
  const [target, setTarget] = useState<Person | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [, startTransition] = useTransition()

  const filtered = people.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  function openAdd() { setForm(emptyForm); setError(null); setModal('add') }

  function openEdit(p: Person) {
    setTarget(p)
    setForm({ name: p.name, bio: p.bio ?? '', birth_date: p.birth_date ?? '', death_date: p.death_date ?? '', photo_url: p.photo_url ?? '' })
    setError(null); setModal('edit')
  }

  function openDelete(p: Person) { setTarget(p); setError(null); setModal('delete') }
  function closeModal() { setModal(null); setTarget(null); setError(null) }

  async function handleSaveAdd() {
    if (!form.name.trim()) { setError('Name is required.'); return }
    setSaving(true)
    const res = await addPerson({
      name: form.name.trim(),
      bio: form.bio || null,
      birth_date: form.birth_date || null,
      death_date: form.death_date || null,
      photo_url: form.photo_url || null,
    })
    setSaving(false)
    if (res.error) { setError(res.error); return }
    closeModal()
    window.location.reload()
  }

  async function handleSaveEdit() {
    if (!target || !form.name.trim()) return
    setSaving(true)
    const res = await updatePerson(target.id, {
      name: form.name.trim(),
      bio: form.bio || null,
      birth_date: form.birth_date || null,
      death_date: form.death_date || null,
      photo_url: form.photo_url || null,
    })
    setSaving(false)
    if (res.error) { setError(res.error); return }
    setPeople((prev) => prev.map((p) => p.id === target.id ? { ...p, ...form, name: form.name.trim() } : p))
    closeModal()
  }

  function handleDelete() {
    if (!target) return
    startTransition(async () => {
      const res = await deletePerson(target.id)
      if (res.error) { setError(res.error); return }
      setPeople((prev) => prev.filter((p) => p.id !== target.id))
      closeModal()
    })
  }

  const inputCls = 'w-full px-3 py-2 bg-black/40 border border-purple-900/50 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500 transition-colors'
  const labelCls = 'block text-xs text-purple-500 mb-1'

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search people…"
          className="flex-1 max-w-sm px-3 py-2 bg-purple-950/40 border border-purple-900/50 rounded-lg text-sm text-white placeholder-purple-700 focus:outline-none focus:border-purple-500 transition-colors" />
        <button onClick={openAdd} className="ml-auto px-4 py-2 bg-purple-700 hover:bg-purple-600 rounded-lg text-sm font-medium transition-colors cursor-pointer">
          + Add Person
        </button>
      </div>
      <p className="text-xs text-purple-600 mb-4">{filtered.length} of {people.length} people</p>

      <div className="border border-purple-900/40 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-purple-950/60 border-b border-purple-900/40">
              <th className="text-left px-4 py-3 text-xs font-semibold text-purple-400 uppercase">Photo</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-purple-400 uppercase">Name</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-purple-400 uppercase hidden md:table-cell">Born</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-purple-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b border-purple-900/20 hover:bg-purple-900/10 transition-colors">
                <td className="px-4 py-3">
                  <div className="w-8 h-8 rounded-full bg-purple-900/30 border border-purple-900/50 flex items-center justify-center text-purple-400 text-xs font-bold">
                    {p.name.charAt(0)}
                  </div>
                </td>
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3 text-purple-500 hidden md:table-cell">{p.birth_date ?? '—'}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => openEdit(p)} className="text-xs text-purple-400 hover:text-white transition-colors cursor-pointer mr-3">Edit</button>
                  <button onClick={() => openDelete(p)} className="text-xs text-red-700 hover:text-red-400 transition-colors cursor-pointer">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Modal */}
      {(modal === 'add' || modal === 'edit') && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div className="bg-gray-950 border border-purple-900/50 rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-purple-400 mb-4">
              {modal === 'add' ? 'Add Person' : 'Edit Person'}
            </h2>
            <div className="flex flex-col gap-3">
              {([
                { label: 'Name *', key: 'name', type: 'text' },
                { label: 'Birth date', key: 'birth_date', type: 'date' },
                { label: 'Death date', key: 'death_date', type: 'date' },
                { label: 'Photo URL', key: 'photo_url', type: 'url' },
              ] as const).map(({ label, key, type }) => (
                <div key={key}>
                  <label className={labelCls}>{label}</label>
                  <input type={type} value={form[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    className={inputCls} />
                </div>
              ))}
              <div>
                <label className={labelCls}>Bio</label>
                <textarea value={form.bio} rows={4}
                  onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                  className={`${inputCls} resize-none`} />
              </div>
            </div>
            {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
            <div className="flex gap-3 mt-5 justify-end">
              <button onClick={closeModal} className="px-4 py-2 text-sm text-purple-500 hover:text-white transition-colors cursor-pointer">Cancel</button>
              <button onClick={modal === 'add' ? handleSaveAdd : handleSaveEdit} disabled={saving}
                className="px-4 py-2 bg-purple-700 hover:bg-purple-600 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors cursor-pointer">
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {modal === 'delete' && target && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div className="bg-gray-950 border border-purple-900/50 rounded-xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-red-400 mb-2">Delete Person</h2>
            <p className="text-sm text-gray-400 mb-1">Delete <span className="text-white font-medium">{target.name}</span>?</p>
            <p className="text-xs text-purple-600 mb-5">This will also remove all their credits.</p>
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
