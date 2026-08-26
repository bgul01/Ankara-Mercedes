/* ==============================================
   ERCAN MEHDİ MERCEDES ÖZEL SERVİS
   main.js — Vanilla JS, güvenli, erişilebilir
   ============================================== */

(function () {
  'use strict';

  /* ==================== HEADER ==================== */
  const header = document.getElementById('header');
  const hamburger = document.getElementById('hamburger');
  const nav = document.getElementById('mainNav');

  // Sticky header gölgesi
  function updateHeader() {
    if (window.scrollY > 12) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', updateHeader, { passive: true });
  updateHeader();

  // Hamburger menü
  if (hamburger && nav) {
    hamburger.addEventListener('click', function () {
      const isOpen = nav.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', String(isOpen));
      hamburger.setAttribute('aria-label', isOpen ? 'Menüyü kapat' : 'Menüyü aç');
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Menü linkine tıklayınca menüyü kapat
    nav.addEventListener('click', function (e) {
      if (e.target.classList.contains('header__nav-link')) {
        nav.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        hamburger.setAttribute('aria-label', 'Menüyü aç');
        document.body.style.overflow = '';
      }
    });

    // Dışarıya tıklayınca kapat
    document.addEventListener('click', function (e) {
      if (!header.contains(e.target) && nav.classList.contains('open')) {
        nav.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        hamburger.setAttribute('aria-label', 'Menüyü aç');
        document.body.style.overflow = '';
      }
    });

    // Escape tuşu ile kapat
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) {
        nav.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        hamburger.setAttribute('aria-label', 'Menüyü aç');
        document.body.style.overflow = '';
        hamburger.focus();
      }
    });
  }

  /* ==================== ACTIVE NAV LINK ==================== */
  const sections = document.querySelectorAll('section[id], footer[id]');
  const navLinks = document.querySelectorAll('.header__nav-link');

  function updateActiveLink() {
    let current = '';
    const scrollPos = window.scrollY + 100;

    sections.forEach(function (section) {
      if (section.offsetTop <= scrollPos) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(function (link) {
      link.classList.remove('active');
      const href = link.getAttribute('href');
      if (href === '#' + current) {
        link.classList.add('active');
      }
    });
  }

  window.addEventListener('scroll', updateActiveLink, { passive: true });

  /* ==================== LOOPING SLIDERS ==================== */
  function setupLoopingSlider(options) {
    const sliderTrack = document.getElementById(options.trackId);
    const sliderDots = document.getElementById(options.dotsId);
    if (!sliderTrack) return;

    const cards = Array.from(sliderTrack.querySelectorAll(options.cardSelector));
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let dotButtons = [];
    let autoTimer = null;
    let loopResetTimer = null;
    let resizeTimer = null;

    function getStep() {
      const card = cards[0];
      if (!card) return 300;
      const gap = parseFloat(getComputedStyle(sliderTrack).columnGap) || options.gap;
      return card.offsetWidth + gap;
    }

    function getCloneCount() {
      const step = getStep();
      const gap = parseFloat(getComputedStyle(sliderTrack).columnGap) || options.gap;
      return Math.min(cards.length, Math.max(1, Math.ceil(((sliderTrack.clientWidth + gap) / step) - 0.01)));
    }

    function getLoopPoint() {
      return cards.length * getStep();
    }

    function stopAutoPlay() {
      if (autoTimer !== null) {
        window.clearInterval(autoTimer);
        autoTimer = null;
      }
    }

    function updateDots() {
      if (!dotButtons.length || !cards.length) return;
      const rawIndex = Math.max(0, Math.round(sliderTrack.scrollLeft / getStep()));
      const activeIndex = rawIndex % cards.length;

      dotButtons.forEach(function (dot, index) {
        const isActive = index === activeIndex;
        dot.classList.toggle('active', isActive);
        dot.setAttribute('aria-current', isActive ? 'true' : 'false');
      });
    }

    function resetLoopPosition() {
      if (sliderTrack.scrollLeft < getLoopPoint() - 2) return;
      sliderTrack.scrollTo({ left: 0, behavior: 'auto' });
      updateDots();
    }

    function scheduleLoopReset() {
      window.clearTimeout(loopResetTimer);
      if (sliderTrack.scrollLeft < getLoopPoint() - 2) return;
      loopResetTimer = window.setTimeout(resetLoopPosition, 140);
    }

    function buildDots() {
      if (!sliderDots) return;
      sliderDots.replaceChildren();
      dotButtons = [];
      sliderDots.hidden = cards.length <= 1;

      cards.forEach(function (_, index) {
        const dot = document.createElement('button');
        dot.className = options.dotClass;
        dot.setAttribute('aria-label', (index + 1) + '. ' + options.dotLabel);
        dot.addEventListener('click', function () {
          stopAutoPlay();
          sliderTrack.scrollTo({
            left: index * getStep(),
            behavior: reducedMotionQuery.matches ? 'auto' : 'smooth'
          });
          startAutoPlay();
        });
        sliderDots.appendChild(dot);
        dotButtons.push(dot);
      });

      updateDots();
    }

    function rebuildClones() {
      window.clearTimeout(loopResetTimer);
      sliderTrack.scrollTo({ left: 0, behavior: 'auto' });
      sliderTrack.querySelectorAll('[data-carousel-clone]').forEach(function (clone) {
        clone.remove();
      });

      const cloneCount = getCloneCount();
      for (let index = 0; index < cloneCount; index += 1) {
        const clone = cards[index].cloneNode(true);
        clone.removeAttribute('data-reveal');
        clone.setAttribute('data-carousel-clone', 'true');
        clone.setAttribute('aria-hidden', 'true');
        // aria-hidden bir öğe odaklanabilir kalmamalı: klonu ve içindeki
        // tüm bağlantı/düğmeleri klavye sırasının dışına al.
        if (typeof clone.tabIndex === 'number') clone.tabIndex = -1;
        clone.querySelectorAll('a[href], button, [tabindex]').forEach(function (el) {
          el.tabIndex = -1;
        });
        sliderTrack.appendChild(clone);
      }
    }

    function advance() {
      if (sliderTrack.scrollWidth <= sliderTrack.clientWidth + 4) return;
      if (sliderTrack.scrollLeft >= getLoopPoint() - 2) {
        resetLoopPosition();
        return;
      }
      sliderTrack.scrollBy({ left: getStep(), behavior: 'smooth' });
    }

    function startAutoPlay() {
      stopAutoPlay();
      if (reducedMotionQuery.matches || document.hidden) return;
      autoTimer = window.setInterval(advance, 3500);
    }

    sliderTrack.addEventListener('scroll', function () {
      updateDots();
      scheduleLoopReset();
    }, { passive: true });
    sliderTrack.addEventListener('touchstart', stopAutoPlay, { passive: true });
    sliderTrack.addEventListener('touchend', startAutoPlay, { passive: true });
    sliderTrack.addEventListener('touchcancel', startAutoPlay, { passive: true });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        stopAutoPlay();
      } else {
        startAutoPlay();
      }
    });

    reducedMotionQuery.addEventListener('change', startAutoPlay);

    rebuildClones();
    buildDots();
    startAutoPlay();

    window.addEventListener('resize', function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function () {
        stopAutoPlay();
        rebuildClones();
        buildDots();
        startAutoPlay();
      }, 120);
    }, { passive: true });
  }

  setupLoopingSlider({
    trackId: 'servicesTrack',
    dotsId: 'servicesDots',
    cardSelector: '.service-card',
    dotClass: 'services__dot',
    dotLabel: 'hizmet slaytına git',
    gap: 20
  });

  setupLoopingSlider({
    trackId: 'modelsTrack',
    dotsId: 'modelsDots',
    cardSelector: '.model-card',
    dotClass: 'models__dot',
    dotLabel: 'model slaytına git',
    gap: 16
  });

  /* ==================== SCROLL REVEAL ==================== */
  const revealElements = document.querySelectorAll('[data-reveal]');

  if (revealElements.length && 'IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    revealElements.forEach(function (el) {
      revealObserver.observe(el);
    });
  } else {
    // IntersectionObserver yoksa hepsini göster
    revealElements.forEach(function (el) {
      el.classList.add('revealed');
    });
  }

  /* ==================== SMOOTH SCROLL ==================== */
  document.addEventListener('click', function (e) {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;

    const targetId = link.getAttribute('href').slice(1);
    if (!targetId) return;

    const target = document.getElementById(targetId);
    if (!target) return;

    e.preventDefault();
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });

    // Klavye kullanıcıları için odağı hedef bölüme taşı (skip-link vb.)
    if (!target.hasAttribute('tabindex')) {
      target.setAttribute('tabindex', '-1');
    }
    target.focus({ preventScroll: true });
  });

  /* ==================== GALLERY GÖSTER / GİZLE ==================== */
  const galleryWrap = document.getElementById('galeri-wrap');
  const galleryMore = document.getElementById('galeri-more');

  if (galleryWrap && galleryMore) {
    const galleryMoreText = galleryMore.querySelector('.gallery__more-text');

    galleryMore.addEventListener('click', function () {
      const collapsed = galleryWrap.classList.toggle('is-collapsed');
      galleryMore.setAttribute('aria-expanded', collapsed ? 'false' : 'true');

      if (galleryMoreText) {
        galleryMoreText.textContent = collapsed ? 'Diğerlerini Gör' : 'Daha Az Göster';
      }

      // Kapatırken galeri başlığına geri dön, kullanıcı boşlukta kalmasın
      if (collapsed) {
        const section = document.getElementById('galeri');
        if (section) {
          const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          section.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
        }
      }
    });
  }

  /* ==================== GALLERY LAZY ENHANCE ==================== */
  // Tüm galeri imglerinde loading=lazy zaten var; burada ek bir şey gerekmez.
  // img elementleri doğrudan HTML'de tanımlanmış, JS ile DOM yazmıyoruz.

})();
