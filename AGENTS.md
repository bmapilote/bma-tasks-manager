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
- `proxy.ts` (root, NOT `src/`) replaces `middleware.ts` — uses Supabase SSR middleware (NOT next-auth)
- Route groups: `(auth)/` and `(dashboard)/` for layout scoping
- Server Actions live in `src/actions/` (not co-located in routes). They use `"use server"`, `requireUser()` for auth, and `revalidatePath`/`redirect` for cache invalidation

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
- Supabase Auth (email/password), no next-auth
- Session managed via `@supabase/ssr` cookies
- Server-side auth helper at `src/lib/require-user.ts` — gets Supabase session, returns Prisma user (auto-links by email on first login)
- Client-side auth context at `src/components/auth/supabase-provider.tsx` — `useSupabaseUser()` hook
- Protected routes via `proxy.ts` (root), public: `/`, `/login`, `/register`
- Login form uses `supabase.auth.signInWithPassword()`, register form uses `supabase.auth.signUp()`

## Paths & imports
- `@/*` → `./src/*` (tsconfig paths)
- Types at `src/types/index.ts` — `TaskStatus`, `TaskPriority`, `SerializedTask`, `SerializedProject`, `UserSession`
- Logger at `src/lib/logger.ts` (pino, formatted with pino-pretty in dev)
- Prisma client singleton at `src/lib/prisma.ts`

## State management
- Client state: `@tanstack/react-query` (`QueryClientProvider` in dashboard layout)
- Form state: React 19 `useActionState` (native, no react-hook-form)
- Auth session: `SupabaseProvider` from `src/components/auth/supabase-provider.tsx` (dashboard layout)

## Style
- Tailwind CSS v4 with `@tailwindcss/postcss` (PostCSS config at root, NOT Tailwind config file)
- Geist font via `next/font` in root layout
- French UI labels, French error messages in Server Actions
- `cn()` utility in `src/lib/utils.ts` (class-variance-authority style merging)

## Architecture notes
- Dashboard layout (`src/app/(dashboard)/layout.tsx`) wraps `SupabaseProvider` + `QueryClientProvider` — new `QueryClient()` created per layout mount (OK for client components in app router)
- Server Actions own all data mutations; React Query used for client cache/refetch of reads where interactive
- Kanban uses native HTML5 drag & drop (no dnd-kit)
- `env` vars required: `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (see `.env` / `.env.local`)

## Netlify deployment

### netlify.toml
- Located at project root — build command: `npx prisma generate && npm run build`
- OpenNext adapter is auto-injected at build time (no `@netlify/plugin-nextjs` needed)
- `proxy.ts` runs as an Edge Function automatically

### Required env vars in Netlify Dashboard
Set these under **Site settings → Environment variables** (do NOT commit to `.env`):

| Variable | Value |
|---|---|
| Variable | Value |
|---|---|
| `DATABASE_URL` | `postgresql://postgres:pass@db.okxlsimomewvtfwsgirn.supabase.co:5432/postgres?sslmode=require&connection_limit=1` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://okxlsimomewvtfwsgirn.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (your anon key) |

**Critical:** If Supabase pooler (port 6543) is unreachable, use direct connection (port 5432) with `connection_limit=1`. To use the pooler, enable it first in **Supabase Dashboard → Database → Connection pooling**, then switch to port 6543 with `pgbouncer=true`.

### Login/register troubleshooting
If auth fails on Netlify:
1. Verify all 3 env vars above are set in the dashboard
2. Check `NEXTAUTH_URL` matches the exact Netlify deployment URL
3. Redeploy after changing env vars
4. Login form now shows specific error messages — use them to diagnose

### Server Component render error on `/dashboard` after login
This error (`digest: 303979541` or similar) means the Server Component threw at runtime:
1. **Check Netlify function logs** — The error message is sanitized in the browser but the real error appears in **Netlify → Site → Functions → Logs**. Look for `console.error` output with the digest.
2. **Verify `DATABASE_URL` on Netlify** — This is the most common cause. Make sure it's set in **Netlify Dashboard → Site settings → Environment variables** with the correct pooler connection string:
   `postgresql://postgres.okxlsimomewvtfwsgirn:pass@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true`
3. **Supabase session cookie** — If the proxy runs but `requireUser()` fails, the auth session might not be propagating. Ensure `proxy.ts` (root) exists and exports `proxy` + `config`.
4. **Prisma engine binary** — On Netlify Lambda, the native Prisma binary might be incompatible. If logs show engine errors, add `binaryTargets = ["native", "rhel-openssl-3.0.x"]` to `prisma/schema.prisma`.
