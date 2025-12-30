<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import 'pathseg';
	import type { WorldCharacter, WorldBuilding } from '$lib/types';
	import { useWorld } from '$lib/hooks/use-world.svelte';
	import { useBuilding } from '$lib/hooks/use-building';
	import { WorldCharacterEntityRenderer } from './entities/world-character-entity';
	import WorldPlanning from './world-planning.svelte';
	import { cn } from '$lib/utils';
	import BuildingSpriteAnimator from './building-sprite-animator.svelte';

	interface Props extends HTMLAttributes<HTMLDivElement> {
		width: number;
		height: number;
		characters?: WorldCharacter[];
		buildings?: WorldBuilding[];
		children?: Snippet;
	}

	let {
		class: className,
		width,
		height,
		characters = [],
		buildings = [],
		children,
		...restProps
	}: Props = $props();

	const world = useWorld();
	const { terrainBody, camera, event } = world;
	const { store: buildingStore, stateStore: buildingStateStore } = useBuilding();

	let container: HTMLDivElement;

	// 카메라 줌 핸들러
	function onwheel(e: WheelEvent) {
		e.preventDefault();
		camera.applyZoom(e.deltaY, e.clientX, e.clientY);
	}

	// characters/buildings prop을 world에 동기화
	$effect(() => {
		world.worldCharacters = Object.fromEntries(characters.map((c) => [c.id, c]));
	});

	$effect(() => {
		world.buildings = Object.fromEntries(buildings.map((b) => [b.id, b]));
	});

	onMount(() => world.mount(container));
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
	bind:this={container}
	data-slot="world-container"
	{...restProps}
	class={cn('relative overflow-hidden border border-border', className)}
	style="width: {width}px; height: {height}px;"
	role="application"
	tabindex="0"
	{onwheel}
	onmousedown={event.onmousedown}
	onmousemove={event.onmousemove}
	onmouseup={event.onmouseup}
	onmouseleave={event.onmouseup}
>
	<!-- 월드 레이어: 카메라 transform 일괄 적용 -->
	<div
		class="pointer-events-none absolute origin-top-left"
		style="
			width: {terrainBody.width}px;
			height: {terrainBody.height}px;
			transform: scale({camera.zoom}) translate({-camera.x}px, {-camera.y}px);
		"
	>
		{#if world.terrainAssetUrl}
			<img
				src={world.terrainAssetUrl}
				class="absolute inset-0 h-full w-full"
				style="opacity: {world.debug ? 0 : 1};"
				alt={world.terrain?.title}
			/>
		{/if}
		{#if world.planning.showGrid}
			<WorldPlanning width={terrainBody.width} height={terrainBody.height} />
		{/if}
		{#each buildings as building (building.id)}
			{@const entity = world.worldBuildingEntities[building.id]}
			{@const buildingData = $buildingStore.data[building.building_id]}
			{@const buildingStates = buildingData
				? ($buildingStateStore.data[buildingData.id] ?? [])
				: []}
			{@const buildingState = buildingStates.find((s) => s.type === 'idle')}
			{#if entity && buildingState}
				<BuildingSpriteAnimator
					x={entity.body.position.x}
					y={entity.body.position.y}
					angle={entity.body.angle}
					{buildingState}
				/>
			{/if}
		{/each}
		{#each characters as character (character.id)}
			{@const entity = world.worldCharacterEntities[character.id]}
			{#if entity}
				<WorldCharacterEntityRenderer {entity} />
			{/if}
		{/each}
	</div>

	<!-- 오버레이 레이어: pointer-events를 받을 수 있는 별도 레이어 -->
	{@render children?.()}
</div>
