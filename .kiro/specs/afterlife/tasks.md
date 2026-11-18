# Tasks — Afterlife (Digital Legacy Planner)

- [x] 1. Project scaffolding
  - [x] 1.1 Create repo layout per steering/structure.md
  - [x] 1.2 Write steering docs (product, tech, structure)
  - [x] 1.3 Write spec (requirements, design, tasks)

- [x] 2. Pure logic (`js/logic.js`, UMD)
  - [x] 2.1 State factory, validation (`validateState`), localStorage load/save
  - [x] 2.2 Account CRUD + heir CRUD (incl. heir delete unassigns accounts)
  - [x] 2.3 Haunting Score (`computeScore`, `nextSteps`)
  - [x] 2.4 Check-in state machine (`checkInStatus`, `checkIn`)
  - [x] 2.5 Will-letter generation (`generateWillText`)
  - [x] 2.6 Encrypted export/import (`exportEncrypted`, `importEncrypted`)
        + plain export fallback

- [x] 3. Tests (`tests/test.js`)
  - [x] 3.1 Unit tests for 2.2–2.6
  - [x] 3.2 Property tests: score bounds + monotonicity; state machine
        never skips stages; crypto round-trip on random payloads
  - [x] 3.3 Run `node tests/test.js` — all green before UI work
        (25 passed, 0 failed, 18 Nov 2026)

- [x] 4. UI (`index.html`, `css/styles.css`, `js/app.js`, `js/seed.js`)
  - [x] 4.1 Shell + header with score dial + privacy badge
  - [x] 4.2 Graveyard: tombstone grid, filters, add/edit/delete
  - [x] 4.3 Heirs + will-letter printable view
  - [x] 4.4 Séance: interval picker, check-in button, moon countdown,
        release screen
  - [x] 4.5 Vault: encrypted export/import, demo seed, erase all
  - [x] 4.6 Print CSS + responsive layout + keyboard access

- [x] 5. Verification
  - [x] 5.1 `node tests/test.js` green (25/25)
  - [x] 5.2 Serve with `python3 -m http.server`, click through every flow
        with seed data (checklist in ENTRY.md) — done via jsdom DOM smoke
        test `tests/smoke-dom.js` (21/21) + manual checklist in ENTRY.md
  - [x] 5.3 Confirm zero network requests (no external fonts/scripts) —
        verified by grep 18 Nov 2026: no fetch/XHR/WebSocket, no external
        URLs in index.html/css/js

- [x] 6. Submission docs
  - [x] 6.1 README.md (English)
  - [x] 6.2 DEMO-SCRIPT.md (2-minute video script, English)
  - [x] 6.3 KIRO-USAGE.md (honest Kiro write-up, English)
  - [x] 6.4 LICENSE (MIT), .gitignore (never ignores .kiro/)
  - [x] 6.5 ENTRY.md (Bahasa Indonesia report + user checklist)

## Manual UI pass checklist (5.2)
1. Load demo seed → graveyard shows 8 fictional accounts, score > 0.
2. Add account → appears as tombstone; ghost marker until wish+heir set.
3. Add heir → assign to an account → ghost clears, score rises.
4. Filter "ghosts only" → only unplanned accounts remain.
5. Set check-in 7 days → status ok; simulate overdue via seed (see seed.js).
6. Generate will → letter lists heirs + accounts; print preview clean.
7. Encrypted export → import with right passphrase restores; wrong
   passphrase shows error and keeps data.
8. Erase everything → empty state, score 0, "graveyard is empty".
