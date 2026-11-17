/* Køkkenets visning: rolig, ingen scroll-animationer. */
(function () {
  var R = window.Risskov, $ = function (s) { return document.querySelector(s); }, ST = R.STATUSES;
  $('#capn').textContent = R.CAP;

  function slotMin(l) { var p = l.split('.'); return Number(p[0]) * 60 + Number(p[1]); }
  function render() {
    if (!$('#tot')) return;
    var data = R.load(), man = R.manual();
    $('#tot').textContent = data.length;

    var miss = data.filter(function (o) { return R.missing(o).length && o.status !== 'Afsluttet'; });
    $('#warn').innerHTML = miss.length ? '<div class="warn" role="alert">' + miss.length + (miss.length === 1 ? ' ordre mangler' : ' ordrer mangler') + ' noget (navn eller telefon)</div>' : '';

    // kapacitet 16.00–19.45
    var c = R.clock(), slots = R.slotsFor(c.dow.valueOf() === 1 ? 2 : c.dow), cap = '';
    if (!slots.length) slots = R.slotsFor(2);
    slots.forEach(function (m) {
      var l = R.lab(m), n = R.count(data, l), isMan = !!man[l], full = n >= R.CAP, bar = '';
      for (var i = 0; i < R.CAP; i++) bar += '<i class="' + (i < n ? 'on' : '') + '"></i>';
      cap += '<div class="cr"><span class="t">' + l + '</span><div class="bar' + (isMan ? ' manual' : full ? ' full' : '') + '" role="img" aria-label="' + n + ' af ' + R.CAP + ' ordrer' + (isMan ? ', sat til fuldt' : full ? ', fuldt' : '') + '">' + bar + '</div>' +
        '<button class="tg" type="button" aria-pressed="' + isMan + '" data-slot="' + l + '">' + (isMan ? 'Åbn' : 'Sæt fuldt') + '</button></div>';
    });
    $('#cap').innerHTML = cap;

    var sorted = data.slice().sort(function (a, b) { return (ST.indexOf(a.status) === 4) - (ST.indexOf(b.status) === 4) || slotMin(a.slot) - slotMin(b.slot) || new Date(a.created) - new Date(b.created); });
    $('#orders').innerHTML = sorted.map(function (o) {
      var i = ST.indexOf(o.status), m = R.missing(o), last = o.changes[o.changes.length - 1];
      return '<article class="order' + (m.length ? ' miss' : '') + '">' +
        '<div class="top"><span class="tm2">' + R.esc(o.slot) + '</span><span class="nm">' + (o.name ? R.esc(o.name) : '<span style="color:var(--red)">Navn mangler</span>') + '</span></div>' +
        '<div class="its">' + o.items.map(function (it) { return it.q + ' × ' + R.esc(R.BYID[it.id].n); }).join(' · ') + ' · ' + R.total(o.items) + ' kr.</div>' +
        '<div class="meta">' + R.esc(o.id) + ' · bestilt kl. ' + R.hm(o.created) + (o.phone ? ' · ' + R.esc(o.phone) : '') + '</div>' +
        (last ? '<span class="chg">' + R.esc(last.text) + ', kl. ' + R.hm(last.at) + '</span>' : '') +
        (m.length ? '<div class="ms">Mangler: ' + m.join(', ') + '</div>' : '') +
        '<div class="prog" aria-hidden="true">' + ST.map(function (s, k) { return '<i class="' + (k <= i ? 'on' : '') + '"></i>'; }).join('') + '</div>' +
        '<div class="st"><span class="pill">' + ST[i] + '</span>' +
        (i < ST.length - 1 ? '<button class="adv" type="button" data-adv="' + R.esc(o.id) + '">' + ST[i] + ' → ' + ST[i + 1] + '</button>' : '<button class="adv" type="button" disabled>Afsluttet</button>') + '</div></article>';
    }).join('');

    var cnt = {}; data.filter(function (o) { return o.status !== 'Afsluttet'; }).forEach(function (o) { o.items.forEach(function (it) { cnt[it.id] = (cnt[it.id] || 0) + it.q; }); });
    var ids = Object.keys(cnt);
    $('#klist').innerHTML = ids.length ? ids.map(function (id) { return '<li>' + cnt[id] + ' × ' + R.esc(R.BYID[id].n) + '</li>'; }).join('') : '<li>Ingen åbne ordrer</li>';
  }

  $('#cap').addEventListener('click', function (e) { var b = e.target.closest('[data-slot]'); if (!b) return; R.setManual(b.dataset.slot, b.getAttribute('aria-pressed') !== 'true'); render(); });
  $('#orders').addEventListener('click', function (e) {
    var b = e.target.closest('[data-adv]'); if (!b) return;
    var data = R.load(), o = data.filter(function (x) { return x.id === b.dataset.adv; })[0];
    if (o && ST.indexOf(o.status) < ST.length - 1) { o.status = ST[ST.indexOf(o.status) + 1]; R.save(data); render(); }
  });
  $('#reset').addEventListener('click', function () { R.reset(); render(); });
  window.addEventListener('storage', render);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) render(); });
  render();
})();
