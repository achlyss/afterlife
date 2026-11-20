/* Afterlife tests — Node, zero dependencies.
 * Run: node tests/test.js   (exit 0 = all green)
 */
'use strict';
const assert = require('assert');
const L = require('../js/logic.js');

let passed = 0, failed = 0;
const failures = [];

function test(name, fn) {
  try {
    const r = fn();
    if (r && typeof r.then === 'function') return r.then(
      () => { passed++; console.log('  ok  ' + name); },
      (e) => { failed++; failures.push(name + ': ' + e.message); console.log('  FAIL ' + name + ' — ' + e.message); }
    );
    passed++;
    console.log('  ok  ' + name);
  } catch (e) {
    failed++;
    failures.push(name + ': ' + e.message);
    console.log('  FAIL ' + name + ' — ' + e.message);
  }
  return Promise.resolve();
}

/* Tiny deterministic PRNG (mulberry32) for property tests. */
function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* Mini property harness: run `fn(rand, i)` N times; any throw = failure. */
function forAll(name, n, seed, fn) {
  return test('property: ' + name, () => {
    const rand = rng(seed);
    for (let i = 0; i < n; i++) fn(rand, i);
  });
}

function stateWith(nAccounts, withWish, withHeir) {
  const s = L.emptyState();
  s.heirs.push({ id: 'h1', name: 'Ana', relationship: 'Sister', email: 'ana@example.com', phone: '', createdAt: '2026-01-01T00:00:00.000Z' });
  for (let i = 0; i < nAccounts; i++) {
    s.accounts.push({
      id: 'a' + i, service: 'Service ' + i, username: 'user' + i,
      category: 'social', importance: 3,
      wish: i < withWish ? 'delete' : null,
      heirId: i < withHeir ? 'h1' : null,
      notes: '', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z'
    });
  }
  return s;
}

