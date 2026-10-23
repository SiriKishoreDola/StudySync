# Profile/Settings and assistant integration preview

Run from `/Users/sebastian/StudySync` on branch `sebastian`:

```sh
npm run dev -- --hostname 127.0.0.1 --port 3000
```

Open http://127.0.0.1:3000/demo. The original starter at http://127.0.0.1:3000/ is preserved.

## Integration boundaries

- `components/studysync/settings.tsx` exports the reusable `Settings` component. Place it below the real Profile page’s Courses card. This repository has no teammate Profile page or shared navigation yet; `DemoHost` provides explicitly fictional integration context only.
- Settings use the browser-local key `studysync-demo-settings-v1`. Values are validated against the demo’s allowed choices on load. Save/Cancel and storage-failure feedback are implemented. No database or authenticated account is connected. Clearing site data resets preferences.
- Light/Dark/System preview only Settings. Saved response length controls Gemini replies; other preferences are stored as demo values and do not alter calendars, time zones, schedules, or AI output.
- `components/studysync/assistant.tsx` exports `Assistant`, a 420px overlay with launcher, close/Escape, focus containment, scrollable messages and fixed composer. It takes a `scenario` prop (`normal`, `error`, `empty`). Replacing the scenario remounts the chat in the host.
- `lib/study-demo.ts` contains fictional October 12–18, 2026 deadlines. Live chat uses `POST /api/chat` and Google Gemini; the error and empty scenarios remain request-free UI fixtures. No real student records, upload, or calendar editing is connected.
- `app/demo/demo.css` holds cream/mauve preview styles. Inter is preferred with local Arial/Helvetica fallbacks; no new remote fonts or dependencies are added. Exact measurements may differ from Figma under the authorized screenshot fallback.
- Temporary navigation only switches Dashboard and Profile & Settings demo views. Upload, Timeline, and My Courses are context labels, not implemented routes. Profile course examples and Dashboard deadlines intentionally mirror their separate approved references.

## Verification

Recorded implementation checks: `npm run lint` passed. The default `npm run build` failed in this execution environment: the initial attempt could not fetch the starter's Google Fonts, and the subsequent attempt hit a Turbopack worker port permission error (`Operation not permitted`). `npm run build -- --webpack` passed, including TypeScript checking and static page generation. This fallback success does not mean the default Turbopack build passed.

```sh
npm run lint
npm run build
```

If the execution environment blocks Turbopack’s worker port, the alternate production check is:

```sh
npm run build -- --webpack
npm run start -- --hostname 127.0.0.1 --port 3001
```

Production preview: http://127.0.0.1:3001/demo. The starter layout’s existing Google Fonts require network access during the build.

Manual checks: change a setting, Save, reload, change again and Cancel; preview Dark/System; open the assistant, select a prompt and observe loading then response; close with Escape; use “Assistant demo scenarios” below the content to select a request-free error fixture or no-deadlines; test typed messages and narrow screens.

## Local Gemini chat

The root `.env.local` must contain `GEMINI_API_KEY` (never use a `NEXT_PUBLIC_` prefix). Next.js does not use `app/.env.local`. Both files are ignored by Git. Restart development after changing the root key. Never paste the key into chat, browser code, logs, or commits.

`app/api/chat/route.ts` uses the official `@google/genai` SDK with stable `gemini-3.8-flash`. System instructions and the key stay server-side. Each request includes at most five prior successful turns plus the new question; messages are transient browser memory, not database records. Input is validated, request bodies are bounded, output has a 2,048-token safety budget without character slicing, server requests time out after 25 seconds, and SDK automatic retries are disabled. Retry is explicit and does not duplicate the question. Messages and fictional demo context are sent to Google; avoid sensitive student data in this unauthenticated preview.

The API refuses production mode, non-loopback hostnames, and cross-origin browser requests. `npm run dev` binds to `127.0.0.1` by default. Do not expose it through tunnels or reverse proxies. These development restrictions are not authentication; add authentication, per-user authorization, rate limits, and real record access before enabling hosted chat. Settings remain browser-local. The saved Concise/Detailed response-length preference is sent with each chat request (including Retry); unsaved changes and Cancel do not affect chat. Missing or unavailable storage defaults to Concise.

Preview: run `npm run dev -- --port 3000`, visit http://127.0.0.1:3000/demo, open **Ask StudySync**, and send one question. The default scenario is **Live Gemini**. Each Send or Retry can consume Gemini quota; no request happens merely by opening the popup. Chat is intentionally unavailable with `npm run start`.

Checks: `npm run test:chat`, `npm run lint`, `npx tsc --noEmit`, and `npm run build -- --webpack`. Route tests use a mocked provider and make no Gemini requests.

Official references: https://ai.google.dev/gemini-api/docs/libraries and https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash.

## Gemini integration validation (October 22, 2026)

- Passed: six mocked route tests (`npm run test:chat`), ESLint (`npm run lint`), TypeScript (`npx tsc --noEmit`), webpack production build (`npm run build -- --webpack`), and local `/demo` HTTP 200.
- The single live Gemini attempt returned HTTP 504 after a timeout. No successful real Gemini response is confirmed; there were no automatic provider retries. Passing mocked tests and compilation does not establish live provider availability.
- Authentication, database access, and real student records remain missing. The endpoint is currently local-development-only: it rejects production mode and non-loopback hosts, checks browser origin, and the development command binds to `127.0.0.1`. These controls do not replace authentication or production rate limiting.
- The SDK installation reported six dependency vulnerabilities: five high and one critical. They remain unresolved; no `audit fix --force` was run. This is the installation's reported count, not a new advisory analysis.
- Root `.env.local` and `app/.env.local` are ignored and untracked. The secret scan found no actual credentials in source/config files eligible for this commit; no secret contents were displayed. Generated files and dependencies are excluded from the commit.

## Response length

Concise is the default: answer/action first, 2–4 short sentences or at most three brief bullets, with no introductions, repeated advice, or closing filler. The server asks at most one necessary clarification question and preserves dates, deadlines, and relevant context. Detailed allows fuller explanations. Explicit requests for detail or brevity override the saved preference. These are model instructions, not guaranteed sentence counts. Save the existing Response length setting before sending a message to use it; no interface or history reset is required.

Response-length validation: all nine mocked tests, lint, TypeScript, and the webpack production build passed. Live Gemini success has not been confirmed: the earlier single live attempt timed out, and no live request was made for the response-length update. Authentication and real student records remain missing; chat stays local-development-only.
