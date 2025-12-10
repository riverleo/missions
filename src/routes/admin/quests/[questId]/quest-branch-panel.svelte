<script lang="ts">
	import { Panel, useNodes } from '@xyflow/svelte';
	import type { Node, Edge } from '@xyflow/svelte';
	import type { QuestBranch } from '$lib/types';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';
	import { useQuest } from '$lib/hooks/use-quest.svelte';
	import { page } from '$app/state';
	import { applyElkLayout } from '$lib/utils/elk-layout';

	interface Props {
		questBranch: QuestBranch | undefined;
		onupdate?: (questBranch: QuestBranch) => void;
		onlayout?: (nodes: Node[], edges: Edge[]) => void;
	}

	let { questBranch, onupdate, onlayout }: Props = $props();

	const { admin } = useQuest();
	const flowNodes = useNodes();

	const questId = $derived(page.params.questId);

	let editTitle = $state('');
	let editDisplayOrder = $state(0);
	let isUpdating = $state(false);
	let isCreating = $state(false);
	let isLayouting = $state(false);

	// 선택된 브랜치가 변경되면 편집 필드 업데이트
	$effect(() => {
		if (questBranch) {
			editTitle = questBranch.title;
			editDisplayOrder = questBranch.display_order;
		}
	});

	function onclickCreate() {
		if (isCreating || !questId) return;

		isCreating = true;

		admin
			.createBranch({
				quest_id: questId,
				title: '',
				display_order: 0,
			})
			.catch((error) => {
				console.error('Failed to create quest branch:', error);
			})
			.finally(() => {
				isCreating = false;
			});
	}

	function onsubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!questBranch || isUpdating) return;

		isUpdating = true;

		admin
			.updateBranch(questBranch.id, {
				title: editTitle,
				display_order: editDisplayOrder,
			})
			.then(() => {
				// 로컬 데이터 업데이트
				questBranch.title = editTitle;
				questBranch.display_order = editDisplayOrder;

				// 부모 컴포넌트에 업데이트 알림
				onupdate?.(questBranch);
			})
			.catch((error) => {
				console.error('Failed to update branch:', error);
			})
			.finally(() => {
				isUpdating = false;
			});
	}

	function onclickCancel() {
		const selectedNode = flowNodes.current.find((n) => n.selected);
		if (!selectedNode) return;

		// 선택 해제
		flowNodes.update((ns) =>
			ns.map((n) => (n.id === selectedNode.id ? { ...n, selected: false } : n))
		);
	}

	async function onclickLayout() {
		if (isLayouting || !onlayout) return;

		isLayouting = true;

		try {
			const nodes = flowNodes.current;
			const edges: Edge[] = [];

			// 현재 노드들로부터 엣지 추출
			nodes.forEach((node) => {
				const data = node.data as { questBranch: QuestBranch };
				if (data.questBranch.parent_quest_branch_id) {
					edges.push({
						id: `${data.questBranch.parent_quest_branch_id}-${node.id}`,
						source: data.questBranch.parent_quest_branch_id,
						target: node.id,
						deletable: true,
					});
				}
			});

			// ELK 레이아웃 계산
			const layoutedNodes = await applyElkLayout(nodes, edges);

			// 부모 컴포넌트에 정렬된 노드와 엣지 전달
			onlayout(layoutedNodes, edges);
		} catch (error) {
			console.error('Failed to layout:', error);
		} finally {
			isLayouting = false;
		}
	}
</script>

<Panel position="top-right">
	<div
		class="w-80 rounded-lg border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-800"
	>
		{#if questBranch}
			<h3 class="mb-4 text-lg font-semibold">브랜치 수정</h3>
			<form {onsubmit} class="space-y-4">
				<div class="space-y-2">
					<Label for="edit-title">제목</Label>
					<Input id="edit-title" bind:value={editTitle} />
				</div>
				<div class="space-y-2">
					<Label for="edit-display-order">표시 순서</Label>
					<Input id="edit-display-order" type="number" bind:value={editDisplayOrder} />
				</div>
				<div class="flex justify-end gap-2">
					<Button type="button" variant="outline" onclick={onclickCancel} disabled={isUpdating}>
						취소
					</Button>
					<Button type="submit" disabled={isUpdating}>
						{isUpdating ? '저장 중...' : '저장'}
					</Button>
				</div>
			</form>
		{:else}
			<h3 class="mb-4 text-lg font-semibold">브랜치 관리</h3>
			<div class="space-y-2">
				<Button onclick={onclickCreate} disabled={isCreating} class="w-full">
					{isCreating ? '생성 중...' : '새로운 브랜치 추가'}
				</Button>
				<Button onclick={onclickLayout} disabled={isLayouting} variant="outline" class="w-full">
					{isLayouting ? '정렬 중...' : '자동 정렬'}
				</Button>
			</div>
		{/if}
	</div>
</Panel>
