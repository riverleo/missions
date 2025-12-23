<script lang="ts">
	import {
		SvelteFlow,
		Controls,
		Background,
		BackgroundVariant,
		MiniMap,
		useNodes,
		useNodesInitialized,
		useEdges,
		useSvelteFlow,
	} from '@xyflow/svelte';
	import type { Node, Edge, Connection, OnConnectEnd } from '@xyflow/svelte';
	import { mode } from 'mode-watcher';
	import { tick } from 'svelte';
	import { page } from '$app/state';
	import { useBuildingBehavior } from '$lib/hooks/use-building-behavior';
	import {
		createBuildingBehaviorActionNodeId,
		parseBuildingBehaviorActionNodeId,
		isBuildingBehaviorActionSuccessEdgeId,
	} from '$lib/utils/flow-id';
	import { applyElkLayout } from '$lib/utils/elk-layout';
	import BuildingBehaviorActionNode from './building-behavior-action-node.svelte';
	import BuildingBehaviorActionPanel from './building-behavior-action-panel.svelte';
	import BuildingBehaviorActionNodePanel from './building-behavior-action-node-panel.svelte';
	import type { BuildingBehaviorId, BuildingBehaviorActionId } from '$lib/types';

	const { buildingBehaviorStore, buildingBehaviorActionStore, admin } = useBuildingBehavior();

	const behaviorId = $derived(page.params.behaviorId as BuildingBehaviorId);
	const behavior = $derived(behaviorId ? $buildingBehaviorStore.data[behaviorId] : undefined);
	const actions = $derived(
		behaviorId
			? Object.values($buildingBehaviorActionStore.data).filter(
					(a) => a.behavior_id === behaviorId
				)
			: []
	);

	const flowNodes = useNodes();
	const flowEdges = useEdges();
	const nodesInitialized = useNodesInitialized();
	const { screenToFlowPosition } = useSvelteFlow();

	// 레이아웃 적용 여부 추적
	let layoutApplied = $state(false);

	// 선택된 노드
	const selectedNode = $derived(flowNodes.current.find((n) => n.selected));
	const selectedAction = $derived(
		selectedNode?.type === 'action'
			? actions.find((a) => a.id === parseBuildingBehaviorActionNodeId(selectedNode.id))
			: undefined
	);
	const selectedActionHasParent = $derived(
		selectedAction
			? actions.some(
					(a) =>
						a.success_building_behavior_action_id === selectedAction.id ||
						a.failure_building_behavior_action_id === selectedAction.id
				)
			: false
	);

	const nodeTypes = {
		action: BuildingBehaviorActionNode,
	};

	let nodes = $state<Node[]>([]);
	let edges = $state<Edge[]>([]);
	let skipConvertEffect = $state(false);

	function isValidConnection(connection: Connection | Edge) {
		const sourceNode = nodes.find((n) => n.id === connection.source);
		const targetNode = nodes.find((n) => n.id === connection.target);

		if (!sourceNode || !targetNode) return false;

		// action → action 연결 허용
		if (sourceNode.type === 'action' && targetNode.type === 'action') {
			// 자기 자신에게 연결 불가
			if (connection.source === connection.target) return false;

			// 이미 연결된 핸들에는 새로운 연결 불가
			const sourceActionId = parseBuildingBehaviorActionNodeId(connection.source);
			const sourceAction = actions.find((a) => a.id === sourceActionId);
			if (sourceAction) {
				const isSuccess = connection.sourceHandle === 'success';
				const existingConnection = isSuccess
					? sourceAction.success_building_behavior_action_id
					: sourceAction.failure_building_behavior_action_id;
				if (existingConnection) return false;
			}

			return true;
		}

		return false;
	}

	async function onconnect(connection: Connection) {
		try {
			const sourceId = parseBuildingBehaviorActionNodeId(connection.source);
			const targetId = parseBuildingBehaviorActionNodeId(connection.target);

			// sourceHandle에 따라 success 또는 failure로 연결
			const isSuccess = connection.sourceHandle === 'success';

			await admin.updateBuildingBehaviorAction(sourceId as BuildingBehaviorActionId, {
				[isSuccess
					? 'success_building_behavior_action_id'
					: 'failure_building_behavior_action_id']: targetId,
			});

			edges = [
				...edges,
				{
					id: `${connection.source}-${connection.sourceHandle}-${connection.target}`,
					source: connection.source,
					sourceHandle: connection.sourceHandle,
					target: connection.target,
					targetHandle: 'target',
					style: isSuccess ? 'stroke: var(--color-green-500)' : 'stroke: var(--color-red-500)',
					deletable: true,
				},
			];
		} catch (error) {
			console.error('Failed to connect:', error);
		}
	}

	const onconnectend: OnConnectEnd = async (event, connectionState) => {
		if (connectionState.isValid) return;

		const sourceNode = connectionState.fromNode;
		if (!sourceNode || sourceNode.type !== 'action') return;
		if (!behavior) return;

		const fromActionId = parseBuildingBehaviorActionNodeId(sourceNode.id);
		const fromHandleId = connectionState.fromHandle?.id;
		const fromAction = actions.find((a) => a.id === fromActionId);
		if (!fromAction) return;

		// target 핸들에서는 새 액션 생성 불가
		if (fromHandleId === 'target') return;

		// 이미 연결된 핸들에서는 새 액션 생성 불가
		if (fromHandleId === 'success') {
			if (fromAction.success_building_behavior_action_id) return;
		} else if (fromHandleId === 'failure') {
			if (fromAction.failure_building_behavior_action_id) return;
		}

		// 마우스/터치 위치를 플로우 좌표로 변환
		const clientX =
			'changedTouches' in event ? (event.changedTouches[0]?.clientX ?? 0) : event.clientX;
		const clientY =
			'changedTouches' in event ? (event.changedTouches[0]?.clientY ?? 0) : event.clientY;
		const position = screenToFlowPosition({ x: clientX, y: clientY });

		skipConvertEffect = true;

		try {
			// 새 액션 생성
			const newAction = await admin.createBuildingBehaviorAction({
				behavior_id: behavior.id,
			});

			// 우측 핸들(success/failure)에서 드래그: 기존 액션이 새 액션을 가리킴
			const isSuccess = fromHandleId === 'success';
			await admin.updateBuildingBehaviorAction(fromActionId as BuildingBehaviorActionId, {
				[isSuccess
					? 'success_building_behavior_action_id'
					: 'failure_building_behavior_action_id']: newAction.id,
			});

			skipConvertEffect = false;
			await tick();
			convertToNodesAndEdges();

			// 새 노드의 위치를 드롭 위치로 설정
			if (newAction) {
				nodes = nodes.map((n) =>
					n.id === createBuildingBehaviorActionNodeId(newAction) ? { ...n, position } : n
				);
			}
		} catch (error) {
			skipConvertEffect = false;
			console.error('Failed to create action on edge drop:', error);
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
				const sourceId = parseBuildingBehaviorActionNodeId(edge.source);
				const isSuccess = isBuildingBehaviorActionSuccessEdgeId(edge.id);

				await admin.updateBuildingBehaviorAction(sourceId as BuildingBehaviorActionId, {
					[isSuccess
						? 'success_building_behavior_action_id'
						: 'failure_building_behavior_action_id']: null,
				});
			}

			// 노드 삭제 처리
			for (const node of nodesToDelete) {
				if (node.type === 'action') {
					const actionId = parseBuildingBehaviorActionNodeId(node.id);
					await admin.removeBuildingBehaviorAction(actionId as BuildingBehaviorActionId);
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

		const COLUMN_GAP = 250;
		const ROW_GAP = 150;

		// 액션 노드
		actions.forEach((action, index) => {
			const row = Math.floor(index / 3);
			const col = index % 3;

			// 이 액션을 가리키는 부모 액션 찾기
			const parentAction = actions.find(
				(a) =>
					a.success_building_behavior_action_id === action.id ||
					a.failure_building_behavior_action_id === action.id
			);
			const isSuccessTarget = parentAction?.success_building_behavior_action_id === action.id;

			newNodes.push({
				id: createBuildingBehaviorActionNodeId(action),
				type: 'action',
				data: { action, parentAction, isSuccessTarget },
				position: { x: col * COLUMN_GAP, y: row * ROW_GAP },
				deletable: true,
			});
		});

		// 성공/실패 엣지
		actions.forEach((action) => {
			if (action.success_building_behavior_action_id) {
				const targetAction = actions.find(
					(a) => a.id === action.success_building_behavior_action_id
				);
				if (targetAction) {
					newEdges.push({
						id: `${createBuildingBehaviorActionNodeId(action)}-success-${createBuildingBehaviorActionNodeId(targetAction)}`,
						source: createBuildingBehaviorActionNodeId(action),
						sourceHandle: 'success',
						target: createBuildingBehaviorActionNodeId(targetAction),
						targetHandle: 'target',
						style: 'stroke: var(--color-green-500)',
						deletable: true,
					});
				}
			}

			if (action.failure_building_behavior_action_id) {
				const targetAction = actions.find(
					(a) => a.id === action.failure_building_behavior_action_id
				);
				if (targetAction) {
					newEdges.push({
						id: `${createBuildingBehaviorActionNodeId(action)}-failure-${createBuildingBehaviorActionNodeId(targetAction)}`,
						source: createBuildingBehaviorActionNodeId(action),
						sourceHandle: 'failure',
						target: createBuildingBehaviorActionNodeId(targetAction),
						targetHandle: 'target',
						style: 'stroke: var(--color-red-500)',
						deletable: true,
					});
				}
			}
		});

		nodes = newNodes;
		edges = newEdges;
		layoutApplied = false;
	}

	async function onlayout() {
		if (nodes.length === 0) return;

		try {
			// flowNodes.current에서 측정된 크기를 가져옴
			const nodesWithMeasured = flowNodes.current;

			// success 엣지를 먼저 배치하여 위쪽에 오도록 정렬
			const sortedEdges = [...edges].sort((a, b) => {
				if (a.sourceHandle === 'success' && b.sourceHandle === 'failure') return -1;
				if (a.sourceHandle === 'failure' && b.sourceHandle === 'success') return 1;
				return 0;
			});

			const layoutedNodes = await applyElkLayout(nodesWithMeasured, sortedEdges);
			nodes = layoutedNodes;
		} catch (error) {
			console.error('Failed to layout:', error);
		}
	}

	// 데이터 변경 시 노드/엣지 재생성
	$effect(() => {
		if (skipConvertEffect) return;

		actions;
		convertToNodesAndEdges();
	});

	// 노드 측정 완료 후 레이아웃 자동 적용
	$effect(() => {
		if (nodesInitialized.current && !layoutApplied && nodes.length > 0) {
			onlayout().then(() => {
				layoutApplied = true;
			});
		}
	});
</script>

<SvelteFlow
	{nodes}
	{edges}
	{nodeTypes}
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

	{#if selectedAction}
		<BuildingBehaviorActionNodePanel action={selectedAction} hasParent={selectedActionHasParent} />
	{:else}
		<BuildingBehaviorActionPanel {behavior} {onlayout} />
	{/if}
</SvelteFlow>
