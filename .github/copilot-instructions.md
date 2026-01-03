# Copilot Instructions: mywebapp

Use these repo-specific notes to be productive immediately.

## Big Picture
- Next.js 16 App Router with TypeScript and Tailwind; PostgreSQL via Prisma.
- Layout renders `Sidebar` + `Header` wrapping page content: see [src/app/layout.tsx](src/app/layout.tsx).
- UI pages call local API routes via `fetch`; APIs use Prisma to persist: see [src/lib/prisma.ts](src/lib/prisma.ts).

## Data Model
- Two tables in [prisma/schema.prisma](prisma/schema.prisma): `Symbol` and `Transaction`.
- `Transaction.type` is a single char: `B` (Buy) or `S` (Sell). `balance` set only for `B`.
- `Symbol` has optional `code1/2/3` and `note`; length limits are enforced at write time.

## API Conventions
- Route handlers live under `src/app/api/**` and return `NextResponse.json(...)`.
- Symbols:
  - [GET](src/app/api/symbols/route.ts): optional search via `?q=` or `?search=`; uses `OR` filter with `mode: 'insensitive'` and `orderBy`.
  - [POST](src/app/api/symbols/route.ts): sanitize inputs (`substring(0, N)`), set optional fields to `null`.
  - [PATCH/DELETE](src/app/api/symbols/[id]/route.ts): parse `params.id` to int; on delete, transactions are removed first, then the symbol.
- Transactions:
  - [GET](src/app/api/transactions/route.ts): includes `symbol`, orders by `date desc`.
  - [POST/PATCH](src/app/api/transactions/route.ts): parse numeric fields (`parseInt/parseFloat`), coerce `date` to `Date`, set `balance` only when `type === 'B'`.
- Error shape: `{ error: '...' }` with `status: 500`. Match this pattern when adding endpoints.
- Dynamic route `params` are passed as a Promise in this codebase; replicate type: `{ params }: { params: Promise<{ id: string }> }`.

## UI Patterns
- Client components start with "use client" and use Tailwind exclusively (no CSS Modules).
- Sidebar collapses < 1024px and styles active links; see [src/components/sidebar.tsx](src/components/sidebar.tsx).
- Header provides search with debounced suggestions from `/api/symbols?q=...` and dispatches a DOM `openSymbol` event to focus an item on `/symbols`; see [src/components/header.tsx](src/components/header.tsx).
- Pages live under `src/app/**/page.tsx` and use simple `fetch` calls to local APIs.

## Workflows
- Dev: `npm run dev` → Next server at http://localhost:3000.
- Build/Run: `npm run build`, `npm start`.
- Lint: `npm run lint` (ESLint 9 + `eslint-config-next`).
- DB: set `.env` `DATABASE_URL` and run `npx prisma migrate dev --name init`; open Prisma Studio with `npx prisma studio`.
- See setup details in [SETUP.md](SETUP.md) and deployment notes in [DEPLOYMENT.md](DEPLOYMENT.md).

## Extending
- New resource: add `src/app/api/<resource>/route.ts` (GET/POST) and `src/app/api/<resource>/[id]/route.ts` (PATCH/DELETE) following transaction/symbol patterns (input coercion, error JSON, ordering).
- Search endpoints should support `?q=` and use `contains` filters with `mode: 'insensitive'` when relevant.
- UI: create a new `src/app/<page>/page.tsx` and wire via `Sidebar`; prefer Turkish labels to match existing UI.

## Gotchas
- Prisma client is pooled via `@prisma/adapter-pg` and cached in dev; see [src/lib/prisma.ts](src/lib/prisma.ts).
- Manual cascade delete for symbols occurs in API even though DB relation has `onDelete: Cascade`; keep behavior consistent unless changing schema and handlers together.
- Tailwind dark mode uses `class`; fonts are injected via `next/font` in layout.

## Key References
- Layout: [src/app/layout.tsx](src/app/layout.tsx)
- Home dashboard: [src/app/page.tsx](src/app/page.tsx)
- Symbols API: [src/app/api/symbols/route.ts](src/app/api/symbols/route.ts), [src/app/api/symbols/[id]/route.ts](src/app/api/symbols/%5Bid%5D/route.ts)
- Transactions API: [src/app/api/transactions/route.ts](src/app/api/transactions/route.ts), [src/app/api/transactions/[id]/route.ts](src/app/api/transactions/%5Bid%5D/route.ts)
- Prisma: [src/lib/prisma.ts](src/lib/prisma.ts), [prisma/schema.prisma](prisma/schema.prisma)
