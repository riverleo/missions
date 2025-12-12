import type { Node, Edge } from '@xyflow/svelte';
import ELK from 'elkjs/lib/elk.bundled.js';

const elk = new ELK();

export interface ElkLayoutOptions {
	nodeSpacing?: number;
	layerSpacing?: number;
}

export async function applyElkLayout(
	nodes: Node[],
	edges: Edge[],
	options: ElkLayoutOptions = {}
): Promise<Node[]> {
	if (nodes.length === 0) return nodes;

	const { nodeSpacing = 30, layerSpacing = 80 } = options;

	const layoutedGraph = await elk.layout({
		id: 'root',
		layoutOptions: {
			'elk.algorithm': 'layered',
			'elk.direction': 'RIGHT',
			'elk.spacing.nodeNode': String(nodeSpacing),
			'elk.layered.spacing.nodeNodeBetweenLayers': String(layerSpacing),
			'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
		},
		children: nodes.map((node) => ({
			id: node.id,
			width: node.measured?.width,
			height: node.measured?.height,
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
