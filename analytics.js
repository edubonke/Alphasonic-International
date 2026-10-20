(() => {
  'use strict';

  const MEASUREMENT_ID = 'G-P7XPQTSGKJ';
  function track(eventName, params = {}) {
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, { ...params, send_to: MEASUREMENT_ID });
    }
  }

  function initAnalyticsTracking() {
    const form = document.getElementById('quote-form');
    const service = document.getElementById('service');
    const timeline = document.getElementById('timeline');
    let requestStarted = false;
    // Category values only: never collect customer details or free text.
    const requestContext = () => ({
      service: service?.value || 'unknown',
      timeline: timeline?.value || 'unknown'
    });
    function markRequestStarted(source) {
      if (requestStarted) return;
      requestStarted = true;
      track('assessment_request_started', { source });
    }

    form?.addEventListener('input', () => markRequestStarted('form'));
    form?.addEventListener('change', () => markRequestStarted('form'));
    form?.addEventListener('assessment-request-reviewed', () => {
      track('assessment_request_reviewed', requestContext());
    });
    service?.addEventListener('change', () => {
      if (service.value) track('service_selected', { service: service.value, source: 'assessment_dropdown' });
    });
    document.querySelectorAll('.service-card[data-service]').forEach(card => {
      card.addEventListener('click', () => {
        markRequestStarted('service_card');
        track('service_selected', { service: card.dataset.service, source: 'service_card' });
      });
    });

    document.getElementById('whatsapp-link')?.addEventListener('click', () => {
      track('whatsapp_quote_clicked', requestContext());
      // A WhatsApp handoff; the visitor still needs to press Send in WhatsApp.
      track('generate_lead', { ...requestContext(), method: 'whatsapp_quote' });
    });
    document.querySelectorAll('.project-image-button').forEach((button, index) => {
      button.addEventListener('click', () => track('portfolio_viewed', { image_position: index + 1 }));
    });
    document.addEventListener('click', event => {
      const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (!link) return;
      const href = link.getAttribute('href') || '';
      if (href === '#site-assessment') track('assessment_cta_clicked');
      else if (href.startsWith('https://wa.me/') && link.id !== 'whatsapp-link') track('whatsapp_direct_clicked');
      else if (href.startsWith('tel:')) track('phone_clicked');
      else if (href.startsWith('mailto:')) track('email_clicked');
      else if (link.closest('.footer-socials') && href.startsWith('https://www.facebook.com/')) {
        track('social_clicked', { platform: 'facebook' });
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAnalyticsTracking, { once: true });
  } else initAnalyticsTracking();
})();
