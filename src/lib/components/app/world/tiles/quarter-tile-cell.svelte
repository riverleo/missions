<script lang="ts">
	import { CELL_SIZE } from '$lib/constants';

	type Placement = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

	interface Props {
		placement: Placement;
		bitmasks: Record<Placement, number>;
		isHovered?: boolean;
	}

	let { placement, bitmasks, isHovered = false }: Props = $props();

	const bitmask = $derived(bitmasks[placement]);

	const rotation = $derived.by(() => {
		switch (placement) {
			case 'top-left':
				return 0;
			case 'top-right':
				return 90;
			case 'bottom-left':
				return 270;
			case 'bottom-right':
				return 180;
		}
	});

	const left = $derived.by(() => {
		switch (placement) {
			case 'top-left':
			case 'bottom-left':
				return 0;
			case 'top-right':
			case 'bottom-right':
				return CELL_SIZE;
		}
	});

	const top = $derived.by(() => {
		switch (placement) {
			case 'top-left':
			case 'top-right':
				return 0;
			case 'bottom-left':
			case 'bottom-right':
				return CELL_SIZE;
		}
	});

	// 라운딩 필요 여부 체크
	// bitmask 1: 현재만 (외곽 코너)
	// bitmask 7: 양쪽 인접 있지만 대각선 없음 (안쪽 코너)
	// bitmask 9: 대각선만 (외곽 코너) - 이론상 불가능하지만 체크
	const rounding = $derived(bitmask === 1 || bitmask === 7 || bitmask === 9);
</script>

<div
	class="absolute"
	style="left: {left}px; top: {top}px; width: {CELL_SIZE}px; height: {CELL_SIZE}px; transform: rotate({rotation}deg);"
>
	<!-- 더미 타일: bitmask를 4개 작은 사각형으로 시각화 -->
	<!-- bit 0 (1) = 현재 (중앙), bit 1 (2) = 인접1, bit 2 (4) = 인접2, bit 3 (8) = 대각선 -->
	<svg width={CELL_SIZE} height={CELL_SIZE} viewBox="0 0 8 8">
		<!-- bit 0: 현재 셀 (중앙 오른쪽 아래) - 빨간색 or 보라색(라운딩) -->
		{#if bitmask & 1}
			<rect
				x="4"
				y="4"
				width="4"
				height="4"
				fill={rounding ? 'rgba(168, 85, 247, 0.8)' : 'rgba(239, 68, 68, 0.8)'}
			/>
		{/if}

		<!-- bit 1: 인접 1 (왼쪽 아래) - 초록색 or 보라색(라운딩) -->
		{#if bitmask & 2}
			<rect
				x="0"
				y="4"
				width="4"
				height="4"
				fill={rounding ? 'rgba(168, 85, 247, 0.8)' : 'rgba(34, 197, 94, 0.8)'}
			/>
		{/if}

		<!-- bit 2: 인접 2 (오른쪽 위) - 파란색 or 보라색(라운딩) -->
		{#if bitmask & 4}
			<rect
				x="4"
				y="0"
				width="4"
				height="4"
				fill={rounding ? 'rgba(168, 85, 247, 0.8)' : 'rgba(59, 130, 246, 0.8)'}
			/>
		{/if}

		<!-- bit 3: 인접 3 (왼쪽 위, 대각선) - 노란색 or 보라색(라운딩) -->
		{#if bitmask & 8}
			<rect
				x="0"
				y="0"
				width="4"
				height="4"
				fill={rounding ? 'rgba(168, 85, 247, 0.8)' : 'rgba(234, 179, 8, 0.8)'}
			/>
		{/if}
	</svg>

	<!-- 디버그: bitmask 번호 표시 (호버 시에만, 회전 없음) -->
	{#if isHovered}
		<div
			class="absolute inset-0 flex items-center justify-center text-[6px] font-bold text-white"
			style="transform: rotate({-rotation}deg);"
		>
			{bitmask}
		</div>
	{/if}
</div>
