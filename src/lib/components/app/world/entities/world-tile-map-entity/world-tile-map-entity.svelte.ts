import Matter from 'matter-js';
import { get } from 'svelte/store';
import type { WorldId, WorldTileMapVector, WorldTileMap, ColliderType } from '$lib/types';
import { CATEGORY_TERRAIN, TILE_SIZE } from '../../constants';
import { useWorld } from '$lib/hooks/use-world';
import { useTerrain } from '$lib/hooks/use-terrain';
import type { BeforeUpdateEvent } from '../../context';
import { Entity } from '../entity.svelte';

const { Bodies, Composite } = Matter;

export class WorldTileMapEntity extends Entity {
	readonly id: WorldId;
	readonly type = 'tilemap' as const;
	readonly body: Map<WorldTileMapVector, Matter.Body>;

	// 타일 데이터를 $state로 관리
	data = $state<WorldTileMap['data']>({});

	constructor(id: WorldId) {
		super();
		this.id = id;

		// 스토어에서 데이터 조회 (초기값만)
		const worldTileMap = this.worldTileMap;
		if (!worldTileMap) {
			throw new Error(`Cannot create WorldTileMapEntity: missing data for id ${id}`);
		}

		this.data = worldTileMap.data;
		this.body = this.createBodies(worldTileMap.data);
	}

	get worldId(): WorldId {
		return this.id;
	}

	get worldTileMap(): WorldTileMap | undefined {
		return get(useWorld().worldTileMapStore).data[this.id];
	}

	// 여러 타일 바디 생성 (순수 함수)
	private createBodies(data: WorldTileMap['data']): Map<WorldTileMapVector, Matter.Body> {
		const { tileStore } = useTerrain();
		const tiles = get(tileStore).data;
		const newBodies = new Map<WorldTileMapVector, Matter.Body>();

		for (const [vector, tileData] of Object.entries(data)) {
			const coords = vector.split(',').map(Number);
			const tileX = coords[0];
			const tileY = coords[1];

			if (tileX === undefined || tileY === undefined) continue;

			const tile = tiles[tileData.tile_id];
			if (!tile) continue;

			// 타일 중심 좌표 계산
			const centerX = tileX * TILE_SIZE + TILE_SIZE / 2;
			const centerY = tileY * TILE_SIZE + TILE_SIZE / 2;

			// 타일 물리 바디 생성
			const tileBody = Bodies.rectangle(centerX, centerY, TILE_SIZE, TILE_SIZE, {
				isStatic: true,
				label: `tile-${vector}`,
				collisionFilter: {
					category: CATEGORY_TERRAIN,
					mask: 0xffffffff,
				},
				render: {
					visible: this.debug,
				},
			});

			newBodies.set(vector as WorldTileMapVector, tileBody);
		}

		return newBodies;
	}

	// 월드에 모든 타일 바디 추가
	addToWorld(): void {
		const bodiesToAdd = Array.from(this.body.values()).filter(
			(body) => !Composite.get(this.world.engine.world, body.id, 'body')
		);

		if (bodiesToAdd.length > 0) {
			Composite.add(this.world.engine.world, bodiesToAdd);
		}
	}

	// 월드에서 모든 타일 바디 제거
	removeFromWorld(): void {
		Composite.remove(this.world.engine.world, Array.from(this.body.values()));
	}

	// 스토어 데이터 변경사항을 엔티티에 동기화
	sync(): void {
		const worldTileMap = this.worldTileMap;
		if (!worldTileMap) return;

		// data가 실제로 변경되었는지 체크 (참조 비교)
		if (this.data === worldTileMap.data) return;

		this.removeFromWorld();

		// data 업데이트
		this.data = worldTileMap.data;

		// body Map 내용을 새로 생성된 것으로 교체
		const newBodies = this.createBodies(worldTileMap.data);
		this.body.clear();
		for (const [vector, body] of newBodies.entries()) {
			this.body.set(vector, body);
		}

		this.addToWorld();
	}

	// 디버그 모드 설정
	setDebug(debug: boolean): void {
		for (const body of this.body.values()) {
			body.render.visible = debug;
		}
	}

	// 스토어에 저장 (WorldTileMapEntity는 저장 불필요)
	saveToStore(): void {
		// TileMap은 스토어에서만 관리되므로 저장 로직 없음
	}

	// 업데이트 로직 (타일맵은 static이므로 비어있음)
	update(_: BeforeUpdateEvent): void {
		// TileMap은 static이므로 update 로직 없음
	}
}
