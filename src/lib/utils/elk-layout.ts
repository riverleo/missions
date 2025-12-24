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

export interface ElkPortLayoutOptions {
	nodeSpacing?: number;
	layerSpacing?: number;
	portSpacing?: number;
}

/**
 * ELK 레이아웃을 포트 정보와 함께 적용합니다.
 * success/failure 같은 분기 엣지가 수직으로 정렬됩니다.
 */
export async function applyElkLayoutWithPorts(
	nodes: Node[],
	edges: Edge[],
	options: ElkPortLayoutOptions = {}
): Promise<Node[]> {
	if (nodes.length === 0) return nodes;

	const { nodeSpacing = 50, layerSpacing = 100, portSpacing = 20 } = options;

	// 각 노드별로 사용되는 sourceHandle을 수집
	const nodeSourceHandles = new Map<string, Set<string>>();
	edges.forEach((edge) => {
		if (edge.sourceHandle) {
			if (!nodeSourceHandles.has(edge.source)) {
				nodeSourceHandles.set(edge.source, new Set());
			}
			nodeSourceHandles.get(edge.source)!.add(edge.sourceHandle);
		}
	});

	const layoutedGraph = await elk.layout({
		id: 'root',
		layoutOptions: {
			'elk.algorithm': 'layered',
			'elk.direction': 'RIGHT',
			'elk.spacing.nodeNode': String(nodeSpacing),
			'elk.layered.spacing.nodeNodeBetweenLayers': String(layerSpacing),
			'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
			'elk.portConstraints': 'FIXED_ORDER',
		},
		children: nodes.map((node) => {
			const width = node.measured?.width ?? 200;
			const height = node.measured?.height ?? 100;
			const handles = nodeSourceHandles.get(node.id);

			// 포트 생성 (success가 위, failure가 아래)
			const ports: { id: string; properties: Record<string, string> }[] = [
				{
					id: `${node.id}-target`,
					properties: {
						'port.side': 'WEST',
						'port.index': '0',
					},
				},
			];

			if (handles) {
				const sortedHandles = Array.from(handles).sort((a, b) => {
					// success를 먼저 (위쪽), failure를 나중에 (아래쪽)
					if (a === 'success') return -1;
					if (b === 'success') return 1;
					return a.localeCompare(b);
				});

				sortedHandles.forEach((handle, index) => {
					ports.push({
						id: `${node.id}-${handle}`,
						properties: {
							'port.side': 'EAST',
							'port.index': String(index),
						},
					});
				});
			}

			return {
				id: node.id,
				width,
				height,
				ports,
				properties: {
					portConstraints: 'FIXED_ORDER',
				},
			};
		}),
		edges: edges.map((edge) => ({
			id: edge.id,
			sources: [edge.sourceHandle ? `${edge.source}-${edge.sourceHandle}` : edge.source],
			targets: [`${edge.target}-target`],
		})),
	});

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
