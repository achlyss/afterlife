# Design — Afterlife (Digital Legacy Planner)

## Overview
A single-page app with zero dependencies. Two layers: pure logic
(`js/logic.js`, UMD so Node tests import the same code the browser runs)
and UI wiring (`js/app.js`). State is one JSON document in localStorage.

## Data model
```js
state = {
  version: 1,
  accounts: [
    { id, service, username, category, importance: 1-5,
      wish: "delete"|"memorialize"|"transfer"|"keep"|null,
      heirId: string|null, notes: string, createdAt, updatedAt }
  ],
  heirs: [
    { id, name, relationship, email, phone, createdAt }
  ],
  checkIn: { intervalDays: 7|14|30|90|null, lastCheckInAt: ISO|null },
  meta: { willGeneratedAt: ISO|null, backupExportedAt: ISO|null,
          seedLoaded: boolean }
}
```
Categories: `social`, `money`, `photos`, `work`, `entertainment`,
`shopping`, `other`. Wishes: `delete` (close it), `memorialize` (keep as a
memorial), `transfer` (hand it to the heir), `keep` (leave it running).

## Haunting Score (R3)
Weights (total 100): wish coverage 40, heir coverage 25, at least one heir
15, check-in configured 10, will generated 5, backup exported 5.
Coverage fractions use accounts with a wish / with an heir, rounded to the
nearest integer. Empty graveyard → 0 with a dedicated message.
`nextSteps(state)` returns missing improvements in priority order
(wish → heir → check-in → will → backup).

## Check-in state machine (R4)
Derived purely from `now - lastCheckInAt` vs `intervalDays`:
- `ok`: elapsed < interval − 3 days (or no interval configured → `unset`)
- `due`: interval − 3 days ≤ elapsed < interval
- `overdue`: interval ≤ elapsed < interval + 7 days
- `released`: elapsed ≥ interval + 7 days
Short intervals (7 days) clamp the "due" window to at least 1 day. The
machine is a pure function `checkInStatus(state, now)` — fully testable.
Release is display-only: the release screen lists heirs + instructions
that *would* be sent. Nothing is sent. Ever.

## Crypto (R6)
- Export envelope: `{ magic: "AFTERLIFE1", salt, iv, data }` (base64).
- KDF: PBKDF2-SHA-256, 100,000 iterations, 16-byte random salt → AES-GCM
  256-bit key. 12-byte random IV per export.
- Import validates `magic`, decrypts, `JSON.parse`s, then validates shape
  with `validateState()` (version, arrays, required fields). Any failure →
  error, existing state untouched.
- `crypto.subtle` requires a secure context. On plain `http://` the app
  detects the absence and offers plain JSON export with a clear warning
  that it is unencrypted.

## UI structure (index.html)
- Header: moon + title + Haunting Score dial (SVG arc) + privacy badge.
- Section 1 — The Graveyard: filter bar (category, wish, ghosts-only),
  tombstone card grid, "Add account" form (modal or inline panel).
- Section 2 — Heirs & The Will: heir list + form; "Generate will letter"
  → printable view (`window.print()` with print CSS).
- Section 3 — The Séance: interval picker, big check-in button, moon-phase
  countdown, status banner; release screen when `released`.
- Section 4 — Vault: encrypted export/import, plain export, load demo
  data, erase everything.
- Footer: honesty note (local-only, simulation, not a legal will).

## Visual design
Dark graveyard: background `#0d0f1a` → `#171a2e` gradient, fog via radial
gradients; bone `#ece5d3`, moss `#7fa36a`, pumpkin `#e8823a` (accents
only), blood moon `#d64545` for danger states. Tombstone cards: rounded
top (`border-radius: 50% 50% 0 0` on the stone cap), engraved serif
headings (Georgia, 'Times New Roman', serif), sans body (system stack).
Ghost accounts get a 👻 marker + dashed border; resting accounts get a
small 🕯️. Status is always text + icon, never color alone.

## Testing strategy
- `tests/test.js` (Node, no deps): unit tests for score, state machine,
  validation, letter generation, crypto round-trip; plus a mini
  property-based harness (`forAll`) asserting score ∈ [0,100], score
  monotonic in wish/heir coverage, and the state machine never skipping
  stages across random timelines.
- Manual UI pass checklist in `tasks.md` (seed → every flow → export/
  import → erase), done in a real browser before submit.
