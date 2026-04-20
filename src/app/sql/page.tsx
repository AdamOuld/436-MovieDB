'use client'

import { useState, useTransition } from 'react'
import { runQuery, type QueryResult } from './actions'

const PRESETS: { label: string; sql: string }[] = [
  {
    label: 'Top rated titles',
    sql: `SELECT t.title, t.kind, t.release_date,
  ROUND(tr.avg_rating::numeric, 2) AS avg_rating,
  tr.review_count
FROM titles t
JOIN title_ratings tr ON t.id = tr.title_id
WHERE tr.review_count > 0
ORDER BY tr.avg_rating DESC, tr.review_count DESC;`,
  },
  {
    label: 'Genre breakdown',
    sql: `SELECT g.name AS genre, COUNT(tg.title_id) AS title_count
FROM genres g
LEFT JOIN title_genres tg ON g.id = tg.genre_id
GROUP BY g.id, g.name
ORDER BY title_count DESC;`,
  },
  {
    label: 'Most active reviewers',
    sql: `SELECT p.username, COUNT(r.id) AS reviews,
  ROUND(AVG(r.rating)::numeric, 2) AS avg_rating_given
FROM profiles p
JOIN reviews r ON p.id = r.user_id
GROUP BY p.id, p.username
ORDER BY reviews DESC;`,
  },
  {
    label: 'Recent reviews',
    sql: `SELECT t.title, p.username, r.rating,
  LEFT(r.review_text, 80) AS excerpt,
  r.created_at::date AS date
FROM reviews r
JOIN titles t ON r.title_id = t.id
JOIN profiles p ON r.user_id = p.id
ORDER BY r.created_at DESC
LIMIT 20;`,
  },
  {
    label: 'Top cast members',
    sql: `SELECT p.name, COUNT(c.title_id) AS appearances
FROM people p
JOIN credits c ON p.id = c.person_id
WHERE c.role = 'actor'
GROUP BY p.id, p.name
ORDER BY appearances DESC
LIMIT 20;`,
  },
  {
    label: 'Titles without posters',
    sql: `SELECT id, title, kind, release_date
FROM titles
WHERE poster_url IS NULL
ORDER BY title;`,
  },
]

export default function SqlPage() {
  const [sql, setSql] = useState(PRESETS[0].sql)
  const [result, setResult] = useState<QueryResult | null>(null)
  const [isPending, startTransition] = useTransition()

  function run() {
    startTransition(async () => {
      const res = await runQuery(sql)
      setResult(res)
    })
  }

  function loadPreset(preset: (typeof PRESETS)[0]) {
    setSql(preset.sql)
    setResult(null)
  }

  const success = result && !('error' in result)
  const failure = result && 'error' in result

  return (
    <main className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-purple-400 mb-6">SQL Query</h1>

      <div className="flex gap-6 flex-col lg:flex-row">
        {/* Sidebar: presets */}
        <aside className="lg:w-56 shrink-0">
          <p className="text-xs text-purple-600 uppercase tracking-wide mb-2 font-medium">Default queries</p>
          <div className="flex flex-col gap-1">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => loadPreset(p)}
                className={`text-left text-sm px-3 py-2 rounded-lg transition-colors cursor-pointer truncate
                  ${sql === p.sql
                    ? 'bg-purple-800/60 text-white'
                    : 'text-purple-400 hover:bg-purple-900/40 hover:text-white'
                  }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </aside>

        {/* Main: editor + results */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          {/* Editor */}
          <div className="relative">
            <textarea
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              spellCheck={false}
              rows={10}
              className="w-full font-mono text-sm bg-purple-950/30 border border-purple-900/50 rounded-lg px-4 py-3 text-gray-200 placeholder-purple-700 focus:outline-none focus:border-purple-500 transition-colors resize-y"
              placeholder="SELECT * FROM titles LIMIT 10;"
            />
            <button
              onClick={run}
              disabled={isPending}
              className="absolute bottom-3 right-3 px-4 py-1.5 bg-purple-700 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors cursor-pointer"
            >
              {isPending ? 'Running…' : 'Run ▶'}
            </button>
          </div>

          {/* Results */}
          {failure && (
            <div className="bg-red-950/30 border border-red-900/50 rounded-lg px-4 py-3 text-sm text-red-400 font-mono">
              {(result as { error: string }).error}
            </div>
          )}

          {success && (() => {
            const { columns, rows, rowCount, duration } = result as {
              columns: string[]
              rows: Record<string, unknown>[]
              rowCount: number
              duration: number
            }
            return (
              <div>
                <p className="text-xs text-purple-600 mb-2">
                  {rowCount} {rowCount === 1 ? 'row' : 'rows'} · {duration}ms
                </p>

                {rows.length === 0 ? (
                  <p className="text-sm text-purple-700">No rows returned.</p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-purple-900/50">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-purple-950/60 border-b border-purple-900/50">
                          {columns.map((col) => (
                            <th
                              key={col}
                              className="text-left px-4 py-2.5 text-xs font-semibold text-purple-400 uppercase tracking-wide whitespace-nowrap"
                            >
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, i) => (
                          <tr
                            key={i}
                            className="border-b border-purple-900/30 hover:bg-purple-900/20 transition-colors"
                          >
                            {columns.map((col) => (
                              <td
                                key={col}
                                className="px-4 py-2.5 text-gray-300 font-mono whitespace-nowrap max-w-xs truncate"
                                title={String(row[col] ?? '')}
                              >
                                {row[col] === null ? (
                                  <span className="text-purple-800 italic">null</span>
                                ) : (
                                  String(row[col])
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })()}
        </div>
      </div>
    </main>
  )
}
