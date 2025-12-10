<script lang="ts">
	import { Panel, useNodes } from '@xyflow/svelte';
	import type { QuestBranch } from '$lib/types';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';
	import { useQuest } from '$lib/hooks/use-quest.svelte';
	import { page } from '$app/state';

	interface Props {
		questBranch: QuestBranch | undefined;
		onupdate?: (branch: QuestBranch) => void;
	}

	let { questBranch, onupdate }: Props = $props();

	const { quests, admin } = useQuest();
	const flowNodes = useNodes();

	const questId = $derived(page.params.questId);
	const currentQuest = $derived($quests.data?.find((q) => q.id === questId));
	const questBranches = $derived(currentQuest?.quest_branches ?? []);

	let editTitle = $state('');
	let editDisplayOrder = $state(0);
	let isUpdating = $state(false);
	let isCreating = $state(false);

	// 선택된 브랜치가 변경되면 편집 필드 업데이트
	$effect(() => {
		if (questBranch) {
			editTitle = questBranch.title;
			editDisplayOrder = questBranch.display_order;
		}
	});

	async function handleCreate() {
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

	async function handleUpdate() {
		if (!questBranch || isUpdating) return;

		isUpdating = true;

		try {
			await admin.updateBranch(questBranch.id, {
				title: editTitle,
				display_order: editDisplayOrder,
			});

			// 로컬 데이터 업데이트
			questBranch.title = editTitle;
			questBranch.display_order = editDisplayOrder;

			// 부모 컴포넌트에 업데이트 알림
			onupdate?.(questBranch);
		} catch (error) {
			console.error('Failed to update branch:', error);
		} finally {
			isUpdating = false;
		}
	}

	function handleCancel() {
		const selectedNode = flowNodes.current.find((n) => n.selected);
		if (!selectedNode) return;

		// 선택 해제
		flowNodes.update((ns) =>
			ns.map((n) => (n.id === selectedNode.id ? { ...n, selected: false } : n))
		);
	}
</script>

<Panel position="top-right">
	<div
		class="w-80 rounded-lg border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-800"
	>
		{#if questBranch}
			<h3 class="mb-4 text-lg font-semibold">브랜치 수정</h3>
			<div class="space-y-4">
				<div class="space-y-2">
					<Label for="edit-title">제목</Label>
					<Input id="edit-title" bind:value={editTitle} />
				</div>
				<div class="space-y-2">
					<Label for="edit-display-order">표시 순서</Label>
					<Input id="edit-display-order" type="number" bind:value={editDisplayOrder} />
				</div>
				<div class="flex justify-end gap-2">
					<Button variant="outline" onclick={handleCancel} disabled={isUpdating}>취소</Button>
					<Button onclick={handleUpdate} disabled={isUpdating}>
						{isUpdating ? '저장 중...' : '저장'}
					</Button>
				</div>
			</div>
		{:else}
			<h3 class="mb-4 text-lg font-semibold">브랜치 관리</h3>
			<Button onclick={handleCreate} disabled={isCreating} class="w-full">
				{isCreating ? '생성 중...' : '새로운 브랜치 추가'}
			</Button>
		{/if}
	</div>
</Panel>
