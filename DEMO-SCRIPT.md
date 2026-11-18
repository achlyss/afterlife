# Demo video script — Afterlife (target: 2 minutes, hard limit 3 minutes)

Record at 1080p, screen + voiceover. No music, no third-party trademarks.
Open the app at `http://localhost:8321/#demo` so the fictional graveyard is
already loaded. Speak slowly; pause between beats.

## 0:00–0:15 — The hook (problem)
> "When you die, your accounts don't die with you. Your photos, your bank,
> your subscriptions — locked behind passwords nobody else knows, or
> haunting your family forever. Afterlife is a planner for your digital
> afterlife — and it takes one calm evening."
*(Show the header: moon, title, Haunting Score dial at 71, "4 ghosts".)*

## 0:15–0:50 — The Graveyard (core feature)
> "Every account is a tombstone. This one has a wish and an heir — it rests
> in peace. This one has neither — it's a ghost."
*(Click the "Ghosts only" filter — 4 ghosts remain. Open one ghost, give it
the wish "Transfer to heir", assign Ana, save. The ghost marker clears and
the score ticks up.)*
> "Give every account a wish and an heir, and the graveyard goes quiet."

## 0:50–1:15 — The Séance (the spooky one)
> "Then there's the Séance — a dead-man's check-in. I set it to every 30
> days. Right now it's due — the moon is almost full."
*(Show the moon phase and the "due" banner. Click "I'm still here" — status
goes calm. Then click "Demo: simulate 40 days without a check-in" — the
release screen appears.)*
> "If I ever stop checking in, this is exactly what would be shared with my
> heirs. Nothing is ever sent on its own — this is a simulation, so I can
> verify it while I'm alive to do so."

## 1:15–1:45 — The Will + The Vault (proof it is real)
> "One click generates my legacy letter — heirs, accounts, wishes, and my
> final message — ready to print."
*(Click "Generate the letter", scroll the letter, show the print button.)*
> "And the whole plan exports as an encrypted backup — AES-GCM, passphrase
> protected — to keep somewhere my heirs can find."
*(Type a passphrase, click "Download encrypted backup" — the file
downloads. Briefly show the wrong-passphrase error on import.)*

## 1:45–2:00 — Close (why it matters + Kiro)
> "Afterlife is local-first: no account, no server, your data never leaves
> this device — and it never stores passwords. I built it with Kiro's
> spec-driven workflow: the spec, the steering docs, and the tests all live
> in the .kiro folder. Lay your ghosts to rest — before they have to."
*(End on the full graveyard view, score visible.)*

## Shot list (checklist before recording)
- [ ] Fresh browser profile (empty localStorage) so `#demo` loads the seed.
- [ ] Zoom 100%, dark room lighting on screen, hide bookmarks bar.
- [ ] Do the full run once as rehearsal — the "simulate 40 days" beat
      changes state, so re-load `#demo` for the real take.
- [ ] Keep it under 3:00 — cut the Vault beat first if running long.
