<script lang="ts">
	import {
		SvelteFlow,
		Controls,
		Background,
		BackgroundVariant,
		MiniMap,
		useNodes,
		useNodesInitialized,
		useSvelteFlow,
	} from '@xyflow/svelte';
	import type { Node, Edge, Connection, OnConnectEnd } from '@xyflow/svelte';
	import { mode } from 'mode-watcher';
	import { page } from '$app/state';
	import type { QuestBranch, QuestId, QuestBranchId } from '$lib/types';
	import QuestBranchNode from './quest-branch-node.svelte';
	import QuestActionPanel from './quest-action-panel.svelte';
	import QuestBranchNodePanel from './quest-branch-node-panel.svelte';
	import { useQuest } from '$lib/hooks/use-quest';
	import { sort } from 'radash';
	import { applyElkLayout } from '$lib/utils/elk-layout';
	import { toTreeMap } from '$lib/utils';

	const questId = $derived(page.params.questId as QuestId);
	const { questBranchStore, admin } = useQuest();
	const flowNodes = useNodes();
	const nodesInitialized = useNodesInitialized();
	const { screenToFlowPosition } = useSvelteFlow();

	// 레이아웃 적용 여부 추적
	let layoutApplied = $state(false);
	// 노드 생성 중 effect 건너뛰기 플래그
	let skipConvertEffect = $state(false);

	const nodeTypes = {
		questBranch: QuestBranchNode,
	};

	const questBranches = $derived(
		Object.values($questBranchStore.data).filter((b) => b.quest_id === questId)
	);

	let nodes = $state<Node[]>([]);
	let edges = $state<Edge[]>([]);

	// 선택된 노드 추적
	const selectedNode = $derived(flowNodes.current.find((n) => n.selected));
	const selectedQuestBranch = $derived(
		selectedNode ? questBranches.find((b) => b.id === selectedNode.id) : undefined
	);

	function onupdateQuestBranch(questBranch: QuestBranch) {
		// 노드 레이블 업데이트
		const node = nodes.find((n) => n.id === questBranch.id);
		if (node && node.data) {
			const data = node.data as { label: string; questBranch: QuestBranch };
			data.label = questBranch.title;
			data.questBranch.title = questBranch.title;
			data.questBranch.display_order_in_quest = questBranch.display_order_in_quest;
		}

		// 선택 해제
		flowNodes.update((ns) =>
			ns.map((n) => (n.id === questBranch.id ? { ...n, selected: false } : n))
		);
	}

	async function onconnect(connection: Connection) {
		try {
			// target이 연결되는 브랜치 (자식), source가 부모 브랜치
			const targetQuestBranch = questBranches.find((b) => b.id === connection.target);
			if (!targetQuestBranch) return;

			await admin.updateQuestBranch(connection.target as QuestBranchId, {
				parent_quest_branch_id: connection.source as QuestBranchId,
			});

			// 로컬 데이터 업데이트
			targetQuestBranch.parent_quest_branch_id = connection.source as QuestBranchId;

			// 엣지 추가
			edges = [
				...edges,
				{
					id: `${connection.source}-${connection.target}`,
					source: connection.source,
					target: connection.target,
					deletable: true,
				},
			];
		} catch (error) {
			console.error('Failed to connect quest branch:', error);
		}
	}

	async function ondelete({
		nodes: nodesToDelete,
		edges: edgesToDelete,
	}: {
		nodes: Node[];
		edges: Edge[];
	}) {
		// 스토어 업데이트 중 effect 건너뛰기
		skipConvertEffect = true;

		try {
			// 엣지 삭제 처리
			for (const edge of edgesToDelete) {
				await admin.updateQuestBranch(edge.target as QuestBranchId, {
					parent_quest_branch_id: null,
				});
			}

			// 노드 삭제 처리
			for (const node of nodesToDelete) {
				await admin.removeQuestBranch(node.id as QuestBranchId);
			}

			// 모든 업데이트 완료 후 노드/엣지 재생성
			skipConvertEffect = false;
			convertToNodesAndEdges(questBranches);
		} catch (error) {
			skipConvertEffect = false;
			console.error('Failed to delete:', error);
		}
	}

	function onlayout(layoutedNodes: Node[], layoutedEdges: Edge[]) {
		nodes = layoutedNodes;
		edges = layoutedEdges;
	}

	const onconnectend: OnConnectEnd = async (event, connectionState) => {
		// 유효한 연결이면 무시 (onconnect에서 처리)
		if (connectionState.isValid) return;
		if (!questId) return;

		const sourceNode = connectionState.fromNode;
		if (!sourceNode) return;

		// 마우스/터치 위치를 플로우 좌표로 변환
		const clientX =
			'changedTouches' in event ? (event.changedTouches[0]?.clientX ?? 0) : event.clientX;
		const clientY =
			'changedTouches' in event ? (event.changedTouches[0]?.clientY ?? 0) : event.clientY;
		const position = screenToFlowPosition({ x: clientX, y: clientY });

		// 스토어 업데이트 중 effect 건너뛰기
		skipConvertEffect = true;

		try {
			// 새 브랜치 생성 (소스 노드를 부모로 설정)
			const newQuestBranch = await admin.createQuestBranch({
				quest_id: questId,
				parent_quest_branch_id: sourceNode.id as QuestBranchId,
			});

			// 모든 업데이트 완료 후 노드/엣지 재생성
			skipConvertEffect = false;
			convertToNodesAndEdges(questBranches);

			// 새 노드의 위치를 드롭 위치로 설정
			if (newQuestBranch) {
				nodes = nodes.map((n) => (n.id === newQuestBranch.id ? { ...n, position } : n));
				// 레이아웃 재적용 방지
				layoutApplied = true;
			}
		} catch (error) {
			skipConvertEffect = false;
			console.error('Failed to create quest branch on edge drop:', error);
		}
	};

	async function convertToNodesAndEdges(questBranches: QuestBranch[]) {
		const newNodes: Node[] = [];
		const newEdges: Edge[] = [];

		// display_order_in_quest로 정렬된 브랜치 사용
		const sortedQuestBranches = sort(questBranches, (b) => b.display_order_in_quest);

		// 트리 위치 계산
		const treeMap = toTreeMap(questBranches, 'parent_quest_branch_id', 'display_order_in_quest');

		// 노드 생성
		sortedQuestBranches.forEach((questBranch) => {
			const treeNode = treeMap.get(questBranch.id);
			newNodes.push({
				id: questBranch.id,
				type: 'questBranch',
				data: {
					label: questBranch.title,
					questBranch,
					position: treeNode?.toString(),
				},
				position: { x: 0, y: 0 }, // elkjs가 계산할 예정
				deletable: true,
			});

			// 엣지 생성 (parent -> child)
			if (questBranch.parent_quest_branch_id) {
				newEdges.push({
					id: `${questBranch.parent_quest_branch_id}-${questBranch.id}`,
					source: questBranch.parent_quest_branch_id,
					target: questBranch.id,
					deletable: true,
				});
			}
		});

		nodes = newNodes;
		edges = newEdges;
		layoutApplied = false;
	}

	// 데이터 변경 시 노드/엣지 생성
	$effect(() => {
		// 의존성 추적을 위해 여기서 접근
		questBranches;

		if (skipConvertEffect) return;
		convertToNodesAndEdges(questBranches);
	});

	// 노드 측정 완료 후 레이아웃 적용
	$effect(() => {
		if (nodesInitialized.current && !layoutApplied && nodes.length > 0) {
			const nodesWithMeasured = flowNodes.current;
			applyElkLayout(nodesWithMeasured, edges).then((layoutedNodes) => {
				nodes = layoutedNodes;
				layoutApplied = true;
			});
		}
	});
</script>

<SvelteFlow
	{nodes}
	{edges}
	{nodeTypes}
	colorMode={mode.current}
	{onconnect}
	{onconnectend}
	{ondelete}
	fitView
>
	<Controls />
	<Background variant={BackgroundVariant.Dots} />
	<MiniMap />

	{#if selectedQuestBranch}
		<QuestBranchNodePanel questBranch={selectedQuestBranch} onupdate={onupdateQuestBranch} />
	{:else}
		<QuestActionPanel {onlayout} />
	{/if}
</SvelteFlow>
