/**
 * visualizationEngine.js
 * 
 * Interactive visualization system for debugging and learning.
 * Provides specialized visualizers for different data structures:
 * - Arrays: index-based visualization with highlights
 * - Trees: hierarchical node-link layout with animation
 * - Graphs: node-link layout with directed edges
 * - Hash Tables: bucket visualization
 * 
 * Each visualizer can animate state transitions and track mutations.
 */

/**
 * Base Visualizer class
 */
class Visualizer {
  constructor(options = {}) {
    this.options = options;
    this.animationDuration = options.animationDuration || 300;
  }

  /**
   * Convert data to visualization format
   * @param {*} data - Data to visualize
   * @param {Object} options - Visualization options
   * @returns {Object} Visualization spec
   */
  visualize(data, options = {}) {
    throw new Error('visualize() must be implemented by subclass');
  }

  /**
   * Animate transition between two states
   * @param {Object} fromState - Previous visualization state
   * @param {Object} toState - New visualization state
   * @returns {Object} Animation spec with keyframes
   */
  animateTransition(fromState, toState) {
    return {
      duration: this.animationDuration,
      fromState,
      toState,
      keyframes: [], // Subclass fills this
    };
  }

  /**
   * Highlight specific elements
   * @param {Array} indices - Element indices to highlight
   * @param {String} color - Highlight color
   * @returns {Object} Highlight spec
   */
  highlight(indices, color = '#FFD700') {
    return {
      indices,
      color,
      type: 'element',
    };
  }
}

/**
 * Array Visualizer
 * Visualizes arrays with index-based layout, supporting sorted/unsorted states
 */
class ArrayVisualizer extends Visualizer {
  visualize(data, options = {}) {
    if (!Array.isArray(data)) {
      throw new Error('ArrayVisualizer requires array input');
    }

    const { showIndices = true, sorted = false, highlightedIndices = [] } = options;

    const elements = data.map((value, index) => ({
      id: `elem_${index}`,
      index,
      value,
      x: index * 60, // Horizontal spacing
      y: 0,
      width: 50,
      height: 40,
      highlighted: highlightedIndices.includes(index),
      label: showIndices ? `[${index}]` : null,
    }));

    return {
      type: 'array',
      dataStructure: 'array',
      elements,
      metadata: {
        length: data.length,
        sorted,
        type: typeof data[0],
      },
      viewport: {
        width: Math.max(800, data.length * 60 + 100),
        height: 150,
      },
    };
  }

  /**
   * Detect array mutations and create animation
   * @param {Array} fromArray - Previous array state
   * @param {Array} toArray - New array state
   * @returns {Object} Animation spec
   */
  animateTransition(fromArray, toArray) {
    const fromVis = this.visualize(fromArray);
    const toVis = this.visualize(toArray);

    // Detect changes: insertions, deletions, value changes
    const mutations = {
      inserted: [],
      deleted: [],
      modified: [],
      reordered: [],
    };

    // Simple diff: detect value changes and length changes
    for (let i = 0; i < Math.max(fromArray.length, toArray.length); i++) {
      if (i >= fromArray.length) {
        mutations.inserted.push({ index: i, value: toArray[i] });
      } else if (i >= toArray.length) {
        mutations.deleted.push({ index: i, value: fromArray[i] });
      } else if (fromArray[i] !== toArray[i]) {
        mutations.modified.push({ index: i, from: fromArray[i], to: toArray[i] });
      }
    }

    return {
      type: 'array_mutation',
      duration: this.animationDuration,
      fromState: fromVis,
      toState: toVis,
      mutations,
    };
  }
}

/**
 * Tree Visualizer
 * Visualizes binary and n-ary trees with hierarchical layout
 */
