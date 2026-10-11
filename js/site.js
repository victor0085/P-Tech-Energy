/* P-Tech Energy Solutions — shared site script */
(function () {
  'use strict';

  /* ---------- 1. ONLINE PICTURES ----------
     Every picture on the site is listed here. To swap one, change its URL.
     Pictures only load while the device is connected (Wi-Fi or mobile data),
     and only when they scroll near the screen, which saves mobile data.
     If a picture can't load, the branded navy/orange panel stays in its place. */
  var P = function (id, w) { return 'https://images.unsplash.com/photo-' + id + '?auto=format&fit=crop&w=' + (w || 900) + '&q=70'; };
  var IMAGES = {
    'hero-solar-field':       P('1509391366360-2e959784a276', 1600),
    'about-team':             P('1581092160562-40aa08e78837', 1000),
    'solar-panel':            P('1508514177221-188b1cf16e9d'),
    'battery':                P('1473341304170-971dccb5ac1e'),
    'inverter':               P('1581092918056-0c4c3acd3789'),
    'satellite-monitoring':   P('1558618666-fcd25c85cd64'),
    'installation-tools':     P('1504307651254-35680f356dfd'),
    'project-residential':    P('1613665813446-82a78c468a1d'),
    'project-commercial':     P('1497435334941-8c899ee9e8e9'),
    'project-off-grid':       P('1509391366360-2e959784a276')
  };
  var MAP_URL = 'https://www.google.com/maps?q=' + encodeURIComponent('7 Okesuna St, Shomolu, Lagos') + '&output=embed';

  function loadOne(el) {
    if (!navigator.onLine) return;                    // wait until connected
    if (el.dataset.state === 'loading' || el.dataset.state === 'done') return;
    var url = el.dataset.src || (el.dataset.img === 'map' ? MAP_URL : IMAGES[el.dataset.img]);
    if (!url) return;
    el.dataset.state = 'loading';
    if (el.tagName === 'IMG') {
      el.onload = function () { el.dataset.state = 'done'; el.classList.add('is-loaded'); };
      el.onerror = function () { el.dataset.state = 'failed'; };
      el.src = url;
    } else { el.src = url; el.dataset.state = 'done'; }
  }

  var io = null;
  function watchImages(root) {
    var els = (root || document).querySelectorAll('[data-img]');
    els.forEach(function (el) {
      if (io) io.observe(el); else loadOne(el);
    });
  }
  function initImages() {
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) loadOne(e.target); });
      }, { rootMargin: '250px' });
    }
    watchImages();
    window.addEventListener('online', function () {
      document.querySelectorAll('[data-img]').forEach(function (el) {
        if (el.dataset.state === 'failed') el.dataset.state = '';
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight + 250) loadOne(el);
      });
      toast('Back online — loading pictures.');
    });
    window.addEventListener('offline', function () { toast('You are offline. Pictures will load when you reconnect.'); });
  }

  /* ---------- Helpers ---------- */
  var toastTimer;
  function toast(msg) {
    var t = document.getElementById('toast'); if (!t) return;
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.classList.remove('show'); }, 3200);
  }
  function setLoading(btn, on) {
    if (!btn) return; btn.classList.toggle('loading', on); btn.disabled = on;
  }
  function fieldError(id, msg) {
    var span = document.querySelector('[data-error-for="' + id + '"]');
    var input = document.getElementById(id);
    if (span) span.textContent = msg || '';
    if (input && input.closest('.field')) input.closest('.field').classList.toggle('invalid', !!msg);
  }
  function safeStore(op, key, val) {
    try { return op === 'get' ? localStorage.getItem(key) : localStorage.setItem(key, val); } catch (e) { return null; }
  }
  window.PTech = { toast: toast, setLoading: setLoading, fieldError: fieldError, watchImages: watchImages,
    WHATSAPP: '2348033260469', EMAIL: 'ptechenergy1@gmail.com' };

  /* ---------- 2. NAV ---------- */
  function initNav() {
    var toggle = document.getElementById('navToggle'), nav = document.getElementById('siteNav');
    if (toggle && nav) {
      toggle.addEventListener('click', function () {
        var open = nav.classList.toggle('open'); toggle.setAttribute('aria-expanded', open);
      });
    }
    var here = (location.pathname.split('/').pop() || 'index.html');
    document.querySelectorAll('.site-nav ul a').forEach(function (a) {
      if (a.getAttribute('href') === here) a.setAttribute('aria-current', 'page');
    });
    var y = document.getElementById('year'); if (y) y.textContent = new Date().getFullYear();
  }

  /* ---------- 3. PROJECTS ---------- */
  /* Sample entries — replace with your real jobs. */
  var PROJECTS = [
    { cat: 'residential', title: '4 kW home backup system', where: 'Lekki, Lagos', size: '4 kW solar · 10 kWh battery', text: 'Hybrid inverter and lithium battery replacing a petrol generator for a family home.' },
    { cat: 'commercial', title: 'Restaurant freezer backup', where: 'Ikeja, Lagos', size: '8 kW solar · 20 kWh battery', text: 'Battery sized around cold-room loads so stock stays safe through long outages.' },
    { cat: 'off-grid', title: 'Rural clinic power', where: 'Taraba State', size: '12 kW solar · 30 kWh battery', text: 'Fully off-grid system with satellite monitoring for a site hours from the nearest town.' },
    { cat: 'commercial', title: 'Office rooftop array', where: 'Victoria Island, Lagos', size: '15 kW solar · 25 kWh battery', text: 'Roof-mounted panels cutting daytime diesel use across a multi-tenant office.' },
    { cat: 'residential', title: 'Duplex solar and CCTV', where: 'Surulere, Lagos', size: '5 kW solar · 10 kWh battery', text: 'Solar, battery and a four-camera CCTV setup installed together in one visit.' },
    { cat: 'off-grid', title: 'Solar street lighting', where: 'Ogun State', size: '24 lamps', text: 'Standalone solar street lights for a community road, with no grid connection needed.' }
  ];
  var CAT_LABEL = { residential: 'Residential', commercial: 'Commercial', 'off-grid': 'Off-grid' };
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  function initProjects() {
    var mount = document.getElementById('projectsMount'); if (!mount) return;
    var bar = document.getElementById('filterBar');
    function render(filter) {
      var list = PROJECTS.filter(function (p) { return filter === 'all' || p.cat === filter; });
      if (!list.length) { mount.innerHTML = '<p class="state-msg">No projects in this category yet.</p>'; return; }
      mount.innerHTML = list.map(function (p) {
        return '<div class="card"><div class="card-media"><img data-img="project-' + p.cat + '" alt="' + esc(p.title) + '" loading="lazy"></div>' +
          '<div class="card-body"><span class="card-tag">' + CAT_LABEL[p.cat] + '</span><h3>' + esc(p.title) + '</h3>' +
          '<p>' + esc(p.text) + '</p><ul class="card-specs"><li><span>Location</span><strong>' + esc(p.where) + '</strong></li>' +
          '<li><span>System</span><strong>' + esc(p.size) + '</strong></li></ul></div></div>';
      }).join('');
      watchImages(mount);
    }
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('.filter-btn'); if (!b) return;
      bar.querySelectorAll('.filter-btn').forEach(function (x) { x.classList.toggle('active', x === b); });
      render(b.dataset.filter);
    });
    render('all');
  }

  /* ---------- 4. CONTACT FORM ----------
     There's no server, so a valid message opens WhatsApp with the text filled in.
     To send by email/CRM instead, replace the body of sendMessage() with a fetch() to your endpoint. */
  function initContact() {
    var form = document.getElementById('contactForm'); if (!form) return;
    var status = document.getElementById('contactStatus'), btn = document.getElementById('contactSubmitBtn');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = function (id) { return document.getElementById(id).value.trim(); };
      var ok = true;
      ['cName', 'cEmail', 'cMessage'].forEach(function (id) { fieldError(id, ''); });
      if (!v('cName')) { fieldError('cName', 'Please enter your name.'); ok = false; }
      if (!/^\S+@\S+\.\S+$/.test(v('cEmail'))) { fieldError('cEmail', 'Enter a valid email, like name@example.com.'); ok = false; }
      if (v('cMessage').length < 10) { fieldError('cMessage', 'Please write a short message (at least 10 characters).'); ok = false; }
      if (!ok) { status.className = 'form-status err'; status.textContent = 'Please fix the highlighted fields.'; return; }
      setLoading(btn, true);
      var interest = document.getElementById('cInterest').selectedOptions[0].text;
      var text = 'Hello P-Tech, my name is ' + v('cName') + '.\nInterested in: ' + interest + '\nPhone: ' + (v('cPhone') || 'n/a') +
        '\nEmail: ' + v('cEmail') + '\n\n' + v('cMessage');
      setTimeout(function () {
        setLoading(btn, false);
        window.open('https://wa.me/' + PTech.WHATSAPP + '?text=' + encodeURIComponent(text), '_blank', 'noopener');
        status.className = 'form-status ok';
        status.textContent = 'WhatsApp is opening with your message ready. Press send there to reach us.';
        form.reset();
      }, 500);
    });
  }

  /* ---------- 5. NEWSLETTER (demo — connect to your mailing list) ---------- */
  function initNewsletter() {
    var form = document.getElementById('newsletterForm'); if (!form) return;
    var status = document.getElementById('newsletterStatus'), btn = document.getElementById('newsletterBtn');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = document.getElementById('newsletterEmail').value.trim();
      if (!/^\S+@\S+\.\S+$/.test(email)) { status.textContent = 'Enter a valid email address.'; return; }
      setLoading(btn, true);
      setTimeout(function () { setLoading(btn, false); status.textContent = 'Thanks! You are on the list.'; form.reset(); }, 600);
    });
  }

  /* ---------- 6. COOKIE BANNER ---------- */
  function initCookies() {
    var b = document.getElementById('cookieBanner'); if (!b) return;
    if (!safeStore('get', 'ptech-cookie')) b.classList.add('show');
    function done(v) { safeStore('set', 'ptech-cookie', v); b.classList.remove('show'); }
    document.getElementById('cookieAccept').addEventListener('click', function () { done('yes'); });
    document.getElementById('cookieDecline').addEventListener('click', function () { done('no'); });
    document.getElementById('cookieLearnMore').addEventListener('click', function (e) { e.preventDefault(); toast('Privacy policy page coming soon.'); });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initNav(); initImages(); initProjects(); initContact(); initNewsletter(); initCookies();
  });
})();
