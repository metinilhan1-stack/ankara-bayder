/* ==========================================================================
   Ankara Doğubayazıtlılar Derneği (BAY-DER) — küçük arayüz betikleri
   ========================================================================== */

(function () {
  'use strict';

  /* ------------------------------------------------------------------
   * YAYIN ÖNCESİ GÜNCELLENECEK SABİTLER (YER TUTUCU)
   * WhatsApp numarası: ülke kodu ile, başında 0 olmadan yazın.
   * Örnek: "9053XXXXXXXX" (053X… değil!)   — boş bırakılırsa form
   * e-posta ile gönderilir.
   * ------------------------------------------------------------------ */
  var WHATSAPP = '';              // örn. "905XXXXXXXXX"
  var DERNEK_EMAIL = 'info@ankaradogubayazitlilar.org';

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- Üst menü: kaydırma durumu ---------------- */
  var header = document.getElementById('header');
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
  if (nav) {
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeMenu();
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMenu();
  });
  window.addEventListener('resize', function () {
    if (window.innerWidth > 920) closeMenu();
  });

  /* ---------------- Kaydırma ile görünürlük animasyonları ---------------- */
  var revealEls = document.querySelectorAll('.reveal');
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
      var val = Math.round(target * eased);
      el.textContent = val.toLocaleString('tr-TR') + suffix;
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = target.toLocaleString('tr-TR') + suffix;
    }
    requestAnimationFrame(tick);
  }
  var counters = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window && counters.length) {
    var cObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          cObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { cObs.observe(c); });
  }

  /* ---------------- Üyelik formu: WhatsApp / e-posta ---------------- */
  var form = document.getElementById('joinForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var fd = new FormData(form);
      var ad = (fd.get('ad') || '').trim();
      var tel = (fd.get('telefon') || '').trim();
      var bag = (fd.get('baglantı') || '').trim();
      var mesaj = (fd.get('mesaj') || '').trim();

      if (!ad || !tel) {
        form.querySelector('.form-legal').textContent = 'Lütfen ad soyad ve telefon alanlarını doldurun.';
        return;
      }

      var body = 'Merhaba, üye olmak istiyorum.\n\n' +
        'Ad Soyad: ' + ad + '\n' +
        'Telefon: ' + tel +
        (bag ? '\nDoğubayazıt bağlantısı: ' + bag : '') +
        (mesaj ? '\nMesaj: ' + mesaj : '') +
        '\n\n(Bu mesaj BAY-DER web sitesinden gönderildi.)';

      if (WHATSAPP) {
        window.open('https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(body), '_blank', 'noopener');
      } else {
        var mailto = 'mailto:' + DERNEK_EMAIL +
          '?subject=' + encodeURIComponent('Üyelik Başvurusu — ' + ad) +
          '&body=' + encodeURIComponent(body);
        window.location.href = mailto;
      }

      form.reset();
      var note = form.querySelector('.form-legal');
      note.textContent = 'Başvurunuz alındı. Yönetim kurulumuz en kısa sürede sizinle iletişime geçecek.';
      note.style.color = '#0f766e';
      note.style.fontWeight = '700';
      note.style.opacity = '1';
    });
  }
})();
