import type { WorldId, VectorKey, TileId } from '$lib/types';
import { EntityIdUtils } from '$lib/utils/entity-id';
import {
	CATEGORY_TILE,
	CATEGORY_BUILDING,
	CATEGORY_CHARACTER,
	CATEGORY_ITEM,
	CATEGORY_BOUNDARY,
	TILE_SIZE,
} from '$lib/constants';
import type { BeforeUpdateEvent, WorldContext } from '$lib/components/app/world/context';
import { Entity } from '../entity.svelte';
import { vectorUtils } from '$lib/utils/vector';

export class WorldTileEntity extends Entity {
	readonly type = 'tile' as const;
	readonly body: Matter.Body;
	readonly tileId: TileId;
	readonly tileX: number;
	readonly tileY: number;

	override get instanceId(): VectorKey {
		return EntityIdUtils.instanceId<VectorKey>(this.id);
	}

	constructor(worldContext: WorldContext, worldId: WorldId, vector: VectorKey, tileId: TileId) {
		super(worldContext, 'tile', worldId, vector);
		this.tileId = tileId;

		// 타일 좌표 파싱
		const coords = vector.split(',').map(Number);
		const tileX = coords[0];
		const tileY = coords[1];

		if (tileX === undefined || tileY === undefined) {
			throw new Error(`Invalid tile vector: ${vector}`);
		}

		this.tileX = tileX;
		this.tileY = tileY;

		// 타일 물리 바디 생성
		this.body = this.createBody(
			'rectangle',
			TILE_SIZE,
			TILE_SIZE,
			vectorUtils.tileIndexToPixel(tileX),
			vectorUtils.tileIndexToPixel(tileY),
			{
				isStatic: true,
				label: this.id,
				collisionFilter: {
					category: CATEGORY_TILE,
					mask: CATEGORY_BOUNDARY | CATEGORY_BUILDING | CATEGORY_CHARACTER | CATEGORY_ITEM,
				},
			}
		);
	}

	override addToWorld(): void {
		super.addToWorld();

		// pathfinder 전체 업데이트
		this.worldContext.pathfinder.update();
		this.worldContext.pathfinderUpdated++;
	}

	override removeFromWorld(): void {
		super.removeFromWorld();

		// pathfinder 전체 업데이트
		this.worldContext.pathfinder.update();
		this.worldContext.pathfinderUpdated++;
	}

	save(): void {
		// 타일은 스토어에서만 관리되므로 저장 로직 없음
	}

	update(_: BeforeUpdateEvent): void {
		// 타일은 static이므로 update 로직 없음
	}
}
