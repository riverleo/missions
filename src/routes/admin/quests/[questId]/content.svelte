<script lang="ts">
	import '@xyflow/svelte/dist/style.css';
	import {
		SvelteFlow,
		Controls,
		Background,
		BackgroundVariant,
		MiniMap,
		Panel,
		useSvelteFlow,
		useNodes,
	} from '@xyflow/svelte';
	import type { Node, Edge, Connection } from '@xyflow/svelte';
	import { mode } from 'mode-watcher';
	import { page } from '$app/stores';
	import type { QuestBranch } from '$lib/types';
	import QuestBranchNode from './quest-branch-node.svelte';
	import ELK from 'elkjs/lib/elk.bundled.js';
	import { useQuest } from '$lib/hooks/use-quest.svelte';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';

	const questId = $derived($page.params.questId);
	const { quests, admin } = useQuest();
	const flowNodes = useNodes();

	const elk = new ELK();

	const nodeTypes = {
		questBranch: QuestBranchNode,
	};

	const currentQuest = $derived($quests.data?.find((q) => q.id === questId));
	const questBranches = $derived(currentQuest?.quest_branches ?? []);

	let nodes = $state<Node[]>([]);
	let edges = $state<Edge[]>([]);

	// 선택된 노드 추적
	const selectedNode = $derived(flowNodes.current.find((n) => n.selected));
	const selectedBranch = $derived(
		selectedNode ? questBranches.find((b) => b.id === selectedNode.id) : null
	);

	let editTitle = $state('');
	let editDisplayOrder = $state(0);
	let isUpdating = $state(false);
	let isCreating = $state(false);

	// 선택된 브랜치가 변경되면 편집 필드 업데이트
	$effect(() => {
		if (selectedBranch) {
			editTitle = selectedBranch.title;
			editDisplayOrder = selectedBranch.display_order;
		}
	});

	async function handleCreateBranch() {
		if (isCreating || !questId) return;

		isCreating = true;

		try {
			await admin.createBranch({
				quest_id: questId,
				title: '',
				display_order: questBranches.length,
			});
		} catch (error) {
			console.error('Failed to create quest branch:', error);
		} finally {
			isCreating = false;
		}
	}

	async function handleUpdateBranch() {
		if (!selectedBranch || !selectedNode || isUpdating) return;

		isUpdating = true;

		try {
			await admin.updateBranch(selectedBranch.id, {
				title: editTitle,
				display_order: editDisplayOrder,
			});

			// 로컬 데이터 업데이트
			selectedBranch.title = editTitle;
			selectedBranch.display_order = editDisplayOrder;

			// 노드 레이블도 업데이트
			const node = nodes.find((n) => n.id === selectedBranch.id);
			if (node && node.data) {
				node.data.label = editTitle;
				const branchData = node.data as { label: string; branch: QuestBranch };
				branchData.branch.title = editTitle;
				branchData.branch.display_order = editDisplayOrder;
			}

			// 선택 해제
			flowNodes.update((ns) =>
				ns.map((n) => (n.id === selectedNode.id ? { ...n, selected: false } : n))
			);
		} catch (error) {
			console.error('Failed to update branch:', error);
		} finally {
			isUpdating = false;
		}
	}

	function handleCancelEdit() {
		if (!selectedNode) return;

		// 선택 해제
		flowNodes.update((ns) =>
			ns.map((n) => (n.id === selectedNode.id ? { ...n, selected: false } : n))
		);
	}

	async function handleConnect(connection: Connection) {
		try {
			// target이 연결되는 브랜치 (자식), source가 부모 브랜치
			const targetBranch = questBranches.find((b) => b.id === connection.target);
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

	async function handleDelete({
		nodes: nodesToDelete,
		edges: edgesToDelete,
	}: {
		nodes: Node[];
		edges: Edge[];
	}) {
		try {
			// 엣지 삭제 처리
			for (const edge of edgesToDelete) {
				const targetBranch = questBranches.find((b) => b.id === edge.target);
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

	async function convertToNodesAndEdges(branches: QuestBranch[]) {
		const newNodes: Node[] = [];
		const newEdges: Edge[] = [];

		// 노드 생성
		branches.forEach((branch) => {
			newNodes.push({
				id: branch.id,
				type: 'questBranch',
				data: { label: branch.title, branch },
				position: { x: 0, y: 0 }, // elkjs가 계산할 예정
				width: 200,
				height: 60,
				deletable: true,
			});

			// 엣지 생성 (parent -> child)
			if (branch.parent_quest_branch_id) {
				newEdges.push({
					id: `${branch.parent_quest_branch_id}-${branch.id}`,
					source: branch.parent_quest_branch_id,
					target: branch.id,
					deletable: true,
				});
			}
		});

		// elkjs로 레이아웃 계산
		if (newNodes.length > 0) {
			const layoutedGraph = await elk.layout({
				id: 'root',
				layoutOptions: {
					'elk.algorithm': 'layered',
					'elk.direction': 'RIGHT',
					'elk.spacing.nodeNode': '80',
					'elk.layered.spacing.nodeNodeBetweenLayers': '100',
				},
				children: newNodes.map((node) => ({
					id: node.id,
					width: node.width ?? 200,
					height: node.height ?? 60,
				})),
				edges: newEdges.map((edge) => ({
					id: edge.id,
					sources: [edge.source],
					targets: [edge.target],
				})),
			});

			// elkjs 결과를 노드 position에 적용
			layoutedGraph.children?.forEach((node) => {
				const flowNode = newNodes.find((n) => n.id === node.id);
				if (flowNode && node.x !== undefined && node.y !== undefined) {
					flowNode.position = { x: node.x, y: node.y };
				}
			});
		}

		nodes = newNodes;
		edges = newEdges;
	}

	$effect(() => {
		if (questBranches.length >= 0) {
			convertToNodesAndEdges(questBranches);
		}
	});
</script>

<div class="relative flex-1">
	<SvelteFlow
		{nodes}
		{edges}
		{nodeTypes}
		colorMode={mode.current}
		onconnect={handleConnect}
		ondelete={handleDelete}
		fitView
	>
		<Controls />
		<Background variant={BackgroundVariant.Dots} />
		<MiniMap />

		<Panel position="top-right">
			<div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 w-80">
				{#if selectedBranch}
					<h3 class="text-lg font-semibold mb-4">브랜치 수정</h3>
					<div class="space-y-4">
						<div class="space-y-2">
							<Label for="edit-title">제목</Label>
							<Input id="edit-title" bind:value={editTitle} />
						</div>
						<div class="space-y-2">
							<Label for="edit-display-order">표시 순서</Label>
							<Input id="edit-display-order" type="number" bind:value={editDisplayOrder} />
						</div>
						<div class="flex gap-2 justify-end">
							<Button variant="outline" onclick={handleCancelEdit} disabled={isUpdating}>
								취소
							</Button>
							<Button onclick={handleUpdateBranch} disabled={isUpdating}>
								{isUpdating ? '저장 중...' : '저장'}
							</Button>
						</div>
					</div>
				{:else}
					<h3 class="text-lg font-semibold mb-4">브랜치 관리</h3>
					<Button onclick={handleCreateBranch} disabled={isCreating} class="w-full">
						{isCreating ? '생성 중...' : '새로운 브랜치 추가'}
					</Button>
				{/if}
			</div>
		</Panel>
	</SvelteFlow>
</div>
