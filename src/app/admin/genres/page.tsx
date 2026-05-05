import { createClient } from '@/lib/supabase-server'
import GenresManager from './GenresManager'

export default async function AdminGenresPage() {
  const supabase = await createClient()

  const [{ data: genres }, { data: counts }] = await Promise.all([
    supabase.from('genres').select('id, name').order('name'),
    supabase.from('title_genres').select('genre_id'),
  ])

  const titleCountByGenre: Record<number, number> = {}
  for (const row of counts ?? []) {
    titleCountByGenre[row.genre_id] = (titleCountByGenre[row.genre_id] ?? 0) + 1
  }

  return <GenresManager initialGenres={genres ?? []} titleCountByGenre={titleCountByGenre} />
}
