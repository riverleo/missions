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
	} from '$lib/components/ui/input-group';
	import { IconHeading, IconClock } from '@tabler/icons-svelte';
	import { getActionString, getFormString } from '$lib/utils/label';

	const {
		admin,
		tileDialogStore: terrainTileDialogStore,
		closeTileDialog,
		tileStore,
	} = useTerrain();

	const open = $derived($terrainTileDialogStore?.type === 'update');
	const tileId = $derived(
		$terrainTileDialogStore?.type === 'update' ? $terrainTileDialogStore.tileId : undefined
	);
	const tile = $derived(tileId ? $tileStore.data[tileId] : undefined);

	let name = $state('');
	let maxDurability = $state<number | undefined>(1000);
	let isSubmitting = $state(false);

	$effect(() => {
		if (open && tile) {
			name = tile.name ?? '';
			maxDurability = tile.max_durability ?? 1000;
		}
	});

	function onOpenChange(value: boolean) {
		if (!value) {
			closeTileDialog();
		}
	}

	function onsubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!tileId || !name.trim() || isSubmitting) return;

		isSubmitting = true;

		admin
			.updateTile(tileId, {
				name: name.trim(),
				max_durability: maxDurability ?? 1000,
			})
			.then(() => {
				closeTileDialog();
			})
			.catch((error) => {
				console.error('Failed to update tile:', error);
			})
			.finally(() => {
				isSubmitting = false;
			});
	}
</script>

<Dialog {open} {onOpenChange}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>타일 수정</DialogTitle>
		</DialogHeader>
		<form {onsubmit} class="flex flex-col gap-4">
			<div class="flex flex-col gap-2">
				<InputGroup>
					<InputGroupAddon align="inline-start">
						<InputGroupText>
							<IconHeading />
						</InputGroupText>
					</InputGroupAddon>
					<InputGroupInput placeholder={getFormString("name")} bind:value={name} />
				</InputGroup>
				<InputGroup>
					<InputGroupAddon align="inline-start">
						<InputGroupText>최대 내구도</InputGroupText>
					</InputGroupAddon>
					<InputGroupInput
						type="number"
						placeholder="숫자 입력"
						bind:value={maxDurability}
						min="0"
					/>
				</InputGroup>
			</div>
			<DialogFooter>
				<Button type="submit" disabled={isSubmitting || !name.trim()}>
					{isSubmitting ? '저장 중...' : '저장'}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>
