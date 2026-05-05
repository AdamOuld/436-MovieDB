'use client'

import { useState } from 'react'

interface Episode {
  id: number
  episode_number: number
  name: string
  overview: string | null
  air_date: string | null
  runtime_min: number | null
}

interface Season {
  id: number
  season_number: number
  name: string | null
  overview: string | null
  air_date: string | null
  episodes: Episode[]
}

export default function SeasonsAccordion({ seasons }: { seasons: Season[] }) {
  const [open, setOpen] = useState<number | null>(seasons.length > 0 ? seasons[0].id : null)

  return (
    <div className="flex flex-col gap-2">
      {seasons.map((season) => {
        const isOpen = open === season.id
        const label = season.name ?? `Season ${season.season_number}`
        const year = season.air_date?.slice(0, 4)
        const epCount = season.episodes.length

        return (
          <div key={season.id} className="border border-purple-900/40 rounded-lg overflow-hidden">
            {/* Header */}
            <button
              onClick={() => setOpen(isOpen ? null : season.id)}
              className="w-full flex items-center justify-between px-4 py-3 bg-purple-950/40 hover:bg-purple-950/60 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="font-medium text-sm">{label}</span>
                <span className="text-xs text-purple-600">{epCount} {epCount === 1 ? 'episode' : 'episodes'}</span>
                {year && <span className="text-xs text-purple-700">{year}</span>}
              </div>
              <span className={`text-purple-500 text-xs transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>

            {/* Body */}
            {isOpen && (
              <div>
                {season.overview && (
                  <p className="px-4 pt-3 pb-1 text-xs text-purple-500 leading-relaxed border-b border-purple-900/20">
                    {season.overview}
                  </p>
                )}
                <div className="divide-y divide-purple-900/20">
                  {season.episodes
                    .sort((a, b) => a.episode_number - b.episode_number)
                    .map((ep) => (
                      <div key={ep.id} className="px-4 py-3 flex gap-4 items-start">
                        <span className="text-xs text-purple-700 w-6 shrink-0 pt-0.5 text-right font-mono">
                          {ep.episode_number}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-3 flex-wrap">
                            <span className="text-sm font-medium">{ep.name}</span>
                            {ep.air_date && (
                              <span className="text-xs text-purple-600">{ep.air_date}</span>
                            )}
                            {ep.runtime_min && (
                              <span className="text-xs text-purple-700">{ep.runtime_min}m</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  {season.episodes.length === 0 && (
                    <p className="px-4 py-3 text-xs text-purple-700">No episodes available.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
