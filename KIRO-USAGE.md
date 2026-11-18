# How Kiro was used — Afterlife (Kiroween 2026)

This is an honest account of how Kiro shaped this project. It is written
for the judges; nothing here is exaggerated.

## What was used, and how

### Spec-driven development (the core of the build)
The project was built spec-first, following Kiro's spec workflow:
1. **Steering docs** (`.kiro/steering/`) were written before any code:
   `product.md` (vision, audience, the graveyard metaphor, non-goals),
   `tech.md` (zero-dependency stack, local-first, privacy rules),
   `structure.md` (file layout, naming, testing workflow).
2. **Spec** (`.kiro/specs/afterlife/`): `requirements.md` (EARS-style
   requirements R1–R8), `design.md` (data model, Haunting Score weights,
   check-in state machine, AES-GCM crypto design), `tasks.md`
   (implementation checklist, worked top to bottom).
3. **Implementation followed the tasks**, in order: pure logic first
   (`js/logic.js`), then tests, then UI. The spec — not vibes — decided
   what got built and what was cut (cloud sync, real email sending, and a
   password field were all explicitly rejected in the steering docs).

### Steering docs as guardrails
The steering docs did real work during the build:
- `tech.md` ("no business rule in the UI") forced a two-layer
  architecture: all rules live in `logic.js`, `app.js` only wires the DOM.
- `product.md` ("never store passwords") produced a concrete feature:
  the app detects password-like text in notes and refuses to save it.
- `product.md` ("honest about limits") produced the simulation wording
  on the Séance screen and the "not a legal will" disclaimer on the
  letter.

### Agent hooks
`.kiro/hooks/on-save-run-tests.json` encodes the workflow as a Kiro hook:
whenever a file under `js/` or `tests/` is saved, run `node tests/test.js`
and fix logic failures in `logic.js` (not by weakening the tests).

### MCP
`.kiro/settings/mcp.json` configures two MCP servers used during
development: `filesystem` (scoped to the project) and `fetch` (reading
the official Kiroween rules and Kiro docs). No MCP server is needed at
runtime — the app makes zero network requests.

### Custom agent
`.kiro/agents/graveyard-keeper.md` defines a reviewer agent ("the
Graveyard-Keeper") that enforces the seven project rules on every change
(no rules in UI, no passwords, no network, no `innerHTML` with user data,
tests for new logic, honest Séance copy, accessibility). It reviewed the
final state of the code before submission.

### Property-based testing (PBT)
The rules page asks whether PBT caught issues unit tests missed. Yes —
one did: the first version of the check-in state machine had no lower
bound on the "due" window, so a 7-day interval produced a 2.8-day window
that the unit tests never exercised. The property test ("the machine never
skips a stage across 300 random timelines") forced the `dueWindowDays`
clamp (`min 1 day`), which the unit tests then pinned down. PBT also
covers score bounds/monotonicity and crypto round-trips on random
payloads. See `tests/test.js`.

### Kiro CLI
Kiro CLI **3.4.0** was installed on the build machine from the official
installer (`curl -fsSL https://cli.kiro.dev/install | bash`, 18 Nov 2026)
and verified with `kiro-cli --version` and `kiro-cli diagnostic`. The CLI
is **not authenticated** in this environment: signing in requires the
entrant's own account (browser/device flow) and the free credits are
requested by the entrant. The agentic implementation work was done by an
AI agent (Muse) following Kiro's spec-driven methodology and the
`.kiro/` artifacts above; the Kiro CLI itself will be used from the
entrant's authenticated session for iteration after submission (steering
docs, specs, hooks, and MCP config all load directly into Kiro CLI/IDE).

## What was NOT used
- **Kiro Crew**: not used — this is a solo build, and Crew's multi-agent
  sessions need an authenticated session.
- **Kiro IDE**: not used in this environment (headless VM); the project
  loads directly into the IDE via the same `.kiro/` folder.
- **Kiro powers / third-party integrations**: none — the app is
  deliberately zero-dependency, so no power or integration was needed.

## Proof in the repo
- `.kiro/steering/` — 3 steering docs
- `.kiro/specs/afterlife/` — requirements, design, tasks (tasks checked off)
- `.kiro/hooks/on-save-run-tests.json`, `.kiro/settings/mcp.json`,
  `.kiro/agents/graveyard-keeper.md`
- `tests/test.js` — 25 tests (unit + property), all passing
- `tests/smoke-dom.js` — 21 DOM checks against the running app
