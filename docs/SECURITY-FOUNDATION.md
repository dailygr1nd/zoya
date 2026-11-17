# ZOYA security foundation — increment 1

Prepared 17 November 2026 from `repomix-output-dailygr1nd-zoya.xml`.

This is a reviewable implementation for a fresh Supabase staging project. It is not a claim that the existing deployment is secured, migrated, or production-ready. No remote project was accessed or modified.

## Implemented

- Authenticated submission endpoint verifies the Supabase user remotely and forwards that user's JWT. No service-role secret or database bypass key is used.
- Database write functions bind ownership to `auth.uid()`. Clients cannot write tables directly, change roles, set verification, or set publication status.
- Browser and server validation plus database constraints protect required fields, amounts, types, phone numbers and ownership-bound media references.
- A private administrator registry controls moderation. Decisions record actor, previous/new status, timestamp and reason in a private audit table, in the same transaction.
- Approval changes publication status only. It does not confer ownership or identity verification. The new schema never automatically grants `verified`.
- Per-account submission IDs prevent duplicate records on retries; changed content with the same ID is rejected. A database lock serializes each account's submissions and a database quota limits them to 10 per rolling day.
- Pending/rejected listings are readable only by the owner or administrator. Public queries see approved listings.
- Media buckets are private. Upload policies enforce owner paths and deny client overwrite/deletion. Bucket configuration restricts MIME types and size (images 10 MB each; video 50 MB).
- Listing submission checks that referenced objects actually exist and belong to the caller. Public media URLs resolve through an anonymous-RLS endpoint only for approved listings.
- Reviewers use short-lived signed media URLs. Anonymous signed URLs last 60 seconds, reviewer URLs 600 seconds. Previously issued signed URLs remain usable until expiry after withdrawal; already downloaded content cannot be recalled.
- Signup is implemented. Dashboard bootstrap creates an inactive, unverified agent profile owned by the current user.
- JSON request bodies are bounded to 32 KiB. API errors do not disclose raw database details. API responses use `no-store`. Basic anti-framing, content-sniffing, referrer and permissions headers are configured.
- Fixed existing lint errors and a nullable property access that prevented clean type checking. URL filter initialization now uses Next.js search parameters under Suspense.

## Verification performed

- `npm test`: 50 passing tests, zero failed/skipped. Includes nested database cases.
- Database tests execute the actual migration and authorization functions in PGlite, a PostgreSQL engine compiled to WASM. They exercise anon/authenticated roles, grants, row-level policies, ownership, private media, moderation, quota, retry behavior and migration guards.
- Auth/Storage schemas are minimal test fixtures. Tests do **not** run the Supabase Auth server, Storage HTTP service, PostgREST or email delivery.
- API helper tests cover remote identity checks with mocked HTTP responses, administrator denial, missing authentication, malformed/oversized bodies and non-leaking errors.
- Production-server HTTP smoke checks passed: signup responds 200, unauthenticated admin/submission endpoints respond 401, invalid media path responds 404, and security headers are present.
- `npm run typecheck`: passed.
- `npm run lint`: passed with 11 existing warnings concerning images, navigation and an unused variable; no errors. Image warnings also occur in modified pages.
- `npm run build`: passed with non-secret placeholder Supabase environment values. This confirms compilation/static generation, not live service connectivity.

## Fresh staging setup

