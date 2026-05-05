import { createClient } from '@/lib/supabase-server'
import TitlesManager from './TitlesManager'

export default async function AdminTitlesPage() {
  const supabase = await createClient()
  const [{ data: titles }, { data: genres }] = await Promise.all([
    supabase
      .from('titles')
      .select('id, title, kind, release_date, poster_url, overview, runtime_min, end_date, language, original_title, backdrop_url, trailer_url')
      .order('title'),
    supabase.from('genres').select('id, name').order('name'),
  ])
  return <TitlesManager initialTitles={titles ?? []} genres={genres ?? []} />
}
