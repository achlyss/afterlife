# Tech Steering — Afterlife

## Stack (zero dependencies, zero build step)
- **Plain HTML + CSS + vanilla JavaScript.** No framework, no bundler, no
  npm install. A judge must be able to run the app with one command:
  `python3 -m http.server` (or by double-clicking `index.html` — the app
  also works from `file://`).
- **localStorage** for persistence (key `afterlife.v1`). All state is a
  single JSON document; every mutation goes through `logic.js` pure
  functions, then persists.
- **Web Crypto (AES-GCM + PBKDF2)** for encrypted export/import. No
  third-party crypto code. Passphrase never leaves the browser.
- **No external requests at runtime.** No CDN fonts, no analytics, no
  fonts fetched from Google. System font stacks only, so the app works
  fully offline. (This is a deliberate privacy and reliability choice.)

## Architecture rules
- `js/logic.js` — **pure logic only** (no DOM access): data model,
  validation, Haunting Score, check-in state machine, will-letter
  generation, export envelope. Written UMD-style so the same file runs in
  the browser (`window.AfterlifeLogic`) and in Node (`module.exports`) for
  tests. Every function is unit-testable without a browser.
- `js/app.js` — **UI wiring only**: reads DOM, calls `logic.js`, renders.
  No business rules live here; if a rule is needed in the UI, it must be a
  function in `logic.js` first.
- `js/seed.js` — demo seed data (fictional people and accounts, clearly
  labeled as demo). Loading seed data never overwrites existing user data
  without confirmation.
- `tests/test.js` — Node tests with plain `assert`, plus a tiny hand-rolled
  property-based harness (no dependencies): score is bounded 0–100 and
  monotonic in coverage; the check-in state machine never skips a stage;
  encrypt/decrypt round-trips for arbitrary payloads.

## Conventions
- IDs: `crypto.randomUUID()` with a timestamp fallback.
- Dates: ISO strings (UTC) in storage; displayed in the user's locale.
- All user-visible strings in English (judges read English). Code comments
  in English. Project docs for the user (ENTRY.md) in Bahasa Indonesia.
- Accessibility: every control has a label, focus states are visible,
  color is never the only signal (status also has text + icon).
- Never store passwords. The account form has no password field on purpose.
- Never `eval()` user input; render user text with `textContent`, never
  `innerHTML` with user data.

## Browser support
Modern evergreen browsers (Chrome/Edge/Firefox/Safari, last 2 years).
Requires `crypto.subtle` for encrypted export — unavailable on plain
`http://` (non-localhost) origins; the app detects this and explains it,
falling back to plain JSON export.
