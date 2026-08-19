let generatedId = 0;

function restoreAttribute(element: HTMLElement, name: string, value: string | null): void {
  if (value === null) {
    element.removeAttribute(name);
    return;
  }

  element.setAttribute(name, value);
}

/**
 * Progressively enhances a native details/summary disclosure.
 */
export default function initializeDisclosure(element: HTMLElement): (() => void) | undefined {
  if (!(element instanceof HTMLDetailsElement)) {
    console.warn('[Forna] Disclosure requires a <details> root element.', element);
    return;
  }

  const trigger = element.querySelector<HTMLElement>(':scope > [data-disclosure-trigger]');
  const panel = element.querySelector<HTMLElement>(':scope > [data-disclosure-panel]');

  if (!trigger || !panel || trigger.tagName !== 'SUMMARY') {
    console.warn('[Forna] Disclosure requires direct summary and panel children.', element);
    return;
  }

  const previousExpanded = trigger.getAttribute('aria-expanded');
  const previousControls = trigger.getAttribute('aria-controls');
  const generatedPanelId = panel.id === '';

  if (generatedPanelId) {
    generatedId += 1;
    panel.id = `forna-disclosure-panel-${String(generatedId)}`;
  }

  const syncExpandedState = (): void => {
    trigger.setAttribute('aria-expanded', String(element.open));
  };

  trigger.setAttribute('aria-controls', panel.id);
  syncExpandedState();
  element.addEventListener('toggle', syncExpandedState);

  return (): void => {
    element.removeEventListener('toggle', syncExpandedState);
    restoreAttribute(trigger, 'aria-expanded', previousExpanded);
    restoreAttribute(trigger, 'aria-controls', previousControls);

    if (generatedPanelId) {
      panel.removeAttribute('id');
    }
  };
}
