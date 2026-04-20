'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

type ReviewState = { error: string } | null

export async function submitReview(titleId: number, _: ReviewState, formData: FormData): Promise<ReviewState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be logged in to submit a review.' }

  const rating = Number(formData.get('rating'))
  const review_text = (formData.get('review_text') as string).trim() || null

  if (!rating || rating < 1 || rating > 5) return { error: 'Please select a star rating.' }

  const { data: existing } = await supabase
    .from('reviews')
    .select('id')
    .eq('title_id', titleId)
    .eq('user_id', user.id)
    .maybeSingle()

  const now = new Date().toISOString()

  const { error } = existing
    ? await supabase
        .from('reviews')
        .update({ rating, review_text, updated_at: now })
        .eq('id', existing.id)
    : await supabase
        .from('reviews')
        .insert({ title_id: titleId, user_id: user.id, rating, review_text })

  if (error) return { error: error.message }

  revalidatePath(`/titles/${titleId}`)
  return null
}

export async function toggleFavorite(titleId: number, isFavorited: boolean): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be logged in.' }

  const { error } = isFavorited
    ? await supabase.from('favorites').delete().eq('title_id', titleId).eq('user_id', user.id)
    : await supabase.from('favorites').insert({ title_id: titleId, user_id: user.id })

  if (error) return { error: error.message }

  revalidatePath(`/titles/${titleId}`)
  revalidatePath('/favorites')
  return {}
}
