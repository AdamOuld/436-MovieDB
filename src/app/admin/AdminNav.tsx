'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { label: 'Titles', href: '/admin/titles' },
  { label: 'People', href: '/admin/people' },
  { label: 'Genres', href: '/admin/genres' },
]

export default function AdminNav() {
  const pathname = usePathname()
  return (
    <div className="flex gap-1 border-b border-purple-900/40 mb-8">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            pathname.startsWith(tab.href)
              ? 'border-purple-500 text-purple-300'
              : 'border-transparent text-purple-600 hover:text-purple-400'
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  )
}
