<script lang="ts">
	import type { BuildingStateType, BuildingId, BuildingState } from '$lib/types';
	import SpriteStateItem, {
		type SpriteStateChange,
	} from '$lib/components/admin/sprite-state-item.svelte';
	import { atlases } from '$lib/components/app/sprite-animator';
	import BuildingSpriteAnimator from '$lib/components/app/sprite-animator/building-sprite-animator.svelte';
	import { useBuilding } from '$lib/hooks/use-building';
	import { useCondition } from '$lib/hooks/use-condition';
	import BuildingTileGrid from './building-tile-grid.svelte';
	import { TILE_SIZE } from '$lib/components/app/world/constants';
	import { getBuildingStateLabel } from '$lib/utils/state-label';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';

	interface Props {
		buildingId: string;
		type: BuildingStateType;
	}

	let { buildingId, type }: Props = $props();

	const { store, stateStore, admin, openStateDialog } = useBuilding();
	const { uiStore } = admin;
	const { conditionStore } = useCondition();

	const building = $derived($store.data[buildingId as BuildingId]);
	const buildingStates = $derived($stateStore.data[buildingId as BuildingId] ?? []);
	const buildingState = $derived(buildingStates.find((s: BuildingState) => s.type === type));
	const condition = $derived(
		buildingState?.condition_id ? $conditionStore.data[buildingState.condition_id] : undefined
	);

	const conditionPreview = $derived.by(() => {
		if (type === 'idle') return undefined;

		if (!condition) {
			return '컨디션 선택 필요';
		}

		return `${condition.name} (${buildingState?.min_value}~${buildingState?.max_value})`;
	});

	async function onchange(change: SpriteStateChange) {
		if (buildingState) {
			await admin.updateBuildingState(buildingState.id, buildingId as BuildingId, change);
		} else if (change.atlas_name) {
			await admin.createBuildingState(buildingId as BuildingId, {
				type,
				atlas_name: change.atlas_name,
			});
		}

		// 타일 값이 0이면 atlas 크기로 자동 계산
		if (change.atlas_name && building && building.tile_cols === 0 && building.tile_rows === 0) {
			const atlas = atlases[change.atlas_name];
			if (atlas) {
				const tile_cols = Math.max(1, Math.round(atlas.frameWidth / TILE_SIZE));
				const tile_rows = Math.max(1, Math.round(atlas.frameHeight / TILE_SIZE));
				await admin.update(buildingId as BuildingId, { tile_cols, tile_rows });
			}
		}
	}

	async function ondelete() {
		if (buildingState) {
			await admin.removeBuildingState(buildingState.id, buildingId as BuildingId);
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
			<BuildingSpriteAnimator
				buildingId={buildingId as BuildingId}
				stateType={type}
				resolution={2}
			/>
		{/if}
	{/snippet}
	{#snippet collider()}
		{#if $uiStore.showBodyPreview && building}
			<div
				style="transform: translate({-building.collider_offset_x}px, {-building.collider_offset_y}px);"
			>
				<BuildingTileGrid cols={building.tile_cols} rows={building.tile_rows} />
			</div>
		{/if}
	{/snippet}
	{#snippet action()}
		{#if conditionPreview !== undefined}
			<Button
				variant={condition ? 'ghost' : 'outline'}
				size="sm"
				disabled={!buildingState || type === 'idle'}
				onclick={onConditionClick}
			>
				{#if condition}
					<Badge variant="secondary">{buildingState?.priority}</Badge>
				{/if}
				{conditionPreview}
			</Button>
		{/if}
	{/snippet}
</SpriteStateItem>
