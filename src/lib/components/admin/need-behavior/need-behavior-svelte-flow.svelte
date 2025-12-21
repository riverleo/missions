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
	import { useNeedBehavior } from '$lib/hooks/use-need-behavior';
	import NeedBehaviorActionNode from './need-behavior-action-node.svelte';
	import NeedBehaviorActionPanel from './need-behavior-action-panel.svelte';
	import NeedBehaviorActionNodePanel from './need-behavior-action-node-panel.svelte';

	const { needBehaviorStore, needBehaviorActionStore, admin } = useNeedBehavior();

	const behaviorId = $derived(page.params.behaviorId);
	const behavior = $derived(behaviorId ? $needBehaviorStore.data[behaviorId] : undefined);
	const actions = $derived(
		behaviorId
			? Object.values($needBehaviorActionStore.data).filter((a) => a.behavior_id === behaviorId)
			: []
	);

	const flowNodes = useNodes();
	const flowEdges = useEdges();
	const { screenToFlowPosition } = useSvelteFlow();

	// 선택된 노드
	const selectedNode = $derived(flowNodes.current.find((n) => n.selected));
	const selectedAction = $derived(
		selectedNode?.type === 'action'
			? actions.find((a) => a.id === selectedNode.id.replace('action-', ''))
			: undefined
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
			return connection.source !== connection.target;
		}

		return false;
	}

	async function onconnect(connection: Connection) {
		try {
			const sourceId = connection.source.replace('action-', '');
			const targetId = connection.target.replace('action-', '');

			// sourceHandle에 따라 success 또는 failure로 연결
			const isSuccess = connection.sourceHandle === 'success';

			await admin.updateAction(sourceId, {
				[isSuccess ? 'success_need_behavior_action_id' : 'failure_need_behavior_action_id']:
					targetId,
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

		// 마우스/터치 위치를 플로우 좌표로 변환
		const clientX =
			'changedTouches' in event ? (event.changedTouches[0]?.clientX ?? 0) : event.clientX;
		const clientY =
			'changedTouches' in event ? (event.changedTouches[0]?.clientY ?? 0) : event.clientY;
		const position = screenToFlowPosition({ x: clientX, y: clientY });

		skipConvertEffect = true;

		try {
			const sourceActionId = sourceNode.id.replace('action-', '');
			const isSuccess = connectionState.fromHandle?.id === 'success';

			// 새 액션 생성
			const newAction = await admin.createAction({
				need_id: behavior.need_id,
				behavior_id: behavior.id,
				type: 'wait',
				order_in_need_behavior: actions.length,
			});

			// 연결 업데이트
			await admin.updateAction(sourceActionId, {
				[isSuccess ? 'success_need_behavior_action_id' : 'failure_need_behavior_action_id']:
					newAction.id,
			});

			skipConvertEffect = false;
			convertToNodesAndEdges();

			// 새 노드의 위치를 드롭 위치로 설정
			if (newAction) {
				nodes = nodes.map((n) =>
					n.id === `action-${newAction.id}` ? { ...n, position } : n
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
				const sourceId = edge.source.replace('action-', '');
				const isSuccess = edge.sourceHandle === 'success';

				await admin.updateAction(sourceId, {
					[isSuccess ? 'success_need_behavior_action_id' : 'failure_need_behavior_action_id']:
						null,
				});
			}

			// 노드 삭제 처리
			for (const node of nodesToDelete) {
				if (node.type === 'action') {
					const actionId = node.id.replace('action-', '');
					await admin.removeAction(actionId);
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

			newNodes.push({
				id: `action-${action.id}`,
				type: 'action',
				data: { action },
				position: { x: col * COLUMN_GAP, y: row * ROW_GAP },
				deletable: true,
			});
		});

		// 성공/실패 엣지
		actions.forEach((action) => {
			if (action.success_need_behavior_action_id) {
				newEdges.push({
					id: `action-${action.id}-success-action-${action.success_need_behavior_action_id}`,
					source: `action-${action.id}`,
					sourceHandle: 'success',
					target: `action-${action.success_need_behavior_action_id}`,
					targetHandle: 'target',
					style: 'stroke: var(--color-green-500)',
					deletable: true,
				});
			}

			if (action.failure_need_behavior_action_id) {
				newEdges.push({
					id: `action-${action.id}-failure-action-${action.failure_need_behavior_action_id}`,
					source: `action-${action.id}`,
					sourceHandle: 'failure',
					target: `action-${action.failure_need_behavior_action_id}`,
					targetHandle: 'target',
					style: 'stroke: var(--color-red-500)',
					deletable: true,
				});
			}
		});

		nodes = newNodes;
		edges = newEdges;
	}

	// 데이터 변경 시 노드/엣지 재생성
	$effect(() => {
		if (skipConvertEffect) return;

		actions;
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
	{onconnectend}
	{ondelete}
	fitView
>
	<Controls />
	<Background variant={BackgroundVariant.Dots} />
	<MiniMap />

	{#if selectedAction}
		<NeedBehaviorActionNodePanel action={selectedAction} />
	{:else}
		<NeedBehaviorActionPanel {behavior} onlayout={convertToNodesAndEdges} />
	{/if}
</SvelteFlow>
