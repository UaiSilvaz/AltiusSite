(() => {
  'use strict';

  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Initial state
  window.addEventListener('load', () => {
    document.body.classList.add('is-loaded');
    if (window.gsap && !prefersReducedMotion) initHeroAnimation();
  });

  // Smooth scroll
  let lenis = null;
  if (window.Lenis && !prefersReducedMotion && window.innerWidth > 991) {
    lenis = new Lenis({ duration: 1.05, smoothWheel: true, wheelMultiplier: 0.9 });
    const raf = (time) => { lenis.raf(time); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }

  $$('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const target = $(link.getAttribute('href'));
      if (!target) return;
      event.preventDefault();
      closeMobileMenu();
      if (lenis) lenis.scrollTo(target, { offset: -72 });
      else target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
  });

  // Header behavior
  const header = $('#siteHeader');
  let lastScroll = window.scrollY;
  const updateHeader = () => {
    const y = window.scrollY;
    header?.classList.toggle('scrolled', y > 30);
    header?.classList.toggle('header-hidden', y > lastScroll && y > 500);
    lastScroll = y;
  };
  window.addEventListener('scroll', updateHeader, { passive: true });
  updateHeader();

  // Mobile menu
  const menuToggle = $('#menuToggle');
  const mobileMenu = $('#mobileMenu');
  function openMobileMenu() {
    menuToggle?.classList.add('active');
    menuToggle?.setAttribute('aria-expanded', 'true');
    mobileMenu?.classList.add('active');
    mobileMenu?.setAttribute('aria-hidden', 'false');
    document.body.classList.add('menu-open');
  }
  function closeMobileMenu() {
    menuToggle?.classList.remove('active');
    menuToggle?.setAttribute('aria-expanded', 'false');
    mobileMenu?.classList.remove('active');
    mobileMenu?.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('menu-open');
  }
  menuToggle?.addEventListener('click', () => mobileMenu?.classList.contains('active') ? closeMobileMenu() : openMobileMenu());

  function initHeroAnimation() {
    if (!window.gsap) return;
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.from('.title-line > span', { yPercent: 110, duration: 1.05, stagger: 0.12 })
      .from('.hero__text', { y: 20, opacity: 0, duration: 0.75 }, '-=0.55')
      .from('.hero__actions', { y: 20, opacity: 0, duration: 0.75 }, '-=0.5')
      .from('.hero__bottom', { y: 18, opacity: 0, duration: 0.7 }, '-=0.4');
  }

  // GSAP scroll animation with IntersectionObserver fallback
  if (window.gsap && window.ScrollTrigger && !prefersReducedMotion) {
    gsap.registerPlugin(ScrollTrigger);

    $$('.reveal').forEach((element) => {
      gsap.fromTo(element, { y: 48, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.95, ease: 'power3.out',
        scrollTrigger: { trigger: element, start: 'top 88%', once: true }
      });
    });

    $$('.split-text').forEach((element) => {
      gsap.fromTo(element, { y: 38, opacity: 0 }, {
        y: 0, opacity: 1, duration: 1.05, ease: 'power3.out',
        scrollTrigger: { trigger: element, start: 'top 86%', once: true }
      });
    });

    gsap.to('.hero__video', {
      scale: 1.05, yPercent: 4, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });

    gsap.to('.hero__glow', {
      xPercent: 25, yPercent: 20, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 }
    });

    $$('.project-card img').forEach((img) => {
      gsap.fromTo(img, { scale: 1.12 }, {
        scale: 1, ease: 'none',
        scrollTrigger: { trigger: img.closest('.project-card'), start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });
  } else {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add('visible'));
    }, { threshold: 0.12 });
    $$('.reveal, .split-text').forEach((element) => observer.observe(element));
  }

  // Animated counters
  const counterObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const element = entry.target;
      const target = Number(element.dataset.counter || 0);
      const duration = 1100;
      const start = performance.now();
      const step = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        element.textContent = Math.round(target * eased);
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      observer.unobserve(element);
    });
  }, { threshold: 0.7 });
  $$('[data-counter]').forEach((counter) => counterObserver.observe(counter));

  // Magnetic buttons
  if (!prefersReducedMotion && window.matchMedia('(pointer: fine)').matches && window.innerWidth > 991) {
    $$('[data-magnetic]').forEach((element) => {
      element.addEventListener('mousemove', (event) => {
        const rect = element.getBoundingClientRect();
        const x = event.clientX - rect.left - rect.width / 2;
        const y = event.clientY - rect.top - rect.height / 2;
        element.style.transform = `translate(${x * 0.14}px, ${y * 0.14}px)`;
      });
      element.addEventListener('mouseleave', () => element.style.transform = 'translate(0, 0)');
    });

    $$('[data-tilt]').forEach((card) => {
      card.addEventListener('mousemove', (event) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(900px) rotateX(${-y * 4}deg) rotateY(${x * 4}deg) translateY(-4px)`;
      });
      card.addEventListener('mouseleave', () => card.style.transform = '');
    });
  }

  // Solar calculator
  const billRange = $('#billRange');
  const billValue = $('#billValue');
  const annualSavings = $('#annualSavings');
  const systemSize = $('#systemSize');
  const panelCount = $('#panelCount');
  let propertyType = 'residencial';
  const typeFactors = { residencial: 1, comercial: 0.95, rural: 1.08 };
  const formatBRL = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);

  function updateCalculator() {
    const bill = Number(billRange?.value || 650);
    const factor = typeFactors[propertyType] || 1;
    const savings = bill * 12 * 0.85 * factor;
    const kwp = Math.max(1.6, bill / 125 * factor);
    const panels = Math.ceil((kwp * 1000) / 550);
    if (billValue) billValue.textContent = bill.toLocaleString('pt-BR');
    if (annualSavings) annualSavings.textContent = formatBRL(savings);
    if (systemSize) systemSize.textContent = `${kwp.toFixed(1).replace('.', ',')} kWp`;
    if (panelCount) panelCount.textContent = `${Math.max(4, panels - 1)}–${panels + 1}`;
    if (billRange) {
      const pct = ((bill - Number(billRange.min)) / (Number(billRange.max) - Number(billRange.min))) * 100;
      billRange.style.setProperty('--range-progress', `${pct}%`);
    }
  }
  billRange?.addEventListener('input', updateCalculator);
  $$('.property-option').forEach((button) => {
    button.addEventListener('click', () => {
      $$('.property-option').forEach((item) => {
        item.classList.remove('active');
        item.setAttribute('aria-checked', 'false');
      });
      button.classList.add('active');
      button.setAttribute('aria-checked', 'true');
      propertyType = button.dataset.type;
      updateCalculator();
    });
  });
  updateCalculator();

  // FAQ accordion
  $$('.faq-item button').forEach((button) => {
    button.addEventListener('click', () => {
      const item = button.closest('.faq-item');
      const isActive = item.classList.contains('active');
      $$('.faq-item').forEach((faq) => {
        faq.classList.remove('active');
        faq.querySelector('button')?.setAttribute('aria-expanded', 'false');
      });
      if (!isActive) {
        item.classList.add('active');
        button.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // Contact form: WhatsApp when configured; Instagram fallback
  const form = $('#contactForm');
  const formFeedback = $('#formFeedback');
  const copyToast = $('#copyToast');
  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const bill = Number(billRange?.value || 650);
    const message = [
      'Olá, equipe Altius! Gostaria de solicitar uma análise.',
      '',
      `Nome: ${data.get('name')}`,
      `Telefone: ${data.get('phone')}`,
      `Cidade: ${data.get('city')}`,
      `Interesse: ${data.get('interest')}`,
      `Conta média informada: R$ ${bill.toLocaleString('pt-BR')}/mês`,
      `Mensagem: ${data.get('message') || 'Não informada'}`
    ].join('\n');

    const config = window.ALTIUS_CONFIG || {};
    const whatsapp = String(config.whatsappNumber || '').replace(/\D/g, '');
    if (whatsapp.length >= 12) {
      window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
      if (formFeedback) formFeedback.textContent = 'Abrindo o WhatsApp para concluir o contato…';
      return;
    }

    try {
      await navigator.clipboard.writeText(message);
      copyToast?.classList.add('show');
      setTimeout(() => copyToast?.classList.remove('show'), 3500);
      if (formFeedback) formFeedback.textContent = 'Mensagem copiada. Cole no direct do Instagram que será aberto.';
    } catch {
      if (formFeedback) formFeedback.textContent = 'Abra o Instagram da Altius e envie os dados preenchidos.';
    }
    setTimeout(() => window.open(config.instagramUrl || 'https://www.instagram.com/altius_energia/', '_blank', 'noopener'), 450);
  });

  // Floating WhatsApp button
  const whatsappFloat = $('#whatsappFloat');
  if (whatsappFloat) {
    const config = window.ALTIUS_CONFIG || {};
    const whatsapp = String(config.whatsappNumber || '').replace(/\D/g, '');
    const message = 'Olá, equipe Altius! Gostaria de solicitar um orçamento.';
    whatsappFloat.href = whatsapp.length >= 12
      ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    whatsappFloat.addEventListener('click', () => {
      whatsappFloat.querySelector('.whatsapp-float__badge')?.remove();
      whatsappFloat.querySelector('.whatsapp-float__message')?.classList.add('is-read');
    });
  }

  // Footer year
  const currentYear = $('#currentYear');
  if (currentYear) currentYear.textContent = new Date().getFullYear();
})();
