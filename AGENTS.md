<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# BMA Task Manager

## Commands
```sh
npm run dev       # dev server (http://localhost:3000)
npm run build     # production build
npm run lint      # ESLint (flat config, eslint.config.mjs)
npx tsc --noEmit  # typecheck (no npm script, run manually)
```

No tests or CI configured. No typecheck script in package.json — use `npx tsc --noEmit`.

## Next.js 16 quirks
- `proxy.ts` (root, NOT `src/`) replaces `middleware.ts` — uses `next-auth/middleware` `withAuth`
- Route groups: `(auth)/` and `(dashboard)/` for layout scoping
- Server Actions live in `src/actions/` (not co-located in routes). They use `"use server"`, `getServerSession` for auth, and `revalidatePath`/`redirect` for cache invalidation
- API route at `src/app/api/auth/[...nextauth]/route.ts`

## Prisma + Supabase PostgreSQL
- Schema: `prisma/schema.prisma` — PostgreSQL (Supabase), 5 models (User, Project, Task, SubTask, ActivityLog)
- Database hosted on Supabase (`db.mejeuwjrwxkyfhyfzgag.supabase.co`)
```sh
npx prisma generate   # regen client after schema change
npx prisma db push    # push schema to Supabase
npx prisma studio     # GUI data browser (via Supabase proxy)
```
- No migrations in use — `db push` is the workflow
- Connection: `DATABASE_URL` in `.env` uses port 5432 (direct) — use 6543 (pooler) for production
- Supabase JS client available in `src/utils/supabase/` (server.ts, client.ts, middleware.ts)

## Data migration
- Migration script at `scripts/migrate-sqlite-to-supabase.mjs`
- To re-run: update `.env` to SQLite temporarily, run the script, then restore PostgreSQL URL

## Auth
- next-auth v4, CredentialsProvider + JWT strategy
- Session user type augmented in `src/types/next-auth.d.ts` (adds `id` field)
- `authOptions` in `src/lib/auth.ts` — shared by API route and Server Actions
- Protected routes via `proxy.ts` (root), public: `/`, `/login`, `/register`
- Login form uses `useActionState` (React 19 native) with `register` action

## Paths & imports
- `@/*` → `./src/*` (tsconfig paths)
- Types at `src/types/index.ts` — `TaskStatus`, `TaskPriority`, `SerializedTask`, `SerializedProject`, `UserSession`
- Logger at `src/lib/logger.ts` (pino, formatted with pino-pretty in dev)
- Prisma client singleton at `src/lib/prisma.ts`

## State management
- Client state: `@tanstack/react-query` (`QueryClientProvider` in dashboard layout)
- Form state: React 19 `useActionState` (native, no react-hook-form)
- Auth session: `SessionProvider` from `next-auth/react` (dashboard layout)

## Style
- Tailwind CSS v4 with `@tailwindcss/postcss` (PostCSS config at root, NOT Tailwind config file)
- Geist font via `next/font` in root layout
- French UI labels, French error messages in Server Actions
- `cn()` utility in `src/lib/utils.ts` (class-variance-authority style merging)

## Architecture notes
- Dashboard layout (`src/app/(dashboard)/layout.tsx`) wraps `SessionProvider` + `QueryClientProvider` — new `QueryClient()` created per layout mount (OK for client components in app router)
- Server Actions own all data mutations; React Query used for client cache/refetch of reads where interactive
- Kanban uses native HTML5 drag & drop (no dnd-kit)
- `env` vars required: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` (see `.env.example`)

## Netlify deployment

### netlify.toml
- Located at project root — build command: `npx prisma generate && npm run build`
- OpenNext adapter is auto-injected at build time (no `@netlify/plugin-nextjs` needed)
- `proxy.ts` runs as an Edge Function automatically

### Required env vars in Netlify Dashboard
Set these under **Site settings → Environment variables** (do NOT commit to `.env`):

| Variable | Value |
|---|---|
| `DATABASE_URL` | `postgresql://postgres:pass@db.mejeujwrxkyfhyfzgag.supabase.co:5432/postgres?sslmode=require&connection_limit=1` |
| `NEXTAUTH_URL` | `https://<site-name>.netlify.app` |
| `NEXTAUTH_SECRET` | Same value as local `.env` (or regenerate via `openssl rand -base64 32`) |

**Critical:** If Supabase pooler (port 6543) is unreachable, use direct connection (port 5432) with `connection_limit=1`. To use the pooler, enable it first in **Supabase Dashboard → Database → Connection pooling**, then switch to port 6543 with `pgbouncer=true`.

### Login/register troubleshooting
If auth fails on Netlify:
1. Verify all 3 env vars above are set in the dashboard
2. Check `NEXTAUTH_URL` matches the exact Netlify deployment URL
3. Redeploy after changing env vars
4. Login form now shows specific error messages — use them to diagnose
