'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { login } from '../actions'

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, null)

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-purple-400 mb-8 text-center">Log in</h1>

        <form action={action} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm text-purple-400 mb-1.5">Email</label>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full px-3 py-2 bg-purple-950/40 border border-purple-900/50 rounded-lg text-sm text-white placeholder-purple-700 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-purple-400 mb-1.5">Password</label>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full px-3 py-2 bg-purple-950/40 border border-purple-900/50 rounded-lg text-sm text-white placeholder-purple-700 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          {state?.error && (
            <p className="text-sm text-red-400 bg-red-950/30 border border-red-900/50 rounded-lg px-3 py-2">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="mt-2 w-full py-2 bg-purple-700 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors cursor-pointer"
          >
            {pending ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-purple-600">
          No account?{' '}
          <Link href="/auth/signup" className="text-purple-400 hover:text-purple-300 transition-colors">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  )
}
