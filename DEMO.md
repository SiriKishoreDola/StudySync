# Profile/Settings and assistant integration preview

Run from `/Users/sebastian/StudySync` on branch `sebastian`:

```sh
npm run dev -- --hostname 127.0.0.1 --port 3000
```

Open http://127.0.0.1:3000/demo. The original starter at http://127.0.0.1:3000/ is preserved.

## Integration boundaries

- `components/studysync/settings.tsx` exports the reusable `Settings` component. Place it below the real Profile page’s Courses card. This repository has no teammate Profile page or shared navigation yet; `DemoHost` provides explicitly fictional integration context only.
- Settings use the browser-local key `studysync-demo-settings-v1`. Values are validated against the demo’s allowed choices on load. Save/Cancel and storage-failure feedback are implemented. No database or authenticated account is connected. Clearing site data resets preferences.
- Light/Dark/System preview only Settings. Other preferences are stored as demo values; they do not alter real calendars, time zones, schedules, or AI output.
- `components/studysync/assistant.tsx` exports `Assistant`, a 420px overlay with launcher, close/Escape, focus containment, scrollable messages and fixed composer. It takes a `scenario` prop (`normal`, `error`, `empty`). Replacing the scenario remounts the chat in the host.
- `lib/study-demo.ts` contains fictional October 12–18, 2026 deadlines and preset responses. The delay and failure are simulated locally. No real AI, upload, calendar editing, or network request occurs.
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

Manual checks: change a setting, Save, reload, change again and Cancel; preview Dark/System; open the assistant, select a prompt and observe loading then response; close with Escape; use “Assistant demo scenarios” below the content to select error/retry or no-deadlines; test typed messages and narrow screens.
