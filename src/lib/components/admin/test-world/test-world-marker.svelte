<script lang="ts">
	import { useWorldTest, useWorld, useWorldContext } from '$lib/hooks/use-world';
	import { useTerrain } from '$lib/hooks/use-terrain';
	import { IconNorthStar } from '@tabler/icons-svelte';
	import { Tooltip, TooltipContent, TooltipTrigger } from '$lib/components/ui/tooltip';

	const { store } = useWorldTest();
	const world = useWorldContext();
	const { worldStore } = useWorld();
	const { store: terrainStore } = useTerrain();

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
</script>

<!-- 디버그 모드일 때 시작지점 표시 -->
{#if $store.debug && startLeft && startTop}
	<Tooltip>
		<TooltipTrigger
			class="absolute -translate-x-1/2 -translate-y-1/2 animate-spin text-red-400"
			style="left: {startLeft}; top: {startTop};"
		>
			<IconNorthStar />
		</TooltipTrigger>
		<TooltipContent>리스폰 위치</TooltipContent>
	</Tooltip>
{/if}
