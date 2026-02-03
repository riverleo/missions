<script lang="ts">
	import { useBuilding } from '$lib/hooks';
	import type { BuildingStateType, BuildingId, BuildingState } from '$lib/types';
	import SpriteStateItem, {
		type SpriteStateChange,
	} from '$lib/components/admin/sprite-state-item.svelte';
	import { atlases } from '$lib/components/app/sprite-animator';
	import BuildingSpriteAnimator from '$lib/components/app/sprite-animator/building-sprite-animator.svelte';
	import BuildingTileGrid from './building-tile-grid.svelte';
	import { CELL_SIZE } from '$lib/constants';
	import { getBuildingStateLabel } from '$lib/utils/state-label';

	interface Props {
		buildingId: BuildingId;
		type: BuildingStateType;
	}

	let { buildingId, type }: Props = $props();

	const { buildingStore, buildingStateStore, admin } = useBuilding();
	const { uiStore } = admin;

	const building = $derived($buildingStore.data[buildingId]);
	const buildingStates = $derived($buildingStateStore.data[buildingId] ?? []);
	const buildingState = $derived(buildingStates.find((s: BuildingState) => s.type === type));

	async function onchange(change: SpriteStateChange) {
		if (buildingState) {
			await admin.updateBuildingState(buildingState.id, buildingId, change);
		} else if (change.atlas_name) {
			await admin.createBuildingState(buildingId, {
				type,
				atlas_name: change.atlas_name,
			});
		}

		// 셀 값이 0이면 atlas 크기로 자동 계산
		if (change.atlas_name && building && building.cell_cols === 0 && building.cell_rows === 0) {
			const atlas = atlases[change.atlas_name];
			if (atlas) {
				const cell_cols = Math.max(1, Math.round(atlas.frameWidth / CELL_SIZE));
				const cell_rows = Math.max(1, Math.round(atlas.frameHeight / CELL_SIZE));
				await admin.updateBuilding(buildingId, { cell_cols, cell_rows });
			}
		}
	}

	async function ondelete() {
		if (buildingState) {
			await admin.removeBuildingState(buildingState.id, buildingId);
		}
	}
</script>

<SpriteStateItem
	{type}
	label={getBuildingStateLabel(type)}
	spriteState={buildingState}
	{onchange}
	{ondelete}
>
	{#snippet preview()}
		{#if buildingState}
			<BuildingSpriteAnimator {buildingId} stateType={type} resolution={2} />
		{/if}
	{/snippet}
	{#snippet collider()}
		{#if $uiStore.showBodyPreview && building}
			<div
				style="transform: translate({-building.collider_offset_x}px, {-building.collider_offset_y}px);"
			>
				<BuildingTileGrid cols={building.cell_cols} rows={building.cell_rows} />
			</div>
		{/if}
	{/snippet}
</SpriteStateItem>
