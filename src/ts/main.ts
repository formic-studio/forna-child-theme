import '../css/main.css';

import { onBricksNodesAdded } from './core/bricks-events';
import { ComponentRegistry } from './core/component-registry';

const registry = new ComponentRegistry();

registry.register({
  name: 'disclosure',
  selector: '[data-component="disclosure"]',
  load: () => import('./components/example-disclosure'),
});

function boot(): void {
  const stopRegistry = registry.start();
  const stopBricksListener = onBricksNodesAdded(() => {
    registry.scan(document);
  });

  const dispose = (): void => {
    stopBricksListener();
    stopRegistry();
  };

  window.addEventListener('pagehide', dispose, { once: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
