(() => {
  'use strict';

  const byId = id => document.getElementById(id);
  const form = byId('quote-form');
  const config = window.ALPHASONIC_ESTIMATOR_CONFIG;

  if (!form || !config?.pricing) {
    document.documentElement.classList.add('estimator-unavailable');
    return;
  }

  const refs = {
    service: byId('service'), projectType: byId('project-type'), quantity: byId('quantity'),
    quantityLabel: byId('quantity-label'), quantitySuffix: byId('quantity-suffix'), quantityHelp: byId('quantity-help'),
    conditionWrap: byId('condition-wrap'), materialsWrap: byId('materials-wrap'), condition: byId('condition'),
    materials: byId('materials'), timeline: byId('timeline'), send: byId('send-whatsapp'), range: byId('estimate-range'),
    mid: byId('estimate-mid'), breakdown: byId('estimate-breakdown'), status: byId('estimate-status'),
    modal: byId('quote-modal'), modalEstimate: byId('modal-estimate'), whatsappLink: byId('whatsapp-link'),
    menuToggle: document.querySelector('.menu-toggle'), primaryNav: byId('primary-nav'), clear: byId('clear-estimator')
  };

  const modalClose = document.querySelector('.modal-close');
  const modalCancel = document.querySelector('.modal-cancel');
  const quoteDialog = refs.modal?.querySelector('[role="dialog"]');
  const serviceCards = [...document.querySelectorAll('[data-service]')];
  const pricing = config.pricing;
  const storageKey = 'alphasonic-estimator-v2';
  let currentEstimate = null;
  let lastFocusedBeforeModal = null;
  let saveTimer = null;

  const rand = new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 });
  const formatMoney = value => rand.format(Math.round(value)).replace('ZAR', 'R');

  const focusableSelector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(',');

  function getFocusableElements(container) {
    if (!container) return [];

    return [...container.querySelectorAll(focusableSelector)].filter(element => {
      return (
        !element.hidden &&
        element.getAttribute('aria-hidden') !== 'true' &&
        element.offsetParent !== null
      );
    });
  }

  function trapTabFocus(container, event) {
    if (event.key !== 'Tab' || !container) return;

    const focusable = getFocusableElements(container);
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function announce(message) {
    if (!refs.status) return;
    refs.status.textContent = '';
    requestAnimationFrame(() => { refs.status.textContent = message; });
  }

  function visibleRequiredFields() {
    return [...form.querySelectorAll('[required]')].filter(el => !el.disabled && !el.hidden && !el.closest('[hidden]'));
  }

  function errorMessageFor(el) {
    if (el.validity.valueMissing) return 'Please complete this field.';
    if (el.validity.patternMismatch && el.id === 'customer-phone') return 'Enter a South African number such as 074 643 7729 or +27 74 643 7729.';
    if (el.validity.rangeUnderflow) return `Enter at least ${el.min}.`;
    return 'Please check this value.';
  }

  function setFieldValidity(el, showMessage = true) {
    if (!el) return true;
    const valid = el.checkValidity();
    el.setAttribute('aria-invalid', valid ? 'false' : 'true');

    let error = el.closest('label')?.querySelector('.field-error');
    if (!valid && showMessage) {
      if (!error) {
        error = document.createElement('small');
        error.className = 'field-error';
        error.id = `${el.id || el.name}-error`;
        error.setAttribute('role', 'alert');
        el.closest('label')?.append(error);
      }
      error.textContent = errorMessageFor(el);
      const ids = new Set((el.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean));
      ids.add(error.id);
      el.setAttribute('aria-describedby', [...ids].join(' '));
    } else if (error) {
      error.remove();
      const ids = (el.getAttribute('aria-describedby') || '').split(/\s+/).filter(id => id && id !== error.id);
      if (ids.length) el.setAttribute('aria-describedby', ids.join(' ')); else el.removeAttribute('aria-describedby');
    }
    return valid;
  }

  function populateProjectTypes(preserveValue = '') {
    const serviceKey = refs.service.value;
    refs.projectType.innerHTML = '';

    if (!serviceKey || !pricing[serviceKey]) {
      refs.projectType.disabled = true;
      refs.projectType.innerHTML = '<option value="">Choose a service first</option>';
      resetEstimate();
      return;
    }

    const serviceConfig = pricing[serviceKey];
    refs.projectType.disabled = false;
    refs.projectType.append(new Option('Select project type', ''));
    Object.entries(serviceConfig.options).forEach(([key, item]) => refs.projectType.append(new Option(item.label, key)));
    if (preserveValue && serviceConfig.options[preserveValue]) refs.projectType.value = preserveValue;

    refs.conditionWrap.hidden = !serviceConfig.showCondition;
    refs.materialsWrap.hidden = !serviceConfig.showMaterials;
    refs.quantityLabel.textContent = serviceConfig.quantityLabel;
    refs.quantitySuffix.textContent = serviceConfig.unit;
    refs.quantityHelp.textContent = serviceConfig.quantityHelp;
    refs.quantity.closest('.input-suffix-wrap').hidden = false;
    refs.quantity.required = true;

    if (refs.projectType.value) updateQuantityMode(false); else resetEstimate();
  }

  function updateQuantityMode(recalculate = true) {
    const serviceKey = refs.service.value;
    const projectKey = refs.projectType.value;
    if (!serviceKey || !projectKey || !pricing[serviceKey]?.options[projectKey]) return;

    const serviceConfig = pricing[serviceKey];
    const option = serviceConfig.options[projectKey];
    const inputWrap = refs.quantity.closest('.input-suffix-wrap');

    if (option.quantityHidden || option.mode === 'fixed') {
      inputWrap.hidden = true;
      refs.quantityHelp.textContent = 'This project type uses a planning range rather than a quantity-based calculation.';
      refs.quantity.required = false;
      refs.quantity.value = 1;
    } else {
      inputWrap.hidden = false;
      refs.quantity.required = true;
      refs.quantityLabel.textContent = option.quantityLabelOverride || serviceConfig.quantityLabel;
      refs.quantitySuffix.textContent = option.unitOverride || serviceConfig.unit;
      refs.quantityHelp.textContent = serviceConfig.quantityHelp;
      if (Number(refs.quantity.value) < 1) refs.quantity.value = '';
    }
    if (recalculate) calculateEstimate();
  }

  function materialMultiplier(serviceKey, option) {
    if (!pricing[serviceKey].showMaterials) return 1;
    if (refs.materials.value === 'standard') return option.standardMaterialsIncluded === false ? 1.45 : 1;
    if (refs.materials.value === 'client') return option.standardMaterialsIncluded === false ? 1 : 0.78;
    if (refs.materials.value === 'labour') return option.standardMaterialsIncluded === false ? 1 : 0.66;
    return 1;
  }

  function setBreakdown(index, value) {
    refs.breakdown?.children[index]?.querySelector('strong') && (refs.breakdown.children[index].querySelector('strong').textContent = value);
  }

  function calculateEstimate({ announceUpdate = false } = {}) {
    const serviceKey = refs.service.value;
    const projectKey = refs.projectType.value;
    if (!serviceKey || !projectKey || !pricing[serviceKey]?.options[projectKey]) {
      resetEstimate();
      return;
    }

    const serviceConfig = pricing[serviceKey];
    const option = serviceConfig.options[projectKey];
    const qty = option.mode === 'fixed' ? 1 : Math.max(0, Number(refs.quantity.value || 0));
    if (option.mode !== 'fixed' && qty <= 0) { resetEstimate(); return; }

    refs.range.closest('.estimate-panel')?.classList.add('is-updating');
    let low = option.low * qty;
    let high = option.high * qty;
    low *= (config.conditionMultipliers[refs.condition.value] || 1) * (config.timelineMultipliers[refs.timeline.value] || 1) * materialMultiplier(serviceKey, option);
    high *= (config.conditionMultipliers[refs.condition.value] || 1) * (config.timelineMultipliers[refs.timeline.value] || 1) * materialMultiplier(serviceKey, option);

    if (option.min) {
      low = Math.max(low, option.min);
      high = Math.max(high, option.min * 1.25);
    }

    const increment = high >= 100000 ? 1000 : high >= 10000 ? 500 : 100;
    low = Math.round(low / increment) * increment;
    high = Math.round(high / increment) * increment;
    if (high <= low) high = low + increment;
    const mid = Math.round(((low + high) / 2) / increment) * increment;
    const unit = option.unitOverride || serviceConfig.unit;

    currentEstimate = { serviceKey, serviceLabel: serviceConfig.label, projectKey, projectLabel: option.label, quantity: qty, unit, low, high, mid };
    refs.range.textContent = `${formatMoney(low)} – ${formatMoney(high)}`;
    refs.mid.textContent = `Planning figure: approximately ${formatMoney(mid)}`;
    setBreakdown(0, serviceConfig.label);
    setBreakdown(1, option.label);
    setBreakdown(2, option.mode === 'fixed' ? 'Fixed planning range' : `${qty} ${unit}`);
    setBreakdown(3, config.timelineLabels[refs.timeline.value] || 'Flexible');
    updateSendButton();

    requestAnimationFrame(() => refs.range.closest('.estimate-panel')?.classList.remove('is-updating'));
    if (announceUpdate) announce(`Estimate updated. Current range ${formatMoney(low)} to ${formatMoney(high)}.`);
  }

  function resetEstimate() {
    currentEstimate = null;
    refs.range.textContent = 'R0 – R0';
    refs.mid.textContent = 'Complete the project details to calculate an estimate.';
    refs.breakdown && [...refs.breakdown.querySelectorAll('strong')].forEach(el => { el.textContent = '—'; });
    refs.send.disabled = true;
  }

  function updateSendButton() {
    const complete = visibleRequiredFields().every(el => String(el.value || '').trim() !== '');
    refs.send.disabled = !(currentEstimate && complete);
  }

  function buildWhatsAppMessage() {
    const data = new FormData(form);
    const option = pricing[currentEstimate.serviceKey].options[currentEstimate.projectKey];
    const quantityText = option.mode === 'fixed' ? 'Not quantity-based' : `${currentEstimate.quantity} ${currentEstimate.unit}`;
    const supplyText = pricing[currentEstimate.serviceKey].showMaterials
      ? refs.materials.options[refs.materials.selectedIndex].text
      : 'To be confirmed after inspection';

    return [
      'Hello Alphasonic International,', '',
      'I used the website project estimator and would like to arrange a site evaluation / inspection.', '',
      `Name: ${data.get('customerName')}`,
      `Phone: ${data.get('customerPhone')}`,
      `Service: ${currentEstimate.serviceLabel}`,
      `Project type: ${currentEstimate.projectLabel}`,
      `Property type: ${data.get('propertyType')}`,
      `Suburb / area: ${data.get('location')}`,
      `Approx. size / quantity: ${quantityText}`,
      `Condition: ${refs.condition.options[refs.condition.selectedIndex]?.text || 'To be confirmed'}`,
      `Supply preference: ${supplyText}`,
      `Preferred timing: ${refs.timeline.options[refs.timeline.selectedIndex]?.text || 'Flexible'}`, '',
      `Website estimated range: ${formatMoney(currentEstimate.low)} – ${formatMoney(currentEstimate.high)}`,
      `Planning figure: approximately ${formatMoney(currentEstimate.mid)}`, '',
      `Project details: ${String(data.get('details') || 'No additional details supplied').trim()}`, '',
      'I understand that this is an estimated quote and that the final quote will be confirmed after a site evaluation / inspection.'
    ].join('\n');
  }

  function validateBeforeSend() {
    let firstInvalid = null;
    visibleRequiredFields().forEach(el => {
      if (!setFieldValidity(el, true) && !firstInvalid) firstInvalid = el;
    });
    if (!currentEstimate && !firstInvalid) firstInvalid = refs.quantity;
    if (firstInvalid) {
      firstInvalid.focus();
      firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      announce('Please correct the highlighted field before continuing.');
      return false;
    }
    return true;
  }

  function openModal() {
    if (!validateBeforeSend()) return;
    lastFocusedBeforeModal = document.activeElement;
    refs.whatsappLink.href = `https://wa.me/${config.whatsappNumber}?text=${encodeURIComponent(buildWhatsAppMessage())}`;
    refs.modalEstimate.textContent = `Your current planning estimate is ${formatMoney(currentEstimate.low)} – ${formatMoney(currentEstimate.high)}.`;
    refs.modal.hidden = false;
    document.body.classList.add('modal-open');
    modalClose?.focus();
  }

  function closeModal() {
    refs.modal.hidden = true;
    document.body.classList.remove('modal-open');
    (lastFocusedBeforeModal || refs.send)?.focus();
  }

  function saveFormSoon() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        const data = Object.fromEntries(new FormData(form).entries());
        localStorage.setItem(storageKey, JSON.stringify(data));
      } catch (_) { /* localStorage can be unavailable in private/restricted contexts */ }
    }, 180);
  }

  function restoreSavedForm() {
    let saved;
    try { saved = JSON.parse(localStorage.getItem(storageKey) || 'null'); } catch (_) { saved = null; }
    if (!saved || typeof saved !== 'object') return;

    if (saved.service && pricing[saved.service]) {
      refs.service.value = saved.service;
      populateProjectTypes(saved.projectType || '');
    }
    Object.entries(saved).forEach(([name, value]) => {
      if (name === 'service' || name === 'projectType') return;
      const field = form.elements.namedItem(name);
      if (field && typeof value === 'string') field.value = value;
    });
    if (refs.projectType.value) updateQuantityMode(false);
    calculateEstimate();
    updateSendButton();
  }

  function clearSavedForm() {
    try { localStorage.removeItem(storageKey); } catch (_) {}
    form.reset();
    refs.projectType.disabled = true;
    refs.projectType.innerHTML = '<option value="">Choose a service first</option>';
    refs.conditionWrap.hidden = false;
    refs.materialsWrap.hidden = false;
    form.querySelectorAll('.field-error').forEach(el => el.remove());
    form.querySelectorAll('[aria-invalid]').forEach(el => el.setAttribute('aria-invalid', 'false'));
    resetEstimate();
    refs.service.focus();
    announce('Saved estimator details cleared.');
  }

  refs.service.addEventListener('change', () => { populateProjectTypes(); saveFormSoon(); });
  refs.projectType.addEventListener('change', () => { updateQuantityMode(); saveFormSoon(); });
  form.addEventListener('input', e => {
    if (e.target.matches('input, textarea, select')) setFieldValidity(e.target, false);
    calculateEstimate(); updateSendButton(); saveFormSoon();
  });
  form.addEventListener('change', e => {
    if (e.target.matches('input, textarea, select')) setFieldValidity(e.target, false);
    calculateEstimate({ announceUpdate: true }); updateSendButton(); saveFormSoon();
  });
  form.addEventListener('focusout', e => { if (e.target.matches('[required]')) setFieldValidity(e.target, true); });
  refs.send.addEventListener('click', openModal);
  refs.clear?.addEventListener('click', clearSavedForm);

  serviceCards.forEach(card => card.addEventListener('click', () => {
    const key = card.dataset.service;
    if (!pricing[key]) return;
    refs.service.value = key;
    populateProjectTypes();
    document.querySelector('#estimator')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => refs.projectType.focus(), 350);
    saveFormSoon();
  }));

  modalClose?.addEventListener('click', closeModal);
  modalCancel?.addEventListener('click', closeModal);
  refs.modal.addEventListener('click', e => {
    if (e.target === refs.modal) closeModal();
  });

  function setMenuState(open, { returnFocus = false } = {}) {
    if (!refs.primaryNav || !refs.menuToggle) return;

    refs.primaryNav.classList.toggle('open', open);
    refs.menuToggle.setAttribute('aria-expanded', String(open));
    refs.menuToggle.setAttribute(
      'aria-label',
      open ? 'Close navigation menu' : 'Open navigation menu'
    );

    if (returnFocus) refs.menuToggle.focus();
  }

  document.addEventListener('keydown', e => {
    if (!refs.modal.hidden) {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeModal();
        return;
      }

      if (e.key === 'Tab') {
        trapTabFocus(quoteDialog || refs.modal, e);
      }

      return;
    }

    if (
      e.key === 'Escape' &&
      refs.primaryNav?.classList.contains('open')
    ) {
      e.preventDefault();
      setMenuState(false, { returnFocus: true });
    }
  });

  refs.menuToggle?.addEventListener('click', () => {
    const open = !refs.primaryNav?.classList.contains('open');
    setMenuState(Boolean(open));
  });

  refs.primaryNav?.addEventListener('click', e => {
    if (e.target.closest('a')) {
      setMenuState(false);
    }
  });

  document.addEventListener('click', e => {
    if (!refs.primaryNav?.classList.contains('open')) return;

    const target = e.target;
    if (!(target instanceof Node)) return;

    if (
      refs.primaryNav.contains(target) ||
      refs.menuToggle?.contains(target)
    ) {
      return;
    }

    setMenuState(false);
  });

  window.addEventListener('resize', () => {
    if (
      window.innerWidth > 1180 &&
      refs.primaryNav?.classList.contains('open')
    ) {
      setMenuState(false);
    }
  });

  setMenuState(false);

  const year = byId('year');
  if (year) year.textContent = new Date().getFullYear();
  restoreSavedForm();
})();


