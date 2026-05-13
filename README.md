# MovieDB

An IMDb-style movie and TV database built with Next.js and Supabase. Browse titles, read and write reviews, manage a favorites list, and explore cast & crew — all backed by a fully manual admin panel.

## Stack

- **Next.js 15** — App Router, server components, server actions
- **TypeScript**
- **Supabase** — PostgreSQL, Auth (email/password), Row Level Security
- **Tailwind CSS v4**

## Features

### Public

- Browse all movies and TV series with search, kind filter, and pagination
- Title detail pages — poster, backdrop, overview, genres, runtime, cast, directors, writers, average rating
- TV series seasons and episodes accordion
- Person pages — bio, birth/death dates, full filmography grouped by role
- User reviews — submit, update, or delete a 1–5 star rating with optional text
- Favorites list — save titles to your personal list
- Recommendations section on the homepage
- SQL query page — run preset or custom queries against the database

### Admin (requires `is_admin` flag)

- Full CRUD for titles, including genre assignment and credits management per title
- Full CRUD for people
- Full CRUD for genres
- Seasons and episodes management for TV series

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project

### Environment variables

Create a `.env.local` file:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Database Schema

| Table                     | Description                                                           |
| ------------------------- | --------------------------------------------------------------------- |
| `titles`                  | Movies and TV series (`kind`: movie / tv)                             |
| `seasons` / `episodes`    | TV seasons and episodes, hung off titles                              |
| `genres` + `title_genres` | Many-to-many genre associations                                       |
| `people` + `credits`      | Cast and crew with roles: actor, director, writer, producer, composer |
| `reviews`                 | One review per user per title, rating 1–5                             |
| `favorites`               | User's saved titles                                                   |

RLS is enabled on all tables. Admin access is controlled via the `profiles.is_admin` boolean, promoted manually via SQL:

```sql
UPDATE profiles SET is_admin = true WHERE username = 'your_username';
```

## Project Structure

```
src/
├── app/
│   ├── admin/          # Admin panel (titles, people, genres, seasons)
│   ├── auth/           # Login and signup pages
│   ├── favorites/      # User favorites page
│   ├── people/[id]/    # Person detail page
│   ├── sql/            # SQL query explorer
│   ├── titles/[id]/    # Title detail page
│   └── page.tsx        # Homepage — browse and search
├── components/         # Shared UI components
├── lib/                # Supabase client setup
└── types/              # Auto-generated Supabase DB types
```
