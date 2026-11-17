/* Fælles data og tilstand. Alt gemmes i localStorage på denne enhed. Ingen server, ingen betaling, ingen rigtige mails eller sms. */
(function () {
  var KEY = 'risskov_demo_orders_v1', FULL = 'risskov_demo_full_v1', SIM = 'risskov_demo_sim_v1', LAST = 'risskov_demo_last_v1';
  // DEMO-ANTAGELSER (ikke fra stedet): max 6 ordrer pr. kvarter (Rons brief), tidligste afhentning 15 min efter bestilling, sidste kvarter 19.45.
  var CAP = 6, LEAD = 15, LAST_SLOT = 19 * 60 + 45;
  var STATUSES = ['Ny', 'Set', 'Godkendt', 'Klar', 'Afsluttet'];

  // Menu: udvalg fra stedets menukort (PDF, august 2025, risskovsushi.dk). Resten af menuen: [tjek menu].
  var MENU = [
    { id: 'm9',   g: '1 person', n: 'Menu 9 stk',            d: '4 nigiri, 5 maki', p: 110 },
    { id: 'm16',  g: '1 person', n: 'Menu 16 stk',           d: '6 nigiri, 10 maki', p: 180 },
    { id: 'mk10', g: '1 person', n: 'Maki-menu 10 stk',      d: '', p: 110 },
    { id: 'mk15', g: '1 person', n: 'Maki-menu 15 stk',      d: '', p: 150 },
    { id: 'ng8',  g: '1 person', n: 'Nigiri-menu 8 stk',     d: '', p: 150 },
    { id: 'v16',  g: '1 person', n: 'Vegetar-menu 16 stk',   d: '6 nigiri, 10 maki. Kan også laves vegansk.', p: 160 },
    { id: 'c14',  g: '1 person', n: 'California menu 14 stk', d: 'Nigiri: 2 laks, 2 tun, 2 rejer. Uramaki: 8 california.', p: 170 },
    { id: 'sm',   g: '1 person', n: 'Single mix 16–18 stk',  d: 'Kokken blander dagens sushi til 1 person.', p: 200 },
    { id: 'm24',  g: '2 personer', n: 'Menu 24 stk',         d: 'Nigiri: 4 laks, 4 reje. Uramaki: 8 california, 8 crispy reje.', p: 270 },
    { id: 'm34',  g: '2 personer', n: 'Menu 34 stk',         d: 'Nigiri: 4 laks, 4 reje. Uramaki: 8 california, 8 crispy reje. Maki: 10 blandede.', p: 340 },
    { id: 'mx36', g: '2 personer', n: 'Maki mix 36 stk',     d: '', p: 420 },
    { id: 'otk',  g: '2 personer', n: 'Mr. Otoko 20 stk',    d: 'ca. 1–2 personer.', p: 300 },
    { id: 'lu32', g: '2 personer', n: 'Lille uramaki menu 32 stk', d: '8 california, 8 teriyaki laks, 8 alaska, 8 crispy reje.', p: 350 },
    { id: 'm49',  g: '3–6 personer', n: 'Menu 49 stk',       d: 'ca. 3 personer.', p: 470 },
    { id: 'f72',  g: '3–6 personer', n: 'Familiemenu 72 stk', d: 'ca. 4 personer.', p: 600 },
    { id: 'p74',  g: '3–6 personer', n: 'Party deluxe 74 stk', d: 'Serveres på et fad, ca. 4 personer.', p: 900 },
    { id: 'a128', g: '3–6 personer', n: 'Aftenhygge 128 stk', d: 'ca. 6 personer.', p: 900 },
    { id: 'jun',  g: 'Børn', n: 'Junior menu 10 stk',        d: '', p: 70 },
    { id: 'kid',  g: 'Børn', n: 'Kids special menu 26 stk',  d: 'ca. 2 børn eller 1–2 voksne.', p: 250 },
    { id: 'rp8',  g: 'Rispapirruller', n: '8 ens stk',       d: '', p: 100 }
  ];
  var BYID = {}; MENU.forEach(function (m) { BYID[m.id] = m; });

  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function del(k) { try { localStorage.removeItem(k); } catch (e) {} }
  function at(h, m) { var d = new Date(); d.setHours(h, m, 0, 0); return d.toISOString(); }
  function hm(iso) { return new Date(iso).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' }); }
  function pad(n) { return String(n).padStart(2, '0'); }
  function lab(min) { return pad(Math.floor(min / 60)) + '.' + pad(min % 60); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  // Falske eksempler. Navne og numre er opdigtede og mærket "(demo)".
  function seed() {
    return [
      { id: 'D-101', name: 'Mette (demo)', phone: '10 00 00 01', items: [{ id: 'm16', q: 1 }, { id: 'm24', q: 1 }], slot: '17.00', status: 'Ny', created: at(16, 5), changes: [] },
      { id: 'D-102', name: 'Jens (demo)', phone: '10 00 00 02', items: [{ id: 'v16', q: 2 }], slot: '17.00', status: 'Set', created: at(16, 12), changes: [] },
      { id: 'D-103', name: 'Familien Sørensen (demo)', phone: '10 00 00 03', items: [{ id: 'f72', q: 1 }], slot: '17.15', status: 'Godkendt', created: at(16, 20), changes: [{ text: 'Ændret: 17.00 → 17.15', at: at(16, 31) }] },
      { id: 'D-104', name: '', phone: '', items: [{ id: 'm34', q: 1 }], slot: '17.30', status: 'Ny', created: at(16, 36), changes: [] }
    ];
  }
  function seedFull() { return { '17.15': 1, '17.30': 1 }; } // fuldt-markeret af køkkenet (demo)

  function load() {
    var raw = get(KEY), data = null;
    if (raw) { try { data = JSON.parse(raw); } catch (e) { data = null; } }
    if (!Array.isArray(data)) { data = seed(); save(data); if (!get(FULL)) set(FULL, JSON.stringify(seedFull())); }
    return data;
  }
  function save(d) { set(KEY, JSON.stringify(d)); }
  function manual() { var r = get(FULL), o = {}; if (r) { try { o = JSON.parse(r) || {}; } catch (e) { o = {}; } } else { o = seedFull(); set(FULL, JSON.stringify(o)); } return o; }
  function setManual(slot, v) { var o = manual(); if (v) o[slot] = 1; else delete o[slot]; set(FULL, JSON.stringify(o)); }
  function reset() { del(KEY); del(FULL); del(SIM); del(LAST); }

  /* ---- tid (demo-ur) ---- */
  function sim() { return get(SIM) || 'a'; }
  function setSim(v) { set(SIM, v); }
  function clock() {
    var s = sim(), n = new Date();
    if (s === 'a') return { min: 16 * 60 + 40, dow: 2, sim: true };
    if (s === 'b') return { min: 18 * 60 + 10, dow: 2, sim: true };
    if (s === 'c') return { min: 15 * 60, dow: 1, sim: true };
    return { min: n.getHours() * 60 + n.getMinutes(), dow: n.getDay(), sim: false };
  }
  function openRange(dow) { if (dow === 1) return null; return dow === 0 ? [17 * 60, 20 * 60] : [16 * 60, 20 * 60]; }
  function slotsFor(dow) {
    var r = openRange(dow), out = []; if (!r) return out;
    for (var m = r[0]; m <= LAST_SLOT; m += 15) out.push(m);
    return out;
  }
  function count(data, slotLabel) { return data.filter(function (o) { return o.slot === slotLabel; }).length; }
  function isFull(data, slotLabel) { return count(data, slotLabel) >= CAP || !!manual()[slotLabel]; }
  function status(data) {
    var c = clock(), r = openRange(c.dow), all = slotsFor(c.dow);
    if (!r) return { closed: true, why: 'Mandag er lukket. Næste dag: tirsdag fra kl. 16.00.', slots: [], c: c };
    var avail = all.filter(function (m) { return m >= c.min + LEAD; });
    if (!avail.length) return { closed: true, why: 'Der er lukket for afhentning i dag.', slots: [], c: c };
    var list = avail.map(function (m) { var l = lab(m); return { min: m, label: l, full: isFull(data, l), left: Math.max(0, CAP - count(data, l)) }; });
    var free = list.filter(function (s) { return !s.full; });
    return { closed: false, slots: list, next: free[0] || null, freeCount: free.length, c: c, all: all.map(function (m) { var l = lab(m); return { min: m, label: l, full: isFull(data, l), past: m < c.min + LEAD }; }) };
  }
  function missing(o) { var m = []; if (!o.name || !o.name.trim()) m.push('navn'); if (!o.phone || o.phone.replace(/\D/g, '').length < 8) m.push('telefon'); return m; }
  function total(items) { return items.reduce(function (a, it) { return a + (BYID[it.id] ? BYID[it.id].p * it.q : 0); }, 0); }
  function newId(d) { return 'B-' + (300 + d.length + 1) + String(Date.now()).slice(-3); }

  window.Risskov = {
    CAP: CAP, LEAD: LEAD, STATUSES: STATUSES, MENU: MENU, BYID: BYID,
    load: load, save: save, reset: reset, manual: manual, setManual: setManual,
    sim: sim, setSim: setSim, clock: clock, slotsFor: slotsFor, count: count, isFull: isFull, status: status,
    missing: missing, total: total, newId: newId, hm: hm, lab: lab, esc: esc,
    last: function () { return get(LAST); }, setLast: function (v) { set(LAST, v); }
  };
})();
