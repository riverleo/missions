<script lang="ts">
	import type { TileCellKey, WorldId } from '$lib/types';
	import { TILE_SIZE } from '$lib/constants';
	import { calculate } from '$lib/utils/bitmask';
	import { EntityIdUtils } from '$lib/utils/entity-id';
	import { vectorUtils } from '$lib/utils/vector';
	import { useWorldContext } from '$lib/hooks/use-world';
	import QuarterTileCell from './quarter-tile-cell.svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	interface Props extends HTMLAttributes<HTMLDivElement> {
		worldId: WorldId;
		tileX: number;
		tileY: number;
		opacity?: number;
		overlapping?: boolean;
	}

	let { worldId, tileX, tileY, overlapping, style, ...restProps }: Props = $props();

	const context = useWorldContext();

	// 타일 좌표에 타일이 있는지 체크 (cursor 포함)
	const checkTile = (tx: number, ty: number): boolean => {
		if (!context) return false;

		// 실제 엔티티 체크
		const tileCellKey: TileCellKey = vectorUtils.createTileCellKey(tx, ty);
		const tileId = EntityIdUtils.createId('tile', worldId, tileCellKey);
		if (context.entities[tileId]) return true;

		// Cursor 체크 (타일 cursor의 범위 내에 있으면 true)
		const cursor = context.blueprint.cursor;
		if (cursor && cursor.type === 'tile') {
			const tileCells = context.blueprint.getTileCellsFromStart();
			// tileCells는 이미 타일 셀 좌표
			return tileCells.some((tileCell) => tileCell.col === tx && tileCell.row === ty);
		}

		return false;
	};

	// 4개 quarter의 bitmask 계산
	// 스프라이트 기준: bit 0=현재, bit 1=인접1, bit 2=인접2, bit 3=대각선
	// 중요: 대각선(bit 3)은 양쪽 인접(bit 1, 2)이 모두 있을 때만 체크
	const bitmasks = $derived.by(() => {
		const current = checkTile(tileX, tileY);
		const left = checkTile(tileX - 1, tileY);
		const right = checkTile(tileX + 1, tileY);
		const top = checkTile(tileX, tileY - 1);
		const bottom = checkTile(tileX, tileY + 1);
		const topLeft = checkTile(tileX - 1, tileY - 1);
		const topRight = checkTile(tileX + 1, tileY - 1);
		const bottomLeft = checkTile(tileX - 1, tileY + 1);
		const bottomRight = checkTile(tileX + 1, tileY + 1);

		return {
			// Top-Left quarter (0°): 현재, 왼쪽, 위, 왼쪽위
			// 대각선은 left && top일 때만 체크
			'top-left': calculate(current, left, top, left && top ? topLeft : false),

			// Top-Right quarter (90° CW): 현재, 위, 오른쪽, 오른쪽위
			// 대각선은 top && right일 때만 체크
			'top-right': calculate(current, top, right, top && right ? topRight : false),

			// Bottom-Right quarter (180°): 현재, 오른쪽, 아래, 오른쪽아래
			// 대각선은 right && bottom일 때만 체크
			'bottom-right': calculate(current, right, bottom, right && bottom ? bottomRight : false),

			// Bottom-Left quarter (270° CW): 현재, 아래, 왼쪽, 왼쪽아래
			// 대각선은 bottom && left일 때만 체크
			'bottom-left': calculate(current, bottom, left, bottom && left ? bottomLeft : false),
		};
	});
</script>

<!-- 타일 컨테이너 -->
<div
	class="absolute"
	style="left: {tileX * TILE_SIZE}px; top: {tileY *
		TILE_SIZE}px; width: {TILE_SIZE}px; height: {TILE_SIZE}px; {overlapping !== undefined
		? `background-color: ${overlapping ? 'rgba(239, 68, 68, 0.8)' : 'rgba(255, 255, 255, 0.8)'};`
		: ''} {style}"
	role="button"
	tabindex="-1"
	{...restProps}
>
	<!-- 4개 quarter의 bitmask 번호 표시 -->
	<QuarterTileCell placement="top-left" {bitmasks} />
	<QuarterTileCell placement="top-right" {bitmasks} />
	<QuarterTileCell placement="bottom-left" {bitmasks} />
	<QuarterTileCell placement="bottom-right" {bitmasks} />
</div>
