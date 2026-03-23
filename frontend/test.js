import { roadmapHierarchy } from './src/data/roadmapData.js';
import dagre from 'dagre';

const nodeWidth = 180;
const nodeHeight = 70;

const generateRawElements = () => {
    const rawNodes = [];
    const rawEdges = [];

    // Root node
    rawNodes.push({
        id: 'root-dsa',
        type: 'custom',
        data: { label: 'DSA Journey', category: 'Start', status: 'completed', id: 'root-dsa' },
        position: { x: 0, y: 0 }
    });

    const traverse = (items, parentId) => {
        items.forEach((item) => {
            rawNodes.push({
                id: item.id,
                type: 'custom',
                data: {
                    label: item.label,
                    category: item.category || 'Topic',
                    id: item.id
                },
                position: { x: 0, y: 0 }
            });

            if (parentId) {
                rawEdges.push({
                    id: `e-${parentId}-${item.id}`,
                    source: parentId,
                    target: item.id,
                    animated: true,
                    style: { stroke: '#94a3b8', strokeWidth: 1.5 }
                });
            }

            if (item.children) {
                traverse(item.children, item.id);
            }
        });
    };

    traverse(roadmapHierarchy, 'root-dsa');
    return { rawNodes, rawEdges };
};

const getLayoutedElements = (nodes, edges, direction = 'TB') => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    const isHorizontal = direction === 'LR';
    dagreGraph.setGraph({ rankdir: direction, nodesep: 60, ranksep: 80 });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    nodes.forEach((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        node.targetPosition = isHorizontal ? 'left' : 'top';
        node.sourcePosition = isHorizontal ? 'right' : 'bottom';

        node.position = {
            x: nodeWithPosition.x - nodeWidth / 2,
            y: nodeWithPosition.y - nodeHeight / 2,
        };

        return node;
    });

    return { layoutedNodes: nodes, layoutedEdges: edges };
};

try {
    const { rawNodes, rawEdges } = generateRawElements();
    console.log("Nodes:", rawNodes.length, "Edges:", rawEdges.length);
    const { layoutedNodes, layoutedEdges } = getLayoutedElements(rawNodes, rawEdges);
    console.log("Success! Layout complete.");
} catch(e) {
    console.error("CRASH:", e);
}
