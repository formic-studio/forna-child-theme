declare global {
  interface BricksAjaxNodesAddedDetail {
    queryId: number | string;
  }

  interface DocumentEventMap {
    'bricks/ajax/nodes_added': CustomEvent<BricksAjaxNodesAddedDetail>;
  }
}

export {};
