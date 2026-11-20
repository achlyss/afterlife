# Requirements — Afterlife v2 (Digital Legacy Planner)

## Introduction
Afterlife v2 adds two features to the v1 planner without changing its
architecture or its state format (`afterlife.v1`, version 1): bulk account
import from CSV (R9) and an Executor Checklist for heirs (R10). Everything
in the v1 spec (`../afterlife/requirements.md`, R1–R8) still applies.
Local-first, zero network requests, never store passwords.

## Glossary (additions to v1)
- **CSV import**: adding many accounts at once from a comma-separated
  values file. One row = one account.
- **Preview**: the import plan shown to the user before anything is saved:
  every row marked valid or invalid, with the reason for each invalid row.
- **Executor Checklist**: a step-by-step document for the heirs, generated
  from the plan: first steps, actions per account grouped by wish, and
  work divided per heir.
- **Ghost** (v1): an account with no wish or no heir assigned.

## Requirements

### R9 — CSV import (The Graveyard)
- R9.1 WHEN the user imports a CSV file, THE SYSTEM SHALL expect the
  header `service,username,category,importance,wish,heir,notes` (column
  names matched case-insensitively; extra columns are ignored).
- R9.2 THE SYSTEM SHALL parse CSV correctly: quoted fields, commas inside
  quoted fields, doubled quotes (`""`) inside quoted fields, CRLF and LF
  line endings; empty lines are skipped.
- R9.3 WHEN the header is missing a required column, THE SYSTEM SHALL
  reject the file with an error naming the missing column(s), and SHALL NOT
  import anything.
- R9.4 WHEN a row has a different number of fields than the header, THE
  SYSTEM SHALL report that row as an error (with its line number) and
  SHALL NOT import that row.
- R9.5 THE SYSTEM SHALL validate every row with the same rules as a
  single account (`validateAccountInput`): service and username required;
  category and wish must be known values; importance must be 1–5;
  password-like text in notes is rejected. A row that fails validation
  SHALL be reported as an error (line number + reason) and SHALL NOT be
  imported.
- R9.6 WHEN the `heir` cell names an heir, THE SYSTEM SHALL match it to
  an existing heir by name (case-insensitive) or by email
  (case-insensitive). WHEN no heir matches, THE SYSTEM SHALL set the
  account's heir to none (the account becomes a ghost) and SHALL say so
  in the preview — it SHALL NOT invent a heir.
- R9.7 THE SYSTEM SHALL show a preview table of all rows before
  importing: each row with its parsed values, a valid/invalid mark, and
  the reason for invalid rows. THE SYSTEM SHALL import only after the
  user confirms, and SHALL import only the valid rows.
- R9.8 THE SYSTEM SHALL offer a downloadable CSV template with the
  expected header and two example rows.
- R9.9 WHEN the file contains an unterminated quoted field, THE SYSTEM
  SHALL reject the file with an error and SHALL NOT import anything.

### R10 — Executor Checklist (Heirs & The Will)
- R10.1 WHEN the user generates the Executor Checklist, THE SYSTEM SHALL
  produce a document from the current plan with three parts: (a) first
  steps — who to contact first and where the backup is kept; (b) actions
  per account grouped by wish (delete / memorialize / transfer / keep);
  (c) work divided per heir — which heir handles which accounts.
- R10.2 THE SYSTEM SHALL list accounts with no wish or no heir as
  unresolved ("ghosts") and SHALL say plainly that no instruction exists
  for them — it SHALL NOT invent instructions.
- R10.3 THE SYSTEM SHALL state on the checklist that it is a planning
  document, not a legal document, and does not replace legal advice.
- R10.4 THE SYSTEM SHALL show the checklist on screen and offer a print
  button (print / save as PDF), like the will letter.
- R10.5 THE SYSTEM SHALL NOT change the stored state when generating the
  checklist (it is a derived view; the Haunting Score is unaffected).
- R10.6 WHEN there are no heirs and no accounts, THE SYSTEM SHALL still
  generate a checklist that says the plan is empty and names the first
  steps to complete it — it SHALL NOT fail on an empty plan.
