/* Afterlife DOM smoke test (jsdom) — loads the real app over HTTP and
 * exercises the UI the way a judge would: seed, score, add account,
 * generate will, check in, export fallback.
 *
 * Requires jsdom (dev-only, not shipped): run once
 *   npm install --no-save jsdom
 * then start the app server and run:
 *   python3 -m http.server 8321   (from the repo root, in another terminal)
 *   node tests/smoke-dom.js
 */
'use strict';
const { JSDOM, VirtualConsole } = require('jsdom');

let pass = 0, fail = 0;
function check(name, cond, extra) {
  if (cond) { pass++; console.log('  ok  ' + name); }
  else { fail++; console.log('  FAIL ' + name + (extra ? ' — ' + extra : '')); }
}

(async () => {
  const errors = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', (e) => errors.push('jsdomError: ' + e.message));
  vc.on('error', (...a) => errors.push('console.error: ' + a.join(' ')));

  const dom = await JSDOM.fromURL('http://localhost:8321/index.html#demo', {
    resources: 'usable',
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    virtualConsole: vc,
    // jsdom does not implement <dialog> methods; polyfill minimal
    // open/close semantics so the app's dialog logic is exercised.
    beforeParse(window) {
      window.HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
      window.HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
      Object.defineProperty(window.HTMLDialogElement.prototype, 'open', {
        get() { return this.hasAttribute('open'); }
      });
    }
  });
  const { window } = dom;
  const { document } = window;
  await new Promise((r) => setTimeout(r, 800)); // let scripts + render settle

  check('no JS errors on load', errors.length === 0, errors.join(' | '));
  check('app scripts loaded (AfterlifeLogic present)', !!window.AfterlifeLogic);

  // Seed via #demo
  const cards = document.querySelectorAll('.grave-card');
  check('seed loaded: 8 tombstones', cards.length === 8, 'got ' + cards.length);
  const ghosts = document.querySelectorAll('.grave-card--ghost');
  check('4 ghosts in seed (a5 no heir, a6, a7 no heir, a8 no wish)', ghosts.length === 4, 'got ' + ghosts.length);
  check('heir list has 2 heirs', document.querySelectorAll('.heir-item').length === 2);
  check('score is 71 (30 wish + 16 heir + 15 hasHeir + 10 check-in)',
    document.getElementById('score-number').textContent === '71',
    'got ' + document.getElementById('score-number').textContent);
  check('séance status is "due" (28/30 days)',
    /due/i.test(document.getElementById('seance-status').textContent),
    document.getElementById('seance-status').textContent);

  // Filters
  document.getElementById('filter-ghosts').checked = true;
  document.getElementById('filter-ghosts').dispatchEvent(new window.Event('change', { bubbles: true }));
  check('ghosts-only filter shows 4 cards',
    document.querySelectorAll('.grave-card').length === 4);

  // Add an account through the dialog form
  document.getElementById('filter-ghosts').checked = false;
  document.getElementById('filter-ghosts').dispatchEvent(new window.Event('change', { bubbles: true }));
  document.getElementById('add-account-btn').click();
  check('dialog opens', document.getElementById('account-dialog').open === true);
  document.getElementById('acc-service').value = 'Spotify';
  document.getElementById('acc-username').value = 'maya.tunes';
  document.getElementById('acc-category').value = 'entertainment';
  document.getElementById('acc-wish').value = 'delete';
  document.getElementById('acc-notes').value = 'Cancel the family plan.';
  document.getElementById('account-form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  check('dialog closes after save', document.getElementById('account-dialog').open === false);
  check('9 tombstones after add', document.querySelectorAll('.grave-card').length === 9,
    'got ' + document.querySelectorAll('.grave-card').length);

  // Password guard in the UI path
  document.getElementById('add-account-btn').click();
  document.getElementById('acc-service').value = 'Evil Corp';
  document.getElementById('acc-username').value = 'x';
  document.getElementById('acc-notes').value = 'password: hunter2';
  document.getElementById('account-form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  check('password-like note rejected, dialog stays open',
    document.getElementById('account-dialog').open === true &&
    /password/i.test(document.getElementById('account-form-error').textContent));
  document.getElementById('account-form-cancel').click();

  // Generate will
  document.getElementById('will-author').value = 'Maya Rahmani';
  document.getElementById('will-message').value = 'Take care of each other.';
  document.getElementById('generate-will').click();
  const willEl = document.getElementById('will-output');
  check('will letter shown', willEl.style.display === 'block');
  check('will contains heir + account + disclaimer',
    /Ana Rahmani/.test(willEl.textContent) && /Gmail/.test(willEl.textContent) && /NOT a legal will/.test(willEl.textContent));
  // After adding Spotify (wish, no heir): 9 accounts → wish 31 + heir 14
  // + hasHeir 15 + check-in 10 = 70; will adds 5 → 75.
  check('score is 75 after will (70 + 5)',
    document.getElementById('score-number').textContent === '75',
    'got ' + document.getElementById('score-number').textContent);

  // Check in
  document.getElementById('checkin-btn').click();
  check('check-in resets status to ok',
    /calm/i.test(document.getElementById('seance-status').textContent),
    document.getElementById('seance-status').textContent);

  // Simulate missed check-ins → released screen
  document.getElementById('simulate-missed').click();
  check('release screen appears after simulated 40 days',
    document.getElementById('release-screen').style.display === 'block' &&
    /RELEASED/.test(document.getElementById('seance-status').textContent));
  check('release screen names an heir',
    /Ana Rahmani/.test(document.getElementById('release-body').textContent));

  // v2: CSV import through the preview dialog
  const csvText = 'service,username,category,importance,wish,heir,notes\n' +
    'Discord,maya.plays,entertainment,2,delete,,\n' +
    'Bad,baduser,bogus,3,delete,,\n';
  const csvFile = new window.File([csvText], 'import.csv', { type: 'text/csv' });
  const csvInput = document.getElementById('csv-file');
  Object.defineProperty(csvInput, 'files', { value: [csvFile], configurable: true });
  csvInput.dispatchEvent(new window.Event('change', { bubbles: true }));
  await new Promise((r) => setTimeout(r, 500)); // let FileReader finish
  check('CSV preview dialog opens',
    document.getElementById('csv-dialog').open === true);
  check('CSV preview shows 1 valid row',
    document.querySelectorAll('#csv-preview-body tr').length === 1,
    'got ' + document.querySelectorAll('#csv-preview-body tr').length);
  check('CSV preview lists 1 skipped row with the reason',
    document.querySelectorAll('#csv-skipped-list li').length === 1 &&
    /bogus|category/i.test(document.getElementById('csv-skipped-list').textContent));
  check('CSV confirm button says "Import 1 account"',
    /Import 1 account/.test(document.getElementById('csv-confirm-btn').textContent));
  document.getElementById('csv-confirm-btn').click();
  check('CSV dialog closes after import',
    document.getElementById('csv-dialog').open === false);
  check('10 tombstones after CSV import (9 + 1 valid row)',
    document.querySelectorAll('.grave-card').length === 10,
    'got ' + document.querySelectorAll('.grave-card').length);

  // v2: CSV template download does not throw
  let threwTemplate = null;
  try { document.getElementById('csv-template-btn').click(); } catch (e) { threwTemplate = e; }
  check('CSV template download click does not throw', threwTemplate === null, threwTemplate && threwTemplate.message);

  // v2: executor checklist
  document.getElementById('generate-checklist').click();
  const clEl = document.getElementById('checklist-output');
  check('checklist output shown', clEl.style.display === 'block');
  check('checklist contains disclaimer + heir + account',
    /NOT a legal/.test(clEl.textContent) && /Ana Rahmani/.test(clEl.textContent) &&
    /EXECUTOR CHECKLIST/.test(clEl.textContent) && /Discord/.test(clEl.textContent));
  check('checklist print button appears',
    document.getElementById('print-checklist').style.display !== 'none');

  // Encrypted export graceful fallback in jsdom (no crypto.subtle)
  check('encrypted export disabled without secure context, note shown',
    document.getElementById('export-encrypted').disabled === true &&
    /unavailable/i.test(document.getElementById('crypto-note').textContent));

  // Plain export produces a downloadable blob URL (no throw)
  let threw = null;
  try { document.getElementById('export-plain').click(); } catch (e) { threw = e; }
  check('plain export click does not throw', threw === null, threw && threw.message);

  // localStorage persisted
  const saved = JSON.parse(window.localStorage.getItem('afterlife.v1'));
  check('state persisted to localStorage (10 accounts)',
    saved && saved.accounts.length === 10, saved && ('accounts: ' + saved.accounts.length));

  console.log('\n' + pass + ' passed, ' + fail + ' failed.');
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
