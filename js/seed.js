/* Afterlife — demo seed data (FICTIONAL people and accounts).
 * Loaded only when the user clicks "Load demo data". Clearly labeled as
 * demo in the UI. Never overwrites existing data without confirmation.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.AfterlifeSeed = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var DAY = 24 * 60 * 60 * 1000;

  function buildSeed() {
    var now = Date.now();
    var iso = function (ms) { return new Date(ms).toISOString(); };
    return {
      version: 1,
      accounts: [
        { id: 'seed-a1', service: 'Gmail', username: 'maya.ghost@example.com', category: 'social', importance: 5, wish: 'transfer', heirId: 'seed-h1', notes: 'Give the family photos to Ana. Delete the rest.', createdAt: iso(now - 40 * DAY), updatedAt: iso(now - 40 * DAY) },
        { id: 'seed-a2', service: 'Instagram', username: '@maya.wanders', category: 'social', importance: 3, wish: 'memorialize', heirId: 'seed-h1', notes: 'Turn it into a memorial page.', createdAt: iso(now - 40 * DAY), updatedAt: iso(now - 40 * DAY) },
        { id: 'seed-a3', service: 'Bank Central (checking)', username: 'maya-8842', category: 'money', importance: 5, wish: 'transfer', heirId: 'seed-h2', notes: 'Account details are in the home safe, envelope 2.', createdAt: iso(now - 39 * DAY), updatedAt: iso(now - 39 * DAY) },
        { id: 'seed-a4', service: 'Google Photos', username: 'maya.ghost@example.com', category: 'photos', importance: 5, wish: 'transfer', heirId: 'seed-h1', notes: 'Download everything first, then share the album "Family".', createdAt: iso(now - 39 * DAY), updatedAt: iso(now - 39 * DAY) },
        { id: 'seed-a5', service: 'Netflix', username: 'maya.ghost@example.com', category: 'entertainment', importance: 1, wish: 'delete', heirId: null, notes: 'Just cancel it.', createdAt: iso(now - 38 * DAY), updatedAt: iso(now - 38 * DAY) },
        { id: 'seed-a6', service: 'Steam', username: 'ghost_maya', category: 'entertainment', importance: 2, wish: null, heirId: null, notes: '', createdAt: iso(now - 38 * DAY), updatedAt: iso(now - 38 * DAY) },
        { id: 'seed-a7', service: 'LinkedIn', username: 'maya-rahmani', category: 'work', importance: 2, wish: 'memorialize', heirId: null, notes: '', createdAt: iso(now - 37 * DAY), updatedAt: iso(now - 37 * DAY) },
        { id: 'seed-a8', service: 'Tokopedia', username: 'maya.ghost@example.com', category: 'shopping', importance: 2, wish: null, heirId: 'seed-h2', notes: '', createdAt: iso(now - 37 * DAY), updatedAt: iso(now - 37 * DAY) }
      ],
      heirs: [
        { id: 'seed-h1', name: 'Ana Rahmani', relationship: 'Sister', email: 'ana.rahmani@example.com', phone: '', createdAt: iso(now - 40 * DAY) },
        { id: 'seed-h2', name: 'Budi Santoso', relationship: 'Husband', email: 'budi.santoso@example.com', phone: '', createdAt: iso(now - 40 * DAY) }
      ],
      // Check-in set 28 days ago on a 30-day rhythm → status "due".
      // The demo video can show the countdown, then simulate a missed
      // check-in to reach "released".
      checkIn: { intervalDays: 30, lastCheckInAt: iso(now - 28 * DAY) },
      meta: { willGeneratedAt: null, backupExportedAt: null, seedLoaded: true }
    };
  }

  return { buildSeed: buildSeed };
});
