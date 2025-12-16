<script lang="ts">
	import type { Terrain } from '$lib/types';
	import { VIEW_BOX_WIDTH, VIEW_BOX_HEIGHT } from '$lib/components/app/world/constants';
	import { IconNorthStar } from '@tabler/icons-svelte';
	import { Tooltip, TooltipContent, TooltipTrigger } from '$lib/components/ui/tooltip';
	import { useTerrain } from '$lib/hooks/use-terrain';

	interface Props {
		terrain: Terrain;
	}

	let { terrain }: Props = $props();

	const { admin } = useTerrain();
	const uiStore = admin.uiStore;

	let isDragging = $state(false);
	let dragX = $state<number | undefined>(undefined);
	let dragY = $state<number | undefined>(undefined);

	// 현재 표시할 좌표 (드래그 중이면 드래그 좌표, 아니면 terrain 좌표)
	const currentX = $derived(isDragging && dragX != null ? dragX : terrain.start_x);
	const currentY = $derived(isDragging && dragY != null ? dragY : terrain.start_y);

	// viewBox 좌표를 퍼센트로 변환
	const left = $derived(currentX != null ? `${(currentX / VIEW_BOX_WIDTH) * 100}%` : undefined);
	const top = $derived(currentY != null ? `${(currentY / VIEW_BOX_HEIGHT) * 100}%` : undefined);

	function onmousedown(e: MouseEvent) {
		e.preventDefault();
		isDragging = true;
		dragX = terrain.start_x ?? 0;
		dragY = terrain.start_y ?? 0;

		window.addEventListener('mousemove', onmousemove);
		window.addEventListener('mouseup', onmouseup);
	}

	function onmousemove(e: MouseEvent) {
		if (!isDragging) return;

		const container = (e.target as HTMLElement).closest('[data-slot="world-container"]');
		if (!container) return;

		const rect = container.getBoundingClientRect();
		dragX = ((e.clientX - rect.left) / rect.width) * VIEW_BOX_WIDTH;
		dragY = ((e.clientY - rect.top) / rect.height) * VIEW_BOX_HEIGHT;

		// 범위 제한
		dragX = Math.max(0, Math.min(VIEW_BOX_WIDTH, dragX));
		dragY = Math.max(0, Math.min(VIEW_BOX_HEIGHT, dragY));
	}

	async function onmouseup() {
		window.removeEventListener('mousemove', onmousemove);
		window.removeEventListener('mouseup', onmouseup);

		if (isDragging && dragX != null && dragY != null) {
			await admin.update(terrain.id, { start_x: dragX, start_y: dragY });
		}

		isDragging = false;
		dragX = undefined;
		dragY = undefined;
	}

	async function onclickOverlay(e: MouseEvent) {
		const target = e.currentTarget as HTMLElement;
		const rect = target.getBoundingClientRect();
		const x = ((e.clientX - rect.left) / rect.width) * VIEW_BOX_WIDTH;
		const y = ((e.clientY - rect.top) / rect.height) * VIEW_BOX_HEIGHT;

		await admin.update(terrain.id, { start_x: x, start_y: y });
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
		<TooltipContent>시작 위치</TooltipContent>
	</Tooltip>
{/if}

{#if $uiStore.isSettingStartMarker}
	<button
		type="button"
		class="absolute inset-0 cursor-crosshair bg-transparent"
		aria-label="시작 위치 설정"
		onclick={onclickOverlay}
	></button>
{/if}