class TreeVisualizer extends Visualizer {
  visualize(treeData, options = {}) {
    const { highlightedNodes = [], compactLayout = false } = options;

    // Build hierarchical layout
    const nodes = [];
    const edges = [];
    let nodeId = 0;

    const traverse = (node, parentId, x, y, offsetX) => {
      if (!node) return;

      const id = nodeId++;
      nodes.push({
        id: `node_${id}`,
        value: node.val || node.value || node,
        x,
        y,
        radius: 20,
        highlighted: highlightedNodes.includes(id),
        label: String(node.val || node.value || node),
      });

      if (parentId !== null) {
        edges.push({
          source: `node_${parentId}`,
          target: `node_${id}`,
          type: 'tree_edge',
        });
      }

      // Recursively layout children
      const childCount = (node.left ? 1 : 0) + (node.right ? 1 : 0) + (node.children ? node.children.length : 0);
      let childX = x - (offsetX * childCount) / 2;

      if (node.left) {
        traverse(node.left, id, childX, y + 80, offsetX / 2);
        childX += offsetX;
      }

      if (node.right) {
        traverse(node.right, id, childX, y + 80, offsetX / 2);
        childX += offsetX;
      }

      if (node.children) {
        for (const child of node.children) {
          traverse(child, id, childX, y + 80, offsetX / 2);
          childX += offsetX;
        }
      }
    };

    // Estimate tree dimensions
    const height = this._getTreeHeight(treeData);
    traverse(treeData, null, 400, 20, 120);

    return {
      type: 'tree',
      dataStructure: 'tree',
      nodes,
      edges,
      metadata: {
        nodeCount: nodes.length,
        height,
      },
      viewport: {
        width: 800,
        height: Math.max(300, height * 100),
      },
    };
  }

  _getTreeHeight(node) {
    if (!node) return 0;
    const leftHeight = this._getTreeHeight(node.left);
    const rightHeight = this._getTreeHeight(node.right);
    const childrenHeight = node.children
      ? Math.max(...node.children.map(c => this._getTreeHeight(c)), 0)
      : 0;
    return 1 + Math.max(leftHeight, rightHeight, childrenHeight);
  }

  /**
   * Animate tree traversal (in-order, pre-order, post-order, level-order)
   * @param {Object} tree - Tree root node
   * @param {String} traversalType - 'inorder' | 'preorder' | 'postorder' | 'levelorder'
   * @returns {Array} Sequence of visualization states with highlighted nodes
   */
  animateTraversal(tree, traversalType = 'inorder') {
    const sequence = [];
    const visitedOrder = [];

    const inorder = (node) => {
      if (!node) return;
      inorder(node.left);
      visitedOrder.push(node);
      inorder(node.right);
    };

    const preorder = (node) => {
      if (!node) return;
      visitedOrder.push(node);
      preorder(node.left);
      preorder(node.right);
    };

    const postorder = (node) => {
      if (!node) return;
      postorder(node.left);
      postorder(node.right);
      visitedOrder.push(node);
    };

    const levelorder = (root) => {
      if (!root) return;
      const queue = [root];
      while (queue.length) {
        const node = queue.shift();
        visitedOrder.push(node);
        if (node.left) queue.push(node.left);
        if (node.right) queue.push(node.right);
      }
    };

    // Execute traversal
    if (traversalType === 'inorder') inorder(tree);
    else if (traversalType === 'preorder') preorder(tree);
    else if (traversalType === 'postorder') postorder(tree);
    else if (traversalType === 'levelorder') levelorder(tree);

    // Generate visualization sequence
    for (let i = 0; i <= visitedOrder.length; i++) {
      const highlighted = visitedOrder.slice(0, i);
      sequence.push(this.visualize(tree, { highlightedNodes: highlighted }));
    }

    return sequence;
  }
}

/**
 * Graph Visualizer
 * Visualizes directed and undirected graphs with force-directed layout
 */
class GraphVisualizer extends Visualizer {
  visualize(graphData, options = {}) {
    const { highlightedNodes = [], highlightedEdges = [], directed = true } = options;

    const { nodes: nodeData = [], edges: edgeData = [] } = graphData;

    // Force-directed layout (simplified)
    const nodes = nodeData.map((node, idx) => {
      const angle = (idx / nodeData.length) * 2 * Math.PI;
      const radius = 150;
      return {
        id: `node_${node.id || idx}`,
        value: node.value || node.label || idx,
        x: 400 + radius * Math.cos(angle),
        y: 300 + radius * Math.sin(angle),
        radius: 20,
        highlighted: highlightedNodes.includes(node.id || idx),
        label: String(node.label || node.value || idx),
      };
    });

    const edges = edgeData.map((edge, idx) => {
      const sourceNode = nodes.find(n => n.id === `node_${edge.source}`);
      const targetNode = nodes.find(n => n.id === `node_${edge.target}`);

      return {
        id: `edge_${idx}`,
        source: `node_${edge.source}`,
        target: `node_${edge.target}`,
        weight: edge.weight || 1,
        type: directed ? 'directed_edge' : 'undirected_edge',
        highlighted: highlightedEdges.includes(idx),
        label: edge.label ? String(edge.label) : null,
      };
    });

    return {
      type: 'graph',
      dataStructure: 'graph',
      nodes,
      edges,
      metadata: {
        nodeCount: nodes.length,
        edgeCount: edges.length,
        directed,
      },
      viewport: {
        width: 800,
        height: 600,
      },
    };
  }

