<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import 'pathseg';
	import type { WorldCharacter, WorldBuilding } from '$lib/types';
	import { useWorld } from '$lib/hooks/use-world.svelte';
	import CharacterSpriteAnimator from './character-sprite-animator.svelte';
	import BuildingSpriteAnimator from './building-sprite-animator.svelte';
	import WorldPlanning from './world-planning.svelte';

	interface Props {
		width: number;
		height: number;
		characters?: WorldCharacter[];
		buildings?: WorldBuilding[];
		children?: Snippet;
	}

	let { width, height, characters = [], buildings = [], children }: Props = $props();

	const world = useWorld();
	const { terrainBody, camera, event } = world;

	let container: HTMLDivElement;

	// 카메라 줌 핸들러
	function onwheel(e: WheelEvent) {
		e.preventDefault();
		camera.applyZoom(e.deltaY, e.clientX, e.clientY);
	}

	// characters/buildings prop을 world에 동기화 (id가 변경되었을 때만)
	let prevCharacterIds = '';
	$effect(() => {
		const ids = characters.map((c) => c.id).join(',');
		if (ids !== prevCharacterIds) {
			prevCharacterIds = ids;
			world.characters = Object.fromEntries(characters.map((c) => [c.id, c]));
		}
	});

	let prevBuildingIds = '';
	$effect(() => {
		const ids = buildings.map((b) => b.id).join(',');
		if (ids !== prevBuildingIds) {
			prevBuildingIds = ids;
			world.buildings = Object.fromEntries(buildings.map((b) => [b.id, b]));
		}
	});

	onMount(() => world.mount(container));
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
	bind:this={container}
	data-slot="world-container"
	class="relative overflow-hidden border border-border"
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
			{#if body}
				<BuildingSpriteAnimator
					worldBuilding={building}
					x={body.position.x}
					y={body.position.y}
					angle={body.position.angle}
				/>
			{/if}
		{/each}
		{#each characters as character (character.id)}
			{@const body = world.characterBodies[character.id]}
			{#if body}
				<CharacterSpriteAnimator
					worldCharacter={character}
					x={body.position.x}
					y={body.position.y}
					angle={body.position.angle}
				/>
			{/if}
		{/each}
	</div>
	{@render children?.()}
</div>
