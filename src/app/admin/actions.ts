'use server'

import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/types/database'

type CreditRole = Database['public']['Enums']['credit_role']

function admin() {
  return createServiceClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { data: profile } = await supabase
    .from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) throw new Error('Not authorized')
}

// ─── Title CRUD ───────────────────────────────────────────────────────────────

export async function addTitle(
  data: Database['public']['Tables']['titles']['Insert'],
  genreIds: number[]
): Promise<{ id: number } | { error: string }> {
  try {
    await requireAdmin()
    const db = admin()
    const { data: inserted, error } = await db.from('titles').insert(data).select('id').single()
    if (error || !inserted) return { error: error?.message ?? 'Failed to insert title' }
    for (const genreId of genreIds) {
      await db.from('title_genres').insert({ title_id: inserted.id, genre_id: genreId })
    }
    revalidatePath('/admin/titles')
    return { id: inserted.id }
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function updateTitle(
  id: number,
  data: Database['public']['Tables']['titles']['Update'],
  genreIds?: number[]
): Promise<{ error?: string }> {
  try {
    await requireAdmin()
    const db = admin()
    const { error } = await db.from('titles').update(data).eq('id', id)
    if (error) return { error: error.message }
    if (genreIds !== undefined) {
      await db.from('title_genres').delete().eq('title_id', id)
      for (const genreId of genreIds) {
        await db.from('title_genres').insert({ title_id: id, genre_id: genreId })
      }
    }
    revalidatePath('/admin/titles')
    revalidatePath(`/titles/${id}`)
    return {}
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function deleteTitle(id: number): Promise<{ error?: string }> {
  try {
    await requireAdmin()
    const db = admin()
    await db.from('credits').delete().eq('title_id', id)
    await db.from('title_genres').delete().eq('title_id', id)
    await db.from('reviews').delete().eq('title_id', id)
    await db.from('favorites').delete().eq('title_id', id)
    const { data: seasons } = await db.from('seasons').select('id').eq('title_id', id)
    for (const s of seasons ?? []) {
      await db.from('episodes').delete().eq('season_id', s.id)
    }
    await db.from('seasons').delete().eq('title_id', id)
    const { error } = await db.from('titles').delete().eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/admin/titles')
    return {}
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export interface TitleDetails {
  genreIds: number[]
  credits: Array<{
    id: number
    person_id: number
    person_name: string
    role: CreditRole
    character_name: string | null
    billing_order: number | null
  }>
}

export async function getTitleDetails(titleId: number): Promise<TitleDetails | { error: string }> {
  try {
    await requireAdmin()
    const db = admin()
    const [{ data: tg }, { data: credits }] = await Promise.all([
      db.from('title_genres').select('genre_id').eq('title_id', titleId),
      db.from('credits')
        .select('id, person_id, role, character_name, billing_order, people(name)')
        .eq('title_id', titleId)
        .order('billing_order'),
    ])
    return {
      genreIds: (tg ?? []).map((r) => r.genre_id),
      credits: (credits ?? []).map((c) => ({
        id: c.id,
        person_id: c.person_id,
        person_name: (Array.isArray(c.people) ? c.people[0]?.name : (c.people as { name: string } | null)?.name) ?? 'Unknown',
        role: c.role,
        character_name: c.character_name,
        billing_order: c.billing_order,
      })),
    }
  } catch (e) {
    return { error: (e as Error).message }
  }
}

// ─── Credits CRUD ─────────────────────────────────────────────────────────────

export async function addCredit(data: {
  title_id: number
  person_id: number
  role: CreditRole
  character_name?: string | null
}): Promise<{ id: number } | { error: string }> {
  try {
    await requireAdmin()
    const { data: inserted, error } = await admin()
      .from('credits').insert(data).select('id').single()
    if (error || !inserted) return { error: error?.message ?? 'Failed to add credit' }
    return { id: inserted.id }
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function deleteCredit(creditId: number): Promise<{ error?: string }> {
  try {
    await requireAdmin()
    const { error } = await admin().from('credits').delete().eq('id', creditId)
    if (error) return { error: error.message }
    return {}
  } catch (e) {
    return { error: (e as Error).message }
  }
}

// ─── People Search (local DB) ─────────────────────────────────────────────────

export async function searchPeopleByName(
  query: string
): Promise<{ results: Array<{ id: number; name: string }> } | { error: string }> {
  try {
    await requireAdmin()
    if (!query.trim()) return { results: [] }
    const { data } = await admin()
      .from('people')
      .select('id, name')
      .ilike('name', `%${query}%`)
      .order('name')
      .limit(10)
    return { results: data ?? [] }
  } catch (e) {
    return { error: (e as Error).message }
  }
}

// ─── People CRUD ──────────────────────────────────────────────────────────────

export async function addPerson(
  data: Database['public']['Tables']['people']['Insert']
): Promise<{ error?: string }> {
  try {
    await requireAdmin()
    const { error } = await admin().from('people').insert(data)
    if (error) return { error: error.message }
    revalidatePath('/admin/people')
    return {}
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function updatePerson(
  id: number,
  data: Database['public']['Tables']['people']['Update']
): Promise<{ error?: string }> {
  try {
    await requireAdmin()
    const { error } = await admin().from('people').update(data).eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/admin/people')
    return {}
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function deletePerson(id: number): Promise<{ error?: string }> {
  try {
    await requireAdmin()
    const db = admin()
    await db.from('credits').delete().eq('person_id', id)
    const { error } = await db.from('people').delete().eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/admin/people')
    return {}
  } catch (e) {
    return { error: (e as Error).message }
  }
}

// ─── Seasons / Episodes CRUD ─────────────────────────────────────────────────

export interface SeasonWithEpisodes {
  id: number
  season_number: number
  name: string | null
  overview: string | null
  air_date: string | null
  episodes: Array<{
    id: number
    episode_number: number
    name: string
    overview: string | null
    air_date: string | null
    runtime_min: number | null
  }>
}

export async function getSeasonsWithEpisodes(
  titleId: number
): Promise<{ seasons: SeasonWithEpisodes[] } | { error: string }> {
  try {
    await requireAdmin()
    const { data } = await admin()
      .from('seasons')
      .select('id, season_number, name, overview, air_date, episodes(id, episode_number, name, overview, air_date, runtime_min)')
      .eq('title_id', titleId)
      .order('season_number')
    return {
      seasons: (data ?? []).map((s) => ({
        ...s,
        episodes: Array.isArray(s.episodes) ? s.episodes : [],
      })),
    }
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function addSeason(
  data: Database['public']['Tables']['seasons']['Insert']
): Promise<{ id: number } | { error: string }> {
  try {
    await requireAdmin()
    const { data: inserted, error } = await admin().from('seasons').insert(data).select('id').single()
    if (error || !inserted) return { error: error?.message ?? 'Failed to add season' }
    return { id: inserted.id }
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function updateSeason(
  id: number,
  data: Database['public']['Tables']['seasons']['Update']
): Promise<{ error?: string }> {
  try {
    await requireAdmin()
    const { error } = await admin().from('seasons').update(data).eq('id', id)
    if (error) return { error: error.message }
    return {}
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function deleteSeason(id: number): Promise<{ error?: string }> {
  try {
    await requireAdmin()
    const db = admin()
    await db.from('episodes').delete().eq('season_id', id)
    const { error } = await db.from('seasons').delete().eq('id', id)
    if (error) return { error: error.message }
    return {}
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function addEpisode(
  data: Database['public']['Tables']['episodes']['Insert']
): Promise<{ id: number } | { error: string }> {
  try {
    await requireAdmin()
    const { data: inserted, error } = await admin().from('episodes').insert(data).select('id').single()
    if (error || !inserted) return { error: error?.message ?? 'Failed to add episode' }
    return { id: inserted.id }
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function updateEpisode(
  id: number,
  data: Database['public']['Tables']['episodes']['Update']
): Promise<{ error?: string }> {
  try {
    await requireAdmin()
    const { error } = await admin().from('episodes').update(data).eq('id', id)
    if (error) return { error: error.message }
    return {}
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function deleteEpisode(id: number): Promise<{ error?: string }> {
  try {
    await requireAdmin()
    const { error } = await admin().from('episodes').delete().eq('id', id)
    if (error) return { error: error.message }
    return {}
  } catch (e) {
    return { error: (e as Error).message }
  }
}

// ─── Genre CRUD ───────────────────────────────────────────────────────────────

export async function addGenre(name: string): Promise<{ error?: string }> {
  try {
    await requireAdmin()
    const { error } = await admin().from('genres').insert({ name: name.trim() })
    if (error) return { error: error.message }
    revalidatePath('/admin/genres')
    return {}
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function updateGenre(id: number, name: string): Promise<{ error?: string }> {
  try {
    await requireAdmin()
    const { error } = await admin().from('genres').update({ name: name.trim() }).eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/admin/genres')
    return {}
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function deleteGenre(id: number): Promise<{ error?: string }> {
  try {
    await requireAdmin()
    const db = admin()
    const { count } = await db
      .from('title_genres').select('*', { count: 'exact', head: true }).eq('genre_id', id)
    if ((count ?? 0) > 0)
      return { error: `Cannot delete — this genre is linked to ${count} title(s).` }
    const { error } = await db.from('genres').delete().eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/admin/genres')
    return {}
  } catch (e) {
    return { error: (e as Error).message }
  }
}

