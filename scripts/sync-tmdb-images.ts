import { createClient } from '@supabase/supabase-js'
import type { Database } from '../src/types/database'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const TMDB_TOKEN = process.env.TMDB_API_READ_ACCESS_TOKEN
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/original'

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !TMDB_TOKEN) {
  console.error(
    'Missing env vars. Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, TMDB_API_READ_ACCESS_TOKEN'
  )
  process.exit(1)
}

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY)

type TitleKind = Database['public']['Enums']['title_kind']

interface TMDBResult {
  poster_path: string | null
  backdrop_path: string | null
}

async function searchTMDB(
  name: string,
  kind: TitleKind,
  year?: number
): Promise<TMDBResult | null> {
  const endpoint = kind === 'movie' ? 'movie' : 'tv'
  const yearParam = year ? (kind === 'movie' ? `&year=${year}` : `&first_air_date_year=${year}`) : ''
  const url = `https://api.themoviedb.org/3/search/${endpoint}?query=${encodeURIComponent(name)}${yearParam}&page=1`

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${TMDB_TOKEN}` },
  })

  if (!res.ok) throw new Error(`TMDB ${res.status}: ${await res.text()}`)

  const data = (await res.json()) as { results: TMDBResult[] }
  return data.results?.[0] ?? null
}

async function main() {
  const { data: titles, error } = await supabase
    .from('titles')
    .select('id, title, kind, release_date')
    .order('id')

  if (error) throw error
  if (!titles || titles.length === 0) {
    console.log('No titles found in database.')
    return
  }

  console.log(`Processing ${titles.length} titles...\n`)

  let updated = 0
  let notFound = 0
  let failed = 0

  for (const row of titles) {
    const year = row.release_date ? new Date(row.release_date).getFullYear() : undefined

    try {
      // Try with year first, fall back to name-only if no results
      let result = await searchTMDB(row.title, row.kind, year)
      if (!result && year) {
        result = await searchTMDB(row.title, row.kind)
      }

      if (!result) {
        console.log(`NOT FOUND  ${row.title} (${row.kind})`)
        notFound++
        continue
      }

      const poster_url = result.poster_path ? `${TMDB_IMAGE_BASE}${result.poster_path}` : null
      const backdrop_url = result.backdrop_path ? `${TMDB_IMAGE_BASE}${result.backdrop_path}` : null

      const { error: updateError } = await supabase
        .from('titles')
        .update({ poster_url, backdrop_url })
        .eq('id', row.id)

      if (updateError) throw updateError

      console.log(`UPDATED    ${row.title} (${row.kind}, ${year ?? '?'})`)
      updated++
    } catch (err) {
      console.error(`FAILED     ${row.title}:`, err)
      failed++
    }

    // Stay well within TMDB's 50 req/s limit
    await new Promise((resolve) => setTimeout(resolve, 150))
  }

  console.log(`\nDone — updated: ${updated}, not found: ${notFound}, failed: ${failed}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
