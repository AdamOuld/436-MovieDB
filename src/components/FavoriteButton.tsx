'use client'

import { useOptimistic, useTransition } from 'react'
import { toggleFavorite } from '@/app/titles/[id]/actions'

interface Props {
  titleId: number
  initialIsFavorited: boolean
}

export default function FavoriteButton({ titleId, initialIsFavorited }: Props) {
  const [optimisticFav, setOptimisticFav] = useOptimistic(initialIsFavorited)
  const [, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      setOptimisticFav(!optimisticFav)
      await toggleFavorite(titleId, optimisticFav)
    })
  }

  return (
    <button
      onClick={handleClick}
      title={optimisticFav ? 'Remove from My List' : 'Add to My List'}
      className="flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors cursor-pointer text-sm font-medium
        border-purple-700 hover:bg-purple-900/40
        "
    >
      <span className={`text-lg leading-none transition-colors ${optimisticFav ? 'text-purple-400' : 'text-purple-700'}`}>
        {optimisticFav ? '♥' : '♡'}
      </span>
      <span className={optimisticFav ? 'text-purple-400' : 'text-purple-600'}>
        {optimisticFav ? 'In My List' : 'Add to My List'}
      </span>
    </button>
  )
}
