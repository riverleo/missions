<script lang="ts">
	import { useWorldTest, useWorld, useWorldContext } from '$lib/hooks/use-world';
	import { useTerrain } from '$lib/hooks/use-terrain';
	import { useCharacter } from '$lib/hooks/use-character';
	import { useCharacterBody } from '$lib/hooks/use-character-body';
	import { useBuilding } from '$lib/hooks/use-building';
	import { useItem } from '$lib/hooks/use-item';
	import { CharacterSpriteAnimator, ItemSpriteAnimator } from '$lib/components/app/sprite-animator';
	import { IconNorthStar } from '@tabler/icons-svelte';
	import { Tooltip, TooltipContent, TooltipTrigger } from '$lib/components/ui/tooltip';
	import { snapPointToTopLeftTile } from '$lib/components/app/world/tiles';
	import type { WorldCharacterId, WorldBuildingId, WorldItemId } from '$lib/types';
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
	const { worldStore } = useWorld();
	const { store: terrainStore } = useTerrain();
	const { store: characterStore, faceStateStore } = useCharacter();
	const { store: characterBodyStore, bodyStateStore } = useCharacterBody();
	const { store: buildingStore } = useBuilding();
	const { store: itemStore } = useItem();

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

	let isCommandPressed = $state(false);
	let containerRef = $state<HTMLElement | undefined>(undefined);
	let mouseX = $state(0);
	let mouseY = $state(0);

	// 컨테이너 기준 마우스 좌표 계산
	const mouseContainerPos = $derived(() => {
		if (!containerRef) return { x: 0, y: 0 };
		const rect = containerRef.getBoundingClientRect();
		return {
			x: mouseX - rect.left,
			y: mouseY - rect.top,
		};
	});

	// 마우스의 월드 좌표 계산
	const mouseWorldPos = $derived(() => {
		const containerPos = mouseContainerPos();
		return {
			x: containerPos.x / world.camera.zoom + world.camera.x,
			y: containerPos.y / world.camera.zoom + world.camera.y,
		};
	});

	// 선택된 건물 (from useBuilding)
	const selectedBuilding = $derived(
		$store.selectedBuildingId ? $buildingStore.data[$store.selectedBuildingId] : undefined
	);

	// 건물 선택 시 world.blueprint.cursor 업데이트
	$effect(() => {
		if (selectedBuilding) {
			const pos = mouseWorldPos();
			const { tileX, tileY } = snapPointToTopLeftTile(
				pos.x,
				pos.y,
				selectedBuilding.tile_cols,
				selectedBuilding.tile_rows
			);
			world.blueprint.cursor = {
				building: selectedBuilding,
				tileX,
				tileY,
			};
		} else {
			world.blueprint.cursor = undefined;
		}
	});

	// 선택된 캐릭터
	const selectedCharacter = $derived(
		$store.selectedCharacterId ? $characterStore.data[$store.selectedCharacterId] : undefined
	);

	// 선택된 아이템 (from useItem)
	const selectedItem = $derived(
		$store.selectedItemId ? $itemStore.data[$store.selectedItemId] : undefined
	);

	// 컨테이너 참조 가져오기
	$effect(() => {
		containerRef = document.querySelector('[data-slot="world-container"]') as HTMLElement;
	});

	function onclickBuildingOverlay() {
		// 겹치는 셀이 있으면 배치하지 않음
		if (!world.blueprint.canPlace) return;

		const pos = mouseWorldPos();
		if (selectedBuilding) {
			const { tileX, tileY } = snapPointToTopLeftTile(
				pos.x,
				pos.y,
				selectedBuilding.tile_cols,
				selectedBuilding.tile_rows
			);
			addWorldBuilding(selectedBuilding.id, tileX, tileY);
		}
	}

	function onclickCharacterOverlay(e: MouseEvent) {
		const pos = mouseWorldPos();
		if (selectedCharacter) {
			addWorldCharacter(selectedCharacter.id, pos.x, pos.y);
		}
	}

	function onclickItemOverlay() {
		const pos = mouseWorldPos();
		if (selectedItem) {
			addWorldItem(selectedItem.id, pos.x, pos.y);
		}
	}

	function onclickEraserOverlay() {
		const pos = mouseWorldPos();

		// 클릭 위치에 있는 엔티티 찾기
		for (const entity of Object.values(world.entities)) {
			const dx = pos.x - entity.body.position.x;
			const dy = pos.y - entity.body.position.y;

			if (entity.type === 'character') {
				const characterEntity = entity as WorldCharacterEntity;
				const characterBody = characterEntity.characterBody;
				if (!characterBody) continue;

				const halfWidth = characterBody.width / 2;
				const halfHeight = characterBody.height / 2;
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

	$effect(() => {
		window.addEventListener('keydown', onkeydown);
		window.addEventListener('keyup', onkeyup);
		window.addEventListener('mousemove', onmousemove);
		return () => {
			window.removeEventListener('keydown', onkeydown);
			window.removeEventListener('keyup', onkeyup);
			window.removeEventListener('mousemove', onmousemove);
		};
	});
</script>

<!-- 지우개 활성화 시 클릭 오버레이 -->
{#if $store.eraser}
	<button
		type="button"
		class="absolute inset-0 cursor-pointer bg-transparent"
		aria-label="지우개"
		onclick={onclickEraserOverlay}
	></button>
{/if}

<!-- 건물 선택 시 클릭 오버레이 -->
{#if selectedBuilding}
	<button
		type="button"
		class="absolute inset-0 cursor-pointer bg-transparent"
		aria-label="건물 배치"
		onclick={onclickBuildingOverlay}
	></button>
{/if}

<!-- 캐릭터 선택 시 클릭 오버레이 -->
{#if selectedCharacter}
	<button
		type="button"
		class="absolute inset-0 bg-transparent"
		style="cursor: {isCommandPressed ? 'none' : 'inherit'}; pointer-events: {isCommandPressed
			? 'auto'
			: 'none'};"
		aria-label="캐릭터 배치"
		onclick={onclickCharacterOverlay}
	></button>
	<!-- 커맨드 키 누를 때 스프라이트 미리보기 -->
	{#if isCommandPressed && selectedCharacter}
		{@const pos = mouseContainerPos()}
		<div
			class="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 opacity-70"
			style="left: {pos.x}px; top: {pos.y}px;"
		>
			<CharacterSpriteAnimator
				characterId={selectedCharacter.id}
				bodyStateType="idle"
				faceStateType="idle"
				resolution={2}
			/>
		</div>
	{/if}
{/if}

<!-- 아이템 선택 시 클릭 오버레이 -->
{#if selectedItem}
	<button
		type="button"
		class="absolute inset-0 bg-transparent"
		style="cursor: {isCommandPressed ? 'none' : 'inherit'}; pointer-events: {isCommandPressed
			? 'auto'
			: 'none'};"
		aria-label="아이템 배치"
		onclick={onclickItemOverlay}
	></button>
	<!-- 커맨드 키 누를 때 아이템 미리보기 -->
	{#if isCommandPressed && selectedItem}
		{@const pos = mouseContainerPos()}
		<div
			class="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 opacity-70"
			style="left: {pos.x}px; top: {pos.y}px;"
		>
			<ItemSpriteAnimator itemId={selectedItem.id} stateType="idle" resolution={2} />
		</div>
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
