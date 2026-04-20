import Link from 'next/link'
import { Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import SearchBar from '@/components/SearchBar'
import Recommendations from '@/components/Recommendations'

const PAGE_SIZE = 10

type SearchParams = Promise<{ q?: string; kind?: string; page?: string }>

export default async function HomePage({ searchParams }: { searchParams: SearchParams }) {
  const { q, kind, page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1)
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let query = supabase
    .from('titles')
    .select('id, title, kind, release_date, poster_url', { count: 'exact' })
    .order('title')
    .range(from, to)

  if (q) query = query.ilike('title', `%${q}%`)
  if (kind === 'movie' || kind === 'tv') query = query.eq('kind', kind)

  const { data: titles, count, error } = await query

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)
  const heading = kind === 'movie' ? 'Movies' : kind === 'tv' ? 'TV Series' : 'All Titles'

  function pageUrl(p: number) {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (kind && kind !== 'all') params.set('kind', kind)
    if (p > 1) params.set('page', String(p))
    const qs = params.toString()
    return qs ? `/?${qs}` : '/'
  }

  // Build visible page numbers: always show first, last, and up to 2 around current
  function pageNumbers() {
    const pages: (number | '…')[] = []
    const delta = 2
    const range: number[] = []
    for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) {
      range.push(i)
    }
    if (range[0] > 1) {
      pages.push(1)
      if (range[0] > 2) pages.push('…')
    }
    pages.push(...range)
    if (range[range.length - 1] < totalPages) {
      if (range[range.length - 1] < totalPages - 1) pages.push('…')
      pages.push(totalPages)
    }
    return pages
  }

  return (
    <main className="p-8 max-w-7xl mx-auto">
      <Suspense>
        <SearchBar />
      </Suspense>

      <Suspense>
        <Recommendations />
      </Suspense>

      {error && <p className="text-red-400 mb-4">Failed to load titles: {error.message}</p>}

      {!error && (
        <>
          <p className="text-sm text-purple-600 mb-4">
            {heading}
            {q && <span> matching &ldquo;{q}&rdquo;</span>}
            {count != null && (
              <span> — {count} {count === 1 ? 'result' : 'results'}</span>
            )}
          </p>

          {titles?.length === 0 && (
            <p className="text-purple-400">No titles found.</p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {titles?.map((title) => (
              <Link
                key={title.id}
                href={`/titles/${title.id}`}
                className="bg-purple-950/40 border border-purple-900/50 rounded-lg overflow-hidden hover:border-purple-600 transition-colors block"
              >
                {title.poster_url ? (
                  <img
                    src={title.poster_url}
                    alt={title.title}
                    className="w-full aspect-[2/3] object-cover"
                  />
                ) : (
                  <div className="w-full aspect-[2/3] bg-purple-900/20 flex items-center justify-center">
                    <span className="text-purple-700 text-sm">No image</span>
                  </div>
                )}
                <div className="p-3">
                  <h2 className="font-semibold text-sm leading-tight line-clamp-2">{title.title}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-purple-400 uppercase">{title.kind}</span>
                    {title.release_date && (
                      <span className="text-xs text-purple-700">
                        {new Date(title.release_date).getFullYear()}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 mt-10">
              <Link
                href={pageUrl(page - 1)}
                aria-disabled={page === 1}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  page === 1
                    ? 'text-purple-800 pointer-events-none'
                    : 'text-purple-400 hover:text-white hover:bg-purple-900/40'
                }`}
              >
                ← Prev
              </Link>

              {pageNumbers().map((p, i) =>
                p === '…' ? (
                  <span key={`ellipsis-${i}`} className="px-2 text-purple-700 text-sm select-none">…</span>
                ) : (
                  <Link
                    key={p}
                    href={pageUrl(p)}
                    className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm transition-colors ${
                      p === page
                        ? 'bg-purple-700 text-white font-medium'
                        : 'text-purple-400 hover:text-white hover:bg-purple-900/40'
                    }`}
                  >
                    {p}
                  </Link>
                )
              )}

              <Link
                href={pageUrl(page + 1)}
                aria-disabled={page === totalPages}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  page === totalPages
                    ? 'text-purple-800 pointer-events-none'
                    : 'text-purple-400 hover:text-white hover:bg-purple-900/40'
                }`}
              >
                Next →
              </Link>
            </div>
          )}
        </>
      )}
    </main>
  )
}
