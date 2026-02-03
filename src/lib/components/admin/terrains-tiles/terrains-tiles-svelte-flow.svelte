<script lang="ts">
	import { useTerrain } from '$lib/hooks';
	import type { ScenarioId } from '$lib/types';
	import { page } from '$app/state';
	import { untrack } from 'svelte';
	import {
		SvelteFlow,
		Controls,
		Background,
		BackgroundVariant,
		MiniMap,
		useNodes,
		useEdges,
	} from '@xyflow/svelte';
	import type { Node, Edge, Connection } from '@xyflow/svelte';
	import { mode } from 'mode-watcher';
	import {
		createTerrainNodeId,
		parseTerrainNodeId,
		createTileNodeId,
		parseTileNodeId,
		createTerrainTileEdgeId,
		isTerrainTileEdgeId,
	} from '$lib/utils/flow-id';
	import TerrainNode from './terrain-node.svelte';
	import TileNode from './tile-node.svelte';
	import TerrainTileEdge from './terrain-tile-edge.svelte';
	import TerrainTileEdgePanel from './terrain-tile-edge-panel.svelte';
	import type { TerrainId, TileId } from '$lib/types';

	const { terrainStore, tileStore, terrainTileStore, admin } = useTerrain();

	const scenarioId = $derived(page.params.scenarioId as ScenarioId);

	const flowNodes = useNodes();
	const flowEdges = useEdges();

	// 데이터
	const terrains = $derived(Object.values($terrainStore.data));
	const tiles = $derived(Object.values($tileStore.data));
	const terrainTiles = $derived(Object.values($terrainTileStore.data));

	// 선택된 엣지
	const selectedEdge = $derived(flowEdges.current.find((e) => e.selected));
	const selectedTerrainTile = $derived(() => {
		if (!selectedEdge || !isTerrainTileEdgeId(selectedEdge.id)) return undefined;
		return terrainTiles.find((tt) => createTerrainTileEdgeId(tt) === selectedEdge.id);
	});

	const nodeTypes = {
		terrain: TerrainNode,
		tile: TileNode,
	};

	const edgeTypes = {
		terrainTile: TerrainTileEdge,
	};

	let nodes = $state<Node[]>([]);
	let edges = $state<Edge[]>([]);
	let skipConvertEffect = $state(false);

	function isValidConnection(connection: Connection | Edge) {
		const sourceNode = nodes.find((n) => n.id === connection.source);
		const targetNode = nodes.find((n) => n.id === connection.target);

		if (!sourceNode || !targetNode) return false;

		// terrain → tile 연결만 허용
		if (sourceNode.type === 'terrain' && targetNode.type === 'tile') {
			return true;
		}

		return false;
	}

	async function onconnect(connection: Connection) {
		try {
			const sourceNode = nodes.find((n) => n.id === connection.source);
			const targetNode = nodes.find((n) => n.id === connection.target);

			if (!sourceNode || !targetNode) return;

			// terrain → tile 연결: terrains_tiles 생성
			if (sourceNode.type === 'terrain' && targetNode.type === 'tile') {
				const terrainId = parseTerrainNodeId(connection.source);
				const tileId = parseTileNodeId(connection.target);

				const newTerrainTile = await admin.createTerrainTile(scenarioId, {
					terrain_id: terrainId as TerrainId,
					tile_id: tileId as TileId,
				});

				edges = [
					...edges,
					{
						id: createTerrainTileEdgeId(newTerrainTile),
						type: 'terrainTile',
						source: connection.source,
						target: connection.target,
						data: { terrainTile: newTerrainTile },
						deletable: true,
					},
				];
			}
		} catch (error) {
			console.error('Failed to connect:', error);
		}
	}

	async function ondelete({ edges: edgesToDelete }: { nodes: Node[]; edges: Edge[] }) {
		try {
			// 엣지 삭제 처리
			for (const edge of edgesToDelete) {
				// terrains_tiles 삭제
				if (isTerrainTileEdgeId(edge.id)) {
					const terrainTile = terrainTiles.find((tt) => createTerrainTileEdgeId(tt) === edge.id);
					if (terrainTile) {
						await admin.removeTerrainTile(terrainTile.id);
					}
				}
			}

			// 로컬 업데이트
			edges = edges.filter((e) => !edgesToDelete.find((ed) => ed.id === e.id));
		} catch (error) {
			console.error('Failed to delete:', error);
		}
	}

	function convertToNodesAndEdges() {
		// 현재 선택된 노드 ID들 저장 (untrack으로 의존성 추적 방지)
		const selectedNodeIds = new Set(
			untrack(() => flowNodes.current.filter((n) => n.selected).map((n) => n.id))
		);

		const newNodes: Node[] = [];
		const newEdges: Edge[] = [];

		const COLUMN_GAP = 300;
		const ROW_GAP = 100;

		// 1. Terrain 노드 (왼쪽 열)
		terrains.forEach((terrain, index) => {
			const id = createTerrainNodeId(terrain);
			newNodes.push({
				id,
				type: 'terrain',
				data: { terrain },
				position: { x: 0, y: index * ROW_GAP },
				deletable: false,
				selected: selectedNodeIds.has(id),
			});
		});

		// 2. Tile 노드 (오른쪽 열)
		tiles.forEach((tile, index) => {
			const id = createTileNodeId(tile);
			newNodes.push({
				id,
				type: 'tile',
				data: { tile },
				position: { x: COLUMN_GAP, y: index * ROW_GAP },
				deletable: false,
				selected: selectedNodeIds.has(id),
			});
		});

		// 3. terrains_tiles 엣지
		terrainTiles.forEach((tt) => {
			const terrain = terrains.find((t) => t.id === tt.terrain_id);
			const tile = tiles.find((t) => t.id === tt.tile_id);
			if (!terrain || !tile) return;

			newEdges.push({
				id: createTerrainTileEdgeId(tt),
				type: 'terrainTile',
				source: createTerrainNodeId(terrain),
				target: createTileNodeId(tile),
				data: { terrainTile: tt },
				deletable: true,
			});
		});

		nodes = newNodes;
		edges = newEdges;
	}

	// 데이터 변경 시 노드/엣지 재생성
	$effect(() => {
		if (skipConvertEffect) return;

		terrains;
		tiles;
		terrainTiles;

		convertToNodesAndEdges();
	});
</script>

<SvelteFlow
	{nodes}
	{edges}
	{nodeTypes}
	{edgeTypes}
	{isValidConnection}
	colorMode={mode.current}
	{onconnect}
	{ondelete}
	fitView
>
	<Controls />
	<Background variant={BackgroundVariant.Dots} />
	<MiniMap />

	{#if selectedTerrainTile()}
		<TerrainTileEdgePanel terrainTile={selectedTerrainTile()!} />
	{/if}
</SvelteFlow>
