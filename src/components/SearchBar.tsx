'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'

export default function SearchBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const query = searchParams.get('q') ?? ''
  const kind = searchParams.get('kind') ?? 'all'

  function update(next: { q?: string; kind?: string }) {
    const params = new URLSearchParams(searchParams.toString())
    if ('q' in next) {
      next.q ? params.set('q', next.q) : params.delete('q')
    }
    if ('kind' in next) {
      next.kind && next.kind !== 'all' ? params.set('kind', next.kind) : params.delete('kind')
    }
    params.delete('page') // reset to page 1 on new search/filter
    startTransition(() => router.replace(`/?${params.toString()}`))
  }

  const tabs = [
    { label: 'All', value: 'all' },
    { label: 'Movies', value: 'movie' },
    { label: 'TV', value: 'tv' },
  ]

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-8">
      <div className="relative flex-1">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
          />
        </svg>
        <input
          type="text"
          placeholder="Search titles…"
          defaultValue={query}
          onChange={(e) => update({ q: e.target.value })}
          className="w-full pl-10 pr-4 py-2 bg-purple-950/40 border border-purple-900/50 rounded-lg text-sm text-white placeholder-purple-700 focus:outline-none focus:border-purple-500 transition-colors"
        />
      </div>

      <div className="flex gap-1 bg-purple-950/40 border border-purple-900/50 rounded-lg p-1 self-start">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => update({ kind: tab.value })}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
              kind === tab.value
                ? 'bg-purple-700 text-white'
                : 'text-purple-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  )
}
