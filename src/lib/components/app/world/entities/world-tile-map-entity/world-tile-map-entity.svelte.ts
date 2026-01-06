import Matter from 'matter-js';
import { get } from 'svelte/store';
import type { WorldId, WorldTileMapVector, WorldTileMap } from '$lib/types';
import { CATEGORY_TERRAIN, TILE_SIZE } from '../../constants';
import { useWorldContext, useWorld } from '$lib/hooks/use-world';
import { useTerrain } from '$lib/hooks/use-terrain';
import type { BeforeUpdateEvent } from '../../context';

const { Bodies, Composite } = Matter;

export class WorldTileMapEntity {
	readonly id: WorldId;
	readonly type = 'tilemap' as const;

	// 타일 데이터를 $state로 관리
	data = $state<WorldTileMap['data']>({});

	// 타일별 바디를 관리하는 Map
	private bodies = new Map<WorldTileMapVector, Matter.Body>();

	protected readonly world = useWorldContext();

	constructor(id: WorldId) {
		this.id = id;

		// 스토어에서 데이터 조회 (초기값만)
		const worldTileMap = this.worldTileMap;
		if (!worldTileMap) {
			throw new Error(`Cannot create WorldTileMapEntity: missing data for id ${id}`);
		}

		this.bodies = this.createBodies(worldTileMap.data);
	}

	get worldTileMap(): WorldTileMap | undefined {
		return get(useWorld().worldTileMapStore).data[this.id];
	}

	get debug(): boolean {
		return this.world.debug;
	}

	// 여러 타일 바디 생성 (순수 함수)
	private createBodies(data: WorldTileMap['data']): Map<WorldTileMapVector, Matter.Body> {
		this.data = data;

		const { tileStore } = useTerrain();
		const tiles = get(tileStore).data;
		const newBodies = new Map<WorldTileMapVector, Matter.Body>();

		for (const [vector, tileData] of Object.entries(data)) {
			// 이미 bodies에 있으면 스킵
			if (this.bodies.has(vector as WorldTileMapVector)) continue;

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

	// 월드에 모든 타일 바디 추가 (data에 있는데 bodies에 없는 것들)
	addToWorld(): void {
		const allBodies = Composite.allBodies(this.world.engine.world);

		for (const body of this.bodies.values()) {
			const exists = allBodies.some((currentBody) => currentBody.label === body.label);

			if (!exists) {
				Composite.add(this.world.engine.world, body);
			}
		}
	}

	// 월드에서 모든 타일 바디 제거
	removeFromWorld(): void {
		const allBodies = Composite.allBodies(this.world.engine.world);
		const bodiesToRemove = allBodies.filter((body) => body.label.startsWith('tile-'));

		if (bodiesToRemove.length > 0) {
			Composite.remove(this.world.engine.world, bodiesToRemove);
		}
	}

	// 스토어 데이터 변경사항을 엔티티에 동기화
	sync(): void {
		const worldTileMap = this.worldTileMap;
		if (!worldTileMap) return;

		// data가 실제로 변경되었는지 체크 (참조 비교)
		if (this.data === worldTileMap.data) return;

		this.removeFromWorld();
		this.bodies = this.createBodies(worldTileMap.data);
		this.addToWorld();
	}

	// 디버그 모드 설정
	setDebug(debug: boolean): void {
		for (const body of this.bodies.values()) {
			body.render.visible = debug;
		}
	}

	// 업데이트 로직 (타일맵은 static이므로 비어있음)
	update(_: BeforeUpdateEvent): void {
		// TileMap은 static이므로 update 로직 없음
	}
}
