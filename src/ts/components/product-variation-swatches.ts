type Cleanup = () => void;

type SwatchVisual = { kind: 'color'; value: string } | { kind: 'image'; value: string };

const UPLOADS_PATH = '/wp-content/uploads/2025/12/';

const SWATCH_VISUALS: Readonly<Record<string, Readonly<Record<string, SwatchVisual>>>> = {
  pa_veneer: {
    jesion: { kind: 'image', value: `${UPLOADS_PATH}jesion.jpg` },
    olcha: { kind: 'image', value: `${UPLOADS_PATH}olcha.jpg` },
    sosna: { kind: 'image', value: `${UPLOADS_PATH}sosna.jpg` },
  },
  pa_cable: {
    natural: { kind: 'image', value: `${UPLOADS_PATH}k2.jpg` },
    twist: { kind: 'image', value: `${UPLOADS_PATH}k1.jpg` },
    vertigo: { kind: 'image', value: `${UPLOADS_PATH}k3.jpg` },
  },
  pa_canopy: {
    biala: { kind: 'color', value: '#f7f4ed' },
    czarna: { kind: 'color', value: '#171717' },
    drewniana: { kind: 'image', value: `${UPLOADS_PATH}Bez-nazwy-2drewno.jpg` },
    mosiadz: { kind: 'image', value: `${UPLOADS_PATH}Bez-nazwy-2mosiadz.jpg` },
  },
};

function getAttributeSlug(select: HTMLSelectElement): string {
  return select.name.replace(/^attribute_/, '');
}

function getOptionLabel(option: HTMLOptionElement): string {
  return option.textContent.trim() || option.value;
}

function applyVisual(circle: HTMLSpanElement, visual: SwatchVisual | undefined): void {
  if (!visual) {
    circle.classList.add('forna-variation-swatch__circle--fallback');
    return;
  }

  if (visual.kind === 'image') {
    circle.style.backgroundImage = `url(${JSON.stringify(visual.value)})`;
    return;
  }

  circle.style.backgroundColor = visual.value;
}

function enhanceSelect(select: HTMLSelectElement): Cleanup | undefined {
  if (select.dataset.fornaSwatchesEnhanced === 'true') {
    return undefined;
  }

  const cell = select.closest<HTMLElement>('td.value, td');
  const row = select.closest<HTMLElement>('tr');
  const options = Array.from(select.options).filter((option) => option.value !== '');

  if (!cell || !row || options.length === 0) {
    return undefined;
  }

  const attributeSlug = getAttributeSlug(select);
  const visuals = SWATCH_VISUALS[attributeSlug];
  const list = document.createElement('div');
  const buttons = new Map<string, HTMLButtonElement>();

  list.className = 'forna-variation-swatches';
  list.setAttribute('role', 'group');

  const rowLabel = row.querySelector<HTMLElement>('th label, th');
  const rowLabelText = rowLabel?.textContent.trim();

  if (rowLabelText) {
    list.setAttribute('aria-label', rowLabelText);
  }

  for (const option of options) {
    const label = getOptionLabel(option);
    const button = document.createElement('button');
    const circle = document.createElement('span');
    const text = document.createElement('span');

    button.type = 'button';
    button.className = 'forna-variation-swatch';
    button.dataset.value = option.value;
    button.setAttribute('aria-label', `${rowLabelText ? `${rowLabelText}: ` : ''}${label}`);
    button.setAttribute('aria-pressed', 'false');

    circle.className = 'forna-variation-swatch__circle';
    circle.setAttribute('aria-hidden', 'true');
    applyVisual(circle, visuals?.[option.value]);

    text.className = 'forna-variation-swatch__label';
    text.textContent = label;

    button.append(circle, text);
    list.append(button);
    buttons.set(option.value, button);
  }

  const originalTabIndex = select.getAttribute('tabindex');
  const originalAriaHidden = select.getAttribute('aria-hidden');

  select.dataset.fornaSwatchesEnhanced = 'true';
  select.classList.add('forna-variation-select--enhanced');
  select.setAttribute('aria-hidden', 'true');
  select.tabIndex = -1;
  row.classList.add('forna-variation-row');
  cell.insertBefore(list, select);

  const update = (): void => {
    for (const option of options) {
      const button = buttons.get(option.value);

      if (!button) {
        continue;
      }

      const isSelected = select.value === option.value;
      button.classList.toggle('is-selected', isSelected);
      button.setAttribute('aria-pressed', String(isSelected));
      button.disabled = option.disabled;
      button.setAttribute('aria-disabled', String(option.disabled));
    }
  };

  const clickListeners = new Map<HTMLButtonElement, EventListener>();

  for (const [value, button] of buttons) {
    const listener: EventListener = () => {
      if (button.disabled) {
        return;
      }

      select.value = value;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      update();
    };

    clickListeners.set(button, listener);
    button.addEventListener('click', listener);
  }

  select.addEventListener('change', update);

  const observer = new MutationObserver(update);
  observer.observe(select, {
    attributeFilter: ['disabled', 'selected'],
    attributes: true,
    childList: true,
    subtree: true,
  });

  update();

  return (): void => {
    observer.disconnect();
    select.removeEventListener('change', update);

    for (const [button, listener] of clickListeners) {
      button.removeEventListener('click', listener);
    }

    list.remove();
    row.classList.remove('forna-variation-row');
    select.classList.remove('forna-variation-select--enhanced');
    delete select.dataset.fornaSwatchesEnhanced;

    if (originalTabIndex === null) {
      select.removeAttribute('tabindex');
    } else {
      select.setAttribute('tabindex', originalTabIndex);
    }

    if (originalAriaHidden === null) {
      select.removeAttribute('aria-hidden');
    } else {
      select.setAttribute('aria-hidden', originalAriaHidden);
    }
  };
}

export default function initialize(form: HTMLElement): Cleanup | undefined {
  if (!(form instanceof HTMLFormElement) || !form.matches('form.variations_form')) {
    return undefined;
  }

  const cleanups = Array.from(
    form.querySelectorAll<HTMLSelectElement>('select[name^="attribute_"]'),
  )
    .map(enhanceSelect)
    .filter((cleanup): cleanup is Cleanup => cleanup !== undefined);

  if (cleanups.length === 0) {
    return undefined;
  }

  form.classList.add('forna-variations--enhanced');

  return (): void => {
    cleanups.forEach((cleanup) => {
      cleanup();
    });
    form.classList.remove('forna-variations--enhanced');
  };
}
