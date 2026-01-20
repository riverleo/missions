<script lang="ts">
	import type { BuildingStateType, BuildingId, BuildingState } from '$lib/types';
	import SpriteStateItem, {
		type SpriteStateChange,
	} from '$lib/components/admin/sprite-state-item.svelte';
	import { atlases } from '$lib/components/app/sprite-animator';
	import BuildingSpriteAnimator from '$lib/components/app/sprite-animator/building-sprite-animator.svelte';
	import { useBuilding } from '$lib/hooks/use-building';
	import { useConditionBehavior } from '$lib/hooks/use-condition-behavior';
	import BuildingTileGrid from './building-tile-grid.svelte';
	import { CELL_SIZE } from '$lib/constants';
	import { getBuildingStateLabel } from '$lib/utils/state-label';
	import { Button } from '$lib/components/ui/button';

	interface Props {
		buildingId: BuildingId;
		type: BuildingStateType;
	}

	let { buildingId, type }: Props = $props();

	const { store, stateStore, admin, openStateDialog } = useBuilding();
	const { uiStore } = admin;
	const { conditionBehaviorStore } = useConditionBehavior();

	const building = $derived($store.data[buildingId]);
	const buildingStates = $derived($stateStore.data[buildingId] ?? []);
	const buildingState = $derived(buildingStates.find((s: BuildingState) => s.type === type));

	// Find condition behaviors that use this building state
	const relatedBehaviors = $derived(
		Object.values($conditionBehaviorStore.data).filter(
			(b) => b.building_state_type === type
		)
	);

	const conditionPreview = $derived.by(() => {
		if (type === 'idle') return undefined;

		if (relatedBehaviors.length === 0) {
			return '연결된 컨디션 행동 없음';
		}

		if (relatedBehaviors.length === 1) {
			return relatedBehaviors[0]?.name;
		}

		return `${relatedBehaviors.length}개 컨디션 행동`;
	});

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
				await admin.update(buildingId, { cell_cols, cell_rows });
			}
		}
	}

	async function ondelete() {
		if (buildingState) {
			await admin.removeBuildingState(buildingState.id, buildingId);
		}
	}

	function onConditionClick() {
		if (buildingState) {
			openStateDialog({ type: 'update', buildingStateId: buildingState.id });
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
	{#snippet action()}
		{#if conditionPreview !== undefined}
			<Button
				variant={relatedBehaviors.length > 0 ? 'ghost' : 'outline'}
				size="sm"
				disabled={!buildingState || type === 'idle'}
				onclick={onConditionClick}
			>
				{conditionPreview}
			</Button>
		{/if}
	{/snippet}
</SpriteStateItem>
