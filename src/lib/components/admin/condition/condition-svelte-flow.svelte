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
	import { page } from '$app/state';
	import { useCondition } from '$lib/hooks/use-condition';
	import { useBuilding } from '$lib/hooks/use-building';
	import {
		createBuildingNodeId,
		parseBuildingNodeId,
		createConditionNodeId,
		parseConditionNodeId,
		createConditionFulfillmentNodeId,
		createBuildingConditionEdgeId,
		isBuildingConditionEdgeId,
		createConditionFulfillmentEdgeId,
	} from '$lib/utils/flow-id';
	import ConditionNode from './condition-node.svelte';
	import ConditionBuildingNode from './condition-building-node.svelte';
	import ConditionFulfillmentNode from './condition-fulfillment-node.svelte';
	import ConditionActionPanel from './condition-action-panel.svelte';
	import ConditionNodePanel from './condition-node-panel.svelte';
	import ConditionBuildingEdgePanel from './condition-building-edge-panel.svelte';
	import ConditionFulfillmentNodePanel from './condition-fulfillment-node-panel.svelte';
	import ConditionBuildingEdge from './condition-building-edge.svelte';
	import type { BuildingId, ConditionId, ConditionFulfillmentId } from '$lib/types';

	const { conditionStore, conditionFulfillmentStore, buildingConditionStore, admin } = useCondition();
	const { store: buildingStore } = useBuilding();

	const flowNodes = useNodes();
	const flowEdges = useEdges();
	const { screenToFlowPosition } = useSvelteFlow();

	// URL에서 선택된 컨디션 ID
	const conditionId = $derived(page.params.conditionId as ConditionId);

	// 데이터 (선택된 컨디션 기준으로 필터링)
	const condition = $derived(conditionId ? $conditionStore.data[conditionId] : undefined);
	const conditionFulfillments = $derived(
		Object.values($conditionFulfillmentStore.data).filter((cf) => cf.condition_id === conditionId)
	);
	const buildingConditions = $derived(
		Object.values($buildingConditionStore.data).filter((bc) => bc.condition_id === conditionId)
	);
	const buildings = $derived(Object.values($buildingStore.data));

	// 선택된 노드/엣지
	const selectedNode = $derived(flowNodes.current.find((n) => n.selected));
	const selectedEdge = $derived(flowEdges.current.find((e) => e.selected));

	// 선택된 항목에 따른 데이터
	const selectedCondition = $derived(
		selectedNode?.type === 'condition' && condition && selectedNode.id === createConditionNodeId(condition)
			? condition
			: undefined
	);

	const selectedFulfillment = $derived(
		selectedNode?.type === 'fulfillment'
			? conditionFulfillments.find((cf) => cf.id === selectedNode.id.replace('condition-fulfillment-', ''))
			: undefined
	);

	const selectedBuildingCondition = $derived(() => {
		if (!selectedEdge || !isBuildingConditionEdgeId(selectedEdge.id)) return undefined;
		return buildingConditions.find((bc) => createBuildingConditionEdgeId(bc) === selectedEdge.id);
	});

	const nodeTypes = {
		condition: ConditionNode,
		building: ConditionBuildingNode,
		fulfillment: ConditionFulfillmentNode,
	};

	const edgeTypes = {
		buildingCondition: ConditionBuildingEdge,
	};

	let nodes = $state<Node[]>([]);
	let edges = $state<Edge[]>([]);
	let layoutApplied = $state(false);
	let skipConvertEffect = $state(false);

	function isValidConnection(connection: Connection | Edge) {
		const sourceNode = nodes.find((n) => n.id === connection.source);
		const targetNode = nodes.find((n) => n.id === connection.target);

		if (!sourceNode || !targetNode) return false;

		// building → condition 연결만 허용
		if (sourceNode.type === 'building' && targetNode.type === 'condition') {
			return true;
		}

		return false;
	}

	async function onconnect(connection: Connection) {
		try {
			const sourceNode = nodes.find((n) => n.id === connection.source);
			const targetNode = nodes.find((n) => n.id === connection.target);

			if (!sourceNode || !targetNode) return;

			// building → condition 연결: building_conditions 생성
			if (sourceNode.type === 'building' && targetNode.type === 'condition') {
				const buildingId = parseBuildingNodeId(connection.source);
				const conditionId = parseConditionNodeId(connection.target);

				const newBuildingCondition = await admin.createBuildingCondition({
					building_id: buildingId as BuildingId,
					condition_id: conditionId as ConditionId,
				});

				edges = [
					...edges,
					{
						id: createBuildingConditionEdgeId(newBuildingCondition),
						type: 'buildingCondition',
						source: connection.source,
						target: connection.target,
						data: { buildingCondition: newBuildingCondition },
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
		if (!sourceNode || sourceNode.type !== 'condition') return;

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
			const conditionId = parseConditionNodeId(sourceNode.id);

			// 새 fulfillment 생성
			const newFulfillment = await admin.createConditionFulfillment({
				condition_id: conditionId as ConditionId,
				fulfillment_type: 'character',
				increase_per_tick: 10,
			});

			// 모든 업데이트 완료 후 노드/엣지 재생성
			skipConvertEffect = false;
			convertToNodesAndEdges();

			// 새 노드의 위치를 드롭 위치로 설정
			if (newFulfillment) {
				nodes = nodes.map((n) =>
					n.id === createConditionFulfillmentNodeId(newFulfillment) ? { ...n, position } : n
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
				// building_conditions 삭제
				if (isBuildingConditionEdgeId(edge.id)) {
					const buildingCondition = buildingConditions.find(
						(bc) => createBuildingConditionEdgeId(bc) === edge.id
					);
					if (buildingCondition) {
						await admin.removeBuildingCondition(buildingCondition.id);
					}
				}
			}

			// 노드 삭제 처리
			for (const node of nodesToDelete) {
				if (node.type === 'fulfillment') {
					const fulfillmentId = node.id.replace('condition-fulfillment-', '');
					await admin.removeConditionFulfillment(fulfillmentId as ConditionFulfillmentId);
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

		// 1. Building 노드 (왼쪽 열)
		buildings.forEach((building, index) => {
			newNodes.push({
				id: createBuildingNodeId(building),
				type: 'building',
				data: { building },
				position: { x: 0, y: index * ROW_GAP },
				deletable: false,
			});
		});

		// 2. Condition 노드 (가운데)
		if (condition) {
			newNodes.push({
				id: createConditionNodeId(condition),
				type: 'condition',
				data: { condition },
				position: { x: COLUMN_GAP, y: 0 },
				deletable: false,
			});
		}

		// 3. Fulfillment 노드 (오른쪽 열)
		conditionFulfillments.forEach((fulfillment, index) => {
			newNodes.push({
				id: createConditionFulfillmentNodeId(fulfillment),
				type: 'fulfillment',
				data: { fulfillment },
				position: { x: COLUMN_GAP * 2, y: index * ROW_GAP },
				deletable: true,
			});
		});

		// 4. building_conditions 엣지
		buildingConditions.forEach((bc) => {
			const building = buildings.find((b) => b.id === bc.building_id);
			const targetCondition = condition && bc.condition_id === condition.id ? condition : undefined;
			if (!building || !targetCondition) return;

			newEdges.push({
				id: createBuildingConditionEdgeId(bc),
				type: 'buildingCondition',
				source: createBuildingNodeId(building),
				target: createConditionNodeId(targetCondition),
				data: { buildingCondition: bc },
				deletable: true,
				style: 'stroke: var(--color-blue-500)',
			});
		});

		// 5. condition → fulfillment 엣지
		conditionFulfillments.forEach((cf) => {
			if (!condition) return;
			newEdges.push({
				id: createConditionFulfillmentEdgeId(cf),
				source: createConditionNodeId(condition),
				target: createConditionFulfillmentNodeId(cf),
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

		condition;
		buildings;
		buildingConditions;
		conditionFulfillments;

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

	{#if selectedCondition}
		<ConditionNodePanel condition={selectedCondition} />
	{:else if selectedFulfillment}
		<ConditionFulfillmentNodePanel fulfillment={selectedFulfillment} />
	{:else if selectedBuildingCondition()}
		<ConditionBuildingEdgePanel buildingCondition={selectedBuildingCondition()!} />
	{:else}
		<ConditionActionPanel onlayout={convertToNodesAndEdges} />
	{/if}
</SvelteFlow>
