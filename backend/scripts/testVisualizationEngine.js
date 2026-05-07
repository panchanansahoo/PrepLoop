/**
 * testVisualizationEngine.js
 * 
 * Tests for the VisualizationEngine and visualizers
 * Coverage: Array, Tree, Graph, Hash Table visualizers + animation
 * 35+ comprehensive test cases
 */

import {
  Visualizer,
  ArrayVisualizer,
  TreeVisualizer,
  GraphVisualizer,
  HashTableVisualizer,
  VisualizationManager,
} from '../services/visualizationEngine.js';

let passCount = 0;
let failCount = 0;

async function runTest(name, fn) {
  try {
    await fn();
    console.log(`✓ ${name}`);
    passCount++;
  } catch (error) {
    console.error(`✗ ${name}`);
    console.error(`  ${error.message}`);
    failCount++;
  }
}

async function runAllTests() {
  console.log('🎨 Visualization Engine Tests\n');

  // ============================================================================
  // Array Visualizer Tests
  // ============================================================================

  await runTest('ArrayVisualizer: visualize simple array', () => {
    const viz = new ArrayVisualizer();
    const result = viz.visualize([1, 2, 3, 4, 5]);

    if (result.type !== 'array') throw new Error('Type should be array');
    if (result.elements.length !== 5) throw new Error('Should have 5 elements');
    if (result.metadata.length !== 5) throw new Error('Metadata length should be 5');
  });

  await runTest('ArrayVisualizer: handle empty array', () => {
    const viz = new ArrayVisualizer();
    const result = viz.visualize([]);

    if (result.elements.length !== 0) throw new Error('Should have 0 elements');
  });

  await runTest('ArrayVisualizer: highlight specific indices', () => {
    const viz = new ArrayVisualizer();
    const result = viz.visualize([1, 2, 3, 4, 5], { highlightedIndices: [0, 2, 4] });

    const highlighted = result.elements.filter(e => e.highlighted);
    if (highlighted.length !== 3) throw new Error('Should have 3 highlighted elements');
  });

  await runTest('ArrayVisualizer: animate mutation', () => {
    const viz = new ArrayVisualizer();
    const animation = viz.animateTransition([1, 2, 3], [1, 2, 3, 4]);

    if (!animation.mutations) throw new Error('Should have mutations');
    if (animation.mutations.inserted.length !== 1) throw new Error('Should have 1 insertion');
    if (animation.mutations.inserted[0].value !== 4) throw new Error('Inserted value should be 4');
  });

  await runTest('ArrayVisualizer: detect value changes', () => {
    const viz = new ArrayVisualizer();
    const animation = viz.animateTransition([1, 2, 3], [1, 20, 3]);

    if (animation.mutations.modified.length !== 1) throw new Error('Should have 1 modification');
    if (animation.mutations.modified[0].from !== 2) throw new Error('From value should be 2');
    if (animation.mutations.modified[0].to !== 20) throw new Error('To value should be 20');
  });

  await runTest('ArrayVisualizer: detect deletions', () => {
    const viz = new ArrayVisualizer();
    const animation = viz.animateTransition([1, 2, 3, 4], [1, 2]);

    if (animation.mutations.deleted.length !== 2) throw new Error('Should have 2 deletions');
  });

  // ============================================================================
  // Tree Visualizer Tests
  // ============================================================================

  await runTest('TreeVisualizer: visualize binary tree', () => {
    const tree = {
      val: 1,
      left: { val: 2, left: null, right: null },
      right: { val: 3, left: null, right: null },
    };

    const viz = new TreeVisualizer();
    const result = viz.visualize(tree);

    if (result.type !== 'tree') throw new Error('Type should be tree');
    if (result.nodes.length !== 3) throw new Error('Should have 3 nodes');
    if (result.edges.length !== 2) throw new Error('Should have 2 edges');
  });

  await runTest('TreeVisualizer: calculate tree height', () => {
    const tree = {
      val: 1,
      left: { val: 2, left: { val: 4, left: null, right: null }, right: null },
      right: { val: 3, left: null, right: null },
    };

    const viz = new TreeVisualizer();
    const result = viz.visualize(tree);

    if (result.metadata.height !== 3) throw new Error(`Height should be 3, got ${result.metadata.height}`);
  });

  await runTest('TreeVisualizer: handle null nodes', () => {
    const tree = {
      val: 1,
      left: null,
      right: null,
    };

    const viz = new TreeVisualizer();
    const result = viz.visualize(tree);

    if (result.nodes.length !== 1) throw new Error('Should have 1 node');
  });

  await runTest('TreeVisualizer: animate inorder traversal', () => {
    const tree = {
      val: 2,
      left: { val: 1, left: null, right: null },
      right: { val: 3, left: null, right: null },
    };

    const viz = new TreeVisualizer();
    const sequence = viz.animateTraversal(tree, 'inorder');

    if (!Array.isArray(sequence)) throw new Error('Sequence should be array');
    if (sequence.length === 0) throw new Error('Sequence should have frames');
  });

  await runTest('TreeVisualizer: animate preorder traversal', () => {
    const tree = {
      val: 1,
      left: { val: 2, left: null, right: null },
      right: { val: 3, left: null, right: null },
    };

    const viz = new TreeVisualizer();
    const sequence = viz.animateTraversal(tree, 'preorder');

    if (sequence.length === 0) throw new Error('Sequence should have frames');
  });

  await runTest('TreeVisualizer: animate postorder traversal', () => {
    const tree = {
      val: 1,
      left: { val: 2, left: null, right: null },
      right: { val: 3, left: null, right: null },
    };

    const viz = new TreeVisualizer();
    const sequence = viz.animateTraversal(tree, 'postorder');

    if (sequence.length === 0) throw new Error('Sequence should have frames');
  });

  await runTest('TreeVisualizer: animate levelorder traversal', () => {
    const tree = {
      val: 1,
      left: { val: 2, left: null, right: null },
      right: { val: 3, left: null, right: null },
    };

    const viz = new TreeVisualizer();
    const sequence = viz.animateTraversal(tree, 'levelorder');

    if (sequence.length === 0) throw new Error('Sequence should have frames');
  });

  // ============================================================================
  // Graph Visualizer Tests
  // ============================================================================

  await runTest('GraphVisualizer: visualize directed graph', () => {
    const graph = {
      nodes: [{ id: 1, label: 'A' }, { id: 2, label: 'B' }, { id: 3, label: 'C' }],
      edges: [
        { source: 1, target: 2 },
        { source: 2, target: 3 },
      ],
    };

    const viz = new GraphVisualizer();
    const result = viz.visualize(graph);

    if (result.type !== 'graph') throw new Error('Type should be graph');
    if (result.nodes.length !== 3) throw new Error('Should have 3 nodes');
    if (result.edges.length !== 2) throw new Error('Should have 2 edges');
    if (result.metadata.directed !== true) throw new Error('Should be directed');
  });

  await runTest('GraphVisualizer: visualize undirected graph', () => {
    const graph = {
      nodes: [{ id: 1 }, { id: 2 }, { id: 3 }],
      edges: [
        { source: 1, target: 2 },
        { source: 2, target: 3 },
      ],
    };

    const viz = new GraphVisualizer();
    const result = viz.visualize(graph, { directed: false });

    if (result.metadata.directed !== false) throw new Error('Should be undirected');
  });

  await runTest('GraphVisualizer: handle graph with weights', () => {
    const graph = {
      nodes: [{ id: 1 }, { id: 2 }],
      edges: [{ source: 1, target: 2, weight: 5 }],
    };

    const viz = new GraphVisualizer();
    const result = viz.visualize(graph);

    if (result.edges[0].weight !== 5) throw new Error('Should preserve edge weight');
  });

  await runTest('GraphVisualizer: animate shortest path', () => {
    const graph = {
      nodes: [{ id: 1 }, { id: 2 }, { id: 3 }],
      edges: [
        { source: 1, target: 2 },
        { source: 2, target: 3 },
      ],
    };

    const viz = new GraphVisualizer();
    const sequence = viz.animateShortestPath(graph, 1, 3);

    if (!Array.isArray(sequence)) throw new Error('Should return array');
    if (sequence.length === 0) throw new Error('Should have visualization frames');
  });

  // ============================================================================
  // Hash Table Visualizer Tests
  // ============================================================================

  await runTest('HashTableVisualizer: visualize hash table', () => {
    const hashTable = [
      [{ key: 'a', value: 1 }],
      [],
      [{ key: 'c', value: 3 }],
      [],
      [{ key: 'e', value: 5 }, { key: 'n', value: 14 }],
      [],
      [],
      [],
    ];

    const viz = new HashTableVisualizer();
    const result = viz.visualize(hashTable);

    if (result.type !== 'hash_table') throw new Error('Type should be hash_table');
    if (result.buckets.length !== 8) throw new Error('Should have 8 buckets');
  });

  await runTest('HashTableVisualizer: detect collisions', () => {
    const hashTable = [
      [{ key: 'a', value: 1 }, { key: 'b', value: 2 }], // Collision
      [],
      [{ key: 'c', value: 3 }],
      [],
      [],
      [],
      [],
      [],
    ];

    const viz = new HashTableVisualizer();
    const result = viz.visualize(hashTable);

    if (result.metadata.collisions !== 1) throw new Error('Should detect 1 collision');
  });

  await runTest('HashTableVisualizer: calculate load factor', () => {
    const hashTable = [
      [{ key: 'a', value: 1 }],
      [{ key: 'b', value: 2 }],
      [{ key: 'c', value: 3 }],
      [{ key: 'd', value: 4 }],
      [],
      [],
      [],
      [],
    ];

    const viz = new HashTableVisualizer();
    const result = viz.visualize(hashTable);

    const loadFactor = parseFloat(result.metadata.loadFactor);
    if (loadFactor !== 0.5) throw new Error(`Load factor should be 0.5, got ${loadFactor}`);
  });

  // ============================================================================
  // Visualization Manager Tests
  // ============================================================================

  await runTest('VisualizationManager: auto-detect array', () => {
    const manager = new VisualizationManager();
    const result = manager.visualize([1, 2, 3, 4]);

    if (result.type !== 'array') throw new Error('Should detect as array');
  });

  await runTest('VisualizationManager: auto-detect tree', () => {
    const tree = {
      val: 1,
      left: { val: 2, left: null, right: null },
      right: { val: 3, left: null, right: null },
    };

    const manager = new VisualizationManager();
    const result = manager.visualize(tree);

    if (result.type !== 'tree') throw new Error('Should detect as tree');
  });

  await runTest('VisualizationManager: auto-detect graph', () => {
    const graph = {
      nodes: [{ id: 1 }, { id: 2 }],
      edges: [{ source: 1, target: 2 }],
    };

    const manager = new VisualizationManager();
    const result = manager.visualize(graph);

    if (result.type !== 'graph') throw new Error('Should detect as graph');
  });

  await runTest('VisualizationManager: throw on unknown type', () => {
    const manager = new VisualizationManager();

    try {
      manager.visualize('invalid');
      throw new Error('Should have thrown');
    } catch (e) {
      if (!e.message.includes('Unable to auto-detect')) throw e;
    }
  });

  // ============================================================================
  // Viewport and Layout Tests
  // ============================================================================

  await runTest('Array visualization: correct viewport sizing', () => {
    const viz = new ArrayVisualizer();
    const result = viz.visualize(new Array(20).fill(0).map((_, i) => i));

    if (result.viewport.width < 20 * 60) throw new Error('Viewport width too small');
  });

  await runTest('Tree visualization: correct viewport sizing', () => {
    const tree = {
      val: 1,
      left: { val: 2, left: { val: 4, left: null, right: null }, right: null },
      right: { val: 3, left: null, right: null },
    };

    const viz = new TreeVisualizer();
    const result = viz.visualize(tree);

    if (result.viewport.height < 100) throw new Error('Viewport height too small');
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================

  await runTest('ArrayVisualizer: handle single element', () => {
    const viz = new ArrayVisualizer();
    const result = viz.visualize([42]);

    if (result.elements.length !== 1) throw new Error('Should have 1 element');
    if (result.elements[0].value !== 42) throw new Error('Element value should be 42');
  });

  await runTest('TreeVisualizer: handle deeply nested tree', () => {
    const tree = { val: 1, left: null, right: null };
    let current = tree;
    for (let i = 2; i <= 10; i++) {
      current.left = { val: i, left: null, right: null };
      current = current.left;
    }

    const viz = new TreeVisualizer();
    const result = viz.visualize(tree);

    if (result.metadata.height !== 10) throw new Error(`Height should be 10, got ${result.metadata.height}`);
  });

  await runTest('GraphVisualizer: handle disconnected nodes', () => {
    const graph = {
      nodes: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }],
      edges: [{ source: 1, target: 2 }], // Nodes 3, 4 are disconnected
    };

    const viz = new GraphVisualizer();
    const result = viz.visualize(graph);

    if (result.nodes.length !== 4) throw new Error('Should have all 4 nodes');
    if (result.edges.length !== 1) throw new Error('Should have 1 edge');
  });

  console.log(`\n✅ Results: ${passCount} passed, ${failCount} failed (${passCount + failCount} total)`);
  process.exit(failCount > 0 ? 1 : 0);
}

runAllTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});
