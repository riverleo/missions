<script lang="ts">
	import { VIEW_BOX_WIDTH, VIEW_BOX_HEIGHT } from '$lib/components/app/world/constants';
	import { useTestWorld } from '$lib/hooks/use-test-world';

	const { store, placeCharacter, placeBuilding } = useTestWorld();

	function onclickOverlay(e: MouseEvent) {
		const target = e.currentTarget as HTMLElement;
		const rect = target.getBoundingClientRect();
		const x = ((e.clientX - rect.left) / rect.width) * VIEW_BOX_WIDTH;
		const y = ((e.clientY - rect.top) / rect.height) * VIEW_BOX_HEIGHT;

		if ($store.selectedCharacter) {
			placeCharacter($store.selectedCharacter, x, y);
		} else if ($store.selectedBuilding) {
			placeBuilding($store.selectedBuilding, x, y);
		}
	}
</script>

<!-- 캐릭터 또는 건물 선택 시 클릭 오버레이 -->
{#if $store.selectedCharacter || $store.selectedBuilding}
	<button
		type="button"
		class="absolute inset-0 cursor-crosshair bg-transparent"
		aria-label={$store.selectedCharacter ? '캐릭터 배치' : '건물 배치'}
		onclick={onclickOverlay}
	></button>
{/if}
