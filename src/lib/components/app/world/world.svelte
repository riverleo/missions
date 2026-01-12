<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { WorldId } from '$lib/types';
	import { WORLD_WIDTH, WORLD_HEIGHT } from '$lib/constants';
	import { setWorldContext, useWorld } from '$lib/hooks/use-world';
	import { WorldContext } from './context';
	import type { Camera } from './camera.svelte';
	import WorldRenderer from './world-renderer.svelte';

	interface Props extends HTMLAttributes<HTMLDivElement> {
		width?: number;
		height?: number;
		worldId: WorldId;
		debug?: boolean;
		children?: Snippet;
		oncamerachange?: (camera: Camera) => void;
		worldContext?: WorldContext;
	}

	let {
		width = WORLD_WIDTH,
		height = WORLD_HEIGHT,
		worldId,
		debug = false,
		children,
		oncamerachange,
		worldContext: worldContextRef = $bindable(),
		...restProps
	}: Props = $props();

	const worldContext = new WorldContext(worldId, debug);
	worldContextRef = worldContext;
	const { worldStore } = useWorld();

	// worldId로 useWorld에서 world 조회
	const world = $derived($worldStore.data[worldId]);
	const terrainId = $derived(world?.terrain_id);

	// oncamerachange prop 변경 시 worldContext 업데이트
	$effect(() => {
		worldContext.oncamerachange = oncamerachange;
	});

	// terrainId 변경 시 reload 호출 (초기 마운트 제외)
	let prevTerrainId: typeof terrainId | undefined = undefined;
	$effect(() => {
		if (terrainId !== prevTerrainId) {
			// 초기 마운트가 아닐 때만 reload
			if (prevTerrainId !== undefined && terrainId) {
				worldContext.reload();
			}
			prevTerrainId = terrainId;
		}
	});

	// debug prop 변경 시 worldContext 업데이트
	$effect(() => {
		worldContext.setDebug(debug);
	});

	setWorldContext(worldContext);
</script>

{#if world}
	<WorldRenderer {...restProps} {width} {height}>
		{@render children?.()}
	</WorldRenderer>
{:else}
	<div
		class="flex flex-col items-center justify-center"
		style="width: {width}px; height: {height}px;"
	>
		<p class="text-sm text-muted-foreground">존재하지 않는 월드입니다.</p>
		<p class="text-sm text-muted">아이디 - {worldId}</p>
	</div>
{/if}
