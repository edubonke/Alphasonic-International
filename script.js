(() => {
  'use strict';

  const menuToggle = document.querySelector('.menu-toggle');
  const primaryNav = document.getElementById('primary-nav');
  function setMenuState(open, returnFocus = false) {
    primaryNav?.classList.toggle('open', open);
    menuToggle?.setAttribute('aria-expanded', String(open));
    menuToggle?.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
    if (returnFocus) menuToggle?.focus();
  }
  menuToggle?.addEventListener('click', () => setMenuState(!primaryNav?.classList.contains('open')));
  primaryNav?.addEventListener('click', event => {
    if (event.target.closest('a')) setMenuState(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && primaryNav?.classList.contains('open')) {
      event.preventDefault();
      setMenuState(false, true);
    }
  });
  document.addEventListener('click', event => {
    if (primaryNav?.classList.contains('open') &&
        !primaryNav.contains(event.target) && !menuToggle?.contains(event.target)) {
      setMenuState(false);
    }
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth > 1180) setMenuState(false);
  });
  setMenuState(false);

  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  // Keep older shared estimator links pointing to the replacement form.
  if (window.location.hash === '#estimator') {
    window.history.replaceState(null, '', '#site-assessment');
    document.getElementById('site-assessment')?.scrollIntoView({ block: 'start' });
  }

  document.querySelectorAll('video[autoplay]').forEach(video => {
    video.defaultMuted = true;
    video.muted = true;
    video.playsInline = true;
    const startPlayback = () => {
      const playback = video.play();
      // Native controls remain usable when the browser blocks autoplay.
      playback?.catch(() => {});
    };
    if (video.readyState >= 2) startPlayback();
    else video.addEventListener('canplay', startPlayback, { once: true });
  });
})();

/* Project gallery viewer: independent of the assessment form so project proof remains optional and lightweight. */
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
