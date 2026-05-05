import { createClient } from '@/lib/supabase-server'
import PeopleManager from './PeopleManager'

export default async function AdminPeoplePage() {
  const supabase = await createClient()
  const { data: people } = await supabase
    .from('people')
    .select('id, name, photo_url, birth_date, death_date, bio')
    .order('name')
  return <PeopleManager initialPeople={people ?? []} />
}
