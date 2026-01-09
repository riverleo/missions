<script lang="ts">
	import type { TileStateType } from '$lib/types';
	import type { TileId } from '$lib/types';
	import SpriteStateItem, {
		type SpriteStateChange,
	} from '$lib/components/admin/sprite-state-item.svelte';
	import TileSpriteAnimator from '$lib/components/app/sprite-animator/tile-sprite-animator.svelte';
	import { useTerrain } from '$lib/hooks/use-terrain';
	import { getTileStateLabel } from '$lib/utils/state-label';
	import { Button } from '$lib/components/ui/button';

	interface Props {
		tileId: string;
		type: TileStateType;
	}

	let { tileId, type }: Props = $props();

	const { tileStore, tileStateStore, admin, openTileStateDialog } = useTerrain();

	const tile = $derived($tileStore.data[tileId as TileId]);
	const tileStates = $derived($tileStateStore.data[tileId as TileId] ?? []);
	const tileState = $derived(tileStates.find((s) => s.type === type));

	const durabilityPreview = $derived.by(() => {
		if (!tileState || type === 'idle') return undefined;

		if (!tile?.max_durability) return '최대 내구도 없음';

		return `내구도 (${tileState.min_durability.toLocaleString()}~${tileState.max_durability.toLocaleString()})`;
	});

	async function onchange(change: SpriteStateChange) {
		if (tileState) {
			await admin.updateTileState(tileState.id, tileId as TileId, change);
		} else if (change.atlas_name) {
			await admin.createTileState(tileId as TileId, { type, atlas_name: change.atlas_name });
		}
	}

	async function ondelete() {
		if (tileState) {
			await admin.removeTileState(tileState.id, tileId as TileId);
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
		<TileSpriteAnimator tileId={tileId as TileId} stateType={type} />
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
