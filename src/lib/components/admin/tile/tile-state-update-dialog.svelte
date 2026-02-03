<script lang="ts">
	import { useTerrain } from '$lib/hooks';
	import { Button } from '$lib/components/ui/button';
	import {
		Dialog,
		DialogContent,
		DialogFooter,
		DialogHeader,
		DialogTitle,
	} from '$lib/components/ui/dialog';
	import {
		InputGroup,
		InputGroupInput,
		InputGroupAddon,
		InputGroupText,
		InputGroupButton,
	} from '$lib/components/ui/input-group';
	import { Tooltip, TooltipTrigger, TooltipContent } from '$lib/components/ui/tooltip';
	import type { TileStateId, TileId } from '$lib/types';
	import { IconMathEqualLower, IconMathLower, IconVariable } from '@tabler/icons-svelte';

	const { tileStore, tileStateStore, admin, tileStateDialogStore, closeTileStateDialog } =
		useTerrain();

	const open = $derived($tileStateDialogStore?.type === 'update');
	const tileStateId = $derived(
		$tileStateDialogStore?.type === 'update' ? $tileStateDialogStore.tileStateId : undefined
	);

	// Find the tile state from all tile states
	const tileState = $derived.by(() => {
		if (!tileStateId) return undefined;
		for (const states of Object.values($tileStateStore.data)) {
			const state = states.find((s) => s.id === tileStateId);
			if (state) return state;
		}
		return undefined;
	});

	const tile = $derived(tileState ? $tileStore.data[tileState.tile_id as TileId] : undefined);

	let minDurability = $state('');
	let maxDurability = $state('');
	let isSubmitting = $state(false);

	$effect(() => {
		if (open && tileState) {
			minDurability = tileState.min_durability.toString();
			maxDurability = tileState.max_durability.toString();
		}
	});

	function onOpenChange(value: boolean) {
		if (!value) {
			closeTileStateDialog();
		}
	}

	function onsubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!tileStateId || !tileState || isSubmitting) return;

		isSubmitting = true;

		const min = parseInt(minDurability) || 0;
		const max = parseInt(maxDurability) || 100;

		admin
			.updateTileState(tileStateId as TileStateId, tileState.tile_id, {
				min_durability: min,
				max_durability: max,
			})
			.then(() => {
				closeTileStateDialog();
			})
			.catch((error) => {
				console.error('Failed to update tile state:', error);
			})
			.finally(() => {
				isSubmitting = false;
			});
	}
</script>

<Dialog {open} {onOpenChange}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>타일 상태 수정</DialogTitle>
		</DialogHeader>
		<form {onsubmit} class="flex flex-col gap-4">
			<div class="flex flex-col gap-2">
				<InputGroup>
					<InputGroupAddon align="inline-start">
						<Tooltip>
							<TooltipTrigger>
								{#snippet child({ props })}
									<InputGroupButton {...props}>내구도</InputGroupButton>
								{/snippet}
							</TooltipTrigger>
							<TooltipContent>이 상태가 활성화되는 내구도 범위를 설정합니다</TooltipContent>
						</Tooltip>
					</InputGroupAddon>
					<InputGroupInput
						placeholder="최소"
						type="number"
						bind:value={minDurability}
						disabled={!tile?.max_durability}
					/>
					<InputGroupText>~</InputGroupText>
					<InputGroupInput
						placeholder="최대"
						type="number"
						bind:value={maxDurability}
						disabled={!tile?.max_durability}
					/>
					<InputGroupAddon align="inline-end">
						{#if tile?.max_durability}
							<InputGroupText>최대 {tile.max_durability.toLocaleString()}</InputGroupText>
						{:else}
							<InputGroupText>최대 내구도 없음</InputGroupText>
						{/if}
					</InputGroupAddon>
				</InputGroup>
			</div>
			<DialogFooter>
				<Button type="submit" disabled={isSubmitting}>
					{isSubmitting ? '저장 중...' : '저장'}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>
