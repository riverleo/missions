import type { Node, Edge } from '@xyflow/svelte';
import ELK from 'elkjs/lib/elk.bundled.js';

const elk = new ELK();

export async function applyElkLayout(nodes: Node[], edges: Edge[]): Promise<Node[]> {
	if (nodes.length === 0) return nodes;

	const layoutedGraph = await elk.layout({
		id: 'root',
		layoutOptions: {
			'elk.algorithm': 'layered',
			'elk.direction': 'RIGHT',
			'elk.spacing.nodeNode': '10',
			'elk.layered.spacing.nodeNodeBetweenLayers': '100',
			'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
		},
		children: nodes.map((node) => ({
			id: node.id,
			width: node.width ?? 200,
			height: node.height ?? 60,
		})),
		edges: edges.map((edge) => ({
			id: edge.id,
			sources: [edge.source],
			targets: [edge.target],
		})),
	});

	// 새로운 position이 적용된 노드 배열 생성
	return nodes.map((node) => {
		const elkNode = layoutedGraph.children?.find((n) => n.id === node.id);
		if (elkNode && elkNode.x !== undefined && elkNode.y !== undefined) {
			return {
				...node,
				position: { x: elkNode.x, y: elkNode.y },
			};
		}
		return node;
	});
}
