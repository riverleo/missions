<script lang="ts">
	import { useTerrain, useWorld, useWorldTest } from '$lib/hooks';
	import { IconNorthStar } from '@tabler/icons-svelte';
	import { Tooltip, TooltipContent, TooltipTrigger } from '$lib/components/ui/tooltip';
	import type { WorldContext } from '$lib/components/app/world/context';

	interface Props {
		worldContext?: WorldContext;
	}

	let { worldContext }: Props = $props();

	const { store } = useWorldTest();
	const { worldStore } = useWorld();
	const { terrainStore } = useTerrain();

	// terrain을 getter에서 가져옴
	const terrainId = $derived(
		worldContext ? $worldStore.data[worldContext.worldId]?.terrain_id : undefined
	);
	const terrain = $derived(terrainId ? $terrainStore.data[terrainId] : undefined);

	// 시작지점 좌표 (카메라 변환 적용)
	const startLeft = $derived(
		terrain?.respawn_x != null && worldContext
			? `${(terrain.respawn_x - worldContext.camera.x) * worldContext.camera.zoom}px`
			: undefined
	);
	const startTop = $derived(
		terrain?.respawn_y != null && worldContext
			? `${(terrain.respawn_y - worldContext.camera.y) * worldContext.camera.zoom}px`
			: undefined
	);

	function onkeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			worldContext?.blueprint.setCursor(undefined);
		}
	}
</script>

<svelte:window {onkeydown} />

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
