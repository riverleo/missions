<script lang="ts">
	import { useWorldTest, useWorld, useWorldContext } from '$lib/hooks/use-world';
	import { useTerrain } from '$lib/hooks/use-terrain';
	import { useBuilding } from '$lib/hooks/use-building';
	import { IconNorthStar } from '@tabler/icons-svelte';
	import { Tooltip, TooltipContent, TooltipTrigger } from '$lib/components/ui/tooltip';
	import { snapPointToTopLeftTile } from '$lib/components/app/world/tiles';
	import { EntityIdUtils } from '$lib/utils/entity-id';
	import type { BuildingId, CharacterId, ItemId, TileId } from '$lib/types';
	import type { WorldCharacterEntity } from '$lib/components/app/world/entities/world-character-entity';

	const { store, addWorldCharacter, addWorldBuilding, addWorldItem, addTileToWorldTileMap } =
		useWorldTest();
	const world = useWorldContext();
	const { worldStore, selectedEntityIdStore } = useWorld();
	const { store: terrainStore } = useTerrain();
	const { store: buildingStore } = useBuilding();

	// terrain을 terrainStore에서 구독
	const terrainId = $derived($worldStore.data[world.worldId]?.terrain_id);
	const terrain = $derived(terrainId ? $terrainStore.data[terrainId] : undefined);

	// 시작지점 좌표 (카메라 변환 적용)
	const startLeft = $derived(
		terrain?.respawn_x != null
			? `${(terrain.respawn_x - world.camera.x) * world.camera.zoom}px`
			: undefined
	);
	const startTop = $derived(
		terrain?.respawn_y != null
			? `${(terrain.respawn_y - world.camera.y) * world.camera.zoom}px`
			: undefined
	);

	let mouseX = $state(0);
	let mouseY = $state(0);
	let isCommandPressed = $state(false);

	// 엔티티 선택 시 world.blueprint.cursor 업데이트
	$effect(() => {
		if (isCommandPressed && $store.selectedEntityTemplateId) {
			const { type, value: id } = EntityIdUtils.template.parse($store.selectedEntityTemplateId);

			const worldPos = world.camera.screenToWorld(mouseX, mouseY);
			if (!worldPos) {
				world.blueprint.cursor = undefined;
				return;
			}

			if (type === 'building') {
				const building = $buildingStore.data[id as BuildingId];
				if (!building) {
					world.blueprint.cursor = undefined;
					return;
				}

				const { tileX, tileY } = snapPointToTopLeftTile(
					worldPos.x,
					worldPos.y,
					building.tile_cols,
					building.tile_rows
				);
				world.blueprint.cursor = {
					entityTemplateId: $store.selectedEntityTemplateId,
					tileX,
					tileY,
				};
			} else if (type === 'tile') {
				const { tileX, tileY } = snapPointToTopLeftTile(worldPos.x, worldPos.y, 1, 1);
				world.blueprint.cursor = {
					entityTemplateId: $store.selectedEntityTemplateId,
					tileX,
					tileY,
				};
			} else if (type === 'character' || type === 'item') {
				// 캐릭터/아이템은 픽셀 좌표 그대로
				const { tileX, tileY } = snapPointToTopLeftTile(worldPos.x, worldPos.y, 1, 1);
				world.blueprint.cursor = {
					entityTemplateId: $store.selectedEntityTemplateId,
					tileX,
					tileY,
				};
			} else {
				world.blueprint.cursor = undefined;
			}
		} else {
			world.blueprint.cursor = undefined;
		}
	});

	function onclickEntityOverlay() {
		const worldPos = world.camera.screenToWorld(mouseX, mouseY);
		if (!worldPos) return;

		// useWorldTest에서 선택한 엔티티가 있으면 배치
		if ($store.selectedEntityTemplateId) {
			const { type, value: id } = EntityIdUtils.template.parse($store.selectedEntityTemplateId);

			if (type === 'building') {
				// 겹치는 셀이 있으면 배치하지 않음
				if (!world.blueprint.placable) return;
				const building = $buildingStore.data[id as BuildingId];
				if (!building) return;
				const { tileX, tileY } = snapPointToTopLeftTile(
					worldPos.x,
					worldPos.y,
					building.tile_cols,
					building.tile_rows
				);
				addWorldBuilding(building.id, tileX, tileY);
			} else if (type === 'tile') {
				// 겹치는 셀이 있으면 배치하지 않음
				if (!world.blueprint.placable) return;
				const { tileX, tileY } = snapPointToTopLeftTile(worldPos.x, worldPos.y, 1, 1);
				addTileToWorldTileMap(id as TileId, tileX, tileY);
			} else if (type === 'character') {
				addWorldCharacter(id as CharacterId, worldPos.x, worldPos.y);
			} else if (type === 'item') {
				addWorldItem(id as ItemId, worldPos.x, worldPos.y);
			}
			return;
		}

		// useWorld에서 선택한 캐릭터가 있으면 이동
		const selectedEntityId = $selectedEntityIdStore.entityId;
		if (EntityIdUtils.is('character', selectedEntityId)) {
			const entity = world.entities[selectedEntityId!];
			if (entity && entity.type === 'character') {
				(entity as WorldCharacterEntity).moveTo(worldPos.x, worldPos.y);
			}
		}
	}

	function onclickCommandOverlay(e: MouseEvent) {
		onclickEntityOverlay();
	}

	function onmousemove(e: MouseEvent) {
		mouseX = e.clientX;
		mouseY = e.clientY;
	}

	function onkeydown(e: KeyboardEvent) {
		if (e.key === 'Meta') {
			isCommandPressed = true;
		}
	}

	function onkeyup(e: KeyboardEvent) {
		if (e.key === 'Meta') {
			isCommandPressed = false;
		}
	}
</script>

<svelte:window {onkeydown} {onkeyup} {onmousemove} />

<!-- 통합 오버레이 -->
{#if isCommandPressed}
	<button
		type="button"
		class="pointer-events-auto absolute inset-0 border-2 border-emerald-400"
		aria-label="커맨드 키를 누른 상태에서 오버레이"
		onclick={onclickCommandOverlay}
	></button>
{/if}

<!-- 디버그 모드일 때 시작지점 표시 -->
{#if $store.debug && startLeft && startTop}
	<Tooltip>
		<TooltipTrigger
			class="absolute -translate-x-1/2 -translate-y-1/2 animate-spin text-red-400"
			style="left: {startLeft}; top: {startTop};"
		>
			<IconNorthStar class="size-4" />
		</TooltipTrigger>
		<TooltipContent>리스폰 위치</TooltipContent>
	</Tooltip>
{/if}
