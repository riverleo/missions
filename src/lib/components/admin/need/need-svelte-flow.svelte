<script lang="ts">
	import type { ScenarioId } from '$lib/types';
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
	import { page } from '$app/state';
	import { useCharacter } from '$lib/hooks/use-character';
	import {
		createCharacterNodeId,
		parseCharacterNodeId,
		createNeedNodeId,
		parseNeedNodeId,
		createFulfillmentNodeId,
		parseFulfillmentNodeId,
		createCharacterNeedEdgeId,
		isCharacterNeedEdgeId,
		createNeedFulfillmentEdgeId,
	} from '$lib/utils/flow-id';
	import NeedNode from './need-node.svelte';
	import NeedCharacterNode from './need-character-node.svelte';
	import NeedFulfillmentNode from './need-fulfillment-node.svelte';
	import NeedActionPanel from './need-action-panel.svelte';
	import NeedNodePanel from './need-node-panel.svelte';
	import NeedCharacterEdgePanel from './need-character-edge-panel.svelte';
	import NeedFulfillmentNodePanel from './need-fulfillment-node-panel.svelte';
	import NeedCharacterEdge from './need-character-edge.svelte';
	import type { CharacterId, NeedId, NeedFulfillmentId } from '$lib/types';

	const { needStore, needFulfillmentStore, characterNeedStore, admin } = useCharacter();

	const scenarioId = $derived(page.params.scenarioId as ScenarioId);
	const { characterStore } = useCharacter();

	const flowNodes = useNodes();
	const flowEdges = useEdges();
	const { screenToFlowPosition } = useSvelteFlow();

	// URL에서 선택된 욕구 ID
	const needId = $derived(page.params.needId as NeedId);

	// 데이터 (선택된 욕구 기준으로 필터링)
	const need = $derived(needId ? $needStore.data[needId] : undefined);
	const needFulfillments = $derived(
		Object.values($needFulfillmentStore.data).filter((nf) => nf.need_id === needId)
	);
	const characterNeeds = $derived(
		Object.values($characterNeedStore.data).filter((cn) => cn.need_id === needId)
	);
	const characters = $derived(Object.values($characterStore.data));

	// 선택된 노드/엣지
	const selectedNode = $derived(flowNodes.current.find((n) => n.selected));
	const selectedEdge = $derived(flowEdges.current.find((e) => e.selected));

	// 선택된 항목에 따른 데이터
	const selectedNeed = $derived(
		selectedNode?.type === 'need' && need && selectedNode.id === createNeedNodeId(need)
			? need
			: undefined
	);

	const selectedFulfillment = $derived(
		selectedNode?.type === 'fulfillment'
			? needFulfillments.find((nf) => nf.id === parseFulfillmentNodeId(selectedNode.id))
			: undefined
	);

	const selectedCharacterNeed = $derived(() => {
		if (!selectedEdge || !isCharacterNeedEdgeId(selectedEdge.id)) return undefined;
		return characterNeeds.find((cn) => createCharacterNeedEdgeId(cn) === selectedEdge.id);
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
				const characterId = parseCharacterNodeId(connection.source);
				const needId = parseNeedNodeId(connection.target);

				const newCharacterNeed = await admin.createCharacterNeed(scenarioId, {
					character_id: characterId as CharacterId,
					need_id: needId as NeedId,
				});

				edges = [
					...edges,
					{
						id: createCharacterNeedEdgeId(newCharacterNeed),
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

		// source 핸들(오른쪽)에서만 새 노드 생성 가능
		const fromHandleType = connectionState.fromHandle?.type;
		if (fromHandleType !== 'source') return;

		// 마우스/터치 위치를 플로우 좌표로 변환
		const clientX =
			'changedTouches' in event ? (event.changedTouches[0]?.clientX ?? 0) : event.clientX;
		const clientY =
			'changedTouches' in event ? (event.changedTouches[0]?.clientY ?? 0) : event.clientY;
		const position = screenToFlowPosition({ x: clientX, y: clientY });

		// 스토어 업데이트 중 effect 건너뛰기
		skipConvertEffect = true;

		try {
			const needId = parseNeedNodeId(sourceNode.id);

			// 새 fulfillment 생성 (기본값은 idle 타입)
			const newFulfillment = await admin.createNeedFulfillment(scenarioId, {
				need_id: needId as NeedId,
				fulfillment_type: 'idle',
				increase_per_tick: 10,
			});

			// 모든 업데이트 완료 후 노드/엣지 재생성
			skipConvertEffect = false;
			convertToNodesAndEdges();

			// 새 노드의 위치를 드롭 위치로 설정
			if (newFulfillment) {
				nodes = nodes.map((n) =>
					n.id === createFulfillmentNodeId(newFulfillment) ? { ...n, position } : n
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
				if (isCharacterNeedEdgeId(edge.id)) {
					const characterNeed = characterNeeds.find(
						(cn) => createCharacterNeedEdgeId(cn) === edge.id
					);
					if (characterNeed) {
						await admin.removeCharacterNeed(characterNeed.id);
					}
				}
			}

			// 노드 삭제 처리
			for (const node of nodesToDelete) {
				if (node.type === 'fulfillment') {
					const fulfillmentId = parseFulfillmentNodeId(node.id);
					await admin.removeNeedFulfillment(fulfillmentId as NeedFulfillmentId);
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
				id: createCharacterNodeId(character),
				type: 'character',
				data: { character },
				position: { x: 0, y: index * ROW_GAP },
				deletable: false,
			});
		});

		// 2. Need 노드 (가운데)
		if (need) {
			newNodes.push({
				id: createNeedNodeId(need),
				type: 'need',
				data: { need },
				position: { x: COLUMN_GAP, y: 0 },
				deletable: false,
			});
		}

		// 3. Fulfillment 노드 (오른쪽 열)
		needFulfillments.forEach((fulfillment, index) => {
			newNodes.push({
				id: createFulfillmentNodeId(fulfillment),
				type: 'fulfillment',
				data: { fulfillment },
				position: { x: COLUMN_GAP * 2, y: index * ROW_GAP },
				deletable: true,
			});
		});

		// 4. character_needs 엣지
		characterNeeds.forEach((cn) => {
			const character = characters.find((c) => c.id === cn.character_id);
			const targetNeed = need && cn.need_id === need.id ? need : undefined;
			if (!character || !targetNeed) return;

			newEdges.push({
				id: createCharacterNeedEdgeId(cn),
				type: 'characterNeed',
				source: createCharacterNodeId(character),
				target: createNeedNodeId(targetNeed),
				data: { characterNeed: cn },
				deletable: true,
				style: 'stroke: var(--color-blue-500)',
			});
		});

		// 5. need → fulfillment 엣지
		needFulfillments.forEach((nf) => {
			if (!need) return;
			newEdges.push({
				id: createNeedFulfillmentEdgeId(nf),
				source: createNeedNodeId(need),
				target: createFulfillmentNodeId(nf),
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

		need;
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
