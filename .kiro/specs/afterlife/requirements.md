# Requirements — Afterlife (Digital Legacy Planner)

## Introduction
Afterlife is a local-first web app that helps an adult plan what happens to
their online accounts after they die: an account inventory ("The Graveyard"),
heirs and dispositions ("The Will"), a dead-man's check-in ("The Séance"),
and a readiness score ("Haunting Score"). All data stays in the browser.
No backend, no account, no keys.

## Glossary
- **Account**: one online account/service the user wants planned (service,
  username, category, importance, wish, heir, notes).
- **Wish**: what should happen to an account — `delete`, `memorialize`,
  `transfer`, or `keep`.
- **Heir**: a person designated to carry out wishes (name, relationship,
  email, optional phone).
- **Ghost**: an account with no wish or no heir assigned.
- **Haunting Score**: 0–100 readiness score; 100 means no ghosts and every
  safety step done.
- **Check-in**: a periodic "I'm still here" confirmation. Missing it moves
  the plan through `ok → due → overdue → released` (simulation only).

## Requirements

### R1 — Account inventory (The Graveyard)
- R1.1 WHEN the user adds an account, THE SYSTEM SHALL require service name
  and username, and accept optional category, importance (1–5), wish, heir,
  and notes.
- R1.2 WHEN an account is saved, THE SYSTEM SHALL assign it a UUID and a
  creation timestamp.
- R1.3 WHEN the user edits or deletes an account, THE SYSTEM SHALL update
  or remove it and persist the change immediately.
- R1.4 WHEN the user filters by category, wish, or "ghosts only", THE SYSTEM
  SHALL show only matching accounts.
- R1.5 THE SYSTEM SHALL never offer a password field and SHALL reject any
  attempt to store a password in notes (warn, do not save passwords).

### R2 — Heirs (The Will)
- R2.1 WHEN the user adds an heir, THE SYSTEM SHALL require name and a
  valid-looking email address, and accept optional relationship and phone.
- R2.2 WHEN an heir is deleted, THE SYSTEM SHALL unassign them from all
  accounts (accounts become ghosts again) instead of deleting the accounts.
- R2.3 WHEN an account references a deleted heir, THE SYSTEM SHALL treat
  that account as having no heir.

### R3 — Haunting Score
- R3.1 THE SYSTEM SHALL compute a score from 0 to 100: 40 points for
  accounts with a wish, 25 for accounts with an heir, 15 for at least one
  heir existing, 10 for a check-in interval configured, 5 for a will
  letter generated at least once, 5 for an encrypted backup exported at
  least once.
- R3.2 WHEN there are no accounts, THE SYSTEM SHALL show score 0 with the
  message "Your graveyard is empty".
- R3.3 THE SYSTEM SHALL list the concrete next steps that would raise the
  score, in priority order.

### R4 — Dead-man's check-in (The Séance)
- R4.1 WHEN the user sets a check-in interval (7/14/30/90 days), THE SYSTEM
  SHALL record the interval and set last check-in to now.
- R4.2 WHEN the user checks in, THE SYSTEM SHALL reset the status to `ok`
  and record the new timestamp.
- R4.3 THE SYSTEM SHALL derive status from elapsed time: `ok` before the
  interval ends; `due` in the 3 days before the deadline; `overdue` after
  the deadline up to 7 days past it; `released` more than 7 days past it.
- R4.4 WHEN status becomes `released`, THE SYSTEM SHALL show the release
  screen: which heirs would be contacted and which account instructions
  would be shared — and SHALL state clearly that nothing was actually sent
  (simulation only).
- R4.5 THE SYSTEM SHALL never send email, SMS, or any network request for
  the check-in feature.

### R5 — Legacy letter (The Will document)
- R5.1 WHEN the user generates the will letter, THE SYSTEM SHALL produce a
  printable document listing heirs, every account with its wish and heir,
  and the user's final message.
- R5.2 THE SYSTEM SHALL include a disclaimer that the letter is a planning
  document, not a legal will.
- R5.3 THE SYSTEM SHALL mark the will as generated (for the score) and
  record the generation date.

### R6 — Encrypted export / import
- R6.1 WHEN the user exports with a passphrase, THE SYSTEM SHALL encrypt
  the full state with AES-GCM (PBKDF2, 100,000 iterations, random salt and
  IV) and download a `.afterlife.json` file.
- R6.2 WHEN the user imports a file with the correct passphrase, THE SYSTEM
  SHALL restore the state after validating its shape.
- R6.3 WHEN the passphrase is wrong or the file is corrupt, THE SYSTEM
  SHALL show an error and SHALL NOT overwrite existing data.
- R6.4 WHEN Web Crypto is unavailable (non-secure origin), THE SYSTEM SHALL
  explain why and offer plain JSON export instead.

### R7 — Seed data & erase
- R7.1 WHEN the user loads demo data, THE SYSTEM SHALL insert fictional
  accounts and heirs, clearly labeled as demo, only after confirmation if
  real data already exists.
- R7.2 WHEN the user erases everything, THE SYSTEM SHALL delete all local
  data after confirmation and return to the empty state.

### R8 — Privacy & honesty
- R8.1 THE SYSTEM SHALL make zero network requests at runtime.
- R8.2 THE SYSTEM SHALL store data only in localStorage under `afterlife.v1`.
- R8.3 THE SYSTEM SHALL display, on the main screen, that data never leaves
  the device.
