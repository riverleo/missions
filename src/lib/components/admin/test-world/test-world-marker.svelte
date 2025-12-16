<script lang="ts">
	import { VIEW_BOX_WIDTH, VIEW_BOX_HEIGHT } from '$lib/components/app/world/constants';
	import { useTestWorld } from '$lib/hooks/use-test-world';

	const { store, place } = useTestWorld();

	function onclickOverlay(e: MouseEvent) {
		const selectedCharacter = $store.selectedCharacter;
		if (!selectedCharacter) return;

		const target = e.currentTarget as HTMLElement;
		const rect = target.getBoundingClientRect();
		const x = ((e.clientX - rect.left) / rect.width) * VIEW_BOX_WIDTH;
		const y = ((e.clientY - rect.top) / rect.height) * VIEW_BOX_HEIGHT;

		place(selectedCharacter, x, y);
	}
</script>

<!-- 캐릭터 선택 시 클릭 오버레이 -->
{#if $store.selectedCharacter}
	<button
		type="button"
		class="absolute inset-0 cursor-crosshair bg-transparent"
		aria-label="캐릭터 배치"
		onclick={onclickOverlay}
	></button>
{/if}
