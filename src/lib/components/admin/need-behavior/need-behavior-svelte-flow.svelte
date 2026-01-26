<script lang="ts">
	import type { ScenarioId } from '$lib/types';
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
	import { useBehavior } from '$lib/hooks/use-behavior';
	import { createActionNodeId, parseActionNodeId, isActionNextEdgeId } from '$lib/utils/flow-id';
	import { applyElkLayout } from '$lib/utils/elk-layout';
	import NeedBehaviorActionNode from './need-behavior-action-node.svelte';
	import NeedBehaviorActionPanel from './need-behavior-action-panel.svelte';
	import NeedBehaviorActionNodePanel from './need-behavior-action-node-panel.svelte';
	import type { NeedBehaviorId, NeedBehaviorActionId } from '$lib/types';

	const { needBehaviorStore, needBehaviorActionStore, admin } = useBehavior();

	const scenarioId = $derived(page.params.scenarioId as ScenarioId);

	const needBehaviorId = $derived(page.params.behaviorId as NeedBehaviorId);
	const behavior = $derived(needBehaviorId ? $needBehaviorStore.data[needBehaviorId] : undefined);
	const actions = $derived(
		needBehaviorId
			? Object.values($needBehaviorActionStore.data).filter((a) => a.behavior_id === needBehaviorId)
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
			? actions.find((a) => a.id === parseActionNodeId(selectedNode.id))
			: undefined
	);
	const selectedActionHasParent = $derived(
		selectedAction
			? actions.some((a) => a.next_need_behavior_action_id === selectedAction.id)
			: false
	);

	const nodeTypes = {
		action: NeedBehaviorActionNode,
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
			const sourceActionId = parseActionNodeId(connection.source);
			const sourceAction = actions.find((a) => a.id === sourceActionId);
			if (sourceAction && sourceAction.next_need_behavior_action_id) {
				return false;
			}

			return true;
		}

		return false;
	}

	async function onconnect(connection: Connection) {
		try {
			const sourceId = parseActionNodeId(connection.source);
			const targetId = parseActionNodeId(connection.target);

			await admin.updateNeedBehaviorAction(sourceId as NeedBehaviorActionId, {
				next_need_behavior_action_id: targetId as NeedBehaviorActionId,
			});

			edges = [
				...edges,
				{
					id: `${connection.source}-next-${connection.target}`,
					source: connection.source,
					sourceHandle: 'next',
					target: connection.target,
					targetHandle: 'target',
					
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

		const fromActionId = parseActionNodeId(sourceNode.id);
		const fromHandleId = connectionState.fromHandle?.id;
		const fromAction = actions.find((a) => a.id === fromActionId);
		if (!fromAction) return;

		// target 핸들에서는 새 액션 생성 불가
		if (fromHandleId === 'target') return;

		// 이미 연결된 핸들에서는 새 액션 생성 불가
		if (fromHandleId === 'next' && fromAction.next_need_behavior_action_id) return;

		// 마우스/터치 위치를 플로우 좌표로 변환
		const clientX =
			'changedTouches' in event ? (event.changedTouches[0]?.clientX ?? 0) : event.clientX;
		const clientY =
			'changedTouches' in event ? (event.changedTouches[0]?.clientY ?? 0) : event.clientY;
		const position = screenToFlowPosition({ x: clientX, y: clientY });

		skipConvertEffect = true;

		try {
			// 새 액션 생성
			const newAction = await admin.createNeedBehaviorAction(scenarioId, {
				need_id: behavior.need_id,
				behavior_id: behavior.id,
				type: 'idle',
				behavior_interact_type: 'building_execute',
			});

			// 우측 핸들(next)에서 드래그: 기존 액션이 새 액션을 가리킴
			await admin.updateNeedBehaviorAction(fromActionId as NeedBehaviorActionId, {
				next_need_behavior_action_id: newAction.id,
			});

			skipConvertEffect = false;
			await tick();
			convertToNodesAndEdges();

			// 새 노드의 위치를 드롭 위치로 설정
			if (newAction) {
				nodes = nodes.map((n) => (n.id === createActionNodeId(newAction) ? { ...n, position } : n));
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
				const sourceId = parseActionNodeId(edge.source);

				await admin.updateNeedBehaviorAction(sourceId as NeedBehaviorActionId, {
					next_need_behavior_action_id: null,
				});
			}

			// 노드 삭제 처리
			for (const node of nodesToDelete) {
				if (node.type === 'action') {
					const actionId = parseActionNodeId(node.id);
					await admin.removeNeedBehaviorAction(actionId as NeedBehaviorActionId);
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
			const parentAction = actions.find((a) => a.next_need_behavior_action_id === action.id);

			newNodes.push({
				id: createActionNodeId(action),
				type: 'action',
				data: { action, parentAction },
				position: { x: col * COLUMN_GAP, y: row * ROW_GAP },
				deletable: true,
			});
		});

		// 다음 액션 엣지
		actions.forEach((action) => {
			if (action.next_need_behavior_action_id) {
				const targetAction = actions.find((a) => a.id === action.next_need_behavior_action_id);
				if (targetAction) {
					newEdges.push({
						id: `${createActionNodeId(action)}-next-${createActionNodeId(targetAction)}`,
						source: createActionNodeId(action),
						sourceHandle: 'next',
						target: createActionNodeId(targetAction),
						targetHandle: 'target',
						
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

			const layoutedNodes = await applyElkLayout(nodesWithMeasured, edges);
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
		<NeedBehaviorActionNodePanel action={selectedAction} hasParent={selectedActionHasParent} />
	{:else}
		<NeedBehaviorActionPanel {behavior} {onlayout} />
	{/if}
</SvelteFlow>
