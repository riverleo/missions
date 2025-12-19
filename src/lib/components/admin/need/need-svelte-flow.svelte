<script lang="ts">
	import {
		SvelteFlow,
		Controls,
		Background,
		BackgroundVariant,
		MiniMap,
	} from '@xyflow/svelte';
	import type { Node, Edge, Connection } from '@xyflow/svelte';
	import { mode } from 'mode-watcher';
	import { useNeed } from '$lib/hooks/use-need';
	import { useCharacter } from '$lib/hooks/use-character';
	import { useBuilding } from '$lib/hooks/use-building';
	import NeedNode from './need-node.svelte';
	import NeedCharacterNode from './need-character-node.svelte';
	import NeedBuildingNode from './need-building-node.svelte';
	import NeedPanel from './need-panel.svelte';

	const { needStore, needFulfillmentStore, characterNeedStore, admin } = useNeed();
	const { store: characterStore } = useCharacter();
	const { store: buildingStore } = useBuilding();

	// 데이터
	const needs = $derived(Object.values($needStore.data));
	const needFulfillments = $derived(Object.values($needFulfillmentStore.data));
	const characterNeeds = $derived(Object.values($characterNeedStore.data));
	const characters = $derived(Object.values($characterStore.data));
	const buildings = $derived(Object.values($buildingStore.data));

	const nodeTypes = {
		need: NeedNode,
		character: NeedCharacterNode,
		building: NeedBuildingNode,
	};

	let nodes = $state<Node[]>([]);
	let edges = $state<Edge[]>([]);
	let layoutApplied = $state(false);

	function isValidConnection(connection: Connection | Edge) {
		const sourceNode = nodes.find((n) => n.id === connection.source);
		const targetNode = nodes.find((n) => n.id === connection.target);

		if (!sourceNode || !targetNode) return false;

		// character → need 연결만 허용
		if (sourceNode.type === 'character' && targetNode.type === 'need') {
			return true;
		}

		// need → building 연결만 허용
		if (sourceNode.type === 'need' && targetNode.type === 'building') {
			return true;
		}

		return false;
	}

	async function onconnect(connection: Connection) {
		try {
			const sourceNode = nodes.find((n) => n.id === connection.source);
			const targetNode = nodes.find((n) => n.id === connection.target);

			if (!sourceNode || !targetNode) return;

			// character → need 연결: character_needs 생성
			if (sourceNode.type === 'character' && targetNode.type === 'need') {
				const characterId = connection.source.replace('character-', '');
				const needId = connection.target.replace('need-', '');

				await admin.createCharacterNeed({
					character_id: characterId,
					need_id: needId,
				});

				edges = [
					...edges,
					{
						id: `character-need-${characterId}-${needId}`,
						source: connection.source,
						target: connection.target,
						deletable: true,
					},
				];
			}

			// need → building 연결: need_fulfillments 생성
			if (sourceNode.type === 'need' && targetNode.type === 'building') {
				const needId = connection.source.replace('need-', '');
				const buildingId = connection.target.replace('building-', '');

				await admin.createNeedFulfillment({
					need_id: needId,
					fulfillment_type: 'building',
					building_id: buildingId,
					amount: 10,
				});

				edges = [
					...edges,
					{
						id: `need-building-${needId}-${buildingId}`,
						source: connection.source,
						target: connection.target,
						deletable: true,
					},
				];
			}
		} catch (error) {
			console.error('Failed to connect:', error);
		}
	}

	async function ondelete({ nodes: nodesToDelete, edges: edgesToDelete }: { nodes: Node[]; edges: Edge[] }) {
		try {
			// 엣지 삭제 처리
			for (const edge of edgesToDelete) {
				// character_needs 삭제
				if (edge.id.startsWith('character-need-')) {
					const characterNeed = characterNeeds.find(
						(cn) => `character-need-${cn.character_id}-${cn.need_id}` === edge.id
					);
					if (characterNeed) {
						await admin.removeCharacterNeed(characterNeed.id);
					}
				}
				// need_fulfillments 삭제
				else if (edge.id.startsWith('need-building-')) {
					const parts = edge.id.replace('need-building-', '').split('-');
					const needId = parts[0];
					const buildingId = parts[1];
					const fulfillment = needFulfillments.find(
						(nf) => nf.need_id === needId && nf.building_id === buildingId
					);
					if (fulfillment) {
						await admin.removeNeedFulfillment(fulfillment.id);
					}
				}
			}

			// 노드 삭제 처리
			for (const node of nodesToDelete) {
				if (node.type === 'need') {
					const needId = node.id.replace('need-', '');
					await admin.removeNeed(needId);
				}
			}

			// 로컬 업데이트
			nodes = nodes.filter((n) => !nodesToDelete.find((nd) => nd.id === n.id));
			edges = edges.filter(
				(e) =>
					!edgesToDelete.find((ed) => ed.id === e.id) &&
					!nodesToDelete.find((nd) => nd.id === e.source || nd.id === e.target)
			);
		} catch (error) {
			console.error('Failed to delete:', error);
		}
	}

	function convertToNodesAndEdges() {
		const newNodes: Node[] = [];
		const newEdges: Edge[] = [];

		const COLUMN_GAP = 300;
		const ROW_GAP = 100;

		// 1. Character 노드 (왼쪽 열)
		characters.forEach((character, index) => {
			newNodes.push({
				id: `character-${character.id}`,
				type: 'character',
				data: { character },
				position: { x: 0, y: index * ROW_GAP },
				deletable: false,
			});
		});

		// 2. Need 노드 (가운데 열)
		needs.forEach((need, index) => {
			newNodes.push({
				id: `need-${need.id}`,
				type: 'need',
				data: { need },
				position: { x: COLUMN_GAP, y: index * ROW_GAP },
				deletable: true,
			});
		});

		// 3. Building 노드 (오른쪽 열)
		buildings.forEach((building, index) => {
			newNodes.push({
				id: `building-${building.id}`,
				type: 'building',
				data: { building },
				position: { x: COLUMN_GAP * 2, y: index * ROW_GAP },
				deletable: false,
			});
		});

		// 4. character_needs 엣지
		characterNeeds.forEach((cn) => {
			newEdges.push({
				id: `character-need-${cn.character_id}-${cn.need_id}`,
				source: `character-${cn.character_id}`,
				target: `need-${cn.need_id}`,
				deletable: true,
			});
		});

		// 5. need_fulfillments (building 타입) 엣지
		needFulfillments
			.filter((nf) => nf.fulfillment_type === 'building' && nf.building_id)
			.forEach((nf) => {
				newEdges.push({
					id: `need-building-${nf.need_id}-${nf.building_id}`,
					source: `need-${nf.need_id}`,
					target: `building-${nf.building_id}`,
					deletable: true,
				});
			});

		nodes = newNodes;
		edges = newEdges;
		layoutApplied = true;
	}

	// 데이터 변경 시 노드/엣지 재생성
	$effect(() => {
		needs;
		characters;
		buildings;
		characterNeeds;
		needFulfillments;

		convertToNodesAndEdges();
	});
</script>

<SvelteFlow
	{nodes}
	{edges}
	{nodeTypes}
	{isValidConnection}
	colorMode={mode.current}
	{onconnect}
	{ondelete}
	fitView
>
	<Controls />
	<Background variant={BackgroundVariant.Dots} />
	<MiniMap />

	<NeedPanel onlayout={convertToNodesAndEdges} />
</SvelteFlow>
