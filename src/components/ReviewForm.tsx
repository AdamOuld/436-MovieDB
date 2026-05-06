'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { submitReview } from '@/app/titles/[id]/actions'

interface Props {
  titleId: number
  existing: { rating: number; review_text: string | null } | null
}

export default function ReviewForm({ titleId, existing }: Props) {
  const router = useRouter()
  const action = submitReview.bind(null, titleId)
  const [state, formAction, pending] = useActionState(action, null)
  const [hovered, setHovered] = useState(0)
  const [selected, setSelected] = useState(existing?.rating ?? 0)
  const prevPending = useRef(false)

  useEffect(() => {
    if (prevPending.current && !pending && !state) {
      router.refresh()
    }
    prevPending.current = pending
  }, [pending, state, router])

  const displayed = hovered || selected

  return (
    <form action={formAction} className="bg-purple-950/30 border border-purple-900/50 rounded-lg p-4 mt-6">
      <h3 className="text-sm font-semibold text-purple-400 mb-4">
        {existing ? 'Update your review' : 'Write a review'}
      </h3>

      {/* Hidden rating value submitted with form */}
      <input type="hidden" name="rating" value={selected} />

      {/* Star picker */}
      <div className="flex gap-1 mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setSelected(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="text-2xl leading-none transition-colors cursor-pointer"
          >
            <span className={displayed >= star ? 'text-yellow-400' : 'text-purple-800'}>★</span>
          </button>
        ))}
        {selected > 0 && (
          <span className="ml-2 text-sm text-purple-500 self-center">{selected} / 5</span>
        )}
      </div>

      {/* Review text */}
      <textarea
        name="review_text"
        defaultValue={existing?.review_text ?? ''}
        placeholder="Share your thoughts… (optional)"
        rows={3}
        className="w-full px-3 py-2 bg-black/40 border border-purple-900/50 rounded-lg text-sm text-white placeholder-purple-700 focus:outline-none focus:border-purple-500 transition-colors resize-none"
      />

      {state?.error && (
        <p className="mt-2 text-sm text-red-400">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending || selected === 0}
        className="mt-3 px-4 py-2 bg-purple-700 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors cursor-pointer"
      >
        {pending ? 'Saving…' : existing ? 'Update review' : 'Submit review'}
      </button>
    </form>
  )
}
