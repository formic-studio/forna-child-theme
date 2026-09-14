type Cleanup = () => void;

type SwatchVisual = { kind: 'color'; value: string } | { kind: 'image'; value: string };

type AttributePresentation = {
  label: string;
  optionLabels?: Readonly<Record<string, string>>;
  optionOrder: readonly string[];
};

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

const ATTRIBUTE_PRESENTATION: Readonly<Record<string, AttributePresentation>> = {
  pa_veneer: {
    label: 'Wykończenie drewna',
    optionOrder: ['olcha', 'sosna', 'jesion'],
  },
  pa_cable: {
    label: 'Przewód',
    optionLabels: { natural: 'Neutral' },
    optionOrder: ['twist', 'natural', 'vertigo'],
  },
  pa_canopy: {
    label: 'Podsufitka',
    optionLabels: { drewniana: 'Drewno' },
    optionOrder: ['biala', 'czarna', 'mosiadz', 'drewniana'],
  },
};

function getAttributeSlug(select: HTMLSelectElement): string {
  return select.name.replace(/^attribute_/, '');
}

function getOptionLabel(
  option: HTMLOptionElement,
  presentation: AttributePresentation | undefined,
): string {
  return presentation?.optionLabels?.[option.value] ?? (option.textContent.trim() || option.value);
}

function sortOptions(
  options: HTMLOptionElement[],
  presentation: AttributePresentation | undefined,
): HTMLOptionElement[] {
  if (!presentation) {
    return options;
  }

  const order = new Map(presentation.optionOrder.map((value, index) => [value, index]));

  return options.sort(
    (left, right) =>
      (order.get(left.value) ?? Number.MAX_SAFE_INTEGER) -
      (order.get(right.value) ?? Number.MAX_SAFE_INTEGER),
  );
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
  const attributeSlug = getAttributeSlug(select);
  const presentation = ATTRIBUTE_PRESENTATION[attributeSlug];
  const options = sortOptions(
    Array.from(select.options).filter((option) => option.value !== ''),
    presentation,
  );

  if (!cell || !row || options.length === 0) {
    return undefined;
  }

  const visuals = SWATCH_VISUALS[attributeSlug];
  const list = document.createElement('div');
  const buttons = new Map<string, HTMLButtonElement>();

  list.className = 'forna-variation-swatches';
  list.setAttribute('role', 'group');

  const rowLabel = row.querySelector<HTMLElement>('th label, th');
  const originalRowLabel = rowLabel?.textContent ?? '';
  const rowLabelText = presentation?.label ?? originalRowLabel.trim();

  if (rowLabel && presentation) {
    rowLabel.textContent = presentation.label;
  }

  if (rowLabelText) {
    list.setAttribute('aria-label', rowLabelText);
  }

  for (const option of options) {
    const label = getOptionLabel(option, presentation);
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

    if (rowLabel && presentation) {
      rowLabel.textContent = originalRowLabel;
    }

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

  const selects = Array.from(
    form.querySelectorAll<HTMLSelectElement>('select[name^="attribute_"]'),
  );
  const rows = selects
    .map((select) => select.closest<HTMLTableRowElement>('tr'))
    .filter((row): row is HTMLTableRowElement => row !== null);
  const originalRows = [...rows];
  const rowParent = rows[0]?.parentElement;

  if (rowParent) {
    [...rows]
      .sort((left, right) => {
        const leftSelect = left.querySelector<HTMLSelectElement>('select[name^="attribute_"]');
        const rightSelect = right.querySelector<HTMLSelectElement>('select[name^="attribute_"]');
        const attributeOrder = ['pa_veneer', 'pa_cable', 'pa_canopy'];

        return (
          attributeOrder.indexOf(leftSelect ? getAttributeSlug(leftSelect) : '') -
          attributeOrder.indexOf(rightSelect ? getAttributeSlug(rightSelect) : '')
        );
      })
      .forEach((row) => {
        rowParent.append(row);
      });
  }

  const cleanups = selects
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

    if (rowParent) {
      originalRows.forEach((row) => {
        rowParent.append(row);
      });
    }

    form.classList.remove('forna-variations--enhanced');
  };
}
