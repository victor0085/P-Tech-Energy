/* P-Tech Energy Solutions — quote estimator, quote sheet, PDF download */
(function () {
  'use strict';

  /* Illustrative pricing model. Replace with your real costs before relying on it. */
  var ESTIMATE_ASSUMPTIONS = {
    fuelCostPerKwh: 600,      // ₦ per kWh from a petrol/diesel generator
    sunHours: 4.5,            // peak sun hours per day
    systemLoss: 0.8,          // real-world efficiency
    panelWatts: 550,
    costPerKw: 450000,        // ₦ per kW of solar installed (panels, mounting, wiring, labour)
    costPerKwhBattery: 400000,// ₦ per kWh of lithium storage
    inverterPerKva: 120000,   // ₦ per kVA of hybrid inverter
    priceRange: 0.12,         // ± range shown around the estimate
    fuelSavedShare: 0.85,     // share of fuel spend that solar replaces
    property: { residential: { solar: 1.0, battery: 1.0 }, commercial: { solar: 1.15, battery: 1.0 }, 'off-grid': { solar: 1.25, battery: 1.2 } },
    backup: { essential: 0.5, full: 0.8, heavy: 1.1 }
  };
  var LABELS = {
    property: { residential: 'Residential home', commercial: 'Commercial / office', 'off-grid': 'Off-grid / rural site' },
    backup: { essential: 'Essentials only (lights, fans, TV, phone charging)', full: 'Whole home or office', heavy: 'Heavy load (air-conditioners, pumps, machines)' },
    timeframe: { asap: 'As soon as possible', '1-3months': 'Within 1–3 months', planning: 'Just planning / comparing prices' },
    roof: { roof: 'On the roof', ground: 'On the ground / open land', unsure: 'Not sure yet' }
  };
  var CO = { name: 'P-Tech Energy Solutions Nig Ltd', rc: 'RC/BN No: 9638834', addr: '7, Okesuna St, Okesuna Bus Stop, Shomolu, Lagos State',
    phones: '08033260469, 08023623320, 08112867193', email: 'ptechenergy1@gmail.com' };

  var A = ESTIMATE_ASSUMPTIONS;
  var $ = function (id) { return document.getElementById(id); };
  var lastEstimate = null, lastQuote = null;

  function naira(n, sym) { return (sym || '₦') + Math.round(n).toLocaleString('en-NG'); }
  function short(n, sym) {
    sym = sym || '₦';
    if (n >= 1e6) return sym + (Math.round(n / 1e5) / 10).toLocaleString('en-NG') + 'M';
    return sym + (Math.round(n / 1e4) * 1e4).toLocaleString('en-NG');
  }
  function roundUp(n, step) { return Math.ceil(n / step - 1e-9) * step; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function checked(name) { var el = document.querySelector('input[name="' + name + '"]:checked'); return el ? el.value : ''; }

  function compute(spend, property, backup) {
    var p = A.property[property], dailyKwh = Math.max(2, spend / 30 / A.fuelCostPerKwh);
    var kw = Math.max(1, roundUp(dailyKwh / (A.sunHours * A.systemLoss) * p.solar, 0.5));
    var battery = Math.max(2.5, roundUp(dailyKwh * A.backup[backup] * p.battery, 0.5));
    var kva = Math.max(1, roundUp(kw * 1.25, 0.5));
    var cost = kw * A.costPerKw + battery * A.costPerKwhBattery + kva * A.inverterPerKva;
    var lo = cost * (1 - A.priceRange), hi = cost * (1 + A.priceRange);
    var yearlySaving = spend * 12 * A.fuelSavedShare;
    return { spend: spend, property: property, backup: backup, dailyKwh: dailyKwh, kw: kw, panels: Math.ceil(kw * 1000 / A.panelWatts),
      battery: battery, kva: kva, costLow: lo, costHigh: hi, paybackLow: lo / yearlySaving, paybackHigh: hi / yearlySaving };
  }
  function years(a, b) {
    var f = function (x) { return Math.max(1, Math.round(x * 2) / 2); };
    var lo = f(a), hi = f(b);
    return lo === hi ? lo + ' years' : lo + ' – ' + hi + ' years';
  }

  /* ---------- Step 1: instant estimate ---------- */
  function updateEstimate() {
    var range = $('billRange'), num = $('billNumber');
    var spend = Math.min(500000, Math.max(10000, Number(num.value) || 10000));
    $('billValue').textContent = naira(spend);
    var e = lastEstimate = compute(spend, checked('property'), checked('backup'));
    $('resSystemSize').textContent = e.kw + ' kW';
    $('resSystemNote').textContent = 'About ' + e.panels + ' solar panels (550 W each). They make your power in the daytime.';
    $('resBattery').textContent = e.battery + ' kWh';
    $('resCost').textContent = short(e.costLow) + ' – ' + short(e.costHigh);
    $('resPayback').textContent = years(e.paybackLow, e.paybackHigh);
    var summary = $('qEstimateSummary'); if (summary) summary.value = e.kw + ' kW / ' + e.battery + ' kWh';
    range.value = spend;
  }
  function initEstimator() {
    var range = $('billRange'), num = $('billNumber');
    range.addEventListener('input', function () { num.value = range.value; updateEstimate(); });
    num.addEventListener('input', function () { range.value = num.value; updateEstimate(); });
    num.addEventListener('blur', function () { num.value = Math.min(500000, Math.max(10000, Number(num.value) || 10000)); updateEstimate(); });
    document.querySelectorAll('input[name="property"],input[name="backup"]').forEach(function (r) { r.addEventListener('change', updateEstimate); });
    updateEstimate();
  }

  /* ---------- Step 2: details form ---------- */
  function validate() {
    var ok = true, v = function (id) { return $(id).value.trim(); };
    ['qName', 'qPhone', 'qEmail', 'qAddress'].forEach(function (id) { PTech.fieldError(id, ''); });
    if (v('qName').length < 2) { PTech.fieldError('qName', 'Please enter your full name.'); ok = false; }
    if (v('qPhone').replace(/\D/g, '').length < 10) { PTech.fieldError('qPhone', 'Enter a phone number with at least 10 digits, e.g. 08012345678.'); ok = false; }
    if (v('qEmail') && !/^\S+@\S+\.\S+$/.test(v('qEmail'))) { PTech.fieldError('qEmail', 'That email looks incomplete. Use a format like name@example.com, or leave it blank.'); ok = false; }
    if (v('qAddress').length < 4) { PTech.fieldError('qAddress', 'Tell us the area and city where we will install, e.g. Shomolu, Lagos.'); ok = false; }
    return ok;
  }
  function refNumber() {
    var d = new Date(), pad = function (n) { return String(n).padStart(2, '0'); };
    var rnd = Math.random().toString(36).slice(2, 6).toUpperCase();
    return 'PT-' + String(d.getFullYear()).slice(2) + pad(d.getMonth() + 1) + pad(d.getDate()) + '-' + rnd;
  }
  function fmtDate(d) { return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }); }

  function buildQuote() {
    var e = lastEstimate, v = function (id) { return $(id).value.trim(); };
    var now = new Date(), valid = new Date(now.getTime() + 14 * 864e5);
    var extras = Array.prototype.map.call(document.querySelectorAll('input[name="extras"]:checked'), function (x) { return x.value; });
    return {
      ref: refNumber(), date: fmtDate(now), valid: fmtDate(valid), e: e,
      name: v('qName'), phone: v('qPhone'), email: v('qEmail'), address: v('qAddress'),
      timeframe: LABELS.timeframe[$('qTimeframe').value], roof: LABELS.roof[$('qRoof').value],
      finance: $('qFinance').checked, extras: extras, notes: v('qNotes')
    };
  }

  function rows(pairs, cls) {
    return '<table class="qs-table ' + (cls || '') + '">' + pairs.map(function (p) { return '<tr><th>' + esc(p[0]) + '</th><td>' + esc(p[1]) + '</td></tr>'; }).join('') + '</table>';
  }
  function estimatePairs(q) {
    var e = q.e;
    return [
      ['Solar panels', e.kw + ' kW (about ' + e.panels + ' x 550 W panels)'],
      ['Battery storage', e.battery + ' kWh lithium'],
      ['Inverter', 'About ' + e.kva + ' kVA hybrid inverter'],
      ['Estimated price', short(e.costLow) + ' – ' + short(e.costHigh)],
      ['Estimated payback', years(e.paybackLow, e.paybackHigh)]
    ];
  }
  function needsPairs(q) {
    return [
      ['Monthly fuel spend', naira(q.e.spend)],
      ['Property type', LABELS.property[q.e.property]],
      ['Backup needed', LABELS.backup[q.e.backup]]
    ];
  }
  function sitePairs(q) {
    var p = [['Name', q.name], ['Phone', q.phone]];
    if (q.email) p.push(['Email', q.email]);
    p.push(['Site address', q.address], ['Mounting', q.roof], ['Install timing', q.timeframe],
      ['Installment plan', q.finance ? 'Yes, please include options' : 'Not needed']);
    return p;
  }

  function renderSheet(q) {
    var extras = q.extras.length ? q.extras.join(', ') : 'None selected';
    $('quoteSheet').innerHTML =
      '<div class="qs-head"><img src="assets/images/logo-full.png" alt="P-Tech Energy Solutions Nig Ltd">' +
      '<div class="qs-meta"><strong>Quotation</strong>Ref: ' + esc(q.ref) + '<br>Date: ' + esc(q.date) + '<br>Valid until: ' + esc(q.valid) + '</div></div>' +
      '<div class="qs-sec"><h3>Prepared for</h3>' + rows(sitePairs(q)) + '</div>' +
      '<div class="qs-sec"><h3>What you told us</h3>' + rows(needsPairs(q)) + '</div>' +
      '<div class="qs-sec"><h3>Recommended system (estimate)</h3>' + rows(estimatePairs(q), 'shaded') + '</div>' +
      '<div class="qs-sec"><h3>Extra services requested</h3><p>' + esc(extras) + '</p></div>' +
      (q.notes ? '<div class="qs-sec"><h3>Your notes</h3><p>' + esc(q.notes) + '</p></div>' : '') +
      '<p class="qs-note">This is an automatic estimate, not a firm price. The final price is confirmed after a site visit and depends on your actual load, roof and equipment choice. Prices are in Nigerian naira.</p>' +
      '<p class="qs-note">' + esc(CO.name) + ' · ' + esc(CO.rc) + ' · ' + esc(CO.addr) + '<br>Phone: ' + esc(CO.phones) + ' · Email: ' + esc(CO.email) + '</p>';
  }

  function plainText(q) {
    var l = ['QUOTE REQUEST ' + q.ref, ''];
    sitePairs(q).concat(needsPairs(q), estimatePairs(q)).forEach(function (p) { l.push(p[0] + ': ' + p[1]); });
    l.push('Extras: ' + (q.extras.length ? q.extras.join(', ') : 'none'));
    if (q.notes) l.push('Notes: ' + q.notes);
    return l.join('\n');
  }

  function onSubmit(ev) {
    ev.preventDefault();
    var status = $('quoteStatus'), btn = $('quoteSubmitBtn');
    if (!validate()) { status.className = 'form-status err'; status.textContent = 'Some details are missing or need fixing. Check the fields marked in red.'; return; }
    status.className = 'form-status'; status.textContent = '';
    PTech.setLoading(btn, true);
    setTimeout(function () {
      PTech.setLoading(btn, false);
      lastQuote = buildQuote(); renderSheet(lastQuote);
      var box = $('quoteResult'); box.hidden = false;
      box.scrollIntoView({ behavior: 'smooth', block: 'start' });
      PTech.toast('Your quote sheet is ready.');
    }, 600);
  }

  /* ---------- Step 3: download / print / send ---------- */
  function loadScript(src) {
    return new Promise(function (res, rej) { var s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
  }
  function loadLogo() {
    return new Promise(function (res) {
      var i = new Image();
      i.onload = function () {
        try { var c = document.createElement('canvas'); c.width = i.naturalWidth; c.height = i.naturalHeight; c.getContext('2d').drawImage(i, 0, 0);
          res({ data: c.toDataURL('image/png'), w: i.naturalWidth, h: i.naturalHeight }); } catch (e) { res(null); }
      };
      i.onerror = function () { res(null); }; i.src = 'assets/images/logo-full.png';
    });
  }

  async function downloadPdf() {
    var q = lastQuote; if (!q) return;
    var btn = $('btnPdf'); PTech.setLoading(btn, true);
    try {
      if (!window.jspdf) await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
      var logo = await loadLogo();
      var doc = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4' });
      var W = 210, M = 16, y = 14, NAVY = [11, 42, 111], ORANGE = [242, 140, 26], GREY = [90, 103, 132];
      var money = function (n) { return short(n, 'NGN '); };           // the PDF font has no ₦ glyph
      var fix = function (s) { return String(s).replace(/₦/g, 'NGN ').replace(/–/g, '-'); };
      var ensure = function (h) { if (y + h > 280) { doc.addPage(); y = 16; } };

      if (logo) { var lh = 18, lw = lh * logo.w / logo.h; doc.addImage(logo.data, 'PNG', M, y, lw, lh); }
      doc.setFont('helvetica', 'bold'); doc.setFontSize(20); doc.setTextColor.apply(doc, NAVY);
      doc.text('QUOTATION', W - M, y + 7, { align: 'right' });
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor.apply(doc, GREY);
      doc.text('Ref: ' + q.ref, W - M, y + 12, { align: 'right' });
      doc.text('Date: ' + q.date + '   Valid until: ' + q.valid, W - M, y + 16.5, { align: 'right' });
      y += 22; doc.setDrawColor.apply(doc, ORANGE); doc.setLineWidth(0.8); doc.line(M, y, W - M, y); y += 8;

      var section = function (title) { ensure(14); doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor.apply(doc, NAVY);
        doc.text(title, M, y); y += 2; doc.setDrawColor(221, 227, 238); doc.setLineWidth(0.3); doc.line(M, y, W - M, y); y += 5.5; };
      var row = function (k, val, shade) {
        var lines = doc.splitTextToSize(fix(val), W - M * 2 - 56); var h = lines.length * 4.6 + 3; ensure(h);
        if (shade) { doc.setFillColor(243, 246, 251); doc.rect(M, y - 4.2, W - M * 2, h, 'F'); }
        doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor.apply(doc, GREY); doc.text(fix(k), M + 2, y);
        doc.setFont('helvetica', 'bold'); doc.setTextColor(28, 39, 64); doc.text(lines, M + 56, y); y += h;
      };

      section('Prepared for'); sitePairs(q).forEach(function (p) { row(p[0], p[1]); }); y += 3;
      section('What you told us'); needsPairs(q).forEach(function (p) { row(p[0], p[1]); }); y += 3;
      section('Recommended system (estimate)');
      var e = q.e, est = [['Solar panels', e.kw + ' kW (about ' + e.panels + ' x 550 W panels)'], ['Battery storage', e.battery + ' kWh lithium'],
        ['Inverter', 'About ' + e.kva + ' kVA hybrid inverter'], ['Estimated price', money(e.costLow) + ' - ' + money(e.costHigh)],
        ['Estimated payback', years(e.paybackLow, e.paybackHigh)]];
      est.forEach(function (p, i) { row(p[0], p[1], i % 2 === 0); }); y += 3;
      section('Extra services requested'); row('Services', q.extras.length ? q.extras.join(', ') : 'None selected');
      if (q.notes) { y += 3; section('Your notes'); row('Notes', q.notes); }

      y += 6; ensure(34); doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor.apply(doc, GREY);
      var disc = doc.splitTextToSize('This is an automatic estimate, not a firm price. The final price is confirmed after a site visit and depends on your actual load, roof and equipment choice.', W - M * 2);
      doc.text(disc, M, y); y += disc.length * 4 + 3;
      doc.text(CO.name + ' | ' + CO.rc, M, y); y += 4.2;
      doc.text(CO.addr, M, y); y += 4.2;
      doc.text('Phone: ' + CO.phones + '   Email: ' + CO.email, M, y);

      doc.save('P-Tech-Quote-' + q.ref + '.pdf');
      PTech.toast('Quote downloaded as PDF.');
    } catch (err) {
      PTech.toast('PDF could not be created (are you online?). Opening the print dialog — choose "Save as PDF".');
      setTimeout(function () { window.print(); }, 900);
    }
    PTech.setLoading(btn, false);
  }

  function sendWhatsApp() { if (lastQuote) window.open('https://wa.me/' + PTech.WHATSAPP + '?text=' + encodeURIComponent(plainText(lastQuote)), '_blank', 'noopener'); }
  function sendEmail() {
    if (!lastQuote) return;
    location.href = 'mailto:' + PTech.EMAIL + '?subject=' + encodeURIComponent('Quote request ' + lastQuote.ref) + '&body=' + encodeURIComponent(plainText(lastQuote));
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (!$('estimator')) return;
    initEstimator();
    $('quoteForm').addEventListener('submit', onSubmit);
    $('btnPdf').addEventListener('click', downloadPdf);
    $('btnPrint').addEventListener('click', function () { window.print(); });
    $('btnWhatsapp').addEventListener('click', sendWhatsApp);
    $('btnEmail').addEventListener('click', sendEmail);
    $('btnEdit').addEventListener('click', function () { $('quoteForm').scrollIntoView({ behavior: 'smooth' }); });
  });
})();
