<script lang="ts">
	import type { ScenarioId } from '$lib/types';
	import { page } from '$app/state';
	import type { TileStateType } from '$lib/types';
	import type { TileId } from '$lib/types';
	import SpriteStateItem, {
		type SpriteStateChange,
	} from '$lib/components/admin/sprite-state-item.svelte';
	import { useTerrain } from '$lib/hooks/use-terrain';
	import { getTileStateLabel } from '$lib/utils/state-label';
	import { Button } from '$lib/components/ui/button';

	interface Props {
		tileId: TileId;
		type: TileStateType;
	}

	let { tileId, type }: Props = $props();

	const { tileStore, tileStateStore, admin, openTileStateDialog } = useTerrain();

	const scenarioId = $derived(page.params.scenarioId as ScenarioId);

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
			await admin.createTileState(scenarioId, tileId, { type, atlas_name: change.atlas_name });
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
		<div class="flex items-center justify-center p-4 text-sm text-gray-500">
			Quarter-Tile 미리보기 (준비 중)
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
