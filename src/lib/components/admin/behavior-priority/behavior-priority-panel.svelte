<script lang="ts">
	import { useBehavior } from '$lib/hooks';
	import BehaviorPriorityList from './behavior-priority-list.svelte';
	import { Button } from '$lib/components/ui/button';
	import type { BehaviorPriority, BehaviorPriorityId, BulkChanges } from '$lib/types';

	const { admin } = useBehavior();

	let changes = $state<BulkChanges<BehaviorPriority> | undefined>(undefined);
	let isSaving = $state(false);

	function onchange(newChanges: BulkChanges<BehaviorPriority>) {
		changes = newChanges;
	}

	async function onsave() {
		if (!changes || isSaving) return;

		isSaving = true;

		try {
			// updated와 deleted를 동시에 처리
			await Promise.all([
				...changes.updated.map((priority) =>
					admin.updateBehaviorPriority(priority.id as BehaviorPriorityId, {
						priority: priority.priority,
					})
				),
				...changes.deleted.map((id) => admin.removeBehaviorPriority(id as BehaviorPriorityId)),
			]);

			// 저장 후 changes 초기화
			changes = undefined;
		} catch (error) {
			console.error('Failed to save behavior priorities:', error);
		} finally {
			isSaving = false;
		}
	}

	// 변경사항이 있는지 확인
	const hasChanges = $derived(
		changes && (changes.updated.length > 0 || changes.deleted.length > 0)
	);
</script>

<div class="ml-84 flex flex-col gap-2 rounded-lg bg-background p-4 shadow-md">
	<div class="flex items-center justify-between">
		<h3 class="text-sm font-medium">행동 우선순위</h3>
		<Button size="sm" variant="secondary" onclick={onsave} disabled={!hasChanges || isSaving}>
			{isSaving ? '저장 중...' : '변경사항 저장'}
		</Button>
	</div>
	<div class="flex-1 overflow-y-auto">
		<BehaviorPriorityList {onchange} />
	</div>
</div>
