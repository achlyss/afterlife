# Product Steering — Afterlife (Digital Legacy Planner)

## Vision
Most people will die with dozens of online accounts and no plan for them.
Photos, money, subscriptions, and memories get locked behind passwords nobody
else knows — or linger forever as digital ghosts. **Afterlife** is a
local-first planner that helps any adult answer, in one calm evening:
*which accounts do I have, what should happen to each of them, and who should
carry it out?*

## Audience
- Any adult with online accounts (effectively everyone).
- People who find estate planning intimidating, morbid, or expensive — the
  app makes it approachable with a gentle, lightly spooky graveyard metaphor.
- Privacy-conscious users: the plan contains the keys to a person's digital
  life, so it must never leave their device unless they explicitly export it.

## The metaphor (theme must enhance function, not decorate it)
- **The Graveyard** = the account inventory. Every account is a tombstone:
  engraved with its name, resting in a plot. A tidy graveyard means a tidy
  afterlife.
- **Ghosts** = accounts with no plan. A ghost is an account that will haunt
  your family — no wish, no heir, no instructions. The app's job is to lay
  every ghost to rest.
- **The Will** = the legacy letter. Heirs, dispositions, and a final message,
  generated as a printable document.
- **The Séance** = the dead-man's check-in. A regular "I'm still here"
  check-in; miss it for too long and the app moves, step by step, toward
  releasing the will to your heirs (demo mode: it shows what would be
  released, it never sends anything by itself).
- **The Haunting Score** = a 0–100 readiness score. The higher the score,
  the fewer ghosts remain.

## Product principles
1. **Local-first, private by default.** All data lives in the browser's
   localStorage. No account, no server, no tracking, no analytics.
2. **No real secrets on screen by default.** Passwords are never stored —
   the planner records *what should happen*, not credentials. Notes are for
   instructions ("delete it", "give photos to Ana"), not passwords.
3. **Honest about limits.** The check-in release is a *simulation* in this
   version: it shows exactly what would be sent, to whom, and when. It never
   sends email on its own. The README says so plainly.
4. **Complete in one sitting.** A user should go from zero to a printed will
   in under 15 minutes. Seed demo data exists so judges can see a full
   graveyard in one click.
5. **Accessible, not just atmospheric.** Dark theme with bone-white text,
   contrast-checked, keyboard navigable, works without a mouse.

## Non-goals
- Not a password manager. Not a legal will (the letter is a planning
  document, not a legal instrument — the app says so on the letter itself).
- No cloud sync, no sharing links, no social features.
- No real email/SMS sending (would require a backend and API keys).
