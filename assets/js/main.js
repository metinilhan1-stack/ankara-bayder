/* ==========================================================================
   Ankara Doğubayazıtlılar Derneği (BAY-DER) — arayüz betikleri
   Giriş animasyonu + kaydırma efektleri + mobil aksiyonlar
   ========================================================================== */

(function () {
  'use strict';

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var header = document.getElementById('header');
  var loader = document.getElementById('loader');

  /* ---------------- Giriş örtüsü + hero yazıları ----------------
     İlk ziyarette 1 sn'lik şık açılış; aynı oturumun tekrarında
     "çat diye" doğrudan açılır. */
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
    function finish() {
      if (finished) return;
      finished = true;
      loader.classList.add('loader--done');
      setTimeout(revealHero, 720);
      try { sessionStorage.setItem('bayderBoot', '1'); } catch (e) {}
    }
    var ready = new Promise(function (res) { res(); });
    if (document.readyState === 'complete') ready = Promise.resolve();
    else {
      window.addEventListener('load', function () { ready = Promise.resolve(); }, { once: true });
    }
    Promise.race([ready, new Promise(function (r) { setTimeout(r, 900); })]).then(finish);
  }

  /* ---------------- Üst menü: kaydırma durumu ---------------- */
  function onScroll() {
    if (header) header.classList.toggle('scrolled', window.scrollY > 40);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------------- Mobil menü ---------------- */
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

  /* ---------------- Okuma ilerleme çubuğu + hızlı çubuk ---------------- */
  var progress = document.getElementById('progress');
  var quickbar = document.getElementById('quickbar');
  var ticking = false;
  function onProgress() {
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    var p = max > 0 ? window.scrollY / max : 0;
    if (progress) progress.style.transform = 'scaleX(' + p + ')';
    if (quickbar) {
      var nearEnd = doc.scrollHeight - window.scrollY - window.innerHeight < 170;
      quickbar.classList.toggle('hide', nearEnd);
    }
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { requestAnimationFrame(onProgress); ticking = true; }
  }, { passive: true });
  onProgress();

  /* ---------------- Kaydırma ile görünürlük animasyonları ---------------- */
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

  /* ---------------- Sayaç animasyonu ---------------- */
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

  /* ---------------- Paylaş (Web Share API) ---------------- */
  var shareBtn = document.getElementById('shareBtn');
  var toast = document.getElementById('toast');
  var toastTimer = null;
  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 2400);
  }
  if (shareBtn) {
    shareBtn.addEventListener('click', function () {
      var data = {
        title: document.title,
        text: 'Ankara Doğubayazıtlılar Derneği (BAY-DER) — başkentte buluşuyoruz.',
        url: location.href
      };
      if (navigator.share) {
        navigator.share(data).catch(function () {});
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(location.href).then(function () {
          showToast('Bağlantı kopyalandı');
        });
      }
    });
  }
})();