  /**
   * Animate shortest path (Dijkstra) algorithm
   * @param {Object} graph - Graph with nodes and edges
   * @param {number} startNodeId - Start node
   * @param {number} endNodeId - End node
   * @returns {Array} Sequence of visualizations showing algorithm progress
   */
  animateShortestPath(graph, startNodeId, endNodeId) {
    // Simplified Dijkstra visualization
    const sequence = [];
    const visited = new Set();
    const nodeOrder = [startNodeId];

    // Simulate path exploration (simplified)
    for (const nodeId of nodeOrder) {
      visited.add(nodeId);
      sequence.push(
        this.visualize(graph, {
          highlightedNodes: Array.from(visited),
        })
      );

      if (nodeId === endNodeId) break;
    }

    return sequence;
  }
}

/**
 * Hash Table Visualizer
 * Visualizes hash tables showing buckets and collisions
 */
class HashTableVisualizer extends Visualizer {
  visualize(hashTableData, options = {}) {
    const { bucketSize = 8, highlightedBuckets = [] } = options;

    const buckets = new Array(bucketSize).fill(null).map((_, idx) => ({
      id: `bucket_${idx}`,
      index: idx,
      entries: hashTableData[idx] || [],
      x: 100 + idx * 70,
      y: 100,
      width: 60,
      height: 40,
      highlighted: highlightedBuckets.includes(idx),
    }));

    // Count collisions
    const collisions = buckets.filter(b => b.entries.length > 1).length;

    return {
      type: 'hash_table',
      dataStructure: 'hash_table',
      buckets,
      metadata: {
        totalEntries: hashTableData.reduce((sum, b) => sum + (b ? b.length : 0), 0),
        bucketCount: bucketSize,
        collisions,
        loadFactor: (hashTableData.reduce((sum, b) => sum + (b ? b.length : 0), 0) / bucketSize).toFixed(2),
      },
      viewport: {
        width: 100 + bucketSize * 70,
        height: 250,
      },
    };
  }
}

/**
 * Visualization Manager
 * Routes data to appropriate visualizer and manages animation sequences
 */
class VisualizationManager {
  constructor(options = {}) {
    this.options = options;
    this.visualizers = {
      array: new ArrayVisualizer(options),
      tree: new TreeVisualizer(options),
      graph: new GraphVisualizer(options),
      hash_table: new HashTableVisualizer(options),
    };
  }

  /**
   * Auto-detect data structure and visualize
   * @param {*} data - Data to visualize
   * @param {Object} options - Visualization options
   * @returns {Object} Visualization spec
   */
  visualize(data, options = {}) {
    const dataType = this._detectDataType(data);
    const visualizer = this.visualizers[dataType];

    if (!visualizer) {
      throw new Error(`No visualizer found for data type: ${dataType}`);
    }

    return visualizer.visualize(data, options);
  }

  /**
   * Detect data type
   * @private
   */
  _detectDataType(data) {
    if (Array.isArray(data)) {
      return 'array';
    }

    if (data && typeof data === 'object') {
      // Check if it's a tree
      if ('val' in data || 'value' in data) {
        if ('left' in data || 'right' in data || 'children' in data) {
          return 'tree';
        }
      }

      // Check if it's a graph
      if ('nodes' in data && 'edges' in data) {
        return 'graph';
      }
    }

    throw new Error('Unable to auto-detect data structure');
  }

  /**
   * Create animation sequence for algorithm visualization
   * @param {String} algorithmType - 'sort' | 'search' | 'traversal' | 'path'
   * @param {*} data - Data to animate
   * @param {Object} trace - Execution trace
   * @returns {Array} Sequence of visualization states
   */
  createAlgorithmAnimation(algorithmType, data, trace) {
    const sequence = [];

    // This would connect trace steps to visualization mutations
    // For now, return basic implementation
    if (Array.isArray(data) && algorithmType === 'sort') {
      const visualizer = this.visualizers.array;
      // Could animate each step if we have fine-grained trace data
      sequence.push(visualizer.visualize(data));
    }

    return sequence;
  }
}

export { Visualizer, ArrayVisualizer, TreeVisualizer, GraphVisualizer, HashTableVisualizer, VisualizationManager };
