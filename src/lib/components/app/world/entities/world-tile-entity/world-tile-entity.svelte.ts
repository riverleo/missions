import type { WorldId, TileVector, TileId } from '$lib/types';
import { EntityIdUtils } from '$lib/utils/entity-id';
import {
	CATEGORY_TILE,
	CATEGORY_BUILDING,
	CATEGORY_CHARACTER,
	CATEGORY_ITEM,
	CATEGORY_WALL,
	TILE_SIZE,
} from '$lib/constants';
import type { BeforeUpdateEvent, WorldContext } from '$lib/components/app/world/context';
import { toPixel } from '$lib/utils/vector';
import { Entity } from '../entity.svelte';

export class WorldTileEntity extends Entity {
	readonly type = 'tile' as const;
	readonly body: Matter.Body;
	readonly tileId: TileId;

	override get instanceId(): TileVector {
		return EntityIdUtils.instanceId<TileVector>(this.id);
	}

	constructor(worldContext: WorldContext, worldId: WorldId, vector: TileVector, tileId: TileId) {
		super(worldContext, 'tile', worldId, vector);
		this.tileId = tileId;

		// 타일 좌표 파싱
		const coords = vector.split(',').map(Number);
		const tileX = coords[0];
		const tileY = coords[1];

		if (tileX === undefined || tileY === undefined) {
			throw new Error(`Invalid tile vector: ${vector}`);
		}

		// 타일 물리 바디 생성
		this.body = this.createBody(
			'rectangle',
			TILE_SIZE,
			TILE_SIZE,
			toPixel(tileX, TILE_SIZE),
			toPixel(tileY, TILE_SIZE),
			{
				isStatic: true,
				label: this.id,
				collisionFilter: {
					category: CATEGORY_TILE,
					mask: CATEGORY_WALL | CATEGORY_BUILDING | CATEGORY_CHARACTER | CATEGORY_ITEM,
				},
			}
		);
	}

	save(): void {
		// 타일은 스토어에서만 관리되므로 저장 로직 없음
	}

	update(_: BeforeUpdateEvent): void {
		// 타일은 static이므로 update 로직 없음
	}
}
