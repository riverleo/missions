<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import {
		Dialog,
		DialogContent,
		DialogFooter,
		DialogHeader,
		DialogTitle,
	} from '$lib/components/ui/dialog';
	import { useBuilding } from '$lib/hooks/use-building';
	import type { BuildingStateId } from '$lib/types';

	const { stateStore, stateDialogStore, closeStateDialog } = useBuilding();

	const open = $derived($stateDialogStore?.type === 'update');
	const buildingStateId = $derived(
		$stateDialogStore?.type === 'update' ? $stateDialogStore.buildingStateId : undefined
	);

	// Find the building state from all building states
	const buildingState = $derived.by(() => {
		if (!buildingStateId) return undefined;
		for (const states of Object.values($stateStore.data)) {
			const state = states.find((s) => s.id === buildingStateId);
			if (state) return state;
		}
		return undefined;
	});

	function onOpenChange(value: boolean) {
		if (!value) {
			closeStateDialog();
		}
	}
</script>

<Dialog {open} {onOpenChange}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>건물 상태 수정</DialogTitle>
		</DialogHeader>
		<p class="text-sm text-muted-foreground">
			건물 상태는 이제 컨디션 행동(Condition Behavior)에서 관리됩니다.
		</p>
		<DialogFooter>
			<Button variant="outline" onclick={closeStateDialog}>닫기</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
