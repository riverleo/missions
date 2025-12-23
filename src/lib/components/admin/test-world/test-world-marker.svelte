<script lang="ts">
	import { useTestWorld } from '$lib/hooks/use-test-world';
	import { useWorld } from '$lib/hooks/use-world.svelte';
	import { useCharacter } from '$lib/hooks/use-character';
	import { useCharacterBody } from '$lib/hooks/use-character-body';
	import { CharacterSpriteAnimator } from '$lib/components/app/sprite-animator';
	import { IconNorthStar } from '@tabler/icons-svelte';
	import { Tooltip, TooltipContent, TooltipTrigger } from '$lib/components/ui/tooltip';
	import { snapPointToBuildingCenter } from '$lib/components/app/world/tiles';

	const { store, placeCharacter, placeBuilding, removeCharacter, removeBuilding, syncPositions } =
		useTestWorld();
	const world = useWorld();
	const { store: characterStore, faceStateStore } = useCharacter();
	const { store: characterBodyStore, bodyStateStore } = useCharacterBody();

	// 1초마다 body 위치를 testWorld 스토어에 동기화
	$effect(() => {
		const interval = setInterval(() => {
			syncPositions(world.characterBodies, world.buildingBodies);
		}, 1000);
		return () => clearInterval(interval);
	});

	// 건물 선택 시 planning 그리드 표시
	$effect(() => {
		world.planning.showGrid = !!$store.selectedBuilding;
	});

	// 시작지점 좌표 (카메라 변환 적용)
	const startLeft = $derived(
		world.terrain?.start_x != null
			? `${(world.terrain.start_x - world.camera.x) * world.camera.zoom}px`
			: undefined
	);
	const startTop = $derived(
		world.terrain?.start_y != null
			? `${(world.terrain.start_y - world.camera.y) * world.camera.zoom}px`
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

	// 스냅된 건물 배치 좌표 (월드 좌표)
	const snappedWorldPos = $derived(() => {
		const pos = mouseWorldPos();
		const building = $store.selectedBuilding;
		if (!building) return { x: pos.x, y: pos.y };
		return snapPointToBuildingCenter(pos.x, pos.y, building.tile_cols, building.tile_rows);
	});

	// 건물 선택 시 world.planning.placement 업데이트
	$effect(() => {
		if ($store.selectedBuilding) {
			const pos = snappedWorldPos();
			world.planning.placement = {
				building: $store.selectedBuilding,
				x: pos.x,
				y: pos.y,
			};
		} else {
			world.planning.placement = undefined;
		}
	});

	// 선택된 캐릭터 -> 바디 -> 바디 상태 조회
	const selectedCharacter = $derived(
		$store.selectedCharacter ? $characterStore.data[$store.selectedCharacter.id] : undefined
	);
	const selectedCharacterBody = $derived(
		selectedCharacter ? $characterBodyStore.data[selectedCharacter.body_id] : undefined
	);
	const selectedBodyStates = $derived(
		selectedCharacterBody ? ($bodyStateStore.data[selectedCharacterBody.id] ?? []) : []
	);
	const selectedCharacterBodyState = $derived(selectedBodyStates.find((s) => s.type === 'idle'));

	// 선택된 캐릭터 -> 얼굴 상태 조회
	const selectedFaceStates = $derived(
		selectedCharacter ? ($faceStateStore.data[selectedCharacter.id] ?? []) : []
	);
	const selectedCharacterFaceState = $derived(selectedFaceStates.find((s) => s.type === 'idle'));

	// 컨테이너 참조 가져오기
	$effect(() => {
		containerRef = document.querySelector('[data-slot="world-container"]') as HTMLElement;
	});

	function onclickBuildingOverlay() {
		// 겹치는 셀이 있으면 배치하지 않음
		if (!world.planning.canPlace) return;

		const pos = snappedWorldPos();
		if ($store.selectedBuilding) {
			placeBuilding($store.selectedBuilding, pos.x, pos.y);
		}
	}

	function onclickCharacterOverlay(e: MouseEvent) {
		const pos = mouseWorldPos();
		if ($store.selectedCharacter) {
			placeCharacter($store.selectedCharacter, pos.x, pos.y);
		}
	}

	function onclickEraserOverlay() {
		const pos = mouseWorldPos();

		// 클릭 위치에 있는 캐릭터 찾기
		for (const [id, body] of Object.entries(world.characterBodies)) {
			const dx = pos.x - body.position.x;
			const dy = pos.y - body.position.y;
			const halfWidth = body.size.width / 2;
			const halfHeight = body.size.height / 2;
			if (Math.abs(dx) <= halfWidth && Math.abs(dy) <= halfHeight) {
				removeCharacter(id);
				return;
			}
		}

		// 클릭 위치에 있는 건물 찾기
		for (const [id, body] of Object.entries(world.buildingBodies)) {
			const dx = pos.x - body.position.x;
			const dy = pos.y - body.position.y;
			const halfWidth = body.size.width / 2;
			const halfHeight = body.size.height / 2;
			if (Math.abs(dx) <= halfWidth && Math.abs(dy) <= halfHeight) {
				removeBuilding(id);
				return;
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
{#if $store.selectedBuilding}
	<button
		type="button"
		class="absolute inset-0 cursor-pointer bg-transparent"
		aria-label="건물 배치"
		onclick={onclickBuildingOverlay}
	></button>
{/if}

<!-- 캐릭터 선택 시 클릭 오버레이 -->
{#if $store.selectedCharacter}
	<button
		type="button"
		class="absolute inset-0 bg-transparent"
		style="cursor: {isCommandPressed ? 'none' : 'inherit'}; pointer-events: {isCommandPressed ? 'auto' : 'none'};"
		aria-label="캐릭터 배치"
		onclick={onclickCharacterOverlay}
	></button>
	<!-- 커맨드 키 누를 때 스프라이트 미리보기 -->
	{#if isCommandPressed && selectedCharacterBodyState}
		{@const pos = mouseContainerPos()}
		<div
			class="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 opacity-70"
			style="left: {pos.x}px; top: {pos.y}px;"
		>
			<CharacterSpriteAnimator
				bodyState={selectedCharacterBodyState}
				faceState={selectedCharacterFaceState}
				resolution={2}
			/>
		</div>
	{/if}
{/if}

<!-- 디버그 모드일 때 시작지점 표시 -->
{#if $store.debug && startLeft && startTop}
	<Tooltip>
		<TooltipTrigger
			class="absolute -translate-x-1/2 -translate-y-1/2 animate-spin text-primary"
			style="left: {startLeft}; top: {startTop};"
		>
			<IconNorthStar class="size-4" />
		</TooltipTrigger>
		<TooltipContent>시작 위치</TooltipContent>
	</Tooltip>
{/if}
