import type { WorldId, TileVector, TileId } from '$lib/types';
import { CATEGORY_TILE, TILE_SIZE } from '$lib/components/app/world/constants';
import type { BeforeUpdateEvent } from '$lib/components/app/world/context';
import { tileToCenterPixel } from '$lib/components/app/world/tiles';
import { Entity } from '../entity.svelte';

export class WorldTileEntity extends Entity {
	readonly id: TileVector;
	readonly type = 'tile' as const;
	readonly body: Matter.Body;
	readonly _worldId: WorldId;
	readonly tileId: TileId;

	constructor(worldId: WorldId, vector: TileVector, tileId: TileId) {
		super();
		this.id = vector;
		this._worldId = worldId;
		this.tileId = tileId;

		// 타일 좌표 파싱
		const coords = this.id.split(',').map(Number);
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
			tileToCenterPixel(tileX),
			tileToCenterPixel(tileY),
			{
				isStatic: true,
				label: this.id,
				collisionFilter: {
					category: CATEGORY_TILE,
					mask: 0xffffffff,
				},
			}
		);
	}

	get worldId(): WorldId {
		return this._worldId;
	}

	sync(): void {
		// 타일은 정적이므로 동기화 로직 없음
	}

	saveToStore(): void {
		// 타일은 스토어에서만 관리되므로 저장 로직 없음
	}

	update(_: BeforeUpdateEvent): void {
		// 타일은 static이므로 update 로직 없음
	}
}
