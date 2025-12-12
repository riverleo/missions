<script lang="ts">
	import {
		SvelteFlow,
		Controls,
		Background,
		BackgroundVariant,
		MiniMap,
		useNodes,
		useNodesInitialized,
	} from '@xyflow/svelte';
	import type { Node, Edge, Connection } from '@xyflow/svelte';
	import { mode } from 'mode-watcher';
	import { page } from '$app/state';
	import type { QuestBranch } from '$lib/types';
	import QuestBranchNode from './quest-branch-node.svelte';
	import QuestPanel from './quest-panel.svelte';
	import QuestBranchPanel from './quest-branch-panel.svelte';
	import { useQuest } from '$lib/hooks/use-quest.svelte';
	import { sort } from 'radash';
	import { applyElkLayout } from '$lib/utils/elk-layout';

	const questId = $derived(page.params.questId);
	const { store, admin } = useQuest();
	const flowNodes = useNodes();
	const nodesInitialized = useNodesInitialized();

	// 레이아웃 적용 여부 추적
	let layoutApplied = $state(false);

	const nodeTypes = {
		questBranch: QuestBranchNode,
	};

	const currentQuest = $derived($store.data?.find((q) => q.id === questId));
	const questBranches = $derived(currentQuest?.quest_branches ?? []);

	let nodes = $state<Node[]>([]);
	let edges = $state<Edge[]>([]);

	// 선택된 노드 추적
	const selectedNode = $derived(flowNodes.current.find((n) => n.selected));
	const selectedQuestBranch = $derived(
		selectedNode ? questBranches.find((b: QuestBranch) => b.id === selectedNode.id) : undefined
	);

	function onupdate(questBranch: QuestBranch) {
		// 노드 레이블 업데이트
		const node = nodes.find((n) => n.id === questBranch.id);
		if (node && node.data) {
			const data = node.data as { label: string; questBranch: QuestBranch };
			data.label = questBranch.title;
			data.questBranch.title = questBranch.title;
			data.questBranch.display_order = questBranch.display_order;
		}

		// 선택 해제
		flowNodes.update((ns) =>
			ns.map((n) => (n.id === questBranch.id ? { ...n, selected: false } : n))
		);
	}

	async function onconnect(connection: Connection) {
		try {
			// target이 연결되는 브랜치 (자식), source가 부모 브랜치
			const targetBranch = questBranches.find((b: QuestBranch) => b.id === connection.target);
			if (!targetBranch) return;

			await admin.updateBranch(connection.target, {
				parent_quest_branch_id: connection.source,
			});

			// 로컬 데이터 업데이트
			targetBranch.parent_quest_branch_id = connection.source;

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
			console.error('Failed to connect branch:', error);
		}
	}

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
				const targetBranch = questBranches.find((b: QuestBranch) => b.id === edge.target);
				if (!targetBranch) continue;

				await admin.updateBranch(edge.target, {
					parent_quest_branch_id: null,
				});

				// 로컬 데이터 업데이트
				targetBranch.parent_quest_branch_id = null;
			}

			// 노드 삭제 처리
			for (const node of nodesToDelete) {
				// DB에서 deleted_at 업데이트하되, refetch는 하지 않음 (화면 깜빡임 방지)
				await admin.removeBranch(node.id, false);
			}

			// 로컬 노드 제거
			nodes = nodes.filter((n) => !nodesToDelete.find((nd) => nd.id === n.id));

			// 로컬 엣지 제거 (명시적으로 삭제된 엣지 + 삭제된 노드와 연결된 엣지)
			edges = edges.filter(
				(e) =>
					!edgesToDelete.find((ed) => ed.id === e.id) &&
					!nodesToDelete.find((nd) => nd.id === e.source || nd.id === e.target)
			);
		} catch (error) {
			console.error('Failed to delete:', error);
		}
	}

	function onlayout(layoutedNodes: Node[], layoutedEdges: Edge[]) {
		nodes = layoutedNodes;
		edges = layoutedEdges;
	}

	async function convertToNodesAndEdges(questBranches: QuestBranch[]) {
		const newNodes: Node[] = [];
		const newEdges: Edge[] = [];

		// display_order로 정렬된 브랜치 사용
		const sortedBranches = sort(questBranches, (b) => b.display_order);

		// 노드 생성
		sortedBranches.forEach((questBranch) => {
			newNodes.push({
				id: questBranch.id,
				type: 'questBranch',
				data: { label: questBranch.title, questBranch },
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

<SvelteFlow {nodes} {edges} {nodeTypes} colorMode={mode.current} {onconnect} {ondelete} fitView>
	<Controls />
	<Background variant={BackgroundVariant.Dots} />
	<MiniMap />

	{#if selectedQuestBranch}
		<QuestBranchPanel questBranch={selectedQuestBranch} {onupdate} />
	{:else}
		<QuestPanel {onlayout} />
	{/if}
</SvelteFlow>
