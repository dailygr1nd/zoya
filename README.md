# ZOYA

Real estate marketplace built with Next.js, TypeScript and Supabase.

This source includes the first backend security increment reconstructed from the supplied repository snapshot. Start with [the security foundation guide](docs/SECURITY-FOUNDATION.md) for scope, test evidence, fresh staging setup, and remaining launch gates.

```bash
npm ci
cp .env.example .env.local
# Configure your fresh staging project URL and publishable key.
npm test
npm run typecheck
npm run lint
npm run build
npm run dev
```

Use Node 22.18 or newer. The database migration is **fresh-project only** and deliberately rejects existing marketplace tables/buckets. For an existing project, first use the read-only `supabase/inspect-existing.sql` and design a migration against the actual schema. Do not force the bootstrap migration over live data.

No live Supabase project has been changed. The guide lists the remaining integration and production-readiness work.
