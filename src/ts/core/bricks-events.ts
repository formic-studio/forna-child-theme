export type BricksNodesAddedHandler = (detail: BricksAjaxNodesAddedDetail) => void;

/**
 * Subscribe to nodes appended by Bricks AJAX and return an explicit cleanup.
 */
export function onBricksNodesAdded(handler: BricksNodesAddedHandler): () => void {
  const listener = (event: DocumentEventMap['bricks/ajax/nodes_added']): void => {
    handler(event.detail);
  };

  document.addEventListener('bricks/ajax/nodes_added', listener);

  return (): void => {
    document.removeEventListener('bricks/ajax/nodes_added', listener);
  };
}
