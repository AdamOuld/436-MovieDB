'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

export interface Review {
  id: number
  user_id: string
  rating: number
  review_text: string | null
  created_at: string
  profiles: { username: string; display_name: string | null; avatar_url: string | null } | null
}

interface Props {
  titleId: number
  initialReviews: Review[]
  totalCount: number
  currentUserId: string | null
  pageSize?: number
}

function ReviewCard({
  review,
  isOwn,
  onDelete,
}: {
  review: Review
  isOwn: boolean
  onDelete: (id: number) => void
}) {
  const [deleting, setDeleting] = useState(false)
  const profile = review.profiles
  const name = profile?.display_name ?? profile?.username ?? 'Anonymous'
  const date = new Date(review.created_at).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })

  async function handleDelete() {
    setDeleting(true)
    const supabase = createClient()
    await supabase.from('reviews').delete().eq('id', review.id)
    onDelete(review.id)
  }

  return (
    <div className="bg-purple-950/30 border border-purple-900/50 rounded-lg p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-full bg-purple-800 border border-purple-700 flex items-center justify-center text-sm font-bold shrink-0 overflow-hidden">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt={name} className="w-full h-full object-cover" />
          ) : (
            name.charAt(0).toUpperCase()
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium leading-none">{name}</p>
          <p className="text-xs text-purple-600 mt-0.5">{date}</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className={i < review.rating ? 'text-yellow-400' : 'text-purple-800'}>★</span>
            ))}
          </div>
          {isOwn && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-xs text-red-500 hover:text-red-400 disabled:opacity-50 transition-colors cursor-pointer"
            >
              Delete
            </button>
          )}
        </div>
      </div>
      {review.review_text && (
        <p className="text-gray-300 text-sm leading-relaxed">{review.review_text}</p>
      )}
    </div>
  )
}

export default function ReviewList({ titleId, initialReviews, totalCount, currentUserId, pageSize = 5 }: Props) {
  const router = useRouter()
  const [reviews, setReviews] = useState<Review[]>(initialReviews)
  const [count, setCount] = useState(totalCount)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setReviews(initialReviews)
    setCount(totalCount)
  }, [initialReviews, totalCount])

  const hasMore = reviews.length < count

  async function loadMore() {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('reviews')
      .select('id, user_id, rating, review_text, created_at, profiles(username, display_name, avatar_url)')
      .eq('title_id', titleId)
      .order('created_at', { ascending: false })
      .range(reviews.length, reviews.length + pageSize - 1)

    if (data) setReviews((prev) => [...prev, ...(data as Review[])])
    setLoading(false)
  }

  function handleDelete(id: number) {
    setReviews((prev) => prev.filter((r) => r.id !== id))
    setCount((prev) => prev - 1)
    router.refresh()
  }

  if (reviews.length === 0) {
    return <p className="text-purple-700 text-sm">No reviews yet.</p>
  }

  return (
    <div>
      <div className="flex flex-col gap-4">
        {reviews.map((review) => (
          <ReviewCard
            key={review.id}
            review={review}
            isOwn={currentUserId !== null && review.user_id === currentUserId}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {hasMore && (
        <button
          onClick={loadMore}
          disabled={loading}
          className="mt-4 text-sm text-purple-400 hover:text-purple-300 disabled:opacity-50 transition-colors cursor-pointer"
        >
          {loading ? 'Loading…' : `Show more (${count - reviews.length} remaining)`}
        </button>
      )}
    </div>
  )
}
