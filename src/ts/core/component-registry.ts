export type ComponentCleanup = () => void;
export type ComponentInitializer = (
  element: HTMLElement,
) => ComponentCleanup | Promise<ComponentCleanup | undefined> | undefined;

export interface ComponentModule {
  default: ComponentInitializer;
}

export interface ComponentDefinition {
  name: string;
  selector: `[data-${string}]`;
  load: () => Promise<ComponentModule>;
}

interface ComponentInstance {
  cleanup: ComponentCleanup | null;
  disposed: boolean;
}

/**
 * Finds declarative components, loads their modules on demand, and owns cleanup.
 */
export class ComponentRegistry {
  private readonly definitions = new Map<string, ComponentDefinition>();
  private readonly instances = new Map<HTMLElement, Map<string, ComponentInstance>>();
  private observer: MutationObserver | null = null;
  private started = false;

  register(definition: ComponentDefinition): void {
    if (this.definitions.has(definition.name)) {
      throw new Error(`Component "${definition.name}" is already registered.`);
    }

    this.definitions.set(definition.name, definition);
  }

  start(): ComponentCleanup {
    if (this.started) {
      return (): void => {
        this.stop();
      };
    }

    this.started = true;
    this.scan(document);

    const body = document.querySelector('body');

    if (body) {
      this.observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          mutation.removedNodes.forEach((node) => {
            this.cleanupWithin(node);
          });
          mutation.addedNodes.forEach((node) => {
            if (node instanceof HTMLElement) {
              this.scan(node);
            }
          });
        }
      });

      this.observer.observe(body, { childList: true, subtree: true });
    }

    return (): void => {
      this.stop();
    };
  }

  scan(root: Document | HTMLElement = document): void {
    this.cleanupDisconnected();

    for (const definition of this.definitions.values()) {
      for (const element of this.findMatches(root, definition.selector)) {
        this.initialize(definition, element);
      }
    }
  }

  stop(): void {
    this.observer?.disconnect();
    this.observer = null;

    for (const element of [...this.instances.keys()]) {
      this.cleanupElement(element);
    }

    this.started = false;
  }

  private findMatches(root: Document | HTMLElement, selector: string): HTMLElement[] {
    const matches: HTMLElement[] = [];

    if (root instanceof HTMLElement && root.matches(selector)) {
      matches.push(root);
    }

    root.querySelectorAll<HTMLElement>(selector).forEach((element) => {
      matches.push(element);
    });

    return matches;
  }

  private initialize(definition: ComponentDefinition, element: HTMLElement): void {
    let elementInstances = this.instances.get(element);

    if (!elementInstances) {
      elementInstances = new Map<string, ComponentInstance>();
      this.instances.set(element, elementInstances);
    }

    if (elementInstances.has(definition.name)) {
      return;
    }

    const instance: ComponentInstance = { cleanup: null, disposed: false };
    elementInstances.set(definition.name, instance);

    void definition
      .load()
      .then((component) => {
        if (instance.disposed) {
          return;
        }

        return component.default(element);
      })
      .then((cleanup) => {
        if (typeof cleanup !== 'function') {
          return;
        }

        if (instance.disposed) {
          this.runCleanup(definition.name, cleanup);
          return;
        }

        instance.cleanup = cleanup;
      })
      .catch((error: unknown) => {
        console.error(`[Forna] Component "${definition.name}" failed to initialize.`, error);
      });
  }

  private cleanupWithin(root: Node): void {
    for (const element of [...this.instances.keys()]) {
      if (root === element || root.contains(element)) {
        this.cleanupElement(element);
      }
    }
  }

  private cleanupDisconnected(): void {
    for (const element of [...this.instances.keys()]) {
      if (!element.isConnected) {
        this.cleanupElement(element);
      }
    }
  }

  private cleanupElement(element: HTMLElement): void {
    const elementInstances = this.instances.get(element);

    if (!elementInstances) {
      return;
    }

    for (const [name, instance] of elementInstances) {
      instance.disposed = true;

      if (instance.cleanup) {
        this.runCleanup(name, instance.cleanup);
      }
    }

    this.instances.delete(element);
  }

  private runCleanup(name: string, cleanup: ComponentCleanup): void {
    try {
      cleanup();
    } catch (error: unknown) {
      console.error(`[Forna] Component "${name}" cleanup failed.`, error);
    }
  }
}
