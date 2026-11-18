# Structure Steering — Afterlife

## File layout
```
afterlife/
├── index.html                  # Single-page app shell
├── css/styles.css              # All styling (dark graveyard theme)
├── js/
│   ├── logic.js                # Pure logic (UMD: browser + Node)
│   ├── seed.js                 # Demo seed data (fictional)
│   └── app.js                  # UI wiring (DOM only)
├── tests/
│   ├── test.js                 # Node tests (assert + mini property harness)
│   └── run-tests.sh            # `node tests/test.js`
├── .kiro/
│   ├── steering/               # product.md, tech.md, structure.md
│   ├── specs/afterlife/        # requirements.md, design.md, tasks.md
│   ├── hooks/                  # on-save-run-tests.json
│   ├── settings/mcp.json       # MCP server configuration
│   └── agents/graveyard-keeper.md  # custom reviewer agent
├── README.md                   # Judges + users (English)
├── DEMO-SCRIPT.md              # 2-minute demo video script (English)
├── KIRO-USAGE.md               # How Kiro was used (English, for Devpost)
├── LICENSE                     # MIT
└── .gitignore                  # Never ignores .kiro/
```

## Naming
- Functions: `verbNoun` (`computeScore`, `addAccount`, `transitionCheckIn`).
- State shape keys: `accounts`, `heirs`, `checkIn`, `meta`.
- CSS classes: BEM-ish, short (`grave-card`, `grave-card__name`,
  `btn--danger`). Theme tokens as CSS variables (`--bone`, `--moss`,
  `--pumpkin`, `--fog`).

## Testing workflow (also encoded as a Kiro hook)
1. Change `logic.js` → run `node tests/test.js` before touching the UI.
2. Change UI → open the app, load seed data, click through every flow
   (add/edit/delete account, add heir, assign, check-in, generate will,
   export/import, erase).
3. Every feature ships with at least one test in `tests/test.js`.

## Git discipline (for the repo the user will create)
- One commit per tasks.md item, message in English, e.g.
  `feat: add Haunting Score computation + tests`.
- Never commit real personal data. Seed data is fictional by design.
