<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle,
	} from '$lib/components/ui/dialog';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { useConditionBehavior } from '$lib/hooks/use-condition-behavior';
	import { useCondition } from '$lib/hooks/use-condition';
	import { getCharacterBehaviorTypeLabel } from '$lib/utils/state-label';
	import type { ScenarioId } from '$lib/types';

	const { conditionBehaviorStore, dialogStore, closeDialog, admin } = useConditionBehavior();
	const { conditionStore } = useCondition();
	const scenarioId = $derived(page.params.scenarioId as ScenarioId);

	const behaviorId = $derived(
		$dialogStore?.type === 'delete' ? $dialogStore.behaviorId : undefined
	);
	const behavior = $derived(behaviorId ? $conditionBehaviorStore.data[behaviorId] : undefined);
	const condition = $derived(
		behavior?.condition_id ? $conditionStore.data[behavior.condition_id] : undefined
	);
	const open = $derived($dialogStore?.type === 'delete');

	let isSubmitting = $state(false);

	function onOpenChange(value: boolean) {
		if (!value) {
			closeDialog();
		}
	}

	function onsubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!behaviorId || !scenarioId || isSubmitting) return;

		isSubmitting = true;

		admin
			.remove(behaviorId)
			.then(() => {
				closeDialog();
				goto(`/admin/scenarios/${scenarioId}/condition-behaviors`);
			})
			.catch((error) => {
				console.error('Failed to delete condition behavior:', error);
			})
			.finally(() => {
				isSubmitting = false;
			});
	}
</script>

<Dialog {open} {onOpenChange}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>건물 행동 삭제</DialogTitle>
			<DialogDescription>
				정말로 "{condition?.name}" 건물의 "{behavior
					? getCharacterBehaviorTypeLabel(behavior.character_behavior_type)
					: ''}" 행동을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
			</DialogDescription>
		</DialogHeader>
		<form {onsubmit}>
			<DialogFooter>
				<Button type="button" variant="outline" onclick={() => closeDialog()}>취소</Button>
				<Button type="submit" variant="destructive" disabled={isSubmitting}>
					{isSubmitting ? '삭제 중...' : '삭제하기'}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>
