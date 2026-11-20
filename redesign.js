/* Interaction layer for the Stitch-inspired navigation, filters and quote wizard. */
(() => {
  'use strict';
  // Preserve older shared deep links from the original single-page site.
  if (document.body.classList.contains('page-index')) {
    const legacy = {'#projects':'portfolio.html','#estimator':'quote.html','#site-assessment':'quote.html'};
    const target = legacy[location.hash];
    if (target) { location.replace(target); return; }
  }

  document.querySelectorAll('.filter-tabs').forEach(group => {
    const buttons = [...group.querySelectorAll('button[data-filter]')];
    const items = [...group.parentElement.querySelectorAll('[data-category]')];
    buttons.forEach(button => button.addEventListener('click', () => {
      const category = button.dataset.filter;
      buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      items.forEach(item => { item.hidden = category !== 'all' && item.dataset.category !== category; });
    }));
  });

  const stages = [
    ['Site preparation','Assess existing conditions and prepare surfaces before installation and finishing begin.','kitchen-renovation-preparation-640.webp'],
    ['Trade installation','Carry out installation work to the agreed scope. This example shows flooring installation in progress.','kitchen-floor-tiling-progress-02-640.webp'],
    ['Surface finishing','Review the application and finish of installed materials before proceeding to handover.','kitchen-floor-tiling-progress-01-640.webp'],
    ['Completed spaces','Review the finished project and communicate any remaining requirements with the client.','kitchen-renovation-complete-02-640.webp']
  ];
  const stageButtons = [...document.querySelectorAll('button[data-stage]')];
  stageButtons.forEach(button => button.addEventListener('click', () => {
    const index = Number(button.dataset.stage);
    const [title, description, file] = stages[index];
    stageButtons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    document.getElementById('stage-kicker').textContent = 'Stage 0' + (index + 1) + ' / 04';
    document.getElementById('stage-title').textContent = title;
    document.getElementById('stage-description').textContent = description;
    const image = document.getElementById('stage-image');
    image.src = 'assets/optimized/' + file;
    image.alt = title + ' — Alphasonic project photograph';
  }));

  const form = document.getElementById('quote-form');
  const steps = [...document.querySelectorAll('.wizard-step')];
  if (!form || !steps.length) return;
  const next = document.getElementById('wizard-next');
  const back = document.getElementById('wizard-back');
  const submit = document.getElementById('send-whatsapp');
  const labels = ['Property classification','Trade discipline','Site parameters & schedule','Contact details'];
  let stepIndex = 0;
  const alert = document.createElement('p');
  alert.className = 'wizard-alert'; alert.setAttribute('role','status');
  form.querySelector('.wizard-actions').before(alert);

  const service = document.getElementById('service');
  const requested = new URLSearchParams(location.search).get('service');
  if (requested && [...service.options].some(option => option.value === requested)) {
    service.value = requested;
    service.dispatchEvent(new Event('change',{bubbles:true}));
  }

  // Progressive enhancement: native selects remain intact for validation and the WhatsApp message.
  for (const select of [document.getElementById('property-type'),service]) {
    const grid = document.createElement('div');
    grid.className = 'choice-grid';
    grid.setAttribute('role','group');
    grid.setAttribute('aria-label', select.id === 'service' ? 'Required trade discipline' : 'Property type');
    const choices = [...select.options].filter(option => option.value).map(option => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = option.textContent;
      button.setAttribute('aria-pressed', String(select.value === option.value));
      button.addEventListener('click', () => {
        select.value = option.value;
        select.setCustomValidity('');
        select.dispatchEvent(new Event('change',{bubbles:true}));
        alert.textContent = '';
      });
      grid.append(button);
      return [button,option.value];
    });
    const sync = () => choices.forEach(([button,value]) => button.setAttribute('aria-pressed',String(select.value === value)));
    select.addEventListener('change',sync);
    form.addEventListener('reset',() => setTimeout(sync,0));
    // Hide the duplicate native selector from accessibility navigation, not from form submission.
    select.closest('label').hidden = true;
    select.closest('label').after(grid);
  }

  function show(index) {
    stepIndex = index;
    steps.forEach((step,i) => { step.hidden = i !== index; });
    document.getElementById('wizard-label').textContent = 'Step ' + (index + 1) + ' of 4 / ' + labels[index];
    document.getElementById('wizard-percent').textContent = (index + 1) * 25 + '% complete';
    document.getElementById('wizard-progress').value = index + 1;
    back.hidden = index === 0;
    next.hidden = index === steps.length - 1;
    submit.hidden = index !== steps.length - 1;
    alert.textContent = '';
  }
  function validateStep(index) {
    const invalid = [...steps[index].querySelectorAll('input,select,textarea')].find(field => {
      field.setCustomValidity('');
      return !field.checkValidity() || (field.required && !field.value.trim());
    });
    if (!invalid) return true;
    alert.textContent = 'Please complete or correct the required information before continuing.';
    if (invalid.closest('[hidden]')) steps[index].querySelector('.choice-grid button')?.focus();
    else { invalid.focus(); invalid.reportValidity(); }
    return false;
  }
  next.addEventListener('click',() => {
    if (!validateStep(stepIndex)) return;
    show(stepIndex + 1);
    const first = [...steps[stepIndex].querySelectorAll('button,input,select,textarea')].find(field => !field.closest('[hidden]'));
    first?.focus();
  });
  back.addEventListener('click',() => show(stepIndex - 1));
  form.addEventListener('submit',event => {
    if (stepIndex !== steps.length - 1) {
      event.preventDefault(); event.stopImmediatePropagation();
      if (validateStep(stepIndex)) show(stepIndex + 1);
      return;
    }
    for (let i=0;i<steps.length;i++) {
      if (!validateStep(i)) {
        event.preventDefault(); event.stopImmediatePropagation(); show(i); validateStep(i); return;
      }
    }
  },true);
  document.getElementById('clear-request')?.addEventListener('click',() => show(0));
  form.querySelector('.wizard-actions').hidden = false;
  show(0);
})();
