(() => {
  'use strict';

  const MEASUREMENT_ID = 'G-P7XPQTSGKJ';

  function track(eventName, params = {}) {
    if (typeof window.gtag !== 'function') return;

    window.gtag('event', eventName, {
      ...params,
      send_to: MEASUREMENT_ID
    });
  }

  function initAnalyticsTracking() {
    const form = document.getElementById('quote-form');
    const service = document.getElementById('service');
    const projectType = document.getElementById('project-type');
    const condition = document.getElementById('condition');
    const timeline = document.getElementById('timeline');
    const estimateRange = document.getElementById('estimate-range');
    const quoteModal = document.getElementById('quote-modal');
    const quoteWhatsApp = document.getElementById('whatsapp-link');

    let estimatorStarted = false;
    let estimateTimer = null;
    let lastEstimateSignature = '';

    function estimatorContext() {
      return {
        service: service?.value || 'unknown',
        project_type: projectType?.value || 'unknown',
        condition: condition?.value || 'unknown',
        timeline: timeline?.value || 'unknown'
      };
    }

    function markEstimatorStarted(source = 'form') {
      if (estimatorStarted) return;
      estimatorStarted = true;

      track('estimator_started', {
        source
      });
    }

    /*
      Estimator interactions.
      No names, phone numbers, locations or project descriptions
      are sent to Google Analytics.
    */
    form?.addEventListener('input', () => {
      markEstimatorStarted('form');
    });

    form?.addEventListener('change', () => {
      markEstimatorStarted('form');
    });

    service?.addEventListener('change', () => {
      if (!service.value) return;

      track('service_selected', {
        service: service.value,
        source: 'estimator_dropdown'
      });
    });

    document.querySelectorAll('.service-card[data-service]').forEach(card => {
      card.addEventListener('click', () => {
        const selectedService = card.dataset.service;
        if (!selectedService) return;

        markEstimatorStarted('service_card');

        track('service_selected', {
          service: selectedService,
          source: 'service_card'
        });
      });
    });

    /*
      Track meaningful calculated estimates.

      The displayed Rand figure is used only internally to recognise
      when the estimate has actually changed. The monetary amount is
      not sent as an Analytics parameter.
    */
    if (estimateRange) {
      const estimateObserver = new MutationObserver(() => {
        clearTimeout(estimateTimer);

        estimateTimer = setTimeout(() => {
          const displayedRange =
            (estimateRange.textContent || '').trim();

          if (
            !displayedRange ||
            displayedRange === 'R0 – R0' ||
            displayedRange === 'R0 - R0'
          ) {
            return;
          }

          const context = estimatorContext();

          const signature = [
            context.service,
            context.project_type,
            context.condition,
            context.timeline,
            displayedRange
          ].join('|');

          if (signature === lastEstimateSignature) return;

          lastEstimateSignature = signature;

          track('estimate_calculated', context);
        }, 900);
      });

      estimateObserver.observe(estimateRange, {
        childList: true,
        characterData: true,
        subtree: true
      });
    }

    /*
      Quote disclaimer opening.
      Observing the modal prevents false events when validation
      stops the modal from opening.
    */
    if (quoteModal) {
      let modalWasOpen = !quoteModal.hidden;

      const modalObserver = new MutationObserver(() => {
        const modalIsOpen = !quoteModal.hidden;

        if (modalIsOpen && !modalWasOpen) {
          track('quote_modal_opened', estimatorContext());
        }

        modalWasOpen = modalIsOpen;
      });

      modalObserver.observe(quoteModal, {
        attributes: true,
        attributeFilter: ['hidden']
      });
    }

    /*
      The strongest website conversion:
      customer continues from the estimate to WhatsApp.
    */
    quoteWhatsApp?.addEventListener('click', () => {
      const context = estimatorContext();

      track('whatsapp_quote_clicked', context);

      track('generate_lead', {
        ...context,
        method: 'whatsapp_quote'
      });
    });

    /*
      Portfolio engagement.
    */
    document.querySelectorAll('.project-image-button').forEach(
      (button, index) => {
        button.addEventListener('click', () => {
          track('portfolio_viewed', {
            image_position: index + 1
          });
        });
      }
    );

    /*
      Site-wide CTA and contact tracking.
    */
    document.addEventListener('click', event => {
      const target =
        event.target instanceof Element
          ? event.target
          : null;

      if (!target) return;

      const link = target.closest('a[href]');
      if (!link) return;

      const rawHref = link.getAttribute('href') || '';

      if (rawHref === '#estimator') {
        track('estimator_cta_clicked');
        return;
      }

      if (
        rawHref.startsWith('https://wa.me/') &&
        link.id !== 'whatsapp-link'
      ) {
        track('whatsapp_direct_clicked');
        return;
      }

      if (rawHref.startsWith('tel:')) {
        track('phone_clicked');
        return;
      }

      if (rawHref.startsWith('mailto:')) {
        track('email_clicked');
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener(
      'DOMContentLoaded',
      initAnalyticsTracking,
      { once: true }
    );
  } else {
    initAnalyticsTracking();
  }
})();
