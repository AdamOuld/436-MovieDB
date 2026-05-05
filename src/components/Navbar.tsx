import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import { logout } from '@/app/auth/actions'

export default async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let displayName: string | null = null
  let isAdmin = false
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, display_name, is_admin')
      .eq('id', user.id)
      .single()
    displayName = profile?.display_name ?? profile?.username ?? user.email ?? null
    isAdmin = profile?.is_admin ?? false
  }

  return (
    <nav className="border-b border-purple-900/40 bg-black/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">

        {/* Left: brand */}
        <Link href="/" className="text-lg font-bold text-purple-400 hover:text-purple-300 transition-colors">
          MovieDB
        </Link>

        {/* Right: actions */}
        <div className="flex items-center gap-6">
          {user ? (
            <>
              <Link href="/favorites" className="text-sm text-purple-300 hover:text-white transition-colors">
                My List
              </Link>
              <Link href="/sql" className="text-sm text-purple-500 hover:text-purple-300 transition-colors hidden sm:block">
                SQL
              </Link>
              {isAdmin && (
                <Link href="/admin" className="text-sm text-purple-500 hover:text-purple-300 transition-colors hidden sm:block">
                  Admin
                </Link>
              )}

              <div className="flex items-center gap-3 pl-4 border-l border-purple-900">
                <span className="text-sm text-purple-500 max-w-32 truncate hidden sm:block">{displayName}</span>
                <form action={logout} className="flex items-center">
                  <button
                    type="submit"
                    className="text-sm text-purple-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Log out
                  </button>
                </form>
              </div>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="text-sm text-purple-300 hover:text-white transition-colors">
                Log in
              </Link>
              <Link
                href="/auth/signup"
                className="text-sm px-4 py-1.5 bg-purple-700 hover:bg-purple-600 rounded-lg font-medium transition-colors"
              >
                Sign up
              </Link>
            </>
          )}
        </div>

      </div>
    </nav>
  )
}
