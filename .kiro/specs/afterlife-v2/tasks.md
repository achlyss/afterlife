# Tasks — Afterlife v2 (Digital Legacy Planner)

- [x] 1. Spec (`.kiro/specs/afterlife-v2/`)
  - [x] 1.1 `requirements.md` — R9 CSV import, R10 Executor Checklist (EARS)
  - [x] 1.2 `design.md` — data model, CSV parser/planner, checklist shape, UI flows
  - [x] 1.3 `tasks.md` — this checklist

- [x] 2. Pure logic (`js/logic.js`, UMD — no DOM)
  - [x] 2.1 CSV parser `parseCsv(text)` — quoted fields, `""` escapes,
        CRLF/LF, empty lines skipped, unterminated quote = file error,
        records carry starting line numbers
  - [x] 2.2 `findHeirByNameOrEmail(state, value)` — name or email,
        case-insensitive, first match wins
  - [x] 2.3 `parseCsvImport(text, state)` — header check, per-row
        validation via `validateAccountInput`, per-row errors with line
        numbers, unmatched heir → `heirId: null` + `heirUnmatched: true`
  - [x] 2.4 `importCsvAccounts(state, validRows)` — append via
        `addAccount`, report added count + any apply-time errors
  - [x] 2.5 `csvTemplate()` — header + two example rows
  - [x] 2.6 `generateExecutorChecklist(state)` — firstSteps, byWish,
        byHeir, ghosts; empty plan still produces a checklist
  - [x] 2.7 `formatExecutorChecklist(state)` — printable text with the
        not-a-legal-document disclaimer; no state mutation

- [x] 3. Tests (`tests/test.js`)
  - [x] 3.1 Parser: quoted commas, doubled quotes, quoted newlines,
        CRLF, empty lines, unterminated quote
  - [x] 3.2 Planner: valid rows, bad header, bad category/wish/
        importance, missing service/username, password in notes
        rejected, heir match by name/email, unmatched heir, line numbers
  - [x] 3.3 Apply: only valid rows added, state still validates
  - [x] 3.4 Checklist: first steps, wish grouping, per-heir grouping,
        ghosts, empty plan, disclaimer in text
  - [x] 3.5 Run `node tests/test.js` — all green before UI work

- [x] 4. UI (`index.html`, `js/app.js`, `css/styles.css`)
  - [x] 4.1 Graveyard: "Import CSV" button + hidden file picker +
        "Download CSV template" button
  - [x] 4.2 CSV preview `<dialog>`: table of rows with valid/invalid
        status + reasons, heir-unmatched warning, confirm imports only
        valid rows
  - [x] 4.3 Heirs & The Will: "Generate executor checklist" button,
        paper-styled output, "Print / save as PDF" button
  - [x] 4.4 Print CSS: `printing-checklist` mode shows only the
        checklist (mirrors `printing-will`)
  - [x] 4.5 CSS polish: mobile ≤640px (single-column grid, smaller
        moon, full-width vault buttons) + ≤480px breakpoint (tighter
        padding, horizontal scroll for the preview table); keep the
        graveyard theme

- [x] 5. Verification
  - [x] 5.1 `node tests/test.js` green (v1 25 + v2 additions)
  - [x] 5.2 DOM smoke test (`tests/smoke-dom.js`, needs jsdom): CSV
        import through the dialog, checklist generation + disclaimer
  - [x] 5.3 `node --check` on all JS files
  - [x] 5.4 Confirm zero network requests (grep: no fetch/XHR/
        WebSocket, no external URLs in index.html/css/js)

- [x] 6. Submission docs
  - [x] 6.1 `KIRO-USAGE.md` — v2 section (new spec + features + how
        Kiro was used)
  - [x] 6.2 `README.md` — mention v2 features
  - [x] 6.3 `ENTRY.md` — record v2 done, 20 Nov 2026
