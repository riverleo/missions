<script lang="ts">
	import type { Terrain } from '$lib/types';
	import { useWorldContext } from '$lib/hooks/use-world';
	import { IconNorthStar } from '@tabler/icons-svelte';
	import { Tooltip, TooltipContent, TooltipTrigger } from '$lib/components/ui/tooltip';
	import { useTerrain } from '$lib/hooks/use-terrain';

	interface Props {
		terrain: Terrain;
	}

	let { terrain }: Props = $props();

	const { admin } = useTerrain();
	const uiStore = admin.uiStore;
	const world = useWorldContext();

	let isDragging = $state(false);
	let dragX = $state<number | undefined>(undefined);
	let dragY = $state<number | undefined>(undefined);

	// 현재 표시할 좌표 (드래그 중이면 드래그 좌표, 아니면 terrain 좌표)
	const currentX = $derived(isDragging && dragX != null ? dragX : terrain.respawn_x);
	const currentY = $derived(isDragging && dragY != null ? dragY : terrain.respawn_y);

	// 월드 좌표를 화면 좌표로 변환 (카메라 변환 적용)
	const left = $derived(
		currentX != null ? `${(currentX - world.camera.x) * world.camera.zoom}px` : undefined
	);
	const top = $derived(
		currentY != null ? `${(currentY - world.camera.y) * world.camera.zoom}px` : undefined
	);

	function onmousedown(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		isDragging = true;
		dragX = terrain.respawn_x ?? 0;
		dragY = terrain.respawn_y ?? 0;

		window.addEventListener('mousemove', onmousemove);
		window.addEventListener('mouseup', onmouseup);
	}

	function onmousemove(e: MouseEvent) {
		if (!isDragging) return;

		const container = (e.target as HTMLElement).closest('[data-slot="world-container"]');
		if (!container) return;

		const rect = container.getBoundingClientRect();
		dragX = ((e.clientX - rect.left) / rect.width) * terrain.width;
		dragY = ((e.clientY - rect.top) / rect.height) * terrain.height;

		// 범위 제한
		dragX = Math.max(0, Math.min(terrain.width, dragX));
		dragY = Math.max(0, Math.min(terrain.height, dragY));
	}

	async function onmouseup() {
		window.removeEventListener('mousemove', onmousemove);
		window.removeEventListener('mouseup', onmouseup);

		if (isDragging && dragX != null && dragY != null) {
			await admin.update(terrain.id, { respawn_x: dragX, respawn_y: dragY });
		}

		isDragging = false;
		dragX = undefined;
		dragY = undefined;
	}

	async function onclickOverlay(e: MouseEvent) {
		const target = e.currentTarget as HTMLElement;
		const rect = target.getBoundingClientRect();
		const x = ((e.clientX - rect.left) / rect.width) * terrain.width;
		const y = ((e.clientY - rect.top) / rect.height) * terrain.height;

		await admin.update(terrain.id, { respawn_x: x, respawn_y: y });
		admin.setSettingStartMarker(false);
	}
</script>

{#if left && top}
	<Tooltip>
		<TooltipTrigger
			class="absolute -translate-x-1/2 -translate-y-1/2 cursor-grab text-primary active:cursor-grabbing {isDragging
				? ''
				: 'animate-spin'}"
			style="left: {left}; top: {top};"
			{onmousedown}
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
