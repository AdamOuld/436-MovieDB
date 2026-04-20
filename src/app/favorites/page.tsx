import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function FavoritesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: favorites, error } = await supabase
    .from('favorites')
    .select('added_at, titles(id, title, kind, release_date, poster_url)')
    .eq('user_id', user.id)
    .order('added_at', { ascending: false })

  if (error) {
    return (
      <main className="p-8 max-w-7xl mx-auto">
        <p className="text-red-400">Failed to load favorites: {error.message}</p>
      </main>
    )
  }

  const titles = favorites?.flatMap((f) => (f.titles ? [f.titles] : [])) ?? []

  return (
    <main className="p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-purple-400 mb-6">My List</h1>

      {titles.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-purple-600 mb-4">Your list is empty.</p>
          <Link href="/" className="text-sm text-purple-400 hover:text-purple-300 transition-colors">
            Browse titles →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {titles.map((title) => (
            <Link
              key={title.id}
              href={`/titles/${title.id}`}
              className="bg-purple-950/40 border border-purple-900/50 rounded-lg overflow-hidden hover:border-purple-600 transition-colors block"
            >
              {title.poster_url ? (
                <img src={title.poster_url} alt={title.title} className="w-full aspect-[2/3] object-cover" />
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
      )}
    </main>
  )
}
