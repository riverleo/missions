<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import 'pathseg';
	import type { WorldCharacter, WorldBuilding } from '$lib/types';
	import { useWorld } from '$lib/hooks/use-world.svelte';
	import { useBuilding } from '$lib/hooks/use-building';
	import { useCharacter } from '$lib/hooks/use-character';
	import { useCharacterBody } from '$lib/hooks/use-character-body';
	import CharacterSpriteAnimator from './character-sprite-animator.svelte';
	import BuildingSpriteAnimator from './building-sprite-animator.svelte';
	import WorldPlanning from './world-planning.svelte';
	import { cn } from '$lib/utils';

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
	const { store: characterStore, faceStateStore } = useCharacter();
	const { store: characterBodyStore, bodyStateStore } = useCharacterBody();

	let container: HTMLDivElement;

	// 카메라 줌 핸들러
	function onwheel(e: WheelEvent) {
		e.preventDefault();
		camera.applyZoom(e.deltaY, e.clientX, e.clientY);
	}

	// characters/buildings prop을 world에 동기화
	$effect(() => {
		world.characters = Object.fromEntries(characters.map((c) => [c.id, c]));
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
				alt="terrain"
				class="absolute inset-0 h-full w-full"
				style="opacity: {world.debug ? 0 : 1};"
			/>
		{/if}
		{#if world.planning.showGrid}
			<WorldPlanning width={terrainBody.width} height={terrainBody.height} />
		{/if}
		{#each buildings as building (building.id)}
			{@const body = world.buildingBodies[building.id]}
			{@const buildingData = $buildingStore.data[building.building_id]}
			{@const buildingStates = buildingData
				? ($buildingStateStore.data[buildingData.id] ?? [])
				: []}
			{@const buildingState = buildingStates.find((s) => s.type === 'idle')}
			{#if body && buildingState}
				<BuildingSpriteAnimator
					x={body.position.x}
					y={body.position.y}
					angle={body.position.angle}
					{buildingState}
				/>
			{/if}
		{/each}
		{#each characters as character (character.id)}
			{@const body = world.characterBodies[character.id]}
			{@const characterData = $characterStore.data[character.character_id]}
			{@const characterBody = characterData
				? $characterBodyStore.data[characterData.body_id]
				: undefined}
			{@const bodyStates = characterBody ? ($bodyStateStore.data[characterBody.id] ?? []) : []}
			{@const bodyState = bodyStates.find((s) => s.type === 'idle')}
			{@const faceStates = characterData ? ($faceStateStore.data[characterData.id] ?? []) : []}
			{@const faceState = faceStates.find((s) => s.type === 'idle')}
			{#if body && bodyState}
				<CharacterSpriteAnimator
					x={body.position.x}
					y={body.position.y}
					angle={body.position.angle}
					characterBodyState={bodyState}
					characterFaceState={faceState}
				/>
			{/if}
		{/each}
	</div>
	{@render children?.()}
</div>
