<script lang="ts">
	import type { BuildingStateType } from '$lib/types';
	import SpriteStateItem, {
		type SpriteStateChange,
	} from '$lib/components/admin/sprite-state-item.svelte';
	import { atlases } from '$lib/components/app/sprite-animator';
	import { useBuilding } from '$lib/hooks/use-building';
	import WorldPlanningPlacementRect from '$lib/components/app/world/world-planning-placement-rect.svelte';
	import { TILE_SIZE } from '$lib/components/app/world/constants';
	import { getBuildingStateLabel } from '$lib/utils/state-label';

	interface Props {
		buildingId: string;
		type: BuildingStateType;
	}

	let { buildingId, type }: Props = $props();

	const { store, admin } = useBuilding();
	const { uiStore } = admin;

	const building = $derived($store.data[buildingId]);
	const buildingState = $derived(building?.building_states.find((s) => s.type === type));

	async function onchange(change: SpriteStateChange) {
		if (buildingState) {
			await admin.updateBuildingState(buildingState.id, buildingId, change);
		} else if (change.atlas_name) {
			await admin.createBuildingState(buildingId, { type, atlas_name: change.atlas_name });
		}

		// 타일 값이 0이면 atlas 크기로 자동 계산
		if (change.atlas_name && building && building.tile_cols === 0 && building.tile_rows === 0) {
			const atlas = atlases[change.atlas_name];
			if (atlas) {
				const tile_cols = Math.max(1, Math.round(atlas.frameWidth / TILE_SIZE));
				const tile_rows = Math.max(1, Math.round(atlas.frameHeight / TILE_SIZE));
				await admin.update(buildingId, { tile_cols, tile_rows });
			}
		}
	}

	async function ondelete() {
		if (buildingState) {
			await admin.removeBuildingState(buildingState.id, buildingId);
		}
	}
</script>

<SpriteStateItem {type} label={getBuildingStateLabel(type)} spriteState={buildingState} {onchange} {ondelete}>
	{#snippet bodyPreview()}
		{#if $uiStore.showBodyPreview && building}
			<div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
				<WorldPlanningPlacementRect cols={building.tile_cols} rows={building.tile_rows} />
			</div>
		{/if}
	{/snippet}
</SpriteStateItem>
