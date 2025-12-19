<script lang="ts">
	import {
		SvelteFlow,
		Controls,
		Background,
		BackgroundVariant,
		MiniMap,
		useNodes,
		useEdges,
		useSvelteFlow,
	} from '@xyflow/svelte';
	import type { Node, Edge, Connection, OnConnectEnd } from '@xyflow/svelte';
	import { mode } from 'mode-watcher';
	import { useNeed } from '$lib/hooks/use-need';
	import { useCharacter } from '$lib/hooks/use-character';
	import NeedNode from './need-node.svelte';
	import NeedCharacterNode from './need-character-node.svelte';
	import NeedFulfillmentNode from './need-fulfillment-node.svelte';
	import NeedActionPanel from './need-action-panel.svelte';
	import NeedNodePanel from './need-node-panel.svelte';
	import NeedCharacterEdgePanel from './need-character-edge-panel.svelte';
	import NeedFulfillmentNodePanel from './need-fulfillment-node-panel.svelte';
	import NeedCharacterEdge from './need-character-edge.svelte';

	const { needStore, needFulfillmentStore, characterNeedStore, admin } = useNeed();
	const { store: characterStore } = useCharacter();

	const flowNodes = useNodes();
	const flowEdges = useEdges();
	const { screenToFlowPosition } = useSvelteFlow();

	// 데이터
	const needs = $derived(Object.values($needStore.data));
	const needFulfillments = $derived(Object.values($needFulfillmentStore.data));
	const characterNeeds = $derived(Object.values($characterNeedStore.data));
	const characters = $derived(Object.values($characterStore.data));

	// 선택된 노드/엣지
	const selectedNode = $derived(flowNodes.current.find((n) => n.selected));
	const selectedEdge = $derived(flowEdges.current.find((e) => e.selected));

	// 선택된 항목에 따른 데이터
	const selectedNeed = $derived(
		selectedNode?.type === 'need'
			? needs.find((n) => n.id === selectedNode.id.replace('need-', ''))
			: undefined
	);

	const selectedFulfillment = $derived(
		selectedNode?.type === 'fulfillment'
			? needFulfillments.find((nf) => nf.id === selectedNode.id.replace('fulfillment-', ''))
			: undefined
	);

	const selectedCharacterNeed = $derived(() => {
		if (!selectedEdge?.id.startsWith('character-need-')) return undefined;
		return characterNeeds.find(
			(cn) => `character-need-${cn.character_id}-${cn.need_id}` === selectedEdge.id
		);
	});

	const nodeTypes = {
		need: NeedNode,
		character: NeedCharacterNode,
		fulfillment: NeedFulfillmentNode,
	};

	const edgeTypes = {
		characterNeed: NeedCharacterEdge,
	};

	let nodes = $state<Node[]>([]);
	let edges = $state<Edge[]>([]);
	let layoutApplied = $state(false);
	let skipConvertEffect = $state(false);

	function isValidConnection(connection: Connection | Edge) {
		const sourceNode = nodes.find((n) => n.id === connection.source);
		const targetNode = nodes.find((n) => n.id === connection.target);

		if (!sourceNode || !targetNode) return false;

		// character → need 연결만 허용
		if (sourceNode.type === 'character' && targetNode.type === 'need') {
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

				const newCharacterNeed = await admin.createCharacterNeed({
					character_id: characterId,
					need_id: needId,
				});

				edges = [
					...edges,
					{
						id: `character-need-${characterId}-${needId}`,
						type: 'characterNeed',
						source: connection.source,
						target: connection.target,
						data: { characterNeed: newCharacterNeed },
						deletable: true,
						style: 'stroke: var(--color-blue-500)',
					},
				];
			}
		} catch (error) {
			console.error('Failed to connect:', error);
		}
	}

	const onconnectend: OnConnectEnd = async (event, connectionState) => {
		// 유효한 연결이면 무시 (onconnect에서 처리)
		if (connectionState.isValid) return;

		const sourceNode = connectionState.fromNode;
		if (!sourceNode || sourceNode.type !== 'need') return;

		// 마우스/터치 위치를 플로우 좌표로 변환
		const clientX =
			'changedTouches' in event ? (event.changedTouches[0]?.clientX ?? 0) : event.clientX;
		const clientY =
			'changedTouches' in event ? (event.changedTouches[0]?.clientY ?? 0) : event.clientY;
		const position = screenToFlowPosition({ x: clientX, y: clientY });

		// 스토어 업데이트 중 effect 건너뛰기
		skipConvertEffect = true;

		try {
			const needId = sourceNode.id.replace('need-', '');

			// 새 fulfillment 생성
			const newFulfillment = await admin.createNeedFulfillment({
				need_id: needId,
				fulfillment_type: 'building',
				increase_per_tick: 10,
			});

			// 모든 업데이트 완료 후 노드/엣지 재생성
			skipConvertEffect = false;
			convertToNodesAndEdges();

			// 새 노드의 위치를 드롭 위치로 설정
			if (newFulfillment) {
				nodes = nodes.map((n) =>
					n.id === `fulfillment-${newFulfillment.id}` ? { ...n, position } : n
				);
				layoutApplied = true;
			}
		} catch (error) {
			skipConvertEffect = false;
			console.error('Failed to create fulfillment on edge drop:', error);
		}
	};

	async function ondelete({
		nodes: nodesToDelete,
		edges: edgesToDelete,
	}: {
		nodes: Node[];
		edges: Edge[];
	}) {
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
			}

			// 노드 삭제 처리
			for (const node of nodesToDelete) {
				if (node.type === 'fulfillment') {
					const fulfillmentId = node.id.replace('fulfillment-', '');
					await admin.removeNeedFulfillment(fulfillmentId);
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
				deletable: false,
			});
		});

		// 3. Fulfillment 노드 (오른쪽 열)
		needFulfillments.forEach((fulfillment, index) => {
			newNodes.push({
				id: `fulfillment-${fulfillment.id}`,
				type: 'fulfillment',
				data: { fulfillment },
				position: { x: COLUMN_GAP * 2, y: index * ROW_GAP },
				deletable: true,
			});
		});

		// 4. character_needs 엣지
		characterNeeds.forEach((cn) => {
			newEdges.push({
				id: `character-need-${cn.character_id}-${cn.need_id}`,
				type: 'characterNeed',
				source: `character-${cn.character_id}`,
				target: `need-${cn.need_id}`,
				data: { characterNeed: cn },
				deletable: true,
				style: 'stroke: var(--color-blue-500)',
			});
		});

		// 5. need → fulfillment 엣지
		needFulfillments.forEach((nf) => {
			newEdges.push({
				id: `need-fulfillment-${nf.need_id}-${nf.id}`,
				source: `need-${nf.need_id}`,
				target: `fulfillment-${nf.id}`,
				deletable: false,
			});
		});

		nodes = newNodes;
		edges = newEdges;
		layoutApplied = true;
	}

	// 데이터 변경 시 노드/엣지 재생성
	$effect(() => {
		if (skipConvertEffect) return;

		needs;
		characters;
		characterNeeds;
		needFulfillments;

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
	{onconnectend}
	{ondelete}
	fitView
>
	<Controls />
	<Background variant={BackgroundVariant.Dots} />
	<MiniMap />

	{#if selectedNeed}
		<NeedNodePanel need={selectedNeed} />
	{:else if selectedFulfillment}
		<NeedFulfillmentNodePanel fulfillment={selectedFulfillment} />
	{:else if selectedCharacterNeed()}
		<NeedCharacterEdgePanel characterNeed={selectedCharacterNeed()!} />
	{:else}
		<NeedActionPanel onlayout={convertToNodesAndEdges} />
	{/if}
</SvelteFlow>
