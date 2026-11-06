# StudySync local integration preview

Run from `/Users/sebastian/StudySync` on branch `sebastian`:

```sh
npm run dev -- --port 3000
```

Open http://127.0.0.1:3000/demo. Dashboard and Profile & Settings share the Ask StudySync popup; switching views does not reset its conversation. The original starter at `/` is preserved.

## Settings contract

`lib/study-preferences.ts` defines the browser-local preferences stored at `studysync-demo-settings-v1`:

| Field | Meaning | Default |
| --- | --- | --- |
| `zone` | Time zone | America/Los_Angeles |
| `format` | Time format | 12-hour |
| `week` | Week starts | Sunday |
| `study` | Preferred study time | Morning · 9 AM–12 PM |
| `length` | Preferred session length | 45 minutes |

Only these five fields are loaded and saved. Unknown legacy fields are ignored while valid remaining values are preserved. A successful Save rewrites the stored object to this contract. Cancel restores the last saved draft without writing storage. Storage errors retain the form and display feedback. These preferences are not connected to real planner records or a database.

The Settings page contains General and Planning only. Profile content and courses remain fictional preview content. Dashboard and Settings use the Vintage Cream (#e6d8c1) and Dusty Mauve (#a37c76) light palette regardless of device color scheme; there are no appearance or assistant preference controls.

## Chat

`components/studysync/assistant.tsx` calls `POST /api/chat` directly on Send or Retry. There are no scenario controls or simulated failure branches in the product. Loading, timeout, provider errors, explicit retry, and empty-deadline feedback remain supported. Deadline availability comes from the server's data; an empty dataset does not prevent students from asking for help. Empty Gemini text is a retriable provider error, distinct from an empty deadline dataset.

The server defaults to concise, supportive replies: answer/action first, 2–4 short sentences or at most three brief bullets, with no introductions, repeated advice, or closing filler. It asks at most one necessary clarification question and preserves important dates and context. Students can ask for more detail directly in chat. These are model instructions, not guaranteed sentence counts. Output has a 2,048-token safety budget without character slicing.

The official `@google/genai` SDK uses `gemini-3.5-flash-lite`. System instructions and credentials stay on the server. Each request contains at most five prior successful turns plus a new question. Requests are bounded and validated, have a 25-second server timeout, and disable automatic SDK retries. Messages live in browser memory; no database or authenticated account is connected. The fictional October 12–18, 2026 deadlines in `lib/study-demo.ts` are explicitly identified as examples, never real student records. Messages and example context are sent to Google.

The root `.env.local` supplies `GEMINI_API_KEY`; never prefix it with `NEXT_PUBLIC_`. Next.js does not use `app/.env.local`. Both environment files are ignored and must remain untracked. Restart development after changing the root key; never paste credentials into chat, browser code, logs, or commits.

Chat is local-development-only: production mode and non-loopback hosts are rejected, browser origins are checked, and `npm run dev` binds to `127.0.0.1`. Do not expose this unauthenticated preview through tunnels or reverse proxies. Authentication, authorization, rate limits, and real student data access are still required before hosted use. `npm run start` can preview the interface but deliberately cannot call Gemini.

## Checks and preview verification

```sh
npm run test:chat
npm run lint
npx tsc --noEmit
npm run build -- --webpack
```

The tests mock Gemini and do not consume provider quota. The webpack build checks TypeScript and page generation; the starter's Google Fonts can require network access. Earlier default Turbopack builds encountered environment restrictions, so webpack is the recorded build check.

Manual preview: change General/Planning values, Save, reload, change again and Cancel. Load an older stored settings object to verify that remaining values survive. Confirm that Dashboard and Profile & Settings have no scenario controls, and check the cream/mauve palette with the device set to dark mode. Open Ask StudySync, send a question, and verify loading and response or error/retry. Sending or retrying can consume quota; simply opening the popup does not call Gemini.

The earlier configured model timed out with HTTP 504 and later returned provider HTTP 503 `UNAVAILABLE`. A separate, explicitly authorized minimal request to `gemini-3.5-flash-lite` returned HTTP 200 with nonempty text using the existing server key and retries disabled. The route now uses that tested alternative. The running app route later returned HTTP 200 for a popup-format request (see verification below); automated checks and one successful request do not establish continued provider availability. The SDK installation previously reported six unresolved dependency vulnerabilities (five high and one critical); no forced audit fix was run.

Official references: https://ai.google.dev/gemini-api/docs/libraries and https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite.

## Gemini failure investigation (November 5, 2026)

The popup's generic connection error was reproduced. A second diagnostic generation request, explicitly approved after the first exception was discarded, confirmed Google HTTP 503 with the allowlisted reason `UNAVAILABLE`. The application returned HTTP 502 before the corrected status mapping; it now preserves a provider 503 as application HTTP 503 and explains temporary Gemini unavailability. No successful generation was confirmed during that investigation; the later alternative-model test described above succeeded. DNS resolution and a verified TLS handshake succeeded. The root key was loaded without printing it; these checks do not establish that Google accepts the credentials when its service recovers.

`lib/gemini-errors.ts` distinguishes DNS, TLS trust, network connection, timeout, credentials/access (including HTTP 400 `API_KEY_INVALID`), unavailable model, quota, malformed request, and provider failures. The route logs only allowlisted category/code/reason and numeric upstream HTTP status. It never logs raw provider messages, keys, URLs, headers, or conversation text. Transport causes are captured before SDK wrapping. SDK automatic retries remain disabled and TLS verification stays enabled. The later model switch changes only the model identifier, not these safeguards. A Google-side service outage cannot be repaired in this repository; retry manually later rather than automatically looping or enabling billing.

Model switch (November 5, 2026): `/api/chat` now uses `gemini-3.5-flash-lite`, matching the successful isolated test. Concise/supportive instructions, history bounds, timeouts, safe error handling, and local-development-only access are preserved. No new live request was made for the switch.

## Running-server verification (November 5, 2026)

The process listening on `127.0.0.1:3000` was confirmed to run from this repository. Its active development route chunk referenced `gemini-3.5-flash-lite`; an older 3.8 chunk remained on disk but was not referenced by the active route. The current shell/root environment loader had no inherited key, enterprise/Vertex flag, or model override. The route hardcodes its model and supplies the server key explicitly.

One controlled POST replayed the popup's method, origin, JSON shape, and suggested prompt through the running `/api/chat` endpoint. Temporary safe tracing confirmed the outgoing model was `gemini-3.5-flash-lite` at Google's official API hostname, with system instructions, one message, the normal 2,048-token limit, and exactly one upstream request. It returned HTTP 200 with nonempty text. This tests the running HTTP route, not a browser automation session. The temporary per-request trace was removed; failure logs retain the selected model and upstream attempt count without recording payloads or secrets.

The earlier application HTTP 503 `UNAVAILABLE` responses were intermittent; no reproducible configuration mismatch was found. Unlike the isolated 64-token test, the application sends full server instructions and bounded conversation history. The successful app request shows those differences do not invariably cause failure. No restart or configuration workaround was needed. The popup keeps an error visible until manual Retry or dismissal; it never polls Google automatically.

If a future restart is needed, this agent-started process has no VS Code terminal tab. Stop it via the active agent session, or stop your own dev server with Ctrl+C in the VS Code terminal that shows Next.js logs. Then use a VS Code integrated terminal in `/Users/sebastian/StudySync` and run `npm run dev -- --port 3000`. Do not start a second server while port 3000 is occupied; Next.js can otherwise choose another port and leave the browser on the old server.

Pre-push verification (November 5, 2026): all 13 mocked tests, ESLint, TypeScript, whitespace checks, and the webpack production build passed. The user also confirmed the browser chatbot is working. The fetched `sebastian` branch matched `origin/sebastian` before the commit; no merge or conflict resolution was needed.

## Shared signed-in assistant

`app/(main)/layout.tsx` owns one Assistant instance beside the shared Navbar and page content. It persists across Next.js Link navigation between `/dashboard`, `/profile`, `/timeline`, `/courses`, course detail pages, `/extraction`, `/upload`, and `/review`. Dashboard no longer owns an instance. Review lives inside the same route group (URL unchanged), uses the shared navigation, and no longer repeats its old page header. Login stays outside this group and has no chatbot. The standalone `/demo` preview keeps its own assistant and is separate from the signed-in app.

The existing placeholder session proxy also covers Courses, Extraction, and Review. This is still a demo session cookie, not production authentication. Gemini configuration, styling, history bounds, and real error/retry handling are unchanged. Conversation persists during in-app navigation; a full reload or logout clears the in-memory chat.

Preview: run `npm run dev -- --port 3000` and open http://127.0.0.1:3000/login. Submit the placeholder login form, then open Ask StudySync. Type a draft or send a message, close the popup, and use the Navbar to visit Profile, Timeline, Courses, and Add Syllabus. Reopen chat and verify the draft/messages remain and there is exactly one launcher. Follow Upload and Review in the syllabus flow; these routes also share the same assistant. Log out and confirm Login has no launcher. Opening the popup or navigating does not send Gemini requests; Send/Retry does.

Shared-shell verification: 14 mocked/unit/render tests passed, TypeScript passed, and the webpack production build passed. ESLint passed with three pre-existing unused-symbol warnings in unchanged Courses/Extraction files. Headless browser checks verified a single persistent launcher, preserved messages, and an unsent draft across Dashboard, Profile, Timeline, Courses, Extraction, Upload, Review, and a course detail page. Login and signup had zero launchers after logout; anonymous Courses redirected to Login. Chat and extraction were mocked only in the QA browser; no real provider calls were made. The browser tool's `.gstack/` state is ignored by Git. The merged lockfile installation reported nine vulnerabilities (eight moderate, one critical); no dependency upgrades or forced audit fix were performed.
