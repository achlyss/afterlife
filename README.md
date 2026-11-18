# Afterlife — Your Digital Legacy Planner 🪦

> **One calm evening to answer: which accounts do I have, what should happen
> to each of them, and who should carry it out?**

Most people will die with dozens of online accounts and no plan for them.
Photos, money, subscriptions, and memories get locked behind passwords
nobody else knows — or linger forever as digital ghosts. **Afterlife** is a
local-first planner that fixes that, with a gentle graveyard metaphor that
makes an uncomfortable topic approachable:

- **🪦 The Graveyard** — your account inventory. Every account is a
  tombstone: give it a wish (delete / memorialize / transfer / keep) and an
  heir, and it rests in peace. Leave it blank and it wanders as a ghost.
- **🕯️ Heirs & The Will** — name the people you trust, assign them
  accounts, and generate a printable legacy letter.
- **🌕 The Séance** — a dead-man's check-in. Check in regularly to say
  "I'm still here"; miss it for too long and the plan moves, step by step,
  toward releasing your will to your heirs. **Simulation only** — Afterlife
  never sends anything by itself; the release screen shows exactly what
  *would* be shared.
- **📊 Haunting Score** — a 0–100 readiness score with concrete next steps.
  The higher the score, the fewer ghosts remain.
- **🔐 The Vault** — encrypted backup (AES-GCM, PBKDF2) you can store
  somewhere your heirs can find, plus plain JSON export/import.

**Privacy by design:** all data lives in your browser's localStorage. No
account, no server, no tracking, no analytics — the app makes **zero network
requests**. It never stores passwords: the planner records *wishes*, not
credentials.

Built for **Kiroween 2026** (Costume Contest category) using Kiro's
spec-driven development workflow. See [KIRO-USAGE.md](KIRO-USAGE.md) for
exactly how Kiro was used.

## Run it

No build step, no dependencies. Any static server works:

```sh
python3 -m http.server 8321
# open http://localhost:8321/
```

Or just double-click `index.html` — the app also works from `file://`.

**Try the demo instantly:** open `http://localhost:8321/#demo` — a fictional
graveyard (8 accounts, 2 heirs) loads automatically, or click
"👻 Load demo graveyard" in the Vault section.

## Test it

```sh
node tests/test.js          # 25 unit + property tests (zero dependencies)
```

DOM smoke test (loads the real app in jsdom and clicks through every flow):

```sh
npm install --no-save jsdom
python3 -m http.server 8321   # in another terminal, from the repo root
node tests/smoke-dom.js       # 21 checks
```

## How it works

- `js/logic.js` — pure logic (UMD: same file runs in the browser and in
  Node for tests): data model, validation, Haunting Score, check-in state
  machine (`ok → due → overdue → released`), will-letter generation,
  AES-GCM export/import.
- `js/app.js` — UI wiring only (DOM). No business rules live here.
- `js/seed.js` — fictional demo data.
- `.kiro/` — steering docs, the full spec (`requirements.md`, `design.md`,
  `tasks.md`), an on-save test hook, MCP config, and a custom reviewer
  agent. **Do not gitignore `.kiro/`** — it is part of the entry.

## Honest limits

- The check-in "release" is a **simulation**: it shows what would be sent,
  to whom, and when. Nothing is ever sent — there is no backend.
- The legacy letter is a **planning document, not a legal will**.
- Encrypted export needs a secure origin (`https` or `localhost`); on plain
  `http://` the app explains why and offers plain JSON export instead.

## License

MIT — see [LICENSE](LICENSE).
