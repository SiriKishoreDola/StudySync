# Google sign-in and verified sessions

This change is reconciled onto `origin/main` at `a131877`. It preserves main's email/password login and database-backed Dashboard, course, requirement, and syllabus-extraction flows. It adds Google OAuth without changing shared database rows, schemas, policies, storage configuration, or provider settings.

## Local test

1. Keep `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in ignored root `.env.local` (legacy anon public-key variable also works). `GEMINI_API_KEY` stays server-only. Never put Google client secrets or service-role keys in public variables.
2. Run `npm run dev -- --port 3000` and open http://127.0.0.1:3000/login. Use an allowed callback on the same hostname: http://127.0.0.1:3000/auth/callback. If Supabase allows localhost instead, use localhost for the entire flow. Restart Next.js after changing environment variables.
3. Choose Continue with Google and complete consent yourself. Expect return to the requested protected page. Cancel consent or open `/auth/callback` without a code to check the safe error path. Existing email/password login remains available.
4. Refresh, navigate through Courses/Extraction/Review, and confirm the session and one shared chatbot persist. Logout must remove access. In a second tab, sign-out/account changes reset the shell. Leave a real session until token expiry to manually check refresh.
5. Signed-out private APIs should return JSON 401; protected pages redirect to Login. An obsolete mock-session cookie must not grant access. Test another account for isolation before entering sensitive student data.

## Auth implementation

- `lib/supabase/client.ts` / `server.ts` adapt the official `@supabase/ssr` browser and cookie-aware server clients.
- `/auth/callback` exchanges the PKCE code and allows only same-app return destinations, with no-store redirects. Provider messages/codes/tokens are never logged.
- Proxy verifies claims, refreshes cookies on both request and response, preserves refresh cookies across redirects, and guards signed-in routes. APIs refresh sessions but retain JSON responses.
- `getCurrentUserId()` validates with Supabase `getUser()`. The shared layout and all private API handlers verify identity; cookie presence or browser-supplied user IDs are not authorization.
- Existing Navbar logout uses Supabase local sign-out with an explicit failure message. Unused mock-session files and NextAuth are removed.

## Data access and reconciliation

The newer main branch had replaced the old demo DB, so this PR does not reintroduce it. Database handlers use the request-scoped publishable-key client, explicit verified owner filters, and RLS instead of service-role clients. Syllabus owner IDs and Storage paths come from the verified user. Course creation ignores caller ownership and invokes the checked-in security-invoker `save_course` RPC. Field aliases are mapped to the existing checked-in schema (`name`, `semester`, `type`); no migration is changed or executed.

The repository's migration declares owner policies on syllabi/courses/requirements and per-user private Storage folders. Their deployment and actual cross-account behavior in the new shared project were not tested here. Review the database team's deployment before live use. No shared-project database test, schema push, user creation, or file upload was performed.

Main's browser cache and temporary extraction data are namespaced by the server-verified user ID. Old unscoped browser keys are ignored, not deleted or assigned to the next signed-in account. Browser storage remains accessible to users of that browser profile; it is not a substitute for server authorization. Existing extraction retry/payload behavior is otherwise preserved and requires separate end-to-end pipeline validation.

## Checks

Run `node --test tests/*.test.mjs`, `npm run lint`, `npx tsc --noEmit`, and `npm run build -- --webpack`. Tests mock Supabase/Gemini and make no shared-project writes. `npm run test:db` and `npm run db:push` are intentionally not run.

Full Google consent, actual token-expiry refresh, and live RLS/Storage tests remain manual. Dependency installation reported eight vulnerabilities (seven moderate, one critical); no audit fix was run.

Official references: [SSR clients and refresh](https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs), [Google OAuth](https://supabase.com/docs/guides/auth/social-sign-in/auth-google).

Submission validation: 27 Node tests passed, TypeScript and the webpack production build passed, and ESLint passed with three pre-existing unused-symbol warnings. No shared database tests/migrations or live OAuth/Gemini requests were run. The original pre-reconciliation patch is preserved in a local Git stash; it is not part of the PR.
