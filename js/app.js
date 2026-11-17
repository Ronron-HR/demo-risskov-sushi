/* Kundeside: næste ledige tid, tidslinje, menukort, samtaleflow og bon. */
(function () {
  var R = window.Risskov;
  var $ = function (s) { return document.querySelector(s); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = typeof window.gsap !== 'undefined';
  function kr(n) { return n.toLocaleString('da-DK') + ' kr.'; }

  /* ---------- forside ---------- */
  function renderHero() {
    var data = R.load(), st = R.status(data);
    var tl = $('#tline'), html = '';
    var simLabel = { a: 'tirsdag kl. 16.40', b: 'tirsdag kl. 18.10', c: 'mandag (lukket)', real: 'rigtigt ur' }[R.sim()];
    $('#simbtn').textContent = 'Demo-tid: ' + simLabel;
    if (st.closed) {
      $('#nx').textContent = 'Lukket'; $('#nxt').textContent = st.why;
      $('#start').disabled = true; $('#closedmsg').hidden = false; $('#closedmsg').textContent = st.why;
    } else {
      $('#start').disabled = false; $('#closedmsg').hidden = true;
      if (st.next) { $('#nx').textContent = st.next.label; $('#nxt').textContent = st.freeCount + (st.freeCount === 1 ? ' ledig tid' : ' ledige tider') + ' i aften'; }
      else { $('#nx').textContent = 'Fuldt'; $('#nxt').textContent = 'Alle tider i aften er optaget'; }
    }
    // 16 kvarterer 16.00–19.45
    var map = {}; (st.all || []).forEach(function (s) { map[s.label] = s; });
    for (var m = 16 * 60; m <= 19 * 60 + 45; m += 15) {
      var l = R.lab(m), s = map[l], cls = '';
      if (!s || s.past || s.full) cls = 'f'; else if (st.next && st.next.label === l) cls = 'n';
      html += '<i class="' + cls + '"></i>';
    }
    tl.innerHTML = html;
    return st;
  }
  var heroSt = renderHero();

  /* ---------- menukort ---------- */
  var board = $('#board'), bh = '';
  R.MENU.forEach(function (m) {
    bh += '<div class="bn" tabindex="0"><div><span class="g">' + R.esc(m.g) + '</span><h3>' + R.esc(m.n) + '</h3>' + (m.d ? '<p>' + R.esc(m.d) + '</p>' : '') + '</div><div class="pr" data-to="' + m.p + '">' + m.p + '<small>kr.</small></div></div>';
  });
  board.innerHTML = bh;

  $('#simbtn').addEventListener('click', function () { var s = R.sim(); R.setSim(s === 'a' ? 'b' : s === 'b' ? 'c' : s === 'c' ? 'real' : 'a'); heroSt = renderHero(); });
  $('#reset').addEventListener('click', function () { R.reset(); heroSt = renderHero(); });

  /* ---------- samtaleflow ---------- */
  var flow = $('#flow'), body = $('#fbody'), nextBtn = $('#next'), backBtn = $('#back'), err = $('#err');
  var step = 0, draft = null, editing = null;

  function cartTotal() { return R.total(draft.items); }
  function qtyOf(id) { var f = draft.items.filter(function (i) { return i.id === id; })[0]; return f ? f.q : 0; }
  function setQty(id, q) {
    draft.items = draft.items.filter(function (i) { return i.id !== id; });
    if (q > 0) draft.items.push({ id: id, q: q });
  }

  function openFlow(editId, startStep) {
    var data = R.load(), o = editId ? data.filter(function (x) { return x.id === editId; })[0] : null;
    editing = o ? o.id : null;
    draft = o ? { items: o.items.map(function (i) { return { id: i.id, q: i.q }; }), slot: o.slot, name: o.name, phone: o.phone } : { items: [], slot: '', name: '', phone: '' };
    step = startStep || 0;
    flow.hidden = false; document.body.style.overflow = 'hidden';
    if (window.__lenis) window.__lenis.stop();
    render(true);
  }
  function closeFlow() { flow.hidden = true; document.body.style.overflow = ''; if (window.__lenis) window.__lenis.start(); heroSt = renderHero(); $('#start').focus(); }

  function progress(n) {
    var pct = Math.min(100, (n + 1) / 4 * 100);
    $('#evi').style.width = pct + '%'; $('#evb').style.left = pct + '%';
    $('#evm').textContent = n >= 4 ? 'Klar' : 'Trin ' + (n + 1) + ' af 4';
  }
  function updateTotal() {
    var show = step === 0 || step === 3;
    $('#tot').hidden = !show; $('#totv').textContent = kr(cartTotal());
  }

  function render(first) {
    err.textContent = '';
    progress(step);
    backBtn.hidden = step === 0 || step === 4 || (editing && step === 1);
    nextBtn.hidden = false;
    var h = '';
    if (step === 0) {
      h = '<p class="k">Spørgsmål 1 af 4</p><h2 class="q">Hvad vil du have?</h2><p class="hint">Vælg en eller flere menuer. Priser fra menukortet.</p>';
      var g = '';
      R.MENU.forEach(function (m) {
        if (m.g !== g) { g = m.g; h += '<div class="grp">' + R.esc(g) + '</div>'; }
        h += '<div class="it"><div><h3>' + R.esc(m.n) + '</h3>' + (m.d ? '<p>' + R.esc(m.d) + '</p>' : '') + '<div class="pz">' + m.p + ' kr.</div></div>' +
          '<div class="qty"><button type="button" data-id="' + m.id + '" data-d="-1" aria-label="Én mindre ' + R.esc(m.n) + '">−</button><output id="q-' + m.id + '" aria-live="polite">' + qtyOf(m.id) + '</output><button type="button" data-id="' + m.id + '" data-d="1" aria-label="Én mere ' + R.esc(m.n) + '">+</button></div></div>';
      });
      h += '<p class="note-s" style="margin-top:14px">Resten af menuen: <span class="tbd">[tjek menu]</span></p>';
      nextBtn.innerHTML = 'Videre <span aria-hidden="true">→</span>';
    } else if (step === 1) {
      var data = R.load(), st = R.status(data);
      h = '<p class="k">Spørgsmål 2 af 4</p><h2 class="q">Hvornår henter du?</h2>';
      if (st.closed) { h += '<p class="hint">' + R.esc(st.why) + '</p>'; }
      else {
        var fi = -1; st.slots.forEach(function (s, i) { if (fi < 0 && s.full) fi = i; });
        var hint = 'Alle tider er optaget i aften.';
        if (st.next) {
          if (fi < 0) hint = 'Vælg et kvarter. Maks. ' + R.CAP + ' ordrer pr. kvarter (demo).';
          else {
            var j = fi; while (j < st.slots.length && st.slots[j].full) j++;
            var after = j < st.slots.length ? st.slots[j] : null;
            hint = 'Fuldt ' + st.slots[fi].label + (j - 1 > fi ? '–' + st.slots[j - 1].label : '') + '.' + (after ? ' Prøv ' + after.label + '.' : ' Prøv ' + st.next.label + '.');
          }
        }
        h += '<p class="hint">' + R.esc(hint) + '</p><div class="slots" role="radiogroup" aria-label="Afhentningstid">';
        st.slots.forEach(function (s) {
          var sel = draft.slot === s.label;
          h += '<button type="button" class="slot" role="radio" aria-checked="' + sel + '"' + (s.full ? ' aria-disabled="true"' : '') + ' data-slot="' + s.label + '"><b>' + s.label + '</b><small>' + (s.full ? 'fuldt' : s.left + ' ledig' + (s.left === 1 ? '' : 'e')) + '</small></button>';
        });
        h += '</div>';
      }
      nextBtn.innerHTML = (editing ? 'Gem ny tid' : 'Videre') + ' <span aria-hidden="true">→</span>';
    } else if (step === 2) {
      h = '<p class="k">Spørgsmål 3 af 4</p><h2 class="q">Hvem henter?</h2><p class="hint">Så ved køkkenet, hvem bestillingen er til.</p>' +
        '<label class="lab" for="nm">Navn</label><input class="field" id="nm" type="text" autocomplete="name" value="' + R.esc(draft.name) + '">' +
        '<label class="lab" for="ph">Telefon</label><input class="field" id="ph" type="tel" inputmode="tel" autocomplete="tel" value="' + R.esc(draft.phone) + '">' +
        '<p class="note-s">Kun brugt i demoen. Der sendes ingen sms.</p>';
      nextBtn.innerHTML = 'Videre <span aria-hidden="true">→</span>';
    } else if (step === 3) {
      h = '<p class="k">Spørgsmål 4 af 4</p><h2 class="q">Passer det her?</h2><div class="sum">' +
        draft.items.map(function (i) { return '<div><span>' + i.q + ' × ' + R.esc(R.BYID[i.id].n) + '</span><span>' + kr(R.BYID[i.id].p * i.q) + '</span></div>'; }).join('') +
        '<div><span>Afhentning kl. ' + R.esc(draft.slot) + '</span><button type="button" data-go="1">Ret</button></div>' +
        '<div><span>' + R.esc(draft.name) + ' · ' + R.esc(draft.phone) + '</span><button type="button" data-go="2">Ret</button></div></div>' +
        '<p class="hint" style="margin-top:14px">Demo: ingen betaling og ingen rigtig ordre.</p>';
      nextBtn.innerHTML = (editing ? 'Gem ændring' : 'Bekræft bestilling') + ' <span aria-hidden="true">✓</span>';
    } else {
      var o = R.load().filter(function (x) { return x.id === R.last(); })[0] || { id: 'D-000', name: draft.name, slot: draft.slot, items: draft.items, status: 'Ny' };
      h = '<div class="receipt ' + (reduce ? '' : 'print') + '" id="rc"><p class="k">Risskov Sushi · bon ' + R.esc(o.id) + '</p><h3>Tak, ' + R.esc((o.name || '').split(' ')[0] || 'gæst') + '.</h3>' +
        '<p class="k">Afhentning</p><div class="big" id="rbig">' + (reduce ? o.slot : '00.00') + '</div><div style="border-top:2px dashed var(--ink);margin:12px 0"></div>' +
        o.items.map(function (i) { return '<div class="li"><span>' + i.q + ' × ' + R.esc(R.BYID[i.id].n) + '</span><span>' + kr(R.BYID[i.id].p * i.q) + '</span></div>'; }).join('') +
        '<div style="border-top:2px dashed var(--ink);margin:12px 0"></div><div class="li"><b>Samlet</b><b>' + kr(R.total(o.items)) + '</b></div><div class="li"><span>Status</span><span>' + R.esc(o.status) + '</span></div>' +
        '<p class="note-s">Demo: gemt kun på denne telefon, ingen betaling.</p></div>' +
        '<a class="btn ink" href="./ejer.html">Se den i køkkenets liste <span aria-hidden="true">→</span></a><div style="height:12px"></div><button class="btn ghost" type="button" id="edit">Ret afhentningstid</button>';
      nextBtn.hidden = true;
      var slotTo = o.slot;
    }
    body.innerHTML = h; body.scrollTop = 0; updateTotal();
    if (step === 4 && !reduce) slotCount($('#rbig'), slotTo);
    if (hasGsap && !reduce && !first && step !== 4) gsap.from(body.children, { y: 20, opacity: 0, duration: .6, ease: 'expo.out', stagger: .05 });
    var f = body.querySelector('input'); if (f && step === 2) { try { f.focus({ preventScroll: true }); } catch (e) {} }
  }

  function slotCount(el, label) { // tæller op til afhentningstiden
    var p = label.split('.'), to = Number(p[0]) * 60 + Number(p[1]), t0 = performance.now(), from = 16 * 60;
    (function f(t) { var x = Math.min(1, (t - t0) / 900), v = Math.round(from + (to - from) * (1 - Math.pow(1 - x, 3))); el.textContent = R.lab(v); if (x < 1) requestAnimationFrame(f); })(t0);
  }

  body.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.dataset.d) { var id = b.dataset.id, q = Math.min(20, Math.max(0, qtyOf(id) + Number(b.dataset.d))); setQty(id, q); $('#q-' + id).textContent = q; updateTotal(); err.textContent = ''; }
    else if (b.dataset.slot) { if (b.getAttribute('aria-disabled') === 'true') return; draft.slot = b.dataset.slot; body.querySelectorAll('.slot').forEach(function (s) { s.setAttribute('aria-checked', s === b); }); err.textContent = ''; }
    else if (b.dataset.go) { step = Number(b.dataset.go); render(); }
    else if (b.id === 'edit') { openFlow(R.last(), 1); }
  });

  nextBtn.addEventListener('click', function () {
    if (step === 0) { if (!draft.items.length) { err.textContent = 'Vælg mindst én menu.'; return; } }
    if (step === 1) { if (!draft.slot) { err.textContent = 'Vælg et kvarter.'; return; } var d0 = R.load(); if (R.isFull(d0.filter(function (o) { return o.id !== editing; }), draft.slot)) { err.textContent = 'Det kvarter blev lige fuldt. Vælg et andet.'; render(); return; } if (editing) { step = 3; render(); return; } }
    if (step === 2) {
      draft.name = (($('#nm') || {}).value || '').trim(); draft.phone = (($('#ph') || {}).value || '').trim();
      if (!draft.name) { err.textContent = 'Skriv dit navn.'; return; }
      if (draft.phone.replace(/\D/g, '').length < 8) { err.textContent = 'Skriv et telefonnummer med mindst 8 cifre.'; return; }
    }
    if (step === 3) { commit(); step = 4; render(); return; }
    step++; render();
  });
  backBtn.addEventListener('click', function () { if (step > 0) { step--; render(); } });
  $('#close').addEventListener('click', closeFlow);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !flow.hidden) closeFlow(); });

  function commit() {
    var data = R.load(), t = new Date().toISOString();
    if (editing) {
      var o = data.filter(function (x) { return x.id === editing; })[0];
      if (o) { if (o.slot !== draft.slot) o.changes.push({ text: 'Ændret: ' + o.slot + ' → ' + draft.slot, at: t }); o.slot = draft.slot; R.setLast(o.id); }
    } else {
      var id = R.newId(data);
      data.push({ id: id, name: draft.name, phone: draft.phone, items: draft.items, slot: draft.slot, status: 'Ny', created: t, changes: [] });
      R.setLast(id);
    }
    R.save(data);
  }
  $('#start').addEventListener('click', function () { if (!$('#start').disabled) openFlow(null, 0); });

  /* ---------- animation ---------- */
  if (hasGsap && !reduce) {
    if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
    if (typeof Lenis !== 'undefined') {
      var lenis = new Lenis({ duration: 1.1 }); window.__lenis = lenis;
      if (window.ScrollTrigger) lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); }); gsap.ticker.lagSmoothing(0);
    }
    var h1 = $('#ttl');
    if (typeof SplitType !== 'undefined') { var sp = new SplitType(h1, { types: 'chars' }); gsap.from(sp.chars, { yPercent: 110, opacity: 0, duration: 1, ease: 'expo.out', stagger: .03, delay: .15 }); }
    gsap.from('#slip', { y: 40, opacity: 0, rotate: -4, duration: 1.1, ease: 'power3.out' });
    gsap.from('.hv', { x: -30, opacity: 0, duration: 1, ease: 'expo.out', delay: .3 });
    var nxEl = $('#nx'), nxTxt = nxEl.textContent;
    if (/^\d\d\.\d\d$/.test(nxTxt)) { nxEl.textContent = '16.00'; var o0 = { v: 16 * 60 }, to = Number(nxTxt.split('.')[0]) * 60 + Number(nxTxt.split('.')[1]); gsap.to(o0, { v: to, duration: 1.4, ease: 'expo.out', delay: .5, onUpdate: function () { nxEl.textContent = R.lab(Math.round(o0.v)); } }); }
    if (window.ScrollTrigger) {
      gsap.to('[data-par]', { yPercent: 10, ease: 'none', scrollTrigger: { trigger: '.about', start: 'top bottom', end: 'bottom top', scrub: true } });
      gsap.to('#mq', { x: -520, ease: 'none', scrollTrigger: { trigger: '.mq', start: 'top bottom', end: 'bottom top', scrub: true } });
      var tms = gsap.utils.toArray('.tm'), line = $('#tli');
      if (matchMedia('(max-width: 899px)').matches) {
        gsap.set(tms.slice(1), { opacity: .1, y: 30 }); gsap.set(line, { scaleX: .05 });
        var tl = gsap.timeline({ scrollTrigger: { trigger: '#tl', start: 'top top', end: '+=140%', pin: true, scrub: .6 } });
        tl.to(line, { scaleX: 1, ease: 'none', duration: 3 }, 0);
        tms.slice(1).forEach(function (el, i) { tl.to(el, { opacity: 1, y: 0, ease: 'power3.out', duration: 1 }, .6 + i * 1.1); });
      } else { gsap.set(line, { scaleX: 1 }); gsap.from(tms, { y: 40, opacity: 0, duration: 1, ease: 'power3.out', stagger: .12, scrollTrigger: { trigger: '#tl', start: 'top 70%' } }); }
      document.querySelectorAll('.pr[data-to]').forEach(function (el) {
        var to = Number(el.dataset.to), o = { v: 0 };
        el.firstChild.nodeValue = '0';
        ScrollTrigger.create({ trigger: el, start: 'top 94%', once: true, onEnter: function () { gsap.to(o, { v: to, duration: 1.1, ease: 'expo.out', onUpdate: function () { el.firstChild.nodeValue = Math.round(o.v); } }); } });
      });
      gsap.utils.toArray('.about .tx, .prak > div').forEach(function (el) { gsap.from(el, { y: 36, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } }); });
    }
    if (matchMedia('(hover:hover)').matches) document.querySelectorAll('.btn').forEach(function (b) {
      b.addEventListener('mousemove', function (e) { var r = b.getBoundingClientRect(); gsap.to(b, { x: (e.clientX - r.left - r.width / 2) * .08, y: (e.clientY - r.top - r.height / 2) * .15, duration: .4, ease: 'power3.out' }); });
      b.addEventListener('mouseleave', function () { gsap.to(b, { x: 0, y: 0, duration: .6, ease: 'expo.out' }); });
    });
  }

  /* test/skærmbillede: #steg0 .. #steg4 åbner flowet direkte med eksempeldata */
  var m = /^#steg(\d)$/.exec(location.hash);
  if (m) {
    openFlow(null, 0); var n = Number(m[1]);
    draft.items = [{ id: 'm16', q: 1 }, { id: 'v16', q: 1 }]; draft.slot = '17.45'; draft.name = 'Ronny'; draft.phone = '12 34 56 78';
    step = n; if (n === 4) { var dd = R.load(); R.setLast(dd[0].id); } render(true);
  }
})();
