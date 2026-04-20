import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'

async function getRecommendations(userId: string) {
  const supabase = await createClient()

  // Collect signal titles: favorites + reviews rated 4 or 5
  const [{ data: favs }, { data: highReviews }, { data: allReviews }] = await Promise.all([
    supabase.from('favorites').select('title_id').eq('user_id', userId),
    supabase.from('reviews').select('title_id').eq('user_id', userId).gte('rating', 4),
    supabase.from('reviews').select('title_id').eq('user_id', userId),
  ])

  const signalIds = [
    ...new Set([
      ...(favs?.map((f) => f.title_id) ?? []),
      ...(highReviews?.map((r) => r.title_id) ?? []),
    ]),
  ]
  if (signalIds.length === 0) return null

  // Genres from signal titles
  const { data: signalGenres } = await supabase
    .from('title_genres')
    .select('genre_id')
    .in('title_id', signalIds)

  const genreIds = [...new Set(signalGenres?.map((g) => g.genre_id) ?? [])]
  if (genreIds.length === 0) return null

  // All titles the user has already seen (any review or favorite)
  const seenIds = [
    ...new Set([
      ...signalIds,
      ...(allReviews?.map((r) => r.title_id) ?? []),
    ]),
  ]

  // Titles sharing those genres, excluding seen
  let candidateQuery = supabase
    .from('title_genres')
    .select('title_id, genre_id')
    .in('genre_id', genreIds)

  if (seenIds.length > 0) {
    candidateQuery = candidateQuery.not('title_id', 'in', `(${seenIds.join(',')})`)
  }

  const { data: candidates } = await candidateQuery
  if (!candidates || candidates.length === 0) return null

  // Score each candidate by number of matching genres
  const scores: Record<number, number> = {}
  for (const c of candidates) {
    scores[c.title_id] = (scores[c.title_id] ?? 0) + 1
  }

  const topIds = Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([id]) => Number(id))

  // Fetch title details and genre names for the signal for the subtitle
  const [{ data: titles }, { data: signalGenreNames }] = await Promise.all([
    supabase
      .from('titles')
      .select('id, title, kind, release_date, poster_url')
      .in('id', topIds),
    supabase.from('genres').select('id, name').in('id', genreIds),
  ])

  const sorted = (titles ?? []).sort((a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0))
  const genreNames = (signalGenreNames ?? []).map((g) => g.name)

  return { titles: sorted, genreNames, scores }
}

export default async function Recommendations() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const result = await getRecommendations(user.id)
  if (!result || result.titles.length === 0) return null

  const { titles, genreNames, scores } = result

  return (
    <section className="mb-10">
      <div className="flex items-baseline gap-3 mb-3">
        <h2 className="text-lg font-semibold text-purple-400">Recommended for You</h2>
        <p className="text-xs text-purple-600 hidden sm:block">
          Based on your taste in {genreNames.slice(0, 3).join(', ')}
        </p>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
        {titles.map((title) => (
          <Link
            key={title.id}
            href={`/titles/${title.id}`}
            className="shrink-0 w-32 sm:w-36 bg-purple-950/40 border border-purple-900/50 rounded-lg overflow-hidden hover:border-purple-600 transition-colors"
          >
            {title.poster_url ? (
              <img
                src={title.poster_url}
                alt={title.title}
                className="w-full aspect-[2/3] object-cover"
              />
            ) : (
              <div className="w-full aspect-[2/3] bg-purple-900/20 flex items-center justify-center">
                <span className="text-purple-700 text-xs">No image</span>
              </div>
            )}
            <div className="p-2">
              <p className="text-xs font-medium leading-tight line-clamp-2">{title.title}</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-purple-400 uppercase">{title.kind}</span>
                <span className="text-xs text-purple-700" title="Matching genres">
                  {'★'.repeat(Math.min(scores[title.id] ?? 1, 3))}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
