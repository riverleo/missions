<script lang="ts">
	import { useTestWorld } from '$lib/hooks/use-test-world';
	import { useWorld } from '$lib/hooks/use-world.svelte';
	import { SpriteAnimator } from '$lib/components/app/sprite-animator/sprite-animator.svelte';
	import SpriteAnimatorRenderer from '$lib/components/app/sprite-animator/sprite-animator-renderer.svelte';
	import { IconNorthStar } from '@tabler/icons-svelte';
	import { Tooltip, TooltipContent, TooltipTrigger } from '$lib/components/ui/tooltip';

	const { store, placeCharacter, placeBuilding } = useTestWorld();
	const world = useWorld();

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
	let mouseX = $state(0);
	let mouseY = $state(0);
	let animator = $state<SpriteAnimator | undefined>(undefined);

	// 선택된 캐릭터/건물의 idle 상태 가져오기
	const selectedIdleState = $derived(() => {
		if ($store.selectedCharacter) {
			return $store.selectedCharacter.character_states.find((s) => s.type === 'idle');
		} else if ($store.selectedBuilding) {
			return $store.selectedBuilding.building_states.find((s) => s.type === 'idle');
		}
		return undefined;
	});

	// idle 상태가 변경되면 animator 생성
	$effect(() => {
		const idleState = selectedIdleState();
		const atlasName = idleState?.atlas_name;

		if (!atlasName) {
			animator?.stop();
			animator = undefined;
			return;
		}

		SpriteAnimator.create(atlasName).then((newAnimator) => {
			animator?.stop();
			newAnimator.init({
				name: 'idle',
				from: idleState?.frame_from ?? undefined,
				to: idleState?.frame_to ?? undefined,
				fps: idleState?.fps ?? undefined,
			});
			newAnimator.play({ name: 'idle', loop: idleState?.loop ?? 'loop' });
			animator = newAnimator;
		});

		return () => {
			animator?.stop();
		};
	});

	function onclickOverlay(e: MouseEvent) {
		const target = e.currentTarget as HTMLElement;
		const rect = target.getBoundingClientRect();
		// 화면 좌표를 월드 좌표로 변환 (카메라 적용)
		const containerX = e.clientX - rect.left;
		const containerY = e.clientY - rect.top;
		const x = containerX / $store.cameraZoom + $store.cameraX;
		const y = containerY / $store.cameraZoom + $store.cameraY;

		if ($store.selectedCharacter) {
			placeCharacter($store.selectedCharacter, x, y);
		} else if ($store.selectedBuilding) {
			placeBuilding($store.selectedBuilding, x, y);
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

<!-- 캐릭터 또는 건물 선택 시 클릭 오버레이 -->
{#if $store.selectedCharacter || $store.selectedBuilding}
	<button
		type="button"
		class="absolute inset-0 bg-transparent"
		style="cursor: {isCommandPressed ? 'none' : 'inherit'}; pointer-events: {isCommandPressed ? 'auto' : 'none'};"
		aria-label={$store.selectedCharacter ? '캐릭터 배치' : '건물 배치'}
		onclick={onclickOverlay}
	></button>
{/if}

<!-- 커맨드 키 누를 때 스프라이트 미리보기 -->
{#if isCommandPressed && animator && ($store.selectedCharacter || $store.selectedBuilding)}
	<div
		class="pointer-events-none fixed -translate-x-1/2 -translate-y-1/2 opacity-70"
		style="left: {mouseX}px; top: {mouseY}px;"
	>
		<SpriteAnimatorRenderer {animator} resolution={2} />
	</div>
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
