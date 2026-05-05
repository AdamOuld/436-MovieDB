'use client'

import { useRouter } from 'next/navigation'

export default function BackButton() {
  const router = useRouter()
  return (
    <button
      onClick={() => router.back()}
      className="text-sm text-purple-400 hover:text-purple-300 transition-colors mb-8 inline-block cursor-pointer"
    >
      ← Back
    </button>
  )
}
