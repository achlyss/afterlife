# Design — Afterlife v2 (Digital Legacy Planner)

## Overview
v2 adds two features on top of the v1 two-layer architecture
(`js/logic.js` pure logic, `js/app.js` DOM wiring). No architecture
change, no state-format change, no network requests. The state stays
`afterlife.v1`, version 1; v2 reads and writes exactly the same shape,
so a plan saved by v1 loads unchanged in v2.

## R9 — CSV import

### CSV format
```
service,username,category,importance,wish,heir,notes
Gmail,me@example.com,social,5,transfer,Ana,"Give photos to Ana, delete the rest."
Netflix,me@example.com,entertainment,1,delete,,"Just cancel it."
```
- Header: the seven column names, matched case-insensitively and by name
  (column order does not matter). Extra columns are ignored. A missing
  required column is a whole-file error.
- `importance`: empty means "use the default (3)"; otherwise an integer
  1–5. Anything else is a row error.
- `category` / `wish`: empty means "none" (category defaults to `other`,
  wish defaults to null). Unknown values are row errors.
- `heir`: a name or an email. Empty means "no heir".
- `notes`: free text; the v1 password rule applies (R1.5).

### Parser (`parseCsv` in `js/logic.js`)
A small hand-rolled RFC 4180 subset parser, no dependencies:
- Fields may be quoted with `"`. Inside a quoted field, `""` is one
  literal quote and commas/newlines are data, not separators.
- Line endings CRLF and LF both end a record. A lone CR is treated as
  data. Line endings are normalized to `\n` before parsing.
- A record is an array of field strings. The parser returns
  `{ records, errors }`; `records` carry their starting line number
  (1-based, header = line 1) so errors can point at the file.
- An unterminated quoted field is a whole-file error (`errors` non-empty,
  `records` empty) — nothing is imported (R9.9).
- A record with a different field count than the header is reported by
  the planner, not the parser (the parser does not know the header).

### Planner (`parseCsvImport(text, state)`)
Pure function, does not touch `state`:
1. Parse with `parseCsv`. Whole-file errors → return them, no rows.
2. Read the header row; map each expected column name to its index.
   Missing column(s) → whole-file error naming them.
3. For each data record (skip records that are entirely empty):
   - Build the account input (trimmed strings; empty importance →
     undefined; empty wish/category/heir → null/default).
   - Match `heir` with `findHeirByNameOrEmail(state, value)`:
     name match is case-insensitive on the trimmed name; email match is
     case-insensitive on the trimmed email. First match wins. No match →
     `heirId: null` and `heirUnmatched: true` (the preview warns the user;
     the account becomes a ghost — never invent a heir).
   - Validate with `validateAccountInput`. Failure → row error
     `{ line, reason }`. Also check field count and importance parsing
     here (they need the header/row context).
   - Success → valid row `{ line, input, heirId, heirName, heirUnmatched }`.
4. Return `{ valid, errors }`. `errors` is a flat list of
   `{ line, reason }` sorted by line. Nothing is saved at this stage.

### Apply (`importCsvAccounts(state, validRows)`)
Appends each valid row with `addAccount` (which re-validates
defensively). Returns `{ added, accounts, errors }`; `errors` should be
empty in practice because the rows were already validated — if one does
fail, it is reported, not silently skipped. The UI saves the state once
after the call. Import is partial by design: valid rows are added,
invalid rows are not (the preview told the user which ones).

### Template (`csvTemplate()`)
Returns the header plus two example rows as text. The UI downloads it
as `afterlife-template.csv` with `text/csv`.

### UI flow (`js/app.js`, Graveyard section)
1. "Import CSV" button opens the hidden file picker (`.csv`).
2. File is read with `FileReader` as text → `L.parseCsvImport(text, state)`.
3. Whole-file error → shown in the import error line, nothing else.
4. Otherwise a `<dialog>` shows the preview table: line, service,
   username, wish, heir, status (✅ valid / ❌ reason). Rows whose heir
   did not match carry a ⚠️ note ("heir not found — will be a ghost").
5. "Import N accounts" confirms → `L.importCsvAccounts(state, valid)`,
   save, re-render, toast with the count. "Cancel" closes without saving.
6. "Download CSV template" downloads `L.csvTemplate()`.

## R10 — Executor Checklist

