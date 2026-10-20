(() => {
  'use strict';

  const form = document.getElementById('quote-form');
  const modal = document.getElementById('quote-modal');
  const summary = document.getElementById('request-summary');
  const whatsappLink = document.getElementById('whatsapp-link');
  if (!form || !modal || !summary || !whatsappLink) return;

  const fields = [...form.querySelectorAll('input, select, textarea')];
  const status = document.getElementById('request-status');
  const closeButton = modal.querySelector('.modal-close');
  const storageKey = 'alphasonic-assessment-request-v1';
  let returnFocus = null;
  let saveTimer = null;

  function announce(message) {
    if (status) status.textContent = message;
  }

  function clearFieldError(field) {
    const error = document.getElementById(`${field.id}-error`);
    if (!error) return;
    const descriptions = (field.getAttribute('aria-describedby') || '')
      .split(/\s+/).filter(id => id && id !== error.id);
    if (descriptions.length) field.setAttribute('aria-describedby', descriptions.join(' '));
    else field.removeAttribute('aria-describedby');
    error.remove();
  }

  function validateField(field, showMessage = true) {
    field.setCustomValidity('');
    if (field.required && !field.value.trim()) {
      field.setCustomValidity('Please complete this field.');
    }
    const valid = field.checkValidity();
    field.setAttribute('aria-invalid', String(!valid));
    if (valid || !showMessage) {
      clearFieldError(field);
      return valid;
    }

    let error = document.getElementById(`${field.id}-error`);
    if (!error) {
      error = document.createElement('small');
      error.id = `${field.id}-error`;
      error.className = 'field-error';
      error.setAttribute('role', 'alert');
      field.closest('label').append(error);
    }
    error.textContent = field.validity.patternMismatch && field.id === 'customer-phone'
      ? 'Enter a South African number such as 074 643 7729 or +27 74 643 7729.'
      : field.validationMessage || 'Please check this value.';
    const descriptions = new Set((field.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean));
    descriptions.add(error.id);
    field.setAttribute('aria-describedby', [...descriptions].join(' '));
    return false;
  }

  function saveDraft() {
    const draft = Object.fromEntries(fields.map(field => [field.name, field.value]));
    try { localStorage.setItem(storageKey, JSON.stringify(draft)); } catch (_) {
      // The request still works when browser storage is unavailable.
    }
  }

  function restoreDraft() {
    let draft;
    try {
      draft = JSON.parse(localStorage.getItem(storageKey) || 'null');
      localStorage.removeItem('alphasonic-estimator-v2');
    } catch (_) { return; }
    if (!draft || typeof draft !== 'object' || Array.isArray(draft)) return;
    fields.forEach(field => {
      const value = draft[field.name];
      if (typeof value !== 'string') return;
      field.value = field.maxLength > 0 ? value.slice(0, field.maxLength) : value;
    });
  }

  function requestDetails() {
    const value = name => String(form.elements.namedItem(name)?.value || '').trim();
    const selectedLabel = name => {
      const select = form.elements.namedItem(name);
      return select?.selectedOptions[0]?.textContent.trim() || '';
    };
    return [
      ['Name', value('customerName')],
      ['Phone', value('customerPhone')],
      ['Service', selectedLabel('service')],
      ['Property type', selectedLabel('propertyType')],
      ['Suburb / area', value('location')],
      ['Site address', value('siteAddress') || 'To be shared with the team'],
      ['Preferred work timing', selectedLabel('timeline')],
      ['Assessment availability', value('assessmentAvailability') || 'To be arranged'],
      ['Project details', value('details')]
    ];
  }

  function closeModal() {
    modal.hidden = true;
    document.body.classList.remove('modal-open');
    if (returnFocus?.isConnected) returnFocus.focus();
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    let firstInvalid = null;
    fields.forEach(field => {
      if (!validateField(field) && !firstInvalid) firstInvalid = field;
    });
    if (firstInvalid) {
      firstInvalid.focus();
      firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      announce('Please correct the highlighted fields before reviewing your request.');
      return;
    }

    clearTimeout(saveTimer);
    saveDraft();
    const details = requestDetails();
    const message = [
      'Hello Alphasonic International,', '',
      'I would like to request a site assessment and quote for the following project.', '',
      ...details.map(([label, value]) => `${label}: ${value}`), '',
      'Please contact me to confirm the site assessment arrangements.'
    ].join('\n');
    whatsappLink.href = `https://wa.me/${form.dataset.whatsappNumber}?text=${encodeURIComponent(message)}`;

    summary.replaceChildren();
    details.forEach(([label, value]) => {
      const term = document.createElement('dt');
      const description = document.createElement('dd');
      term.textContent = label;
      description.textContent = value;
      summary.append(term, description);
    });
    returnFocus = document.activeElement;
    modal.hidden = false;
    document.body.classList.add('modal-open');
    closeButton.focus();
    form.dispatchEvent(new CustomEvent('assessment-request-reviewed'));
  });

  function handleEdit(event) {
    if (!fields.includes(event.target)) return;
    validateField(event.target, false);
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveDraft, 180);
  }
  form.addEventListener('input', handleEdit);
  form.addEventListener('change', handleEdit);
  form.addEventListener('focusout', event => {
    if (fields.includes(event.target) && (event.target.required || event.target.value)) {
      validateField(event.target);
    }
  });

  document.getElementById('clear-request')?.addEventListener('click', () => {
    clearTimeout(saveTimer);
    try { localStorage.removeItem(storageKey); } catch (_) {}
    form.reset();
    fields.forEach(field => {
      field.setCustomValidity('');
      field.removeAttribute('aria-invalid');
      clearFieldError(field);
    });
    announce('Saved request details cleared.');
    form.elements.namedItem('service').focus();
  });

  document.querySelectorAll('.service-card[data-service]').forEach(card => {
    card.addEventListener('click', () => {
      const service = form.elements.namedItem('service');
      if (![...service.options].some(option => option.value === card.dataset.service)) return;
      service.value = card.dataset.service;
      validateField(service, false);
      document.getElementById('site-assessment')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      service.focus({ preventScroll: true });
      clearTimeout(saveTimer);
      saveDraft();
    });
  });

  closeButton.addEventListener('click', closeModal);
  modal.querySelector('.modal-cancel')?.addEventListener('click', closeModal);
  modal.addEventListener('click', event => {
    if (event.target === modal) closeModal();
  });
  document.addEventListener('keydown', event => {
    if (modal.hidden) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      closeModal();
    } else if (event.key === 'Tab') {
      const focusable = [...modal.querySelectorAll('a[href], button:not([disabled]), [tabindex="0"]')]
        .filter(element => !element.hidden && !element.closest('[hidden]'));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
  });

  restoreDraft();
})();
