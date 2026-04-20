'use server'

const PROJECT_REF = 'cdyswhkzicfnetwktpzg'

export type QueryResult =
  | { columns: string[]; rows: Record<string, unknown>[]; rowCount: number; duration: number }
  | { error: string }

export async function runQuery(sql: string): Promise<QueryResult> {
  if (!sql.trim()) return { error: 'Query is empty.' }

  const token = process.env.SUPABASE_ACCESS_TOKEN
  if (!token) return { error: 'SUPABASE_ACCESS_TOKEN is not set in .env.local.' }

  const start = Date.now()

  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ query: sql }),
    }
  )

  const data = await res.json()

  if (!res.ok) {
    return { error: data.message ?? data.error ?? `Request failed (${res.status})` }
  }

  const rows: Record<string, unknown>[] = Array.isArray(data) ? data : []
  const columns = rows.length > 0 ? Object.keys(rows[0]) : []

  return {
    columns,
    rows,
    rowCount: rows.length,
    duration: Date.now() - start,
  }
}
