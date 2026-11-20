/* Afterlife — UI wiring (DOM only).
 * All rules live in js/logic.js. This file reads the DOM, calls logic,
 * and renders. User text is rendered with textContent only — never
 * innerHTML with user data.
 */
(function () {
  'use strict';

  var L = window.AfterlifeLogic;
  var Seed = window.AfterlifeSeed;

  var state = L.loadState(window.localStorage);
  var editingAccountId = null;
  var currentFilter = { query: '', category: '', wish: '', ghostsOnly: false };

  function $(id) { return document.getElementById(id); }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = text;
    return n;
  }

  function save() { L.saveState(window.localStorage, state); }

  var toastTimer = null;
  function toast(msg) {
    var t = $('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 3200);
  }

  function download(filename, text, mime) {
    var blob = new Blob([text], { type: mime || 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 500);
  }

  /* ---------- score dial ---------- */

  function renderScore() {
    var r = L.computeScore(state);
    var dial = $('score-dial');
    var C = 2 * Math.PI * 54;
    dial.style.strokeDashoffset = String(C * (1 - r.score / 100));
    dial.style.stroke = r.score >= 80 ? '#7fa36a' : r.score >= 40 ? '#e8823a' : '#d64545';
    $('score-number').textContent = r.score;
    $('score-label').textContent = r.empty
      ? 'Your graveyard is empty. Add your first account to begin.'
      : r.score >= 80 ? 'Well rested. Few ghosts remain.'
      : r.score >= 40 ? 'Getting there — some ghosts still wander.'
      : 'Haunted. Your family would be lost without a plan.';
    var steps = $('next-steps');
    steps.innerHTML = '';
    L.nextSteps(state).forEach(function (s) {
      var li = el('li', '', '🕯️ ' + s);
      steps.appendChild(li);
    });
    $('account-count').textContent = state.accounts.length + ' account' + (state.accounts.length === 1 ? '' : 's');
    var ghosts = state.accounts.filter(function (a) { return L.isGhost(state, a); }).length;
    $('ghost-count').textContent = ghosts + ' ghost' + (ghosts === 1 ? '' : 's');
  }

  /* ---------- graveyard ---------- */

  function wishBadge(a) {
    if (!a.wish) return el('span', 'badge badge--ghost', '👻 Ghost — no wish');
    return el('span', 'badge', '🕯️ ' + L.WISH_LABELS[a.wish]);
  }

  function renderGraveyard() {
    var grid = $('grave-grid');
    grid.innerHTML = '';
    var list = L.filterAccounts(state, currentFilter);
    $('grave-empty').style.display = state.accounts.length === 0 ? 'block' : 'none';
    $('grave-noresult').style.display = state.accounts.length > 0 && list.length === 0 ? 'block' : 'none';
    list.forEach(function (a) {
      var heir = L.heirById(state, a.heirId);
      var card = el('article', 'grave-card' + (L.isGhost(state, a) ? ' grave-card--ghost' : ''));
      var stone = el('div', 'grave-stone');
      stone.appendChild(el('h3', 'grave-stone__name', a.service));
      stone.appendChild(el('p', 'grave-stone__user', '@ ' + a.username));
      stone.appendChild(el('p', 'grave-stone__cat',
        (L.CATEGORY_LABELS[a.category] || a.category) + ' · ' + '★'.repeat(a.importance || 3)));
      card.appendChild(stone);
      var body = el('div', 'grave-card__body');
      body.appendChild(wishBadge(a));
      var heirLine = el('p', 'grave-card__heir',
        heir ? 'Heir: ' + heir.name : 'Heir: none assigned');
      body.appendChild(heirLine);
      if (a.notes) body.appendChild(el('p', 'grave-card__notes', a.notes));
      var actions = el('div', 'grave-card__actions');
      var editBtn = el('button', 'btn btn--small', '✏️ Edit');
      editBtn.addEventListener('click', function () { openAccountForm(a); });
      var delBtn = el('button', 'btn btn--small btn--danger', '🪦 Delete');
      delBtn.addEventListener('click', function () {
        if (window.confirm('Delete "' + a.service + '" from the graveyard?')) {
          L.deleteAccount(state, a.id);
          save(); renderAll();
          toast('Account laid to rest. 🪦');
        }
      });
      actions.appendChild(editBtn);
      actions.appendChild(delBtn);
      body.appendChild(actions);
      card.appendChild(body);
      grid.appendChild(card);
    });
  }

  function fillHeirOptions(select, selectedId) {
    select.innerHTML = '';
    select.appendChild(el('option', '', '— No heir —'));
    select.lastChild.value = '';
    state.heirs.forEach(function (h) {
      var o = el('option', '', h.name + (h.relationship ? ' (' + h.relationship + ')' : ''));
      o.value = h.id;
      select.appendChild(o);
    });
    select.value = selectedId || '';
  }

  function openAccountForm(account) {
    editingAccountId = account ? account.id : null;
    $('account-form-title').textContent = account ? 'Edit account' : 'Add an account';
    $('acc-service').value = account ? account.service : '';
    $('acc-username').value = account ? account.username : '';
    $('acc-category').value = account ? account.category : 'social';
    $('acc-importance').value = account ? account.importance : 3;
    $('acc-wish').value = account ? (account.wish || '') : '';
    fillHeirOptions($('acc-heir'), account ? account.heirId : null);
    $('acc-notes').value = account ? account.notes : '';
    $('account-form-error').textContent = '';
    $('account-dialog').showModal();
  }

  function submitAccountForm(ev) {
    ev.preventDefault();
    var input = {
      service: $('acc-service').value,
      username: $('acc-username').value,
      category: $('acc-category').value,
      importance: parseInt($('acc-importance').value, 10),
      wish: $('acc-wish').value || null,
      heirId: $('acc-heir').value || null,
      notes: $('acc-notes').value
    };
    var res = editingAccountId
      ? L.updateAccount(state, editingAccountId, input)
      : L.addAccount(state, input);
    if (!res.ok) {
      $('account-form-error').textContent = '⚠️ ' + res.error;
      return;
    }
    save(); renderAll();
    $('account-dialog').close();
    toast(editingAccountId ? 'Tombstone updated. 🕯️' : 'Account added to the graveyard. 🪦');
  }

  /* ---------- heirs + will ---------- */

  function renderHeirs() {
    var list = $('heir-list');
    list.innerHTML = '';
    $('heir-empty').style.display = state.heirs.length === 0 ? 'block' : 'none';
    state.heirs.forEach(function (h) {
      var li = el('li', 'heir-item');
      var info = el('div', 'heir-item__info');
      info.appendChild(el('strong', '', h.name));
      info.appendChild(el('span', 'heir-item__meta',
        (h.relationship ? h.relationship + ' · ' : '') + h.email + (h.phone ? ' · ' + h.phone : '')));
      li.appendChild(info);
      var assigned = state.accounts.filter(function (a) { return a.heirId === h.id; }).length;
      li.appendChild(el('span', 'heir-item__count', assigned + ' account' + (assigned === 1 ? '' : 's')));
      var del = el('button', 'btn btn--small btn--danger', 'Remove');
      del.addEventListener('click', function () {
        if (window.confirm('Remove ' + h.name + ' as an heir? Their accounts will become ghosts again.')) {
          L.deleteHeir(state, h.id);
          save(); renderAll();
          toast(h.name + ' is no longer an heir. 👻');
        }
      });
      li.appendChild(del);
      list.appendChild(li);
    });
  }

  function submitHeirForm(ev) {
    ev.preventDefault();
    var res = L.addHeir(state, {
      name: $('heir-name').value,
      relationship: $('heir-relationship').value,
      email: $('heir-email').value,
      phone: $('heir-phone').value
    });
    if (!res.ok) {
      $('heir-form-error').textContent = '⚠️ ' + res.error;
      return;
    }
    $('heir-form-error').textContent = '';
    $('heir-name').value = '';
    $('heir-relationship').value = '';
    $('heir-email').value = '';
    $('heir-phone').value = '';
    save(); renderAll();
    toast('Heir named. 🕯️');
  }

  function generateWill() {
    var text = L.generateWillText(state, $('will-author').value.trim(), $('will-message').value.trim());
    save();
    var out = $('will-output');
    out.textContent = text;
    out.style.display = 'block';
    $('print-will').style.display = 'inline-block';
    renderScore();
    toast('Your legacy letter is ready. 🕯️');
  }

  function printWill() {
    document.body.classList.add('printing-will');
    window.print();
  }
  window.addEventListener('afterprint', function () {
    document.body.classList.remove('printing-will');
    document.body.classList.remove('printing-checklist');
  });

  /* ---------- executor checklist (R10) ---------- */

  function generateChecklist() {
    var text = L.formatExecutorChecklist(state);
    var out = $('checklist-output');
    out.textContent = text;
    out.style.display = 'block';
    $('print-checklist').style.display = 'inline-block';
    toast('Your executor checklist is ready. ✅');
  }

  function printChecklist() {
    document.body.classList.add('printing-checklist');
    window.print();
  }

  /* ---------- CSV import (R9) ---------- */

  var csvPlan = null; // the plan currently shown in the preview dialog

  function openCsvPicker() { $('csv-file').click(); }

  function downloadCsvTemplate() {
    download('afterlife-template.csv', L.csvTemplate(), 'text/csv');
    toast('CSV template downloaded. 📄');
  }

  function onCsvFileChosen(ev) {
    var file = ev.target.files[0];
    ev.target.value = ''; // allow picking the same file again
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      var plan = L.parseCsvImport(String(reader.result), state);
      if (plan.valid.length === 0) {
        // File-level error, or every row failed: show the reasons inline.
        $('csv-error').textContent = '⚠️ ' + plan.errors.map(function (e) {
          return (e.line ? 'Line ' + e.line + ': ' : '') + e.reason;
        }).join(' ');
        return;
      }
      $('csv-error').textContent = '';
      csvPlan = plan;
      renderCsvPreview(plan);
      $('csv-dialog').showModal();
    };
    reader.readAsText(file);
  }

  function renderCsvPreview(plan) {
    var tbody = $('csv-preview-body');
    tbody.innerHTML = '';
    plan.valid.forEach(function (row) {
      var tr = document.createElement('tr');
      var cells = [
        String(row.line),
        row.input.service,
        row.input.username,
        L.CATEGORY_LABELS[row.input.category] || row.input.category,
        row.input.wish ? L.WISH_LABELS[row.input.wish] : '—',
        row.heirName || '—'
      ];
      cells.forEach(function (c) { tr.appendChild(el('td', '', c)); });
      var status = row.heirUnmatched ? '⚠️ Valid — heir not found, will be a ghost' : '✅ Valid';
      tr.appendChild(el('td', row.heirUnmatched ? 'csv-status--warn' : 'csv-status--ok', status));
      tbody.appendChild(tr);
    });
    var skipped = $('csv-skipped-list');
    skipped.innerHTML = '';
    plan.errors.forEach(function (e) {
      skipped.appendChild(el('li', '', 'Line ' + e.line + ': ' + e.reason + ' (not imported)'));
    });
    $('csv-preview-summary').textContent =
      plan.valid.length + ' valid row' + (plan.valid.length === 1 ? '' : 's') +
      ' · ' + plan.errors.length + ' row' + (plan.errors.length === 1 ? '' : 's') + ' with problems.';
    var confirm = $('csv-confirm-btn');
    confirm.textContent = 'Import ' + plan.valid.length + ' account' + (plan.valid.length === 1 ? '' : 's');
    confirm.disabled = plan.valid.length === 0;
  }

  function confirmCsvImport() {
    if (!csvPlan || csvPlan.valid.length === 0) return;
    var res = L.importCsvAccounts(state, csvPlan.valid);
    save(); renderAll();
    $('csv-dialog').close();
    csvPlan = null;
    toast('Imported ' + res.added + ' account' + (res.added === 1 ? '' : 's') + ' from CSV. 🪦');
  }

  /* ---------- séance ---------- */

  var MOONS = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'];

  function renderSeance() {
    var status = L.checkInStatus(state);
    var banner = $('seance-status');
    var next = L.nextCheckInAt(state);
    $('seance-interval').value = state.checkIn.intervalDays ? String(state.checkIn.intervalDays) : '';
    $('checkin-btn').disabled = !state.checkIn.intervalDays;

    var moon = '🌑';
    if (state.checkIn.intervalDays && state.checkIn.lastCheckInAt) {
      var elapsed = Date.now() - Date.parse(state.checkIn.lastCheckInAt);
      var frac = Math.max(0, Math.min(1, elapsed / (state.checkIn.intervalDays * L._DAY_MS)));
      moon = MOONS[Math.min(7, Math.floor(frac * 8))];
    }
    $('seance-moon').textContent = moon;

    banner.className = 'seance-banner seance-banner--' + status;
    if (status === 'unset') {
      banner.textContent = 'No rhythm set yet. Choose how often you want to check in — the Séance will keep watch.';
      $('seance-countdown').textContent = '';
    } else if (status === 'ok') {
      var daysLeft = Math.ceil((Date.parse(next) - Date.now()) / L._DAY_MS);
      banner.textContent = 'All is calm. You checked in recently.';
      $('seance-countdown').textContent = 'Next check-in in ' + daysLeft + ' day' + (daysLeft === 1 ? '' : 's') + ' (' + new Date(next).toLocaleDateString() + ').';
    } else if (status === 'due') {
      var dueLeft = Math.ceil((Date.parse(next) - Date.now()) / L._DAY_MS);
      banner.textContent = '⚠️ The moon is almost full — your check-in is due in ' + dueLeft + ' day' + (dueLeft === 1 ? '' : 's') + '. Say you are still here.';
      $('seance-countdown').textContent = 'Due ' + new Date(next).toLocaleDateString() + '.';
    } else if (status === 'overdue') {
      var over = Math.floor((Date.now() - Date.parse(next)) / L._DAY_MS);
      banner.textContent = '🔔 Overdue by ' + over + ' day' + (over === 1 ? '' : 's') + '. Check in now, or the will moves one step closer to release.';
      $('seance-countdown').textContent = 'Release happens 7 days after the deadline.';
    } else if (status === 'released') {
      banner.textContent = '🕯️ RELEASED (simulation). The deadline passed more than 7 days ago. Below is exactly what would be shared with your heirs — nothing was actually sent.';
      $('seance-countdown').textContent = '';
    }

    // Release screen (display only — nothing is ever sent)
    var rel = $('release-screen');
    if (status === 'released') {
      rel.style.display = 'block';
      var relBody = $('release-body');
      relBody.innerHTML = '';
      if (state.heirs.length === 0) {
        relBody.appendChild(el('p', '', 'No heirs were named, so there is nobody to contact. Name an heir to complete your plan.'));
      } else {
        state.heirs.forEach(function (h) {
          var assigned = state.accounts.filter(function (a) { return a.heirId === h.id; });
          var p = el('p', '', '✉️ ' + h.name + ' (' + h.email + ') would receive: ');
          var ul = document.createElement('ul');
          if (assigned.length === 0) {
            ul.appendChild(el('li', '', 'Your legacy letter (no accounts assigned to them).'));
          } else {
            assigned.forEach(function (a) {
              ul.appendChild(el('li', '', a.service + ' — ' + (a.wish ? L.WISH_LABELS[a.wish] : 'no wish set')));
            });
          }
          p.appendChild(ul);
          relBody.appendChild(p);
        });
      }
    } else {
      rel.style.display = 'none';
    }
  }

  /* ---------- vault ---------- */

  function renderVault() {
    var enc = $('export-encrypted');
    if (!L.getSubtle()) {
      enc.disabled = true;
      $('crypto-note').textContent = '⚠️ Encrypted export is unavailable here: this page is not on a secure origin (Web Crypto needs https or localhost). Plain JSON export below still works — but it is NOT encrypted, so guard the file.';
    } else {
      enc.disabled = false;
      $('crypto-note').textContent = 'Encrypted with AES-GCM (PBKDF2, 100,000 iterations). Your passphrase never leaves this browser.';
    }
    $('vault-meta').textContent =
      (state.meta.willGeneratedAt ? 'Will generated: ' + new Date(state.meta.willGeneratedAt).toLocaleString() + '. ' : 'Will not generated yet. ') +
      (state.meta.backupExportedAt ? 'Backup exported: ' + new Date(state.meta.backupExportedAt).toLocaleString() + '.' : 'No backup exported yet.');
  }

  function exportEncryptedFlow() {
    var pass = $('export-pass').value;
    L.exportEncrypted(state, pass).then(function (res) {
      if (!res.ok) { $('vault-error').textContent = '⚠️ ' + res.error; return; }
      $('vault-error').textContent = '';
      download('afterlife-backup.afterlife.json', JSON.stringify(res.envelope, null, 2));
      save(); renderAll();
      toast('Encrypted backup downloaded. Keep it somewhere safe. 🔐');
    });
  }

  function importEncryptedFlow() {
    var file = $('import-file').files[0];
    var pass = $('import-pass').value;
    if (!file) { $('vault-error').textContent = '⚠️ Choose a backup file first.'; return; }
    var reader = new FileReader();
    reader.onload = function () {
      var envelope;
      try { envelope = JSON.parse(String(reader.result)); }
      catch (e) { $('vault-error').textContent = '⚠️ That file is not an Afterlife backup.'; return; }
      L.importEncrypted(envelope, pass).then(function (res) {
        if (!res.ok) { $('vault-error').textContent = '⚠️ ' + res.error; return; }
        state = res.state;
        save(); renderAll();
        $('vault-error').textContent = '';
        toast('Backup restored. Welcome back. 🕯️');
      });
    };
    reader.readAsText(file);
  }

  function exportPlainFlow() {
    download('afterlife-plan.json', L.exportPlain(state));
    toast('Plain JSON exported (unencrypted — guard this file).');
  }

  function importPlainFlow() {
    var file = $('import-file').files[0];
    if (!file) { $('vault-error').textContent = '⚠️ Choose a backup file first.'; return; }
    var reader = new FileReader();
    reader.onload = function () {
      var res = L.importPlain(String(reader.result));
      if (!res.ok) { $('vault-error').textContent = '⚠️ ' + res.error; return; }
      state = res.state;
      save(); renderAll();
      $('vault-error').textContent = '';
      toast('Plan imported. 🕯️');
    };
    reader.readAsText(file);
  }

  function loadDemo() {
    if (state.accounts.length > 0 || state.heirs.length > 0) {
      if (!window.confirm('This replaces your current plan with fictional demo data. Continue?')) return;
    }
    state = Seed.buildSeed();
    save(); renderAll();
    toast('Demo graveyard loaded — fictional data, clearly labeled. 👻');
  }

  function eraseAll() {
    if (!window.confirm('Erase EVERYTHING? This deletes all accounts, heirs, and settings from this browser. This cannot be undone.')) return;
    state = L.emptyState();
    save(); renderAll();
    toast('The graveyard is empty again. 🪦');
  }

  /* ---------- render all + wiring ---------- */

  function renderAll() {
    renderScore();
    renderGraveyard();
    renderHeirs();
    renderSeance();
    renderVault();
  }

  function wire() {
    $('add-account-btn').addEventListener('click', function () { openAccountForm(null); });
    $('account-form').addEventListener('submit', submitAccountForm);
    $('account-form-cancel').addEventListener('click', function () { $('account-dialog').close(); });
    $('filter-query').addEventListener('input', function (e) { currentFilter.query = e.target.value; renderGraveyard(); });
    $('filter-category').addEventListener('change', function (e) { currentFilter.category = e.target.value; renderGraveyard(); });
    $('filter-wish').addEventListener('change', function (e) { currentFilter.wish = e.target.value; renderGraveyard(); });
    $('filter-ghosts').addEventListener('change', function (e) { currentFilter.ghostsOnly = e.target.checked; renderGraveyard(); });
    $('heir-form').addEventListener('submit', submitHeirForm);
    $('generate-will').addEventListener('click', generateWill);
    $('print-will').addEventListener('click', printWill);
    $('generate-checklist').addEventListener('click', generateChecklist);
    $('print-checklist').addEventListener('click', printChecklist);
    $('csv-import-btn').addEventListener('click', openCsvPicker);
    $('csv-file').addEventListener('change', onCsvFileChosen);
    $('csv-template-btn').addEventListener('click', downloadCsvTemplate);
    $('csv-confirm-btn').addEventListener('click', confirmCsvImport);
    $('csv-cancel-btn').addEventListener('click', function () { $('csv-dialog').close(); csvPlan = null; });
    $('seance-interval').addEventListener('change', function (e) {
      var days = parseInt(e.target.value, 10);
      if (!days) return;
      var res = L.setCheckInInterval(state, days);
      if (!res.ok) { toast(res.error); return; }
      save(); renderAll();
      toast('Séance rhythm set: every ' + days + ' days. 🌕');
    });
    $('checkin-btn').addEventListener('click', function () {
      var res = L.checkInNow(state);
      if (!res.ok) { toast(res.error); return; }
      save(); renderAll();
      toast('Still here. The Séance is satisfied. 🌕');
    });
    $('simulate-missed').addEventListener('click', function () {
      if (!state.checkIn.intervalDays) L.setCheckInInterval(state, 30);
      state.checkIn.lastCheckInAt = new Date(Date.now() - 40 * L._DAY_MS).toISOString();
      save(); renderAll();
      toast('Demo: 40 days without a check-in — the will is now RELEASED (simulation).');
    });
    $('export-encrypted').addEventListener('click', exportEncryptedFlow);
    $('import-encrypted').addEventListener('click', importEncryptedFlow);
    $('export-plain').addEventListener('click', exportPlainFlow);
    $('import-plain').addEventListener('click', importPlainFlow);
    $('load-demo').addEventListener('click', loadDemo);
    $('erase-all').addEventListener('click', eraseAll);
    if (state.meta.seedLoaded) {
      var badge = $('demo-badge');
      if (badge) badge.style.display = 'inline-block';
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    wire();
    renderAll();
    // Deep link for judges / demo video: #demo loads the fictional
    // graveyard automatically when the plan is still empty.
    if (window.location.hash === '#demo' &&
        state.accounts.length === 0 && state.heirs.length === 0) {
      state = Seed.buildSeed();
      save(); renderAll();
    }
  });
})();