### Generator (`generateExecutorChecklist(state)`)
Pure function, returns a structured object (no state mutation):
```js
{
  generatedAt: ISO,
  firstSteps: [string, ...],
  byWish: { delete: [...], memorialize: [...], transfer: [...],
            keep: [...], none: [...] },   // each entry:
            // { service, username, heirName, notes }
  byHeir: [ { heir: { name, email, relationship, phone } | null,
              accounts: [ { service, username, wish, notes } ] } ],
  ghosts: [ { service, username, wish, heirName, notes } ]
}
```
- `firstSteps` (in order):
  1. Contact the first named heir (name + email) — or, if no heir is
     named, "Name an heir first — without one, nobody can act on this
     plan."
  2. Read the legacy letter (The Will) — it lists every account, wish,
     and heir.
  3. Find the encrypted Afterlife backup (the plan says where it is
     kept: USB stick, safe, or a trusted person — the checklist does
     NOT invent a location; it tells the heir to ask the family).
  4. Check the Séance status: if the plan was released, follow the
     release instructions.
  5. If ghosts exist: "Resolve N ghost(s) first — these accounts have
     no wish or no heir, so there is no instruction for them yet."
- `byWish` groups accounts by their wish; accounts with no wish go
  under `none` with the note "no wish set".
- `byHeir` groups accounts by assigned heir (in heir order, then
  accounts in graveyard order). Accounts with no heir go under
  `heir: null` ("No heir assigned").
- `ghosts` is the union of "no wish" and "no heir" accounts (the same
  rule as `isGhost`), listed so the family sees what is unresolved.
- An empty plan still produces a checklist: `firstSteps` says the plan
  is empty and lists the first steps to complete it (add accounts, name
  an heir, generate the will).

### Text rendering (`formatExecutorChecklist(state)`)
Returns the printable plain-text document (like `generateWillText`):
title, date, the "planning document, NOT a legal document" disclaimer,
first steps, actions grouped by wish, work per heir, unresolved ghosts,
closing line. Used for the on-screen `<pre>` and for print. It calls
`generateExecutorChecklist` internally and does not mutate state.

### UI flow (`js/app.js`, Heirs & The Will section)
Mirrors the will letter exactly: "Generate executor checklist" button →
text rendered into `#checklist-output` (paper-styled `<pre>`, same as the
will) → "Print / save as PDF" button appears → `window.print()` with a
`printing-checklist` body class; print CSS shows only the checklist.

### Print CSS
The existing print block hides everything except the will. v2 extends it:
`body.printing-checklist` hides everything except `#checklist-output`
(and its section heading is hidden too, like the will). The two print
modes are mutually exclusive by body class.

## CSS polish (v2)
- Keep the graveyard theme (same CSS variables, same fog, same serif
  headings). No structural HTML changes beyond the new controls.
- Mobile (≤640px): header stacks (already), score card full width
  (already); add: grave grid becomes one column, the seance moon shrinks,
  dialog padding shrinks, buttons in vault cards stretch full width.
- New breakpoint (≤480px): smaller h1/moon, tighter section padding,
  the CSV preview table scrolls horizontally (`.csv-preview` wrapper
  with `overflow-x: auto`).
- New components reuse existing tokens: `.csv-preview` table (dark,
  bone text, pumpkin for errors), `.checklist-output` reuses the will
  paper style.
- Print: extend the existing `@media print` block for the checklist.

## Testing (v2 additions, `tests/test.js`)
- `parseCsv`: quoted commas, doubled quotes, quoted newlines, CRLF,
  empty lines skipped, unterminated quote → error, field-count mismatch
  reported by the planner.
- `parseCsvImport`: valid rows; header missing a column; bad category /
  wish / importance; missing service/username; password in notes
  rejected; heir matched by name (case-insensitive) and by email;
  unmatched heir → `heirId: null` + `heirUnmatched: true`; line numbers
  correct after an empty line.
- `importCsvAccounts`: adds only valid rows; state validates afterwards.
- `generateExecutorChecklist`: first steps mention the first heir;
  grouping by wish; per-heir grouping; ghosts listed; empty plan still
  produces a checklist.
- `formatExecutorChecklist`: contains the not-a-legal-document
  disclaimer, heir names, account services.
- DOM smoke test (`tests/smoke-dom.js`): import a valid CSV through the
  dialog and confirm the tombstones appear; generate the checklist and
  confirm the output contains the disclaimer.
