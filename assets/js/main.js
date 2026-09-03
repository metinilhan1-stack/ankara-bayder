/* ==========================================================================
   Ankara Doğubayazıtlılar Derneği (BAY-DER)
   Giriş + parçacıklar + scroll efektleri + mobil alt navigasyon
   ========================================================================== */

(function () {
  'use strict';

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var header = document.getElementById('header');
  var loader = document.getElementById('loader');

  /* ---------------- Giriş örtüsü + hero yazıları ---------------- */
  function revealHero() {
    var els = document.querySelectorAll('.hero .reveal');
    els.forEach(function (el, i) {
      el.style.setProperty('--d', (0.05 + i * 0.13) + 's');
      el.classList.add('in');
    });
  }

  var booted = false;
  try { booted = sessionStorage.getItem('bayderBoot') === '1'; } catch (e) {}

  if (prefersReduced || booted || !loader) {
    if (loader) loader.classList.add('loader--done');
    revealHero();
  } else {
    var finished = false;
    var MIN_MS = 5200;
    var t0 = performance.now();
    function finish() {
      if (finished) return;
      finished = true;
      loader.classList.add('loader--done');
      setTimeout(revealHero, 600);
      try { sessionStorage.setItem('bayderBoot', '1'); } catch (e) {}
    }
    function finishAfterRemainder() {
      var remain = Math.max(0, MIN_MS - (performance.now() - t0));
      setTimeout(finish, remain);
    }
    window.addEventListener('load', finishAfterRemainder, { once: true });
    window.setTimeout(finishAfterRemainder, 3500);
  }

  /* ---------------- Başlık durumu ---------------- */
  function onScroll() {
    if (header) header.classList.toggle('scrolled', window.scrollY > 40);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------------- Mobil menü (hamburger) ---------------- */
  var navToggle = document.getElementById('navToggle');
  var nav = document.getElementById('nav');
  function closeMenu() {
    document.body.classList.remove('menu-open');
    if (header) header.classList.remove('menu-open');
    if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
  }
  if (navToggle) {
    navToggle.addEventListener('click', function () {
      var open = document.body.classList.toggle('menu-open');
      if (header) header.classList.toggle('menu-open', open);
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }
  if (nav) nav.addEventListener('click', function (e) { if (e.target.closest('a')) closeMenu(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
  window.addEventListener('resize', function () { if (window.innerWidth > 920) closeMenu(); });

  /* ---------------- Okuma ilerleme çubuğu ---------------- */
  var progress = document.getElementById('progress');
  var raf = false;
  function updateBar() {
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    var p = max > 0 ? window.scrollY / max : 0;
    if (progress) progress.style.transform = 'scaleX(' + p + ')';
    raf = false;
  }
  window.addEventListener('scroll', function () {
    if (!raf) { requestAnimationFrame(updateBar); raf = true; }
  }, { passive: true });
  updateBar();

  /* ---------------- Reveal (scroll) ---------------- */
  var revealEls = document.querySelectorAll('.reveal:not(.hero .reveal)');
  if ('IntersectionObserver' in window && !prefersReduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------------- Sayaçlar ---------------- */
  function animateCount(el) {
    var target = parseInt(el.getAttribute('data-count'), 10) || 0;
    var suffix = el.getAttribute('data-suffix') || '';
    var dur = 1400;
    var start = null;
    function tick(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString('tr-TR') + suffix;
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = target.toLocaleString('tr-TR') + suffix;
    }
    requestAnimationFrame(tick);
  }
  var counters = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window && counters.length) {
    var cObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { animateCount(entry.target); cObs.unobserve(entry.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { cObs.observe(c); });
  }

  /* ---------------- Yıldız / ışık parçacıkları ---------------- */
  function seeded() {
    var s = 2463534242;
    return function () {
      s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
      return ((s >>> 0) / 4294967296);
    };
  }
  function buildFx(containerId, count, drift) {
    var box = document.getElementById(containerId);
    if (!box || prefersReduced) return;
    var rnd = seeded();
    var warm = ['#ffe9b3', '#ffd98f', '#e8f4ef', '#ffffff', '#bff0e3'];
    for (var i = 0; i < count; i++) {
      var s = document.createElement('span');
      s.className = 'fx-star';
      var size = (drift ? 1 + rnd() * 2.2 : 1.5 + rnd() * 2.6).toFixed(1);
      s.style.width = size + 'px';
      s.style.height = size + 'px';
      s.style.left = (rnd() * 98).toFixed(1) + '%';
      s.style.top = (rnd() * 96).toFixed(1) + '%';
      s.style.background = warm[(rnd() * warm.length) | 0];
      s.style.setProperty('--td', (drift ? 7 + rnd() * 8 : 3 + rnd() * 6).toFixed(2) + 's');
      s.style.setProperty('--dd', (-rnd() * 10).toFixed(2) + 's');
      if (drift) s.style.setProperty('--dy', (20 - rnd() * 60).toFixed(0) + 'px');
      box.appendChild(s);
    }
  }
  var wide = window.innerWidth >= 861;
  buildFx('heroFx', wide ? 26 : 10, false);
  buildFx('storyFx', 12, true);
  buildFx('socialFx', 12, false);

  /* ---------------- Yolculuk çizgisi ilerlemesi ---------------- */
  var journey = document.getElementById('journey');
  function updateJourney() {
    if (!journey) return;
    var r = journey.getBoundingClientRect();
    var vh = window.innerHeight || 1;
    var hit = (vh * 0.65 - r.top) / Math.max(r.height, 1);
    var p = Math.min(Math.max(hit, 0), 1);
    journey.style.setProperty('--j', p.toFixed(3));
  }
  var jRaf = false;
  window.addEventListener('scroll', function () {
    if (!jRaf && journey) { requestAnimationFrame(updateJourney); jRaf = true; }
  }, { passive: true });
  window.addEventListener('resize', updateJourney, { passive: true });
  updateJourney();

  /* ---------------- Mobil alt navigasyon: aktif bölüm ---------------- */
  var barLinks = document.querySelectorAll('.bottombar a');
  var barTargets = ['hero', 'hakkimizda', 'etkinlikler', 'firmalar', 'iletisim'].map(function (id) {
    return document.getElementById(id);
  });
  var barTicking = false;
  function updateBottomNav() {
    var vh = window.innerHeight;
    var pos = window.scrollY + vh * 0.35;
    var activeId = 'hero';
    barTargets.forEach(function (sec, idx) {
      if (sec && sec.offsetTop <= pos) activeId = barTargets[idx].id;
    });
    // footer/sosyal üzerinde iletişim aktif kalsın
    barLinks.forEach(function (a) {
      var on = a.getAttribute('data-sec') === activeId;
      a.classList.toggle('active', on);
      if (on) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
    barTicking = false;
  }
  window.addEventListener('scroll', function () {
    if (!barTicking) { requestAnimationFrame(updateBottomNav); barTicking = true; }
  }, { passive: true });
  window.addEventListener('resize', updateBottomNav, { passive: true });
  updateBottomNav();
})();