async function main() {
  console.log('Afterlife tests\n');

  console.log('— state & validation');
  await test('emptyState validates', () => assert.strictEqual(L.validateState(L.emptyState()), true));
  await test('validateState rejects garbage', () => {
    assert.strictEqual(L.validateState(null), false);
    assert.strictEqual(L.validateState({}), false);
    assert.strictEqual(L.validateState({ version: 2, accounts: [], heirs: [], checkIn: {}, meta: {} }), false);
    const bad = L.emptyState(); bad.accounts.push({ id: 'x' });
    assert.strictEqual(L.validateState(bad), false);
  });

  console.log('— accounts');
  await test('addAccount requires service + username', () => {
    const s = L.emptyState();
    assert.strictEqual(L.addAccount(s, { service: '', username: 'u' }).ok, false);
    assert.strictEqual(L.addAccount(s, { service: 'Gmail', username: '' }).ok, false);
    const r = L.addAccount(s, { service: 'Gmail', username: 'me@example.com' });
    assert.strictEqual(r.ok, true);
    assert.strictEqual(s.accounts.length, 1);
    assert.ok(r.account.id);
  });
  await test('addAccount refuses password-like notes (R1.5)', () => {
    const s = L.emptyState();
    assert.strictEqual(L.notesContainPassword('password: hunter2'), true);
    assert.strictEqual(L.notesContainPassword('pwd=abc123'), true);
    assert.strictEqual(L.notesContainPassword('Delete it after I am gone'), false);
    const r = L.addAccount(s, { service: 'Gmail', username: 'u', notes: 'password: hunter2' });
    assert.strictEqual(r.ok, false);
    assert.strictEqual(s.accounts.length, 0);
  });
  await test('updateAccount + deleteAccount', () => {
    const s = L.emptyState();
    const r = L.addAccount(s, { service: 'Gmail', username: 'u' });
    const id = r.account.id;
    const u = L.updateAccount(s, id, { wish: 'delete' });
    assert.strictEqual(u.ok, true);
    assert.strictEqual(u.account.wish, 'delete');
    assert.strictEqual(L.deleteAccount(s, id), true);
    assert.strictEqual(s.accounts.length, 0);
    assert.strictEqual(L.deleteAccount(s, id), false);
  });
  await test('isGhost: no wish or no heir = ghost', () => {
    const s = stateWith(3, 1, 1);
    assert.strictEqual(L.isGhost(s, s.accounts[0]), false); // wish + heir
    assert.strictEqual(L.isGhost(s, s.accounts[1]), true);  // no wish, no heir
    assert.strictEqual(L.isGhost(s, s.accounts[2]), true);
  });
  await test('filterAccounts: ghostsOnly + category + query', () => {
    const s = stateWith(4, 2, 2);
    s.accounts[0].category = 'money';
    assert.strictEqual(L.filterAccounts(s, { ghostsOnly: true }).length, 2);
    assert.strictEqual(L.filterAccounts(s, { category: 'money' }).length, 1);
    assert.strictEqual(L.filterAccounts(s, { query: 'service 3' }).length, 1);
  });

  console.log('— heirs');
  await test('addHeir validates email', () => {
    const s = L.emptyState();
    assert.strictEqual(L.addHeir(s, { name: 'Ana', email: 'not-an-email' }).ok, false);
    assert.strictEqual(L.addHeir(s, { name: '', email: 'a@b.co' }).ok, false);
    assert.strictEqual(L.addHeir(s, { name: 'Ana', email: 'ana@example.com' }).ok, true);
  });
  await test('deleteHeir unassigns accounts (R2.2)', () => {
    const s = stateWith(2, 2, 2);
    assert.strictEqual(L.deleteHeir(s, 'h1'), true);
    assert.strictEqual(s.accounts[0].heirId, null);
    assert.strictEqual(L.isGhost(s, s.accounts[0]), true);
  });

  console.log('— Haunting Score');
  await test('empty graveyard scores 0', () => {
    const r = L.computeScore(L.emptyState());
    assert.strictEqual(r.score, 0);
    assert.strictEqual(r.empty, true);
  });
  await test('full coverage scores 100', () => {
    const s = stateWith(4, 4, 4);
    s.checkIn.intervalDays = 30;
    s.meta.willGeneratedAt = '2026-01-01T00:00:00.000Z';
    s.meta.backupExportedAt = '2026-01-01T00:00:00.000Z';
    assert.strictEqual(L.computeScore(s).score, 100);
  });
  await test('partial coverage scores in between', () => {
    const s = stateWith(4, 2, 2); // wish 20 + heir ~13 (rounded) + hasHeir 15 = 48
    const r = L.computeScore(s);
    assert.ok(r.score > 0 && r.score < 100, 'got ' + r.score);
    assert.strictEqual(r.parts.wish, 20);
    assert.strictEqual(r.parts.hasHeir, 15);
  });
  await test('nextSteps lists concrete actions', () => {
    const steps = L.nextSteps(L.emptyState());
    assert.ok(steps.length >= 1 && /first account/i.test(steps[0]));
    const s = stateWith(2, 0, 0);
    const steps2 = L.nextSteps(s);
    assert.ok(steps2.some((x) => /wish/i.test(x)));
    assert.ok(steps2.some((x) => /heir/i.test(x)));
  });

  console.log('— check-in state machine');
  await test('status progression ok → due → overdue → released', () => {
    const s = L.emptyState();
    assert.strictEqual(L.checkInStatus(s), 'unset');
    s.checkIn.intervalDays = 30;
    const t0 = Date.parse('2026-11-01T00:00:00.000Z');
    s.checkIn.lastCheckInAt = '2026-11-01T00:00:00.000Z';
    const D = L._DAY_MS;
    assert.strictEqual(L.checkInStatus(s, t0 + 10 * D), 'ok');
    assert.strictEqual(L.checkInStatus(s, t0 + 28 * D), 'due');      // 2 days left
    assert.strictEqual(L.checkInStatus(s, t0 + 30 * D), 'overdue');  // deadline day
    assert.strictEqual(L.checkInStatus(s, t0 + 36 * D), 'overdue');  // 6 days past
    assert.strictEqual(L.checkInStatus(s, t0 + 37 * D), 'released'); // 7 days past
    assert.strictEqual(L.checkInStatus(s, t0 + 90 * D), 'released');
  });
  await test('short interval (7d) still has a due window', () => {
    const s = L.emptyState();
    s.checkIn.intervalDays = 7;
    const t0 = Date.parse('2026-11-01T00:00:00.000Z');
    s.checkIn.lastCheckInAt = '2026-11-01T00:00:00.000Z';
    const D = L._DAY_MS;
    assert.strictEqual(L.checkInStatus(s, t0 + 5 * D), 'due');
    assert.strictEqual(L.checkInStatus(s, t0 + 7 * D), 'overdue');
    assert.strictEqual(L.checkInStatus(s, t0 + 14 * D), 'released');
  });
  await test('setCheckInInterval validates + checkInNow resets', () => {
    const s = L.emptyState();
    assert.strictEqual(L.setCheckInInterval(s, 5).ok, false);
    assert.strictEqual(L.checkInNow(s).ok, false);
    assert.strictEqual(L.setCheckInInterval(s, 30).ok, true);
    assert.strictEqual(L.checkInStatus(s), 'ok');
    assert.ok(L.nextCheckInAt(s));
  });

  console.log('— will letter');
  await test('generateWillText lists heirs + accounts + disclaimer', () => {
    const s = stateWith(2, 2, 2);
    const text = L.generateWillText(s, 'Imam', 'Take care of each other.');
    assert.ok(/MY DIGITAL WILL/.test(text));
    assert.ok(/NOT a legal will/.test(text));
    assert.ok(/Ana/.test(text));
    assert.ok(/Service 0/.test(text));
    assert.ok(/Take care of each other/.test(text));
    assert.ok(s.meta.willGeneratedAt);
  });

  console.log('— CSV import (R9)');
  const CSV_HEADER_LINE = 'service,username,category,importance,wish,heir,notes';
  await test('parseCsv: basic rows + header', () => {
    const r = L.parseCsv(CSV_HEADER_LINE + '\nGmail,u1,social,3,delete,,\nNetflix,u2,entertainment,1,delete,,');
    assert.strictEqual(r.errors.length, 0);
    assert.strictEqual(r.records.length, 3);
    assert.deepStrictEqual(r.records[0].fields, ['service', 'username', 'category', 'importance', 'wish', 'heir', 'notes']);
    assert.strictEqual(r.records[1].line, 2);
    assert.deepStrictEqual(r.records[2].fields, ['Netflix', 'u2', 'entertainment', '1', 'delete', '', '']);
  });
  await test('parseCsv: quoted commas + doubled quotes + quoted newline', () => {
    const r = L.parseCsv(CSV_HEADER_LINE + '\nGmail,u1,social,3,delete,,"Give photos to Ana, then delete."\nSteam,gamer,entertainment,2,keep,,"Say ""hi"" to Ana"\nA,u,social,3,delete,,"line one\nline two"\nB,u2,social,3,delete,,');
    assert.strictEqual(r.errors.length, 0, r.errors.join('; '));
    assert.strictEqual(r.records[1].fields[6], 'Give photos to Ana, then delete.');
    assert.strictEqual(r.records[2].fields[6], 'Say "hi" to Ana');
    assert.strictEqual(r.records[3].fields[6], 'line one\nline two');
    assert.strictEqual(r.records[3].line, 4);
    assert.strictEqual(r.records[4].line, 6); // the quoted newline consumed line 5
  });
  await test('parseCsv: CRLF endings + BOM + empty lines', () => {
    const r = L.parseCsv('\uFEFF' + CSV_HEADER_LINE + '\r\nGmail,u1,social,3,delete,,\r\n\r\nNetflix,u2,entertainment,1,delete,,\r\n');
    assert.strictEqual(r.errors.length, 0);
    assert.strictEqual(r.records[0].fields[0], 'service'); // BOM stripped
    assert.strictEqual(r.records[1].fields[0], 'Gmail');
    assert.strictEqual(r.records[2].fields.length, 1); // the empty line is one empty field
    assert.strictEqual(r.records[3].fields[0], 'Netflix');
  });
  await test('parseCsv: unterminated quote is a file error', () => {
    const r = L.parseCsv(CSV_HEADER_LINE + '\nGmail,u1,social,3,delete,,"never closed');
    assert.strictEqual(r.records.length, 0);
    assert.strictEqual(r.errors.length, 1);
    assert.ok(/Unterminated/.test(r.errors[0]));
  });
  await test('parseCsvImport: valid rows, heir matched by name', () => {
    const s = stateWith(0, 0, 0); // heir Ana (ana@example.com) exists
    const csv = CSV_HEADER_LINE + '\nGmail,me@example.com,social,5,transfer,Ana,"Give photos to Ana."\nNetflix,me@example.com,entertainment,1,delete,,';
    const res = L.parseCsvImport(csv, s);
    assert.strictEqual(res.errors.length, 0, JSON.stringify(res.errors));
    assert.strictEqual(res.valid.length, 2);
    assert.strictEqual(res.valid[0].heirId, 'h1');
    assert.strictEqual(res.valid[0].heirName, 'Ana');
    assert.strictEqual(res.valid[0].heirUnmatched, false);
    assert.strictEqual(res.valid[1].heirId, null);
    assert.strictEqual(res.valid[0].input.wish, 'transfer');
    assert.strictEqual(res.valid[0].input.importance, 5);
  });
  await test('parseCsvImport: heir matched by email, case-insensitive', () => {
    const s = stateWith(0, 0, 0);
    const csv = CSV_HEADER_LINE + '\nGmail,u,social,3,transfer,ANA@EXAMPLE.COM,\nSteam,g,entertainment,2,keep,ana,';
    const res = L.parseCsvImport(csv, s);
    assert.strictEqual(res.errors.length, 0, JSON.stringify(res.errors));
    assert.strictEqual(res.valid[0].heirId, 'h1');
    assert.strictEqual(res.valid[1].heirId, 'h1'); // lowercase name matches too
  });
  await test('parseCsvImport: unmatched heir → null + flag, still valid', () => {
    const s = stateWith(0, 0, 0);
    const csv = CSV_HEADER_LINE + '\nGmail,u,social,3,transfer,Stranger,';
    const res = L.parseCsvImport(csv, s);
    assert.strictEqual(res.errors.length, 0);
    assert.strictEqual(res.valid.length, 1);
    assert.strictEqual(res.valid[0].heirId, null);
    assert.strictEqual(res.valid[0].heirUnmatched, true);
  });
  await test('parseCsvImport: bad header (missing column) rejects the file', () => {
    const s = L.emptyState();
    const res = L.parseCsvImport('service,username,category,importance,wish,notes\nGmail,u,social,3,delete,', s);
    assert.strictEqual(res.valid.length, 0);
    assert.strictEqual(res.errors.length, 1);
    assert.ok(/heir/.test(res.errors[0].reason));
  });
  await test('parseCsvImport: per-row errors carry line numbers', () => {
    const s = L.emptyState();
    const csv = CSV_HEADER_LINE + '\nGmail,u1,social,3,delete,,\n\nBad,baduser,bogus,3,delete,,\nNoUser,,social,3,delete,,\nBadWish,u,social,3,explode,,\nBadImp,u,social,abc,delete,,\nBadImp2,u,social,9,delete,,';
    const res = L.parseCsvImport(csv, s);
    assert.strictEqual(res.valid.length, 1, JSON.stringify(res));
    assert.strictEqual(res.errors.length, 5, JSON.stringify(res.errors));
    assert.deepStrictEqual(res.errors.map((e) => e.line), [4, 5, 6, 7, 8]);
    assert.ok(/category/i.test(res.errors[0].reason));
    assert.ok(/Username is required/.test(res.errors[1].reason));
    assert.ok(/wish/i.test(res.errors[2].reason));
    assert.ok(/Importance/.test(res.errors[3].reason));
    assert.ok(/Importance/.test(res.errors[4].reason));
  });
  await test('parseCsvImport: password in notes rejected, field-count mismatch', () => {
    const s = L.emptyState();
    const csv = CSV_HEADER_LINE + '\nGmail,u,social,3,delete,,"password: hunter2"\nShort,u,social,3,delete';
    const res = L.parseCsvImport(csv, s);
    assert.strictEqual(res.valid.length, 0);
    assert.strictEqual(res.errors.length, 2);
    assert.ok(/password/i.test(res.errors[0].reason));
    assert.ok(/columns/.test(res.errors[1].reason));
  });
  await test('parseCsvImport: empty file is a file error', () => {
    const res = L.parseCsvImport('', L.emptyState());
    assert.strictEqual(res.valid.length, 0);
    assert.strictEqual(res.errors.length, 1);
    assert.strictEqual(res.errors[0].line, 0);
  });
  await test('csvTemplate has the header + example rows', () => {
    const t = L.csvTemplate();
    assert.ok(t.startsWith(CSV_HEADER_LINE + '\n'));
    assert.ok(/Gmail/.test(t) && /Netflix/.test(t));
    const res = L.parseCsvImport(t, stateWith(0, 0, 0));
    assert.strictEqual(res.errors.length, 0, JSON.stringify(res.errors));
    assert.strictEqual(res.valid.length, 2);
  });
  await test('importCsvAccounts: adds only valid rows', () => {
    const s = stateWith(0, 0, 0);
    const csv = CSV_HEADER_LINE + '\nGmail,u1,social,3,delete,,\nBad,baduser,bogus,3,delete,,\nSteam,gamer,entertainment,2,keep,Ana,';
    const plan = L.parseCsvImport(csv, s);
    assert.strictEqual(plan.valid.length, 2);
    const res = L.importCsvAccounts(s, plan.valid);
    assert.strictEqual(res.added, 2);
    assert.strictEqual(res.errors.length, 0);
    assert.strictEqual(s.accounts.length, 2);
    assert.strictEqual(s.accounts[1].heirId, 'h1');
    assert.strictEqual(L.validateState(s), true);
    const empty = L.importCsvAccounts(s, []);
    assert.strictEqual(empty.added, 0);
    assert.strictEqual(s.accounts.length, 2);
  });

  console.log('— executor checklist (R10)');
  function checklistState() {
    const s = L.emptyState();
    s.heirs.push(
      { id: 'h1', name: 'Ana', relationship: 'Sister', email: 'ana@example.com', phone: '', createdAt: '2026-01-01T00:00:00.000Z' },
      { id: 'h2', name: 'Budi', relationship: 'Husband', email: 'budi@example.com', phone: '+62 800', createdAt: '2026-01-01T00:00:00.000Z' }
    );
    s.accounts.push(
      { id: 'a1', service: 'Gmail', username: 'u1', category: 'social', importance: 5, wish: 'transfer', heirId: 'h1', notes: 'Photos to Ana.', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
      { id: 'a2', service: 'Instagram', username: 'u2', category: 'social', importance: 3, wish: 'memorialize', heirId: 'h1', notes: '', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
      { id: 'a3', service: 'Bank', username: 'u3', category: 'money', importance: 5, wish: 'transfer', heirId: 'h2', notes: '', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
      { id: 'a4', service: 'Netflix', username: 'u4', category: 'entertainment', importance: 1, wish: 'delete', heirId: null, notes: '', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
      { id: 'a5', service: 'Steam', username: 'u5', category: 'entertainment', importance: 2, wish: null, heirId: null, notes: '', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }
    );
    return s;
  }
  await test('generateExecutorChecklist: first steps name the first heir', () => {
    const c = L.generateExecutorChecklist(checklistState());
    assert.ok(/Ana/.test(c.firstSteps[0]) && /ana@example.com/.test(c.firstSteps[0]));
    assert.ok(c.firstSteps.some((s) => /legacy letter/i.test(s)));
    assert.ok(c.firstSteps.some((s) => /backup/i.test(s)));
    assert.ok(c.firstSteps.some((s) => /ghost/i.test(s))); // 2 ghosts: a4 (no heir), a5 (no wish, no heir)
  });
  await test('generateExecutorChecklist: grouped by wish + per heir + ghosts', () => {
    const c = L.generateExecutorChecklist(checklistState());
    assert.strictEqual(c.byWish.transfer.length, 2);
    assert.strictEqual(c.byWish.memorialize.length, 1);
    assert.strictEqual(c.byWish.delete.length, 1);
    assert.strictEqual(c.byWish.keep.length, 0);
    assert.strictEqual(c.byWish.none.length, 1); // Steam
    assert.strictEqual(c.byHeir.length, 3); // Ana, Budi, unassigned
    assert.strictEqual(c.byHeir[0].heir.name, 'Ana');
    assert.strictEqual(c.byHeir[0].accounts.length, 2);
    assert.strictEqual(c.byHeir[1].heir.name, 'Budi');
    assert.strictEqual(c.byHeir[1].accounts.length, 1);
    assert.strictEqual(c.byHeir[2].heir, null);
    assert.strictEqual(c.byHeir[2].accounts.length, 2); // Netflix + Steam
    assert.strictEqual(c.ghosts.length, 2);
    assert.deepStrictEqual(c.ghosts.map((g) => g.service).sort(), ['Netflix', 'Steam']);
  });
  await test('generateExecutorChecklist: empty plan still produces a checklist', () => {
    const c = L.generateExecutorChecklist(L.emptyState());
    assert.ok(c.firstSteps.some((s) => /empty/i.test(s)));
    assert.strictEqual(c.byWish.delete.length, 0);
    assert.strictEqual(c.byHeir.length, 0);
    assert.strictEqual(c.ghosts.length, 0);
    const text = L.formatExecutorChecklist(L.emptyState());
    assert.ok(/empty/i.test(text));
  });
  await test('formatExecutorChecklist: disclaimer + names + no state mutation', () => {
    const s = checklistState();
    const before = JSON.stringify(s);
    const text = L.formatExecutorChecklist(s);
    assert.ok(/NOT a legal/.test(text));
    assert.ok(/Ana/.test(text) && /Budi/.test(text));
    assert.ok(/Gmail/.test(text) && /Netflix/.test(text));
    assert.ok(/UNRESOLVED GHOSTS \(2\)/.test(text));
    assert.ok(/WORK PER HEIR/.test(text));
    assert.strictEqual(JSON.stringify(s), before); // no mutation, no score change
  });

  console.log('— crypto');
  await test('Web Crypto available in this Node', () => {
    assert.ok(L.getSubtle(), 'crypto.subtle missing — run on Node 19+');
  });
  await test('encrypted export/import round-trip', async () => {
    const s = stateWith(3, 2, 1);
    const exp = await L.exportEncrypted(s, 'correct horse');
    assert.strictEqual(exp.ok, true, exp.error || '');
    assert.strictEqual(exp.envelope.magic, 'AFTERLIFE1');
    const imp = await L.importEncrypted(exp.envelope, 'correct horse');
    assert.strictEqual(imp.ok, true, imp.error || '');
    assert.strictEqual(imp.state.accounts.length, 3);
    assert.strictEqual(L.validateState(imp.state), true);
  });
  await test('wrong passphrase fails safely, data untouched', async () => {
    const s = stateWith(2, 2, 2);
    const exp = await L.exportEncrypted(s, 'correct horse');
    const imp = await L.importEncrypted(exp.envelope, 'wrong passphrase');
    assert.strictEqual(imp.ok, false);
    assert.strictEqual(s.accounts.length, 2); // original state untouched
  });
  await test('plain export/import round-trip', () => {
    const s = stateWith(2, 1, 1);
    const text = L.exportPlain(s);
    const imp = L.importPlain(text);
    assert.strictEqual(imp.ok, true);
    assert.strictEqual(imp.state.accounts.length, 2);
    assert.strictEqual(L.importPlain('not json{{').ok, false);
    assert.strictEqual(L.importPlain('{"nope":1}').ok, false);
  });

  console.log('— property tests');
  await forAll('score always in [0,100]', 500, 42, (rand) => {
    const n = Math.floor(rand() * 12);
    const w = Math.floor(rand() * (n + 1));
    const h = Math.floor(rand() * (n + 1));
    const s = stateWith(n, w, h);
    if (rand() > 0.5) s.checkIn.intervalDays = 30;
    if (rand() > 0.5) s.meta.willGeneratedAt = '2026-01-01T00:00:00.000Z';
    if (rand() > 0.5) s.meta.backupExportedAt = '2026-01-01T00:00:00.000Z';
    const sc = L.computeScore(s).score;
    assert.ok(sc >= 0 && sc <= 100, 'score out of range: ' + sc);
  });
  await forAll('score is monotonic in wish coverage', 200, 7, (rand) => {
    const n = 4 + Math.floor(rand() * 6);
    const w = Math.floor(rand() * n);
    const low = L.computeScore(stateWith(n, w, n)).score;
    const high = L.computeScore(stateWith(n, w + 1, n)).score;
    assert.ok(high >= low, `score fell ${low} -> ${high} when wishes increased`);
  });
  await forAll('check-in machine never skips a stage', 300, 99, (rand) => {
    const s = L.emptyState();
    s.checkIn.intervalDays = [7, 14, 30, 90][Math.floor(rand() * 4)];
    const t0 = Date.parse('2026-11-01T00:00:00.000Z');
    s.checkIn.lastCheckInAt = '2026-11-01T00:00:00.000Z';
    const order = ['unset', 'ok', 'due', 'overdue', 'released'];
    let prev = -1;
    for (let d = 0; d <= 120; d += 1) {
      const st = L.checkInStatus(s, t0 + d * L._DAY_MS);
      const idx = order.indexOf(st);
      assert.ok(idx >= prev, `stage jumped backwards at day ${d}: ${order[prev]} -> ${st}`);
      prev = idx;
    }
  });
  await forAll('crypto round-trip on random payloads', 20, 1234, async (rand) => {
    const s = stateWith(Math.floor(rand() * 8), 0, 0);
    s.accounts.forEach((a, i) => { a.notes = 'note-' + i + '-' + Math.floor(rand() * 1e9); });
    const pass = 'pw-' + Math.floor(rand() * 1e9);
    const exp = await L.exportEncrypted(s, pass);
    assert.strictEqual(exp.ok, true);
    const imp = await L.importEncrypted(exp.envelope, pass);
    assert.strictEqual(imp.ok, true);
    assert.strictEqual(imp.state.accounts.length, s.accounts.length);
  });

  console.log('\n' + passed + ' passed, ' + failed + ' failed.');
  if (failed > 0) {
    console.log('Failures:\n- ' + failures.join('\n- '));
    process.exit(1);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
