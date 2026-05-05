import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ReviewForm from '@/components/ReviewForm'
import ReviewList from '@/components/ReviewList'
import FavoriteButton from '@/components/FavoriteButton'
import SeasonsAccordion from '@/components/SeasonsAccordion'

export default async function TitlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const titleId = Number(id)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: title, error }, { data: credits }, { data: titleGenres }, { data: ratings }, { data: reviews }, { data: seasons }] =
    await Promise.all([
      supabase.from('titles').select('*').eq('id', titleId).single(),
      supabase
        .from('credits')
        .select('role, character_name, billing_order, people(id, name, photo_url)')
        .eq('title_id', titleId)
        .order('billing_order'),
      supabase
        .from('title_genres')
        .select('genres(id, name)')
        .eq('title_id', titleId),
      supabase.from('title_ratings').select('avg_rating, review_count').eq('title_id', titleId).single(),
      supabase
        .from('reviews')
        .select('id, rating, review_text, created_at, profiles(username, display_name, avatar_url)')
        .eq('title_id', titleId)
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('seasons')
        .select('id, season_number, name, overview, air_date, episodes(id, episode_number, name, overview, air_date, runtime_min)')
        .eq('title_id', titleId)
        .order('season_number'),
    ])

  if (error || !title) notFound()

  let existingReview: { rating: number; review_text: string | null } | null = null
  if (user) {
    const { data } = await supabase
      .from('reviews')
      .select('rating, review_text')
      .eq('title_id', titleId)
      .eq('user_id', user.id)
      .maybeSingle()
    existingReview = data
  }

  let isFavorited = false
  if (user) {
    const { data } = await supabase
      .from('favorites')
      .select('title_id')
      .eq('title_id', titleId)
      .eq('user_id', user.id)
      .maybeSingle()
    isFavorited = !!data
  }

  const cast = credits?.filter((c) => c.role === 'actor') ?? []
  const directors = credits?.filter((c) => c.role === 'director') ?? []
  const writers = credits?.filter((c) => c.role === 'writer') ?? []
  const genres = titleGenres?.flatMap((tg) => (tg.genres ? [tg.genres] : [])) ?? []
  const avgRating = ratings?.avg_rating ? Number(ratings.avg_rating).toFixed(1) : null
  const reviewCount = ratings?.review_count ?? 0

  const year = title.release_date ? new Date(title.release_date).getFullYear() : null
  const runtime = title.runtime_min
    ? `${Math.floor(title.runtime_min / 60)}h ${title.runtime_min % 60}m`
    : null

  return (
    <div className="min-h-screen bg-black">
      {/* Backdrop hero */}
      <div className="relative h-[50vh] min-h-80 overflow-hidden">
        {title.backdrop_url ? (
          <img
            src={title.backdrop_url}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-purple-950/30" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
        <div className="absolute top-4 left-4">
          <Link
            href="/"
            className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
          >
            ← Back
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 -mt-32 relative z-10 pb-16">
        <div className="flex gap-8 items-end">
          {/* Poster */}
          <div className="shrink-0 w-40 sm:w-52 rounded-lg overflow-hidden border border-purple-900/50 shadow-2xl">
            {title.poster_url ? (
              <img src={title.poster_url} alt={title.title} className="w-full aspect-[2/3] object-cover" />
            ) : (
              <div className="w-full aspect-[2/3] bg-purple-900/20 flex items-center justify-center">
                <span className="text-purple-700 text-sm">No poster</span>
              </div>
            )}
          </div>

          {/* Title info */}
          <div className="pb-2 min-w-0">
            <h1 className="text-2xl sm:text-4xl font-bold leading-tight">{title.title}</h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-sm text-purple-400">
              <span className="uppercase font-medium">{title.kind}</span>
              {year && <span>{year}</span>}
              {runtime && <span>{runtime}</span>}
              {title.language && <span className="uppercase">{title.language}</span>}
            </div>
            {avgRating && (
              <div className="flex items-center gap-2 mt-3">
                <span className="text-yellow-400 font-bold text-lg">★ {avgRating}</span>
                <span className="text-sm text-purple-600">
                  {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
                </span>
              </div>
            )}
            {genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {genres.map((g) => (
                  <span
                    key={g.id}
                    className="text-xs px-2 py-1 rounded-full bg-purple-900/50 border border-purple-800 text-purple-300"
                  >
                    {g.name}
                  </span>
                ))}
              </div>
            )}
            {user && (
              <div className="mt-4">
                <FavoriteButton titleId={titleId} initialIsFavorited={isFavorited} />
              </div>
            )}
          </div>
        </div>

        {/* Overview */}
        {title.overview && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-purple-400 mb-2">Overview</h2>
            <p className="text-gray-300 leading-relaxed">{title.overview}</p>
          </div>
        )}

        {/* Directors / Writers */}
        {(directors.length > 0 || writers.length > 0) && (
          <div className="mt-8 flex flex-wrap gap-8">
            {directors.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-purple-400 mb-1">
                  {directors.length === 1 ? 'Director' : 'Directors'}
                </h2>
                <p className="text-gray-300 text-sm flex flex-wrap gap-x-2">
                  {directors.map((d, i) => {
                    const p = Array.isArray(d.people) ? d.people[0] : d.people
                    return p ? <Link key={i} href={`/people/${p.id}`} className="hover:text-purple-300 transition-colors">{p.name}</Link> : null
                  })}
                </p>
              </div>
            )}
            {writers.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-purple-400 mb-1">
                  {writers.length === 1 ? 'Writer' : 'Writers'}
                </h2>
                <p className="text-gray-300 text-sm flex flex-wrap gap-x-2">
                  {writers.map((w, i) => {
                    const p = Array.isArray(w.people) ? w.people[0] : w.people
                    return p ? <Link key={i} href={`/people/${p.id}`} className="hover:text-purple-300 transition-colors">{p.name}</Link> : null
                  })}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Seasons (TV only) */}
        {title.kind === 'tv' && (
          <div className="mt-10">
            <h2 className="text-lg font-semibold text-purple-400 mb-4">
              Seasons
              {seasons && seasons.length > 0 && (
                <span className="ml-2 text-sm font-normal text-purple-600">({seasons.length})</span>
              )}
            </h2>
            {seasons && seasons.length > 0 ? (
              <SeasonsAccordion seasons={seasons.map((s) => ({
                ...s,
                episodes: Array.isArray(s.episodes) ? s.episodes : [],
              }))} />
            ) : (
              <p className="text-sm text-purple-700">No seasons added yet.</p>
            )}
          </div>
        )}

        {/* Reviews */}
        <div className="mt-10">
          <h2 className="text-lg font-semibold text-purple-400 mb-4">
            Reviews
            {reviewCount > 0 && (
              <span className="ml-2 text-sm font-normal text-purple-600">({reviewCount})</span>
            )}
          </h2>

          <ReviewList
            titleId={titleId}
            initialReviews={(reviews ?? []).map((r) => ({
              ...r,
              profiles: Array.isArray(r.profiles) ? r.profiles[0] ?? null : r.profiles,
            }))}
            totalCount={Number(reviewCount)}
          />

          {user ? (
            <ReviewForm titleId={titleId} existing={existingReview} />
          ) : (
            <p className="mt-6 text-sm text-purple-600">
              <a href="/auth/login" className="text-purple-400 hover:text-purple-300 transition-colors">Log in</a> to leave a review.
            </p>
          )}
        </div>

        {/* Cast */}
        {cast.length > 0 && (
          <div className="mt-10">
            <h2 className="text-lg font-semibold text-purple-400 mb-4">Cast</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {cast.slice(0, 12).map((credit, i) => {
                const person = Array.isArray(credit.people) ? credit.people[0] : credit.people
                if (!person) return null
                return (
                  <Link key={i} href={`/people/${person.id}`} className="text-center group">
                    <div className="w-full aspect-square rounded-full overflow-hidden bg-purple-900/30 border border-purple-900/50 mx-auto mb-2 group-hover:border-purple-500 transition-colors">
                      {person.photo_url ? (
                        <img
                          src={person.photo_url}
                          alt={person.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-purple-700 text-xl font-bold">
                          {person.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <p className="text-xs font-medium leading-tight group-hover:text-purple-300 transition-colors">{person.name}</p>
                    {credit.character_name && (
                      <p className="text-xs text-purple-500 mt-0.5 leading-tight line-clamp-2">
                        {credit.character_name}
                      </p>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
