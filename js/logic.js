/* Afterlife — pure logic layer (UMD: browser + Node).
 * No DOM access here. Every rule lives in this file and is covered by
 * tests/test.js. The UI (js/app.js) only calls these functions.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.AfterlifeLogic = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var STORAGE_KEY = 'afterlife.v1';
  var DAY_MS = 24 * 60 * 60 * 1000;

  var CATEGORIES = ['social', 'money', 'photos', 'work', 'entertainment', 'shopping', 'other'];
  var WISHES = ['delete', 'memorialize', 'transfer', 'keep'];
  var INTERVALS = [7, 14, 30, 90];

  var WISH_LABELS = {
    delete: 'Delete it',
    memorialize: 'Memorialize it',
    transfer: 'Transfer to heir',
    keep: 'Leave it as is'
  };

  var CATEGORY_LABELS = {
    social: 'Social', money: 'Money & Bank', photos: 'Photos & Memories',
    work: 'Work', entertainment: 'Entertainment', shopping: 'Shopping', other: 'Other'
  };

  /* ---------- helpers ---------- */

  function newId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return 'id-' + Date.now().toString(36) + '-' + Math.floor(Math.random() * 1e9).toString(36);
  }

  function nowIso() { return new Date().toISOString(); }

  function isPlainObject(v) {
    return v !== null && typeof v === 'object' && !Array.isArray(v);
  }

  function validEmail(email) {
    return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
  }

  /* R1.5 — refuse to store anything that looks like a password. The planner
   * records wishes, never credentials. */
  var PASSWORD_PATTERNS = [
    /passw(or)?d\s*[:=]\s*\S+/i,
    /\bpass\s*[:=]\s*\S+/i,
    /\bpwd\s*[:=]\s*\S+/i,
    /\bsecret\s*[:=]\s*\S+/i,
    /PIN\s*[:=]\s*\d{4,}/i
  ];
  function notesContainPassword(text) {
    if (!text) return false;
    return PASSWORD_PATTERNS.some(function (re) { return re.test(text); });
  }

  /* ---------- state ---------- */

  function emptyState() {
    return {
      version: 1,
      accounts: [],
      heirs: [],
      checkIn: { intervalDays: null, lastCheckInAt: null },
      meta: { willGeneratedAt: null, backupExportedAt: null, seedLoaded: false }
    };
  }

  function validateState(s) {
    if (!isPlainObject(s) || s.version !== 1) return false;
    if (!Array.isArray(s.accounts) || !Array.isArray(s.heirs)) return false;
    if (!isPlainObject(s.checkIn) || !isPlainObject(s.meta)) return false;
    for (var i = 0; i < s.accounts.length; i++) {
      var a = s.accounts[i];
      if (!isPlainObject(a) || typeof a.id !== 'string' || !a.service || !a.username) return false;
      if (a.wish !== null && a.wish !== undefined && WISHES.indexOf(a.wish) === -1) return false;
      if (a.importance !== undefined && (a.importance < 1 || a.importance > 5)) return false;
    }
    for (var j = 0; j < s.heirs.length; j++) {
      var h = s.heirs[j];
      if (!isPlainObject(h) || typeof h.id !== 'string' || !h.name || !validEmail(h.email)) return false;
    }
    return true;
  }

  function loadState(storage) {
    try {
      var raw = storage.getItem(STORAGE_KEY);
      if (!raw) return emptyState();
      var parsed = JSON.parse(raw);
      return validateState(parsed) ? parsed : emptyState();
    } catch (e) {
      return emptyState();
    }
  }

  function saveState(storage, state) {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  /* ---------- accounts ---------- */

  function validateAccountInput(input) {
    if (!input.service || !String(input.service).trim()) return 'Service name is required.';
    if (!input.username || !String(input.username).trim()) return 'Username is required.';
    if (input.category && CATEGORIES.indexOf(input.category) === -1) return 'Unknown category.';
    if (input.wish && WISHES.indexOf(input.wish) === -1) return 'Unknown wish.';
    if (input.importance !== undefined && input.importance !== null &&
        (input.importance < 1 || input.importance > 5)) return 'Importance must be 1–5.';
    if (notesContainPassword(input.notes || '')) {
      return 'Do not store passwords here. Write instructions instead (e.g. "delete it"), never credentials.';
    }
    return null;
  }

  function addAccount(state, input) {
    var err = validateAccountInput(input);
    if (err) return { ok: false, error: err };
    var acc = {
      id: newId(),
      service: String(input.service).trim(),
      username: String(input.username).trim(),
      category: input.category || 'other',
      importance: input.importance || 3,
      wish: input.wish || null,
      heirId: input.heirId || null,
      notes: (input.notes || '').trim(),
      createdAt: nowIso(),
      updatedAt: nowIso()
    };
    state.accounts.push(acc);
    return { ok: true, account: acc };
  }

  function updateAccount(state, id, input) {
    var acc = null;
    for (var i = 0; i < state.accounts.length; i++) {
      if (state.accounts[i].id === id) { acc = state.accounts[i]; break; }
    }
    if (!acc) return { ok: false, error: 'Account not found.' };
    var merged = {
      service: input.service !== undefined ? input.service : acc.service,
      username: input.username !== undefined ? input.username : acc.username,
      category: input.category !== undefined ? input.category : acc.category,
      importance: input.importance !== undefined ? input.importance : acc.importance,
      wish: input.wish !== undefined ? input.wish : acc.wish,
      heirId: input.heirId !== undefined ? input.heirId : acc.heirId,
      notes: input.notes !== undefined ? input.notes : acc.notes
    };
    var err = validateAccountInput(merged);
    if (err) return { ok: false, error: err };
    acc.service = String(merged.service).trim();
    acc.username = String(merged.username).trim();
    acc.category = merged.category;
    acc.importance = merged.importance;
    acc.wish = merged.wish || null;
    acc.heirId = merged.heirId || null;
    acc.notes = (merged.notes || '').trim();
    acc.updatedAt = nowIso();
    return { ok: true, account: acc };
  }

  function deleteAccount(state, id) {
    var before = state.accounts.length;
    state.accounts = state.accounts.filter(function (a) { return a.id !== id; });
    return state.accounts.length < before;
  }

  function isGhost(state, account) {
    return !account.wish || !account.heirId || !heirById(state, account.heirId);
  }

  function filterAccounts(state, filter) {
    filter = filter || {};
    return state.accounts.filter(function (a) {
      if (filter.category && a.category !== filter.category) return false;
      if (filter.wish && a.wish !== filter.wish) return false;
      if (filter.ghostsOnly && !isGhost(state, a)) return false;
      if (filter.query) {
        var q = filter.query.toLowerCase();
        var hay = (a.service + ' ' + a.username + ' ' + (a.notes || '')).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
  }

  /* ---------- CSV import (R9) ---------- */

  var CSV_HEADER = ['service', 'username', 'category', 'importance', 'wish', 'heir', 'notes'];

  function recordIsEmpty(rec) {
    return rec.fields.every(function (f) { return String(f).trim() === ''; });
  }

  /* Small RFC 4180 subset parser: quoted fields, "" escapes, commas and
   * newlines inside quotes, CRLF/LF line endings. Returns records with
   * their starting line number (1-based, header = line 1). An unterminated
   * quoted field is a whole-file error: records come back empty. */
  function parseCsv(text) {
    if (typeof text !== 'string') return { records: [], errors: ['Input is not text.'] };
    var src = text;
    if (src.charCodeAt(0) === 0xFEFF) src = src.slice(1); // strip UTF-8 BOM (Excel)
    var records = [];
    var errors = [];
    var fields = [];
    var field = '';
    var inQuotes = false;
    var fieldStart = true;
    var line = 1;
    var recordStartLine = 1;
    var i = 0;
    while (i < src.length) {
      var ch = src[i];
      if (inQuotes) {
        if (ch === '"') {
          if (src[i + 1] === '"') { field += '"'; i += 2; }
          else { inQuotes = false; i++; }
        } else {
          if (ch === '\n') line++;
          field += ch;
          i++;
        }
      } else if (ch === '"' && field === '' && fieldStart) {
        inQuotes = true;
        fieldStart = false;
        i++;
      } else if (ch === ',') {
        fields.push(field);
        field = '';
        fieldStart = true;
        i++;
      } else if (ch === '\n') {
        fields.push(field);
        records.push({ line: recordStartLine, fields: fields });
        fields = [];
        field = '';
        line++;
        recordStartLine = line;
        fieldStart = true;
        i++;
      } else if (ch === '\r') {
        if (src[i + 1] === '\n') {
          fields.push(field);
          records.push({ line: recordStartLine, fields: fields });
          fields = [];
          field = '';
          line++;
          recordStartLine = line;
          fieldStart = true;
          i += 2;
        } else {
          field += ch; // lone CR is data, not a line ending
          fieldStart = false;
          i++;
        }
      } else {
        field += ch;
        fieldStart = false;
        i++;
      }
    }
    if (inQuotes) {
      return { records: [], errors: ['Unterminated quoted field (a " was opened but never closed). Nothing was imported.'] };
    }
    if (field !== '' || fields.length > 0) {
      fields.push(field);
      records.push({ line: recordStartLine, fields: fields });
    }
    return { records: records, errors: errors };
  }

  function findHeirByNameOrEmail(state, value) {
    if (!value) return null;
    var v = String(value).trim().toLowerCase();
    if (!v) return null;
    for (var i = 0; i < state.heirs.length; i++) {
      var h = state.heirs[i];
      if (h.name && String(h.name).trim().toLowerCase() === v) return h;
      if (h.email && String(h.email).trim().toLowerCase() === v) return h;
    }
    return null;
  }

  /* Plan a CSV import without touching state. Returns
   * { valid: [{ line, input, heirId, heirName, heirUnmatched }],
   *   errors: [{ line, reason }] }.
   * File-level errors use line 0. Nothing is saved here. */
  function parseCsvImport(text, state) {
    var parsed = parseCsv(text);
    if (parsed.errors.length > 0) {
      return {
        valid: [],
        errors: parsed.errors.map(function (e) { return { line: 0, reason: e }; })
      };
    }
    var records = parsed.records;
    var headerIdx = -1;
    for (var i = 0; i < records.length; i++) {
      if (!recordIsEmpty(records[i])) { headerIdx = i; break; }
    }
    if (headerIdx === -1) {
      return {
        valid: [],
        errors: [{ line: 0, reason: 'The file is empty — no header row found. Expected header: ' + CSV_HEADER.join(',') + '.' }]
      };
    }
    var header = records[headerIdx].fields.map(function (f) { return String(f).trim().toLowerCase(); });
    var colIndex = {};
    var missing = [];
    CSV_HEADER.forEach(function (name) {
      var idx = header.indexOf(name);
      if (idx === -1) missing.push(name);
      else colIndex[name] = idx;
    });
    if (missing.length > 0) {
      return {
        valid: [],
        errors: [{ line: records[headerIdx].line, reason: 'Missing column(s) in header: ' + missing.join(', ') + '. Expected header: ' + CSV_HEADER.join(',') + '.' }]
      };
    }
    var valid = [];
    var errors = [];
    for (var j = headerIdx + 1; j < records.length; j++) {
      var rec = records[j];
      if (recordIsEmpty(rec)) continue;
      var line = rec.line;
      if (rec.fields.length !== header.length) {
        errors.push({ line: line, reason: 'Expected ' + header.length + ' columns, got ' + rec.fields.length + '.' });
        continue;
      }
      var get = function (name) { return (rec.fields[colIndex[name]] || '').trim(); };
      var importanceRaw = get('importance');
      var importance;
      if (importanceRaw === '') {
        importance = undefined;
      } else if (/^-?\d+$/.test(importanceRaw)) {
        importance = parseInt(importanceRaw, 10);
      } else {
        errors.push({ line: line, reason: 'Importance must be a whole number 1–5.' });
        continue;
      }
      var heirRaw = get('heir');
      var heir = null;
      var heirUnmatched = false;
      if (heirRaw !== '') {
        heir = findHeirByNameOrEmail(state, heirRaw);
        if (!heir) heirUnmatched = true;
      }
      var input = {
        service: get('service'),
        username: get('username'),
        category: get('category') || 'other',
        importance: importance,
        wish: get('wish') || null,
        heirId: heir ? heir.id : null,
        notes: get('notes')
      };
      var err = validateAccountInput(input);
      if (err) {
        errors.push({ line: line, reason: err });
        continue;
      }
      valid.push({ line: line, input: input, heirId: input.heirId, heirName: heir ? heir.name : null, heirUnmatched: heirUnmatched });
    }
    return { valid: valid, errors: errors };
  }

  function importCsvAccounts(state, validRows) {
    var added = [];
    var errors = [];
    validRows.forEach(function (row) {
      var res = addAccount(state, row.input);
      if (res.ok) added.push(res.account);
      else errors.push({ line: row.line, reason: res.error });
    });
    return { added: added.length, accounts: added, errors: errors };
  }

  function csvTemplate() {
    return 'service,username,category,importance,wish,heir,notes\n' +
      'Gmail,me@example.com,social,5,transfer,Ana,"Give the family photos to Ana, then delete the rest."\n' +
      'Netflix,me@example.com,entertainment,1,delete,,"Just cancel the subscription."\n';
  }

  /* ---------- heirs ---------- */

  function addHeir(state, input) {
    if (!input.name || !String(input.name).trim()) return { ok: false, error: 'Heir name is required.' };
    if (!validEmail(input.email || '')) return { ok: false, error: 'A valid email address is required.' };
    var heir = {
      id: newId(),
      name: String(input.name).trim(),
      relationship: (input.relationship || '').trim(),
      email: String(input.email).trim(),
      phone: (input.phone || '').trim(),
      createdAt: nowIso()
    };
    state.heirs.push(heir);
    return { ok: true, heir: heir };
  }

  function deleteHeir(state, id) {
    var before = state.heirs.length;
    state.heirs = state.heirs.filter(function (h) { return h.id !== id; });
    // R2.2 — unassign the heir from all accounts; the accounts stay.
    state.accounts.forEach(function (a) {
      if (a.heirId === id) { a.heirId = null; a.updatedAt = nowIso(); }
    });
    return state.heirs.length < before;
  }

  function heirById(state, id) {
    if (!id) return null;
    for (var i = 0; i < state.heirs.length; i++) {
      if (state.heirs[i].id === id) return state.heirs[i];
    }
    return null;
  }

  /* ---------- Haunting Score (R3) ---------- */

  function computeScore(state) {
    if (state.accounts.length === 0) {
      return { score: 0, parts: { wish: 0, heir: 0, hasHeir: 0, checkIn: 0, will: 0, backup: 0 }, empty: true };
    }
    var withWish = 0, withHeir = 0;
    state.accounts.forEach(function (a) {
      if (a.wish) withWish++;
      if (a.heirId && heirById(state, a.heirId)) withHeir++;
    });
    var wish = Math.round(40 * withWish / state.accounts.length);
    var heir = Math.round(25 * withHeir / state.accounts.length);
    var hasHeir = state.heirs.length > 0 ? 15 : 0;
    var checkIn = state.checkIn.intervalDays ? 10 : 0;
    var will = state.meta.willGeneratedAt ? 5 : 0;
    var backup = state.meta.backupExportedAt ? 5 : 0;
    var score = Math.max(0, Math.min(100, wish + heir + hasHeir + checkIn + will + backup));
    return { score: score, parts: { wish: wish, heir: heir, hasHeir: hasHeir, checkIn: checkIn, will: will, backup: backup }, empty: false };
  }

  function nextSteps(state) {
    var steps = [];
    if (state.accounts.length === 0) {
      steps.push('Add your first account to the graveyard.');
      return steps;
    }
    var ghostsWish = 0, ghostsHeir = 0;
    state.accounts.forEach(function (a) {
      if (!a.wish) ghostsWish++;
      if (!a.heirId || !heirById(state, a.heirId)) ghostsHeir++;
    });
    if (ghostsWish > 0) steps.push('Give ' + ghostsWish + ' account' + (ghostsWish > 1 ? 's' : '') + ' a wish (delete, memorialize, transfer, or keep).');
    if (state.heirs.length === 0) steps.push('Name at least one heir — someone to carry out your wishes.');
    if (ghostsHeir > 0) steps.push('Assign an heir to ' + ghostsHeir + ' account' + (ghostsHeir > 1 ? 's' : '') + '.');
    if (!state.checkIn.intervalDays) steps.push('Set a check-in rhythm for the Séance.');
    if (!state.meta.willGeneratedAt) steps.push('Generate your legacy letter (The Will).');
    if (!state.meta.backupExportedAt) steps.push('Export an encrypted backup of your plan.');
    return steps;
  }

  /* ---------- Check-in state machine (R4) ---------- */

  function dueWindowDays(intervalDays) {
    return Math.min(3, Math.max(1, Math.floor(intervalDays * 0.4)));
  }

  function checkInStatus(state, nowMs) {
    var ci = state.checkIn;
    if (!ci.intervalDays || !ci.lastCheckInAt) return 'unset';
    var now = nowMs !== undefined ? nowMs : Date.now();
    var last = Date.parse(ci.lastCheckInAt);
    if (isNaN(last)) return 'unset';
    var elapsed = now - last;
    var intervalMs = ci.intervalDays * DAY_MS;
    if (elapsed < 0) return 'ok'; // clock moved backwards: be kind
    if (elapsed >= intervalMs + 7 * DAY_MS) return 'released';
    if (elapsed >= intervalMs) return 'overdue';
    if (elapsed >= intervalMs - dueWindowDays(ci.intervalDays) * DAY_MS) return 'due';
    return 'ok';
  }

  function setCheckInInterval(state, days) {
    if (INTERVALS.indexOf(days) === -1) return { ok: false, error: 'Interval must be 7, 14, 30, or 90 days.' };
    state.checkIn.intervalDays = days;
    state.checkIn.lastCheckInAt = nowIso();
    return { ok: true };
  }

  function checkInNow(state) {
    if (!state.checkIn.intervalDays) return { ok: false, error: 'Set a check-in interval first.' };
    state.checkIn.lastCheckInAt = nowIso();
    return { ok: true, status: 'ok' };
  }

  function nextCheckInAt(state) {
    if (!state.checkIn.intervalDays || !state.checkIn.lastCheckInAt) return null;
    return new Date(Date.parse(state.checkIn.lastCheckInAt) + state.checkIn.intervalDays * DAY_MS).toISOString();
  }

  /* ---------- Will letter (R5) ---------- */

  function generateWillText(state, authorName, finalMessage) {
    var lines = [];
    var date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    lines.push('MY DIGITAL WILL — A PLANNING LETTER');
    lines.push('Prepared with Afterlife on ' + date + '.');
    lines.push('');
    lines.push('This letter is a personal planning document. It is NOT a legal will');
    lines.push('and does not replace legal advice or a legally executed will.');
    lines.push('');
    if (authorName) lines.push('From: ' + authorName);
    lines.push('');
    lines.push('MY HEIRS');
    if (state.heirs.length === 0) {
      lines.push('  (No heirs named yet.)');
    } else {
      state.heirs.forEach(function (h) {
        lines.push('  - ' + h.name + (h.relationship ? ' (' + h.relationship + ')' : '') + ' — ' + h.email + (h.phone ? ' — ' + h.phone : ''));
      });
    }
    lines.push('');
    lines.push('MY ACCOUNTS — WHAT SHOULD HAPPEN TO EACH');
    if (state.accounts.length === 0) {
      lines.push('  (No accounts listed yet.)');
    } else {
      state.accounts.forEach(function (a) {
        var heir = heirById(state, a.heirId);
        lines.push('  - ' + a.service + ' (' + a.username + ') [' + (CATEGORY_LABELS[a.category] || a.category) + ']');
        lines.push('      Wish: ' + (a.wish ? WISH_LABELS[a.wish] : 'No wish set yet') +
          ' | Heir: ' + (heir ? heir.name : 'None assigned') +
          ' | Importance: ' + (a.importance || 3) + '/5');
        if (a.notes) lines.push('      Note: ' + a.notes);
      });
    }
    lines.push('');
    if (finalMessage) {
      lines.push('MY FINAL MESSAGE');
      lines.push(finalMessage);
      lines.push('');
    }
    lines.push('— End of letter. Keep this somewhere your heirs can find it,');
    lines.push('  and keep your Afterlife backup somewhere safe.');
    state.meta.willGeneratedAt = nowIso();
    return lines.join('\n');
  }

  /* ---------- Executor Checklist (R10) ---------- */

  /* Structured checklist for the heirs. A derived view: it never mutates
   * state and never affects the Haunting Score. */
  function generateExecutorChecklist(state) {
    var byWish = { delete: [], memorialize: [], transfer: [], keep: [], none: [] };
    var byHeirMap = {};
    var heirOrder = [];
    var ghosts = [];
    state.accounts.forEach(function (a) {
      var heir = heirById(state, a.heirId);
      var entry = {
        service: a.service, username: a.username,
        wish: a.wish || null, heirName: heir ? heir.name : null,
        notes: a.notes || ''
      };
      (a.wish ? byWish[a.wish] : byWish.none).push(entry);
      var key = heir ? heir.id : null;
      if (!byHeirMap[key]) { byHeirMap[key] = { heir: heir, accounts: [] }; heirOrder.push(key); }
      byHeirMap[key].accounts.push({
        service: a.service, username: a.username,
        wish: a.wish || null, notes: a.notes || ''
      });
      if (isGhost(state, a)) ghosts.push(entry);
    });
    var byHeir = heirOrder.map(function (k) { return byHeirMap[k]; });
    byHeir.sort(function (x, y) {
      if (!x.heir && !y.heir) return 0;
      if (!x.heir) return 1;
      if (!y.heir) return -1;
      return state.heirs.indexOf(x.heir) - state.heirs.indexOf(y.heir);
    });
    var firstSteps = [];
    if (state.accounts.length === 0 && state.heirs.length === 0) {
      firstSteps.push('This plan is empty — there is nothing to carry out yet.');
      firstSteps.push('First, add accounts to the graveyard and name an heir. Then generate the legacy letter (The Will).');
    } else {
      if (state.heirs.length === 0) {
        firstSteps.push('Name an heir first — without one, nobody can act on this plan.');
      } else {
        var first = state.heirs[0];
        firstSteps.push('Contact ' + first.name + ' (' + first.email + ')' + (first.phone ? ' — ' + first.phone : '') + ' first. They are the first person named in this plan.');
      }
      firstSteps.push('Read the legacy letter (The Will) — it lists every account, every wish, and every heir.');
      firstSteps.push('Find the encrypted Afterlife backup — ask the family where it is kept (a USB stick, a safe, or a trusted person). It holds the full plan.');
      firstSteps.push('Check the Séance status: if the plan was released, follow the release instructions shown in the app.');
      if (ghosts.length > 0) {
        firstSteps.push('Resolve ' + ghosts.length + ' ghost' + (ghosts.length === 1 ? '' : 's') + ' first — these accounts have no wish or no heir, so there is no instruction for them yet.');
      }
    }
    return { generatedAt: nowIso(), firstSteps: firstSteps, byWish: byWish, byHeir: byHeir, ghosts: ghosts };
  }

  /* Printable plain-text rendering of the checklist (like the will
   * letter). Does not mutate state. */
  function formatExecutorChecklist(state) {
    var c = generateExecutorChecklist(state);
    var lines = [];
    var date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    lines.push('EXECUTOR CHECKLIST — WHAT TO DO, STEP BY STEP');
    lines.push('Prepared with Afterlife on ' + date + '.');
    lines.push('');
    lines.push('This checklist is a personal planning document. It is NOT a legal');
    lines.push('document and does not replace legal advice or a legally executed will.');
    lines.push('');
    lines.push('FIRST STEPS');
    c.firstSteps.forEach(function (s, i) { lines.push('  ' + (i + 1) + '. ' + s); });
    lines.push('');
    lines.push('ACTIONS PER ACCOUNT — GROUPED BY WISH');
    var wishOrder = ['delete', 'memorialize', 'transfer', 'keep', 'none'];
    var wishHeadings = {
      delete: 'DELETE', memorialize: 'MEMORIALIZE', transfer: 'TRANSFER TO HEIR',
      keep: 'LEAVE AS IS', none: 'NO WISH SET'
    };
    wishOrder.forEach(function (w) {
      var list = c.byWish[w];
      lines.push('  ' + wishHeadings[w] + ' (' + list.length + ')');
      if (list.length === 0) {
        lines.push('    (None.)');
      } else {
        list.forEach(function (a) {
          lines.push('    - ' + a.service + ' (' + a.username + ')' +
            (a.heirName ? ' — heir: ' + a.heirName : ' — no heir assigned') +
            (a.notes ? ' — ' + a.notes : ''));
        });
      }
    });
    lines.push('');
    lines.push('WORK PER HEIR');
    if (c.byHeir.length === 0) {
      lines.push('  (No accounts listed yet.)');
    } else {
      c.byHeir.forEach(function (group) {
        var label = group.heir ? group.heir.name + ' (' + group.heir.email + ')' : 'No heir assigned';
        lines.push('  ' + label + ' — ' + group.accounts.length + ' account' + (group.accounts.length === 1 ? '' : 's'));
        group.accounts.forEach(function (a) {
          lines.push('    - ' + a.service + ' (' + a.username + ') — ' +
            (a.wish ? WISH_LABELS[a.wish] : 'no wish set') +
            (a.notes ? ' — ' + a.notes : ''));
        });
      });
    }
    lines.push('');
    lines.push('UNRESOLVED GHOSTS (' + c.ghosts.length + ')');
    if (c.ghosts.length === 0) {
      lines.push('  None — every account has a wish and an heir.');
    } else {
      c.ghosts.forEach(function (a) {
        var why = [];
        if (!a.wish) why.push('no wish');
        if (!a.heirName) why.push('no heir');
        lines.push('  - ' + a.service + ' (' + a.username + ') — ' + why.join(' and ') + '. No instruction exists for this account yet.');
      });
    }
    lines.push('');
    lines.push('— End of checklist. Keep this with the legacy letter, and keep');
    lines.push('  the encrypted Afterlife backup somewhere safe.');
    return lines.join('\n');
  }

  /* ---------- Crypto (R6) ---------- */

  function getSubtle() {
    try {
      if (typeof crypto !== 'undefined' && crypto.subtle) return crypto.subtle;
    } catch (e) { /* ignore */ }
    return null;
  }

  function bytesToB64(bytes) {
    if (typeof Buffer !== 'undefined') return Buffer.from(bytes).toString('base64');
    var bin = '';
    bytes.forEach(function (b) { bin += String.fromCharCode(b); });
    return btoa(bin);
  }

  function b64ToBytes(b64) {
    if (typeof Buffer !== 'undefined') return new Uint8Array(Buffer.from(b64, 'base64'));
    var bin = atob(b64);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }

  function strToBytes(str) {
    if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(str);
    return new Uint8Array(Buffer.from(str, 'utf8'));
  }

  function bytesToStr(bytes) {
    if (typeof TextDecoder !== 'undefined') return new TextDecoder().decode(bytes);
    return Buffer.from(bytes).toString('utf8');
  }

  function randomBytes(n) {
    var arr = new Uint8Array(n);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(arr);
    else for (var i = 0; i < n; i++) arr[i] = Math.floor(Math.random() * 256);
    return arr;
  }

  function exportEncrypted(state, passphrase) {
    var subtle = getSubtle();
    if (!subtle) return Promise.resolve({ ok: false, error: 'Web Crypto is unavailable here (this page is not on a secure origin). Use plain JSON export instead.' });
    if (!passphrase || passphrase.length < 4) return Promise.resolve({ ok: false, error: 'Passphrase must be at least 4 characters.' });
    var salt = randomBytes(16);
    var iv = randomBytes(12);
    var data = strToBytes(JSON.stringify(state));
    return subtle.importKey('raw', strToBytes(passphrase), { name: 'PBKDF2' }, false, ['deriveKey'])
      .then(function (baseKey) {
        return subtle.deriveKey(
          { name: 'PBKDF2', salt: salt, iterations: 100000, hash: 'SHA-256' },
          baseKey, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
      })
      .then(function (key) { return subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, data); })
      .then(function (ct) {
        state.meta.backupExportedAt = nowIso();
        return {
          ok: true,
          envelope: { magic: 'AFTERLIFE1', salt: bytesToB64(salt), iv: bytesToB64(iv), data: bytesToB64(new Uint8Array(ct)) }
        };
      })
      .catch(function (e) { return { ok: false, error: 'Encryption failed: ' + (e && e.message ? e.message : e) }; });
  }

  function importEncrypted(envelope, passphrase) {
    var subtle = getSubtle();
    if (!subtle) return Promise.resolve({ ok: false, error: 'Web Crypto is unavailable here (this page is not on a secure origin).' });
    if (!envelope || envelope.magic !== 'AFTERLIFE1' || !envelope.salt || !envelope.iv || !envelope.data) {
      return Promise.resolve({ ok: false, error: 'This file is not an Afterlife encrypted backup.' });
    }
    if (!passphrase) return Promise.resolve({ ok: false, error: 'Passphrase is required.' });
    var salt, iv, data;
    try {
      salt = b64ToBytes(envelope.salt);
      iv = b64ToBytes(envelope.iv);
      data = b64ToBytes(envelope.data);
    } catch (e) {
      return Promise.resolve({ ok: false, error: 'Backup file is corrupt.' });
    }
    return subtle.importKey('raw', strToBytes(passphrase), { name: 'PBKDF2' }, false, ['deriveKey'])
      .then(function (baseKey) {
        return subtle.deriveKey(
          { name: 'PBKDF2', salt: salt, iterations: 100000, hash: 'SHA-256' },
          baseKey, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
      })
      .then(function (key) { return subtle.decrypt({ name: 'AES-GCM', iv: iv }, key, data); })
      .then(function (pt) {
        var parsed;
        try { parsed = JSON.parse(bytesToStr(new Uint8Array(pt))); }
        catch (e) { return { ok: false, error: 'Backup file is corrupt.' }; }
        if (!validateState(parsed)) return { ok: false, error: 'Backup contents are invalid.' };
        return { ok: true, state: parsed };
      })
      .catch(function () { return { ok: false, error: 'Wrong passphrase, or the backup file is corrupt.' }; });
  }

  function exportPlain(state) {
    return JSON.stringify({ magic: 'AFTERLIFE1-PLAIN', exportedAt: nowIso(), state: state }, null, 2);
  }

  function importPlain(text) {
    try {
      var parsed = JSON.parse(text);
      var s = parsed && parsed.state ? parsed.state : parsed;
      if (!validateState(s)) return { ok: false, error: 'This file does not contain a valid Afterlife plan.' };
      return { ok: true, state: s };
    } catch (e) {
      return { ok: false, error: 'Could not read this file.' };
    }
  }

  /* ---------- public API ---------- */

  return {
    STORAGE_KEY: STORAGE_KEY,
    CATEGORIES: CATEGORIES,
    WISHES: WISHES,
    INTERVALS: INTERVALS,
    WISH_LABELS: WISH_LABELS,
    CATEGORY_LABELS: CATEGORY_LABELS,
    emptyState: emptyState,
    validateState: validateState,
    loadState: loadState,
    saveState: saveState,
    validateAccountInput: validateAccountInput,
    notesContainPassword: notesContainPassword,
    addAccount: addAccount,
    updateAccount: updateAccount,
    deleteAccount: deleteAccount,
    isGhost: isGhost,
    filterAccounts: filterAccounts,
    CSV_HEADER: CSV_HEADER,
    parseCsv: parseCsv,
    findHeirByNameOrEmail: findHeirByNameOrEmail,
    parseCsvImport: parseCsvImport,
    importCsvAccounts: importCsvAccounts,
    csvTemplate: csvTemplate,
    addHeir: addHeir,
    deleteHeir: deleteHeir,
    heirById: heirById,
    computeScore: computeScore,
    nextSteps: nextSteps,
    dueWindowDays: dueWindowDays,
    checkInStatus: checkInStatus,
    setCheckInInterval: setCheckInInterval,
    checkInNow: checkInNow,
    nextCheckInAt: nextCheckInAt,
    generateWillText: generateWillText,
    generateExecutorChecklist: generateExecutorChecklist,
    formatExecutorChecklist: formatExecutorChecklist,
    getSubtle: getSubtle,
    exportEncrypted: exportEncrypted,
    importEncrypted: importEncrypted,
    exportPlain: exportPlain,
    importPlain: importPlain,
    _DAY_MS: DAY_MS
  };
});
