<script lang="ts">
	import { useWorldTest, useWorld, useWorldContext } from '$lib/hooks/use-world';
	import { useTerrain } from '$lib/hooks/use-terrain';
	import { useBuilding } from '$lib/hooks/use-building';
	import { EntitySpriteAnimator } from '$lib/components/app/sprite-animator';
	import { IconNorthStar } from '@tabler/icons-svelte';
	import { Tooltip, TooltipContent, TooltipTrigger } from '$lib/components/ui/tooltip';
	import { snapPointToTopLeftTile } from '$lib/components/app/world/tiles';
	import { EntityIdUtils } from '$lib/utils/entity-id';
	import type { BuildingId, CharacterId, ItemId } from '$lib/types';
	import type { WorldCharacterEntity } from '$lib/components/app/world/entities/world-character-entity';
	import type { WorldBuildingEntity } from '$lib/components/app/world/entities/world-building-entity';
	import type { WorldItemEntity } from '$lib/components/app/world/entities/world-item-entity';

	const {
		store,
		addWorldCharacter,
		addWorldBuilding,
		addWorldItem,
		removeWorldCharacter,
		removeWorldBuilding,
		removeWorldItem,
	} = useWorldTest();
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

	// 건물 선택 시 world.blueprint.cursor 업데이트
	$effect(() => {
		if (
			isCommandPressed &&
			$store.selectedEntityId &&
			EntityIdUtils.is('building', $store.selectedEntityId)
		) {
			const { value: id } = EntityIdUtils.parse($store.selectedEntityId);
			const building = $buildingStore.data[id as BuildingId];
			if (!building) {
				world.blueprint.cursor = undefined;
				return;
			}

			const worldPos = world.camera.screenToWorld(mouseX, mouseY);
			if (!worldPos) {
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
				buildingId: building.id,
				tileX,
				tileY,
			};
		} else {
			world.blueprint.cursor = undefined;
		}
	});

	function onclickEntityOverlay() {
		if (!$store.selectedEntityId) return;

		const worldPos = world.camera.screenToWorld(mouseX, mouseY);
		if (!worldPos) return;

		const { type, value: id } = EntityIdUtils.parse($store.selectedEntityId);

		if (type === 'building') {
			// 겹치는 셀이 있으면 배치하지 않음
			if (!world.blueprint.canPlace) return;
			const building = $buildingStore.data[id as BuildingId];
			if (!building) return;
			const { tileX, tileY } = snapPointToTopLeftTile(
				worldPos.x,
				worldPos.y,
				building.tile_cols,
				building.tile_rows
			);
			addWorldBuilding(building.id, tileX, tileY);
		} else if (type === 'character') {
			addWorldCharacter(id as CharacterId, worldPos.x, worldPos.y);
		} else if (type === 'item') {
			addWorldItem(id as ItemId, worldPos.x, worldPos.y);
		}
	}

	function onclickEraserOverlay() {
		const worldPos = world.camera.screenToWorld(mouseX, mouseY);
		if (!worldPos) return;

		// 클릭 위치에 있는 엔티티 찾기
		for (const entity of Object.values(world.entities)) {
			const dx = worldPos.x - entity.body.position.x;
			const dy = worldPos.y - entity.body.position.y;

			if (entity.type === 'character') {
				const characterEntity = entity as WorldCharacterEntity;
				const characterBody = characterEntity.characterBody;
				if (!characterBody) continue;

				const halfWidth = characterBody.collider_width / 2;
				const halfHeight = characterBody.collider_height / 2;
				if (Math.abs(dx) <= halfWidth && Math.abs(dy) <= halfHeight) {
					removeWorldCharacter(characterEntity.id);
					return;
				}
			} else if (entity.type === 'building') {
				const buildingEntity = entity as WorldBuildingEntity;
				const width = buildingEntity.body.bounds.max.x - buildingEntity.body.bounds.min.x;
				const height = buildingEntity.body.bounds.max.y - buildingEntity.body.bounds.min.y;
				const halfWidth = width / 2;
				const halfHeight = height / 2;
				if (Math.abs(dx) <= halfWidth && Math.abs(dy) <= halfHeight) {
					removeWorldBuilding(buildingEntity.id);
					return;
				}
			} else if (entity.type === 'item') {
				const itemEntity = entity as WorldItemEntity;
				const width = itemEntity.body.bounds.max.x - itemEntity.body.bounds.min.x;
				const height = itemEntity.body.bounds.max.y - itemEntity.body.bounds.min.y;
				const halfWidth = width / 2;
				const halfHeight = height / 2;
				if (Math.abs(dx) <= halfWidth && Math.abs(dy) <= halfHeight) {
					removeWorldItem(itemEntity.id);
					return;
				}
			}
		}
	}

	// 통합된 오버레이 핸들러
	function onclickOverlay(e: MouseEvent) {
		if ($store.eraser) {
			onclickEraserOverlay();
		} else {
			onclickEntityOverlay();
		}
	}

	function oncontextmenuOverlay(e: MouseEvent) {
		// 캐릭터 엔티티 선택 시 이동
		const selectedEntityId = $selectedEntityIdStore.entityId;
		if (EntityIdUtils.is('character', selectedEntityId) && isCommandPressed) {
			e.preventDefault();

			if (!selectedEntityId) return;
			const worldPos = world.camera.screenToWorld(mouseX, mouseY);
			if (!worldPos) return;

			const { value: characterId } = EntityIdUtils.parse(selectedEntityId);
			const entity = world.entities[characterId];
			if (entity && entity.type === 'character') {
				(entity as WorldCharacterEntity).moveTo(worldPos.x, worldPos.y);
			}
		}
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
		onclick={onclickOverlay}
		oncontextmenu={oncontextmenuOverlay}
	></button>

	<!-- 커맨드 키 누를 때 스프라이트 미리보기 -->
	{#if $store.selectedEntityId}
		{@const containerPos = world.camera.screenToContainer(mouseX, mouseY)}
		{#if containerPos}
			<div
				class="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 opacity-70"
				style="left: {containerPos.x}px; top: {containerPos.y}px;"
			>
				<EntitySpriteAnimator entityId={$store.selectedEntityId} resolution={2} />
			</div>
		{/if}
	{/if}
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