/* Project gallery viewer: separate from the estimator so project proof remains optional and lightweight. */
(() => {
  'use strict';

  const lightbox = document.getElementById('project-lightbox');
  if (!lightbox) return;

  const buttons = [...document.querySelectorAll('.project-image-button')];
  const image = document.getElementById('project-lightbox-image');
  const caption = document.getElementById('project-lightbox-caption');
  const closeButton = lightbox.querySelector('.project-lightbox-close');
  const prevButton = lightbox.querySelector('.project-lightbox-prev');
  const nextButton = lightbox.querySelector('.project-lightbox-next');

  if (!buttons.length || !image || !caption || !closeButton || !prevButton || !nextButton) return;

  let currentIndex = 0;
  let returnFocus = null;

  const lightboxFocusables = () =>
    [closeButton, prevButton, nextButton].filter(
      element => !element.disabled && !element.hidden
    );

  const trapLightboxFocus = event => {
    if (event.key !== 'Tab') return;

    const focusable = lightboxFocusables();
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const render = () => {
    const button = buttons[currentIndex];
    const thumb = button.querySelector('img');
    image.src = button.dataset.gallerySrc || thumb?.src || '';
    image.alt = thumb?.alt || 'Alphasonic International project photograph';
    caption.textContent = button.dataset.galleryCaption || thumb?.alt || '';
  };

  const open = (index, trigger) => {
    currentIndex = index;
    returnFocus = trigger;
    render();
    lightbox.hidden = false;
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.classList.add('project-lightbox-open');
    closeButton.focus();
  };

  const close = () => {
    lightbox.hidden = true;
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('project-lightbox-open');
    image.removeAttribute('src');
    if (returnFocus instanceof HTMLElement) returnFocus.focus();
  };

  const move = direction => {
    currentIndex = (currentIndex + direction + buttons.length) % buttons.length;
    render();
  };

  buttons.forEach((button, index) => {
    button.addEventListener('click', () => open(index, button));
  });

  closeButton.addEventListener('click', close);
  prevButton.addEventListener('click', () => move(-1));
  nextButton.addEventListener('click', () => move(1));

  lightbox.addEventListener('click', event => {
    if (event.target === lightbox) close();
  });

  document.addEventListener('keydown', event => {
    if (lightbox.hidden) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      move(-1);
      return;
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      move(1);
      return;
    }

    trapLightboxFocus(event);
  });
})();
