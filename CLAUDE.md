# Movie Database Project (IMDb-like)

## Stack

- Next.js (App Router)
- TypeScript
- Supabase (PostgreSQL + Auth + RLS)
- Tailwind CSS
- @supabase/supabase-js

## Database

- Supabase project ID: cdyswhkzicfnetwktpzg
- Auto-generated DB types in src/types/database.ts
- Always import Database type from there, never create manual type definitions
- RLS is enabled on all tables — admin checks use profiles.is_admin flag

## Auth

- Using Supabase Auth (email/password)
- Profiles table auto-created via trigger on signup
- Admin promoted manually via SQL

## Schema Overview

- titles: movies and TV series in one table (kind enum: movie/tv)
- seasons/episodes: hang off titles for TV series
- genres + title_genres: many-to-many
- people + credits: cast/crew with roles (actor, director, writer, producer, composer)
- reviews: one per user per title, rating 1-10
- favorites: user's personal list
- profiles: extends auth.users with username, display_name, is_admin
- title_ratings: view with avg_rating and review_count per title

## Conventions

- Use createClient<Database> for typed Supabase client
- Environment variables: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
- Keep components in src/components/
- Keep Supabase client setup in src/lib/supabase.ts

## Key Features to Build

- Browse/search movies & TV series
- Title detail page (info, cast, genres, reviews)
- User auth (sign up, log in, log out)
- User reviews and ratings
- Favorites / My List
- Admin page (add/edit/delete titles, people, genres)
- Recommendation section
- SQL query page (default queries + custom user queries)
- Theme of app should be purple and black
