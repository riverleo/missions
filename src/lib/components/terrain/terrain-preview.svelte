<script lang="ts">
	import { useTerrain } from '$lib/hooks';
	import type { Terrain } from '$lib/types';
	import { IconNorthStar } from '@tabler/icons-svelte';
	import { Tooltip, TooltipContent, TooltipTrigger } from '$lib/components/ui/tooltip';

	interface Props {
		terrain: Terrain;
		terrainAssetUrl: string | undefined;
	}

	let { terrain, terrainAssetUrl }: Props = $props();

	const { admin } = useTerrain();
	const uiStore = admin.terrainUiStore;

	let containerRef = $state<HTMLDivElement | undefined>(undefined);
	let isDragging = $state(false);
	let dragX = $state<number | undefined>(undefined);
	let dragY = $state<number | undefined>(undefined);

	// 현재 표시할 좌표 (드래그 중이면 드래그 좌표, 아니면 terrain 좌표)
	const currentX = $derived(isDragging && dragX != null ? dragX : terrain.respawn_x);
	const currentY = $derived(isDragging && dragY != null ? dragY : terrain.respawn_y);

	// 픽셀 좌표로 표시
	const left = $derived(currentX != null ? `${currentX}px` : undefined);
	const top = $derived(currentY != null ? `${currentY}px` : undefined);

	function onmousedownMarker(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		isDragging = true;
		dragX = terrain.respawn_x ?? 0;
		dragY = terrain.respawn_y ?? 0;

		window.addEventListener('mousemove', onmousemove);
		window.addEventListener('mouseup', onmouseup);
	}

	function onmousemove(e: MouseEvent) {
		if (!isDragging || !containerRef) return;

		const rect = containerRef.getBoundingClientRect();
		dragX = Math.max(0, Math.min(terrain.width, e.clientX - rect.left));
		dragY = Math.max(0, Math.min(terrain.height, e.clientY - rect.top));
	}

	async function onmouseup() {
		window.removeEventListener('mousemove', onmousemove);
		window.removeEventListener('mouseup', onmouseup);

		if (isDragging && dragX != null && dragY != null) {
			await admin.updateTerrain(terrain.id, { respawn_x: dragX, respawn_y: dragY });
		}

		isDragging = false;
		dragX = undefined;
		dragY = undefined;
	}

	async function onclickOverlay(e: MouseEvent) {
		if (!containerRef) return;

		const rect = containerRef.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;

		await admin.updateTerrain(terrain.id, { respawn_x: x, respawn_y: y });
		admin.setSettingStartMarker(false);
	}
</script>

<div
	bind:this={containerRef}
	class="relative overflow-hidden border border-border"
	style="width: {terrain.width}px; height: {terrain.height}px;"
>
	{#if terrainAssetUrl}
		<img src={terrainAssetUrl} class="absolute inset-0 h-full w-full" alt={terrain.title} />
	{/if}

	{#if left && top}
		<Tooltip>
			<TooltipTrigger
				class="absolute -translate-x-1/2 -translate-y-1/2 cursor-grab text-primary active:cursor-grabbing {isDragging
					? ''
					: 'animate-spin'}"
				style="left: {left}; top: {top};"
				onmousedown={onmousedownMarker}
			>
				<IconNorthStar class="size-4" />
			</TooltipTrigger>
			<TooltipContent>리스폰 위치</TooltipContent>
		</Tooltip>
	{/if}

	{#if $uiStore.isSettingStartMarker}
		<button
			type="button"
			class="absolute inset-0 cursor-crosshair bg-transparent"
			aria-label="리스폰 위치 설정"
			onclick={onclickOverlay}
		></button>
	{/if}
</div>
