<script lang="ts">
	import type { TileStateType, TileWang2CornerIndex } from '$lib/types';
	import type { TileId } from '$lib/types';
	import SpriteStateItem, {
		type SpriteStateChange,
	} from '$lib/components/admin/sprite-state-item.svelte';
	import TileSpriteAnimator from '$lib/components/app/sprite-animator/tile-sprite-animator.svelte';
	import { useTerrain } from '$lib/hooks/use-terrain';
	import { getTileStateLabel } from '$lib/utils/state-label';
	import { Button } from '$lib/components/ui/button';

	interface Props {
		tileId: TileId;
		type: TileStateType;
	}

	let { tileId, type }: Props = $props();

	const { tileStore, tileStateStore, admin, openTileStateDialog } = useTerrain();

	const tile = $derived($tileStore.data[tileId]);
	const tileStates = $derived($tileStateStore.data[tileId] ?? []);
	const tileState = $derived(tileStates.find((s) => s.type === type));

	const durabilityPreview = $derived.by(() => {
		if (!tileState || type === 'idle') return undefined;

		if (!tile?.max_durability) return '최대 내구도 없음';

		return `내구도 (${tileState.min_durability.toLocaleString()}~${tileState.max_durability.toLocaleString()})`;
	});

	async function onchange(change: SpriteStateChange) {
		if (tileState) {
			await admin.updateTileState(tileState.id, tileId, change);
		} else if (change.atlas_name) {
			await admin.createTileState(tileId, { type, atlas_name: change.atlas_name });
		}
	}

	async function ondelete() {
		if (tileState) {
			await admin.removeTileState(tileState.id, tileId);
		}
	}

	function onDurabilityClick() {
		if (tileState) {
			openTileStateDialog({ type: 'update', tileStateId: tileState.id });
		}
	}
</script>

<SpriteStateItem
	{type}
	label={getTileStateLabel(type)}
	spriteState={tileState}
	{onchange}
	{ondelete}
>
	{#snippet preview()}
		<div class="grid grid-cols-4 grid-rows-4 gap-0">
			{#each [[5, 4, 15, 7], [11, 8, 16, 14], [2, 10, 12, 13], [1, 3, 6, 9]] as row}
				{#each row as index}
					<TileSpriteAnimator {tileId} index={index as TileWang2CornerIndex} stateType={type} />
				{/each}
			{/each}
		</div>
	{/snippet}
	{#snippet action()}
		{#if durabilityPreview !== undefined}
			<Button
				variant="ghost"
				size="sm"
				disabled={!tileState || !tile?.max_durability}
				onclick={onDurabilityClick}
			>
				{durabilityPreview}
			</Button>
		{/if}
	{/snippet}
</SpriteStateItem>
