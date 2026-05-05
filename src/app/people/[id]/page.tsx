import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import BackButton from '@/components/BackButton'


export default async function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const personId = Number(id)

  const supabase = await createClient()

  const [{ data: person, error }, { data: credits }] = await Promise.all([
    supabase.from('people').select('*').eq('id', personId).single(),
    supabase
      .from('credits')
      .select('role, character_name, titles(id, title, kind, release_date, poster_url)')
      .eq('person_id', personId)
      .order('role'),
  ])

  if (error || !person) notFound()

  const age = person.birth_date
    ? Math.floor(
        (new Date(person.death_date ?? Date.now()).getTime() - new Date(person.birth_date).getTime()) /
          (1000 * 60 * 60 * 24 * 365.25)
      )
    : null

  type Credit = NonNullable<typeof credits>[number]
  const byRole: Record<string, Credit[]> = {}
  for (const c of credits ?? []) {
    if (!byRole[c.role]) byRole[c.role] = []
    byRole[c.role].push(c)
  }
  const roleOrder = ['actor', 'director', 'writer', 'producer', 'composer']
  const roleLabel: Record<string, string> = {
    actor: 'Acting',
    director: 'Directing',
    writer: 'Writing',
    producer: 'Producing',
    composer: 'Music',
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <BackButton />

        {/* Header */}
        <div className="flex gap-8 items-start">
          <div className="shrink-0 w-32 sm:w-44 rounded-xl overflow-hidden border border-purple-900/50 shadow-xl">
            {person.photo_url ? (
              <img src={person.photo_url} alt={person.name} className="w-full aspect-[2/3] object-cover" />
            ) : (
              <div className="w-full aspect-[2/3] bg-purple-900/20 flex items-center justify-center">
                <span className="text-purple-700 text-4xl font-bold">{person.name.charAt(0)}</span>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 pt-2">
            <h1 className="text-3xl sm:text-4xl font-bold">{person.name}</h1>

            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-purple-400">
              {person.birth_date && (
                <span>Born {person.birth_date}{age !== null && !person.death_date ? ` (age ${age})` : ''}</span>
              )}
              {person.death_date && (
                <span>Died {person.death_date}{age !== null ? ` (age ${age})` : ''}</span>
              )}
            </div>

            {person.bio && (
              <p className="mt-4 text-gray-300 text-sm leading-relaxed max-w-2xl">{person.bio}</p>
            )}
          </div>
        </div>

        {/* Filmography */}
        {credits && credits.length > 0 && (
          <div className="mt-12">
            <h2 className="text-lg font-semibold text-purple-400 mb-6">Filmography</h2>
            <div className="flex flex-col gap-8">
              {roleOrder.filter((r) => byRole[r]).map((role) => (
                <div key={role}>
                  <h3 className="text-sm font-semibold text-purple-600 uppercase tracking-wide mb-3">
                    {roleLabel[role]}
                  </h3>
                  <div className="flex flex-col gap-2">
                    {byRole[role].map((credit, i) => {
                      const title = Array.isArray(credit.titles) ? credit.titles[0] : credit.titles
                      if (!title) return null
                      return (
                        <Link key={i} href={`/titles/${title.id}`}
                          className="flex items-center gap-4 p-3 rounded-lg border border-purple-900/30 hover:border-purple-700/50 hover:bg-purple-950/30 transition-colors group">
                          <div className="w-10 h-14 shrink-0 rounded overflow-hidden bg-purple-900/30 border border-purple-900/50">
                            {title.poster_url ? (
                              <img src={title.poster_url} alt={title.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-purple-700 text-xs">?</div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm group-hover:text-purple-300 transition-colors truncate">{title.title}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-purple-600 uppercase">{title.kind}</span>
                              {title.release_date && <span className="text-xs text-purple-700">{title.release_date.slice(0, 4)}</span>}
                              {credit.character_name && <span className="text-xs text-purple-600">as {credit.character_name}</span>}
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
