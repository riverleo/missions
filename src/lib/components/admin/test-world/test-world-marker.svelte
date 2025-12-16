<script lang="ts">
	import { useTestWorld } from '$lib/hooks/use-test-world';

	const { store, placeCharacter, placeBuilding } = useTestWorld();

	let isCommandPressed = $state(false);

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
		return () => {
			window.removeEventListener('keydown', onkeydown);
			window.removeEventListener('keyup', onkeyup);
		};
	});
</script>

<!-- 캐릭터 또는 건물 선택 시 클릭 오버레이 -->
{#if $store.selectedCharacter || $store.selectedBuilding}
	<button
		type="button"
		class="absolute inset-0 bg-transparent"
		style="cursor: {isCommandPressed ? 'crosshair' : 'inherit'}; pointer-events: {isCommandPressed ? 'auto' : 'none'};"
		aria-label={$store.selectedCharacter ? '캐릭터 배치' : '건물 배치'}
		onclick={onclickOverlay}
	></button>
{/if}
