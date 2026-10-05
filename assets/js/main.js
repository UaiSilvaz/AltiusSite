(() => {
  'use strict';
  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const prefersReducedMotion = motionPreference.matches;
  const mobileViewport = window.matchMedia('(max-width: 900px)');
  const header = $('#siteHeader');
  const menuToggle = $('#menuToggle');
  const mobileMenu = $('#mobileMenu');
  const dock = $('.mobile-dock');
  let menuScrollY = 0;

  // Native scrolling keeps touch momentum and anchor navigation in one system.
  $$('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const id = link.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (!target) return;
      event.preventDefault();
      closeMobileMenu();
      target.scrollIntoView({ behavior: motionPreference.matches ? 'instant' : 'smooth', block: 'start' });
      history.replaceState(null, '', `#${id}`);
    });
  });

  const updateHeader = () => header?.classList.toggle('scrolled', window.scrollY > 24);
  window.addEventListener('scroll', updateHeader, { passive: true });
  updateHeader();

  function openMobileMenu() {
    menuScrollY = window.scrollY;
    mobileMenu.inert = false;
    mobileMenu.setAttribute('aria-hidden', 'false');
    mobileMenu.classList.add('active');
    menuToggle.classList.add('active');
    menuToggle.setAttribute('aria-expanded', 'true');
    menuToggle.setAttribute('aria-label', 'Fechar menu');
    document.body.classList.add('menu-open');
    document.body.style.top = `-${menuScrollY}px`;
    $('main').inert = true;
    $('.site-footer').inert = true;
    if (dock) dock.inert = true;
  }
  function closeMobileMenu() {
    if (!mobileMenu.classList.contains('active')) return;
    mobileMenu.classList.remove('active');
    mobileMenu.inert = true;
    mobileMenu.setAttribute('aria-hidden', 'true');
    menuToggle.classList.remove('active');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Abrir menu');
    document.body.classList.remove('menu-open');
    document.body.style.top = '';
    $('main').inert = false;
    $('.site-footer').inert = false;
    if (dock) dock.inert = false;
    window.scrollTo({ top: menuScrollY, behavior: 'instant' });
    menuToggle.focus({ preventScroll: true });
  }
  menuToggle?.addEventListener('click', () => mobileMenu.classList.contains('active') ? closeMobileMenu() : openMobileMenu());
  document.addEventListener('keydown', (event) => {
    if (!mobileMenu.classList.contains('active')) return;
    if (event.key === 'Escape') { closeMobileMenu(); return; }
    if (event.key !== 'Tab') return;
    const focusable = [menuToggle, ...$$('a', mobileMenu)];
    const index = focusable.indexOf(document.activeElement);
    if (event.shiftKey && index <= 0) { event.preventDefault(); focusable.at(-1).focus(); }
    else if (!event.shiftKey && (index === focusable.length - 1 || index < 0)) { event.preventDefault(); menuToggle.focus(); }
  });
  mobileViewport.addEventListener('change', () => { if (!mobileViewport.matches) closeMobileMenu(); });

  // One-time, compositor-friendly entry animations. Content stays visible if JS fails.
  const runningAnimations = new Set();
  if (!prefersReducedMotion && 'IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(({ isIntersecting, target }) => {
        if (!isIntersecting) return;
        observer.unobserve(target);
        if (motionPreference.matches || !target.animate) return;
        const animation = target.animate([
          { opacity: 0.55, transform: 'translateY(14px)' },
          { opacity: 1, transform: 'translateY(0)' }
        ], { duration: 420, easing: 'cubic-bezier(.2,.7,.2,1)' });
        runningAnimations.add(animation);
        animation.finished.finally(() => runningAnimations.delete(animation)).catch(() => {});
      });
    }, { threshold: 0.06 });
    $$('.reveal, .split-text').forEach(element => revealObserver.observe(element));
  }
  motionPreference.addEventListener('change', () => {
    if (motionPreference.matches) runningAnimations.forEach(animation => animation.cancel());
    syncVideo();
  });

  // Only load the decorative video on larger screens; pause outside the viewport.
  const video = $('.hero__video');
  let heroVisible = true;
  function syncVideo() {
    const allowed = !mobileViewport.matches && !motionPreference.matches && !navigator.connection?.saveData;
    if (!allowed || !heroVisible || document.hidden) { video?.pause(); return; }
    const source = $('source', video);
    if (!source.hasAttribute('src')) { source.src = source.dataset.src; video.load(); }
    video.play().catch(() => {});
  }
  if (video) {
    new IntersectionObserver(([entry]) => { heroVisible = entry.isIntersecting; syncVideo(); }).observe($('#inicio'));
    mobileViewport.addEventListener('change', syncVideo);
    document.addEventListener('visibilitychange', syncVideo);
    syncVideo();
  }

  // Touch-friendly services rail, with equivalent button and keyboard controls.
  const track = $('#solutionsTrack');
  const cards = $$('.solution-card', track);
  const prev = $('#servicePrev');
  const next = $('#serviceNext');
  const position = $('#servicePosition');
  let activeService = 0;
  function updateServicePosition() {
    const left = track.getBoundingClientRect().left;
    activeService = cards.reduce((best, card, index) =>
      Math.abs(card.getBoundingClientRect().left - left) < Math.abs(cards[best].getBoundingClientRect().left - left) ? index : best, 0);
    position.textContent = `${String(activeService + 1).padStart(2, '0')} / ${String(cards.length).padStart(2, '0')}`;
    prev.disabled = activeService === 0;
    next.disabled = activeService === cards.length - 1;
  }
  function moveService(direction) {
    const card = cards[Math.max(0, Math.min(cards.length - 1, activeService + direction))];
    const left = card.getBoundingClientRect().left - track.getBoundingClientRect().left + track.scrollLeft;
    track.scrollTo({ left, behavior: motionPreference.matches ? 'instant' : 'smooth' });
  }
  prev.addEventListener('click', () => moveService(-1));
  next.addEventListener('click', () => moveService(1));
  track.addEventListener('scroll', updateServicePosition, { passive: true });
  track.addEventListener('keydown', event => {
    if (event.target !== track || !mobileViewport.matches) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); moveService(event.key === 'ArrowRight' ? 1 : -1); }
  });
  window.addEventListener('resize', updateServicePosition, { passive: true });
  updateServicePosition();

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
    const supportInterests = ['Monitoramento ou reconexão de inversor', 'Manutenção e suporte técnico'];
    const contactNumber = supportInterests.includes(data.get('interest'))
      ? config.supportWhatsappNumber
      : config.whatsappNumber;
    const whatsapp = String(contactNumber || config.whatsappNumber || '').replace(/\D/g, '');
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
