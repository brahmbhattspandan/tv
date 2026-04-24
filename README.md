# Stock Scanner

A daily stock technical analysis tracker built with Next.js. Add stock symbols to your watchlist, set price levels, and track whether stocks cross above or below your targets — with live Yahoo Finance data.

## Features

- **Symbol autocomplete** via Yahoo Finance search
- **Price level tracking** — set above/below targets and see live crossing alerts
- **One-click price refresh** with live market data
- **Carry forward** watchlists to the next trading day (skips weekends)
- **Date-based navigation** for historical tracking
- **User accounts** — create a personal login or use as guest
- **Dark theme** responsive UI

## Tech Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript 5**
- **Tailwind CSS 4** — dark theme
- **Drizzle ORM** + **better-sqlite3** (local) or **Turso** (production)
- **yahoo-finance2** — live stock quotes and search
- **jose** + **bcryptjs** — JWT sessions and password hashing

---

## Local Development

### Prerequisites

- Node.js 22+
- npm

### Setup

```bash
# Install dependencies
npm install

# Push database schema (creates scanner.db)
npx drizzle-kit push

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The local version uses SQLite (`scanner.db`) — no external database needed.

---

## Deploy to Vercel (Free Tier)

Vercel's serverless functions don't support local SQLite files. You need a hosted database. **Turso** is recommended — it's SQLite-compatible and has a generous free tier (500 databases, 9 GB storage, 25M row reads/month).

### Step 1: Create a Turso Database

1. Sign up at [turso.tech](https://turso.tech) (free tier)
2. Install the Turso CLI:
   ```bash
   # macOS
   brew install tursodatabase/tap/turso

   # or via curl
   curl -sSfL https://get.tur.so/install.sh | bash
   ```
3. Log in and create a database:
   ```bash
   turso auth login
   turso db create stock-scanner
   turso db show stock-scanner --url    # Copy the URL (libsql://...)
   turso db tokens create stock-scanner  # Copy the auth token
   ```

### Step 2: Switch to Turso Driver

Install the Turso/libSQL driver:

```bash
npm install @libsql/client
npm uninstall better-sqlite3 @types/better-sqlite3
```

Update `src/db/index.ts`:

```ts
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

export const db = drizzle({
  connection: {
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
  schema,
});
```

Update `drizzle.config.ts`:

```ts
import type { Config } from "drizzle-kit";

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "turso",
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
} satisfies Config;
```

Push the schema to Turso:

```bash
TURSO_DATABASE_URL="libsql://your-db.turso.io" \
TURSO_AUTH_TOKEN="your-token" \
npx drizzle-kit push
```

### Step 3: Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com/new](https://vercel.com/new) and import your repository
3. In **Environment Variables**, add:

   | Variable | Value |
   |----------|-------|
   | `AUTH_SECRET` | A random 32+ character string (run `openssl rand -base64 32`) |
   | `TURSO_DATABASE_URL` | Your Turso database URL (`libsql://...`) |
   | `TURSO_AUTH_TOKEN` | Your Turso auth token |

4. Click **Deploy**

### Step 4: Verify

- Visit your deployed URL
- Try adding a stock as a guest
- Create an account and verify data is scoped to your user
- Check the `/about` page

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `AUTH_SECRET` | **Yes** (production) | Secret key for JWT session signing. Must be set in production. |
| `TURSO_DATABASE_URL` | Production only | Turso database URL (`libsql://...`) |
| `TURSO_AUTH_TOKEN` | Production only | Turso database auth token |

---

## Project Structure

```
src/
  app/
    page.tsx            # Redirects to today's date
    [date]/page.tsx     # Date-specific stock view
    login/page.tsx      # Login page
    register/page.tsx   # Registration page
    about/page.tsx      # About page
    api/
      auth/             # Login, register, logout, session endpoints
      entries/          # CRUD for stock entries
      quote/[symbol]/   # Live Yahoo Finance quotes
      search/           # Symbol autocomplete search
  components/           # React client components
  db/
    schema.ts           # Drizzle schema (users + daily_entries)
    index.ts            # Database connection
  lib/
    auth.ts             # JWT session management
    yahoo.ts            # Yahoo Finance instance
```

## License

MIT