1. Create a separate disposable Supabase project. Keep the existing production project unchanged.
2. In Auth settings, enable email/password with email confirmation, disable anonymous sign-ins, set a password policy of at least 12 characters, and configure the correct site/redirect URLs and delivery settings. The UI minimum alone does not enforce provider policy.
3. Review and apply `supabase/migrations/202611170001_security_baseline.sql` to the fresh project using a trusted database administrator. The migration is transactional and rejects existing `properties`, `agents` or the two media buckets. Do not remove this guard to force deployment.
4. Copy `.env.example` to `.env.local` and set the project URL and publishable key. Never put privileged keys in `NEXT_PUBLIC_*` variables.
5. Use Node 22.18+ (tested on Node 24), then run `npm ci`, `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, and `npm run dev`.
6. Sign up two test accounts and confirm their email addresses. Sign in to create their dashboard profiles. Create an administrator account separately.
7. A trusted database administrator grants the reviewer role using the confirmed Auth user UUID:

```sql
insert into zoya_private.administrators(user_id)
values ('REPLACE-WITH-CONFIRMED-ADMIN-USER-UUID');
```

The UUID is an example placeholder, not executable as written. Revoke access by deleting the specific registry row. There is intentionally no self-service admin assignment endpoint.

8. With account A, submit a listing with JPEG/PNG/WebP images and international-format contact numbers, e.g. `+255712345678`. Use account B and an anonymous browser to confirm the pending listing/media are inaccessible.
9. As the reviewer, open `/admin`, inspect the private media, and approve with a reason. Confirm the public listing and media now appear, without a verified badge.
10. Reject or return the listing to pending. Confirm public reads stop and newly requested media links fail; allow existing signed links to expire.
11. Verify real Storage rejection of oversized/unsupported files and foreign paths, Auth email flow, PostgREST role enforcement, and direct RPC misuse in staging. These integration checks remain required.

## Existing deployment integration

Run `supabase/inspect-existing.sql` against the existing project. It only reads schema, constraints, policies, grants, function metadata, triggers and bucket settings. It does not fetch customer rows or credentials. Export all result sets. Also record Auth settings (email confirmation, anonymous accounts, password policy and redirects) without sharing secrets.

Use those results to design an additive, installation-specific migration, including:

- Map every legacy listing to an accountable account. Do not infer ownership from an unverified display name/phone alone; unresolved ownership needs an explicit review/quarantine decision.
- Reconcile current policy definitions and grants. PostgreSQL permissive policies combine with OR, so simply adding restrictive-looking policies may leave older access open.
- Review legacy `verified` flags; the old UI set them automatically on approval. Do not treat them as proof of identity or property rights.
- Inventory existing public media and URLs. Making a bucket private and changing paths requires a coordinated migration and URL mapping; already public copies may persist elsewhere.
- Preserve existing rows and IDs; verify backups and restore before applying changes. Test the upgrade against a sanitized staging copy before production.

## Remaining work / launch gates

This increment is the ownership and moderation foundation, not the complete listing-to-enquiry milestone.

- Real staging integration tests and a deployment-specific schema migration remain outstanding.
- Administrator MFA enrollment/challenge and database enforcement are not yet implemented. Require this before public launch.
- Media MIME metadata and extension restrictions do not prove the contents are safe. Add server-side file inspection/re-encoding, malware checks as appropriate, upload quotas, and abandoned-object cleanup before opening uploads widely. Objects cannot currently be deleted by clients.
- No total upload quota or network/IP abuse protection is implemented. The listing quota is not a substitute for these controls. Add provider/edge limits and signup abuse controls.
- Password recovery, account deletion/suspension, agency membership, listing editing/resubmission and verification evidence workflows remain to be implemented.
- `ensure_agent` creates an inactive public-profile candidate. Directory activation and evidence-based verification require a later controlled workflow; do not set these flags based only on registration.
- Enquiries, viewing requests, complaints/reporting and notifications remain to be implemented.
- Public approved listing records currently include the intended public contact details, ownership/submission UUIDs and timestamps; the private admin registry/audit records are separate. Add explicit public projections and revisit contact publication consent before launch. Activated agent records currently expose their configured contact fields.
- Search remains browser-filtered and admin reads are capped at the latest 100 listings. Add indexed server-side filters, pagination and a complete review queue.
- Retry IDs and uploaded-file caching survive retries in the current form instance, not a page reload. Add durable draft/resume support if needed.
- Audit rows are protected from application roles, not from database administrators; external append-only retention is a later operational control.
- Add monitoring/alerts, restore drills, retention rules, a tested CSP and dependency/security scanning in the deployment pipeline.
- No browser end-to-end or live-load test has been performed.

## Primary implementation references

- Next.js bundled documentation: `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md`, authentication guide and headers reference were read before implementation.
- https://supabase.com/docs/reference/javascript/auth-getuser
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/storage/security/access-control
- https://nextjs.org/docs/app/guides/authentication
