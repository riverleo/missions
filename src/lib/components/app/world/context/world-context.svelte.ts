import Matter from 'matter-js';
import { get } from 'svelte/store';
import type {
	Supabase,
	Terrain,
	WorldCharacter,
	WorldCharacterId,
	WorldBuilding,
	WorldBuildingId,
	WorldItem,
	WorldItemId,
	WorldId,
} from '$lib/types';
import { useWorld } from '$lib/hooks/use-world';
import { useTerrain } from '$lib/hooks/use-terrain';
import { Camera } from '../camera.svelte';
import { WorldEvent } from '../world-event.svelte';
import { TerrainBody } from '../terrain-body.svelte';
import { WorldBuildingEntity } from '../entities/world-building-entity';
import { WorldCharacterEntity } from '../entities/world-character-entity';
import { WorldItemEntity } from '../entities/world-item-entity';
import { Entity } from '../entities/entity.svelte';
import { WorldContextBlueprint } from './world-context-blueprint.svelte';
import { WORLD_WIDTH, WORLD_HEIGHT } from '../constants';

const { Engine, Runner, Render, Mouse, MouseConstraint, Composite, Body } = Matter;

export class WorldContext {
	readonly engine: Matter.Engine;
	readonly runner: Matter.Runner;
	readonly camera: Camera;
	readonly event: WorldEvent;
	readonly terrainBody = new TerrainBody();
	readonly worldId: WorldId;
	readonly blueprint: WorldContextBlueprint;

	entities = $state<Record<string, Entity>>({});

	debug = $state(false);
	initialized = $state(false);
	render: Matter.Render | undefined = $state.raw(undefined);
	mouseConstraint: Matter.MouseConstraint | undefined = $state.raw(undefined);
	oncamerachange: ((camera: Camera) => void) | undefined;

	private respawningWorldCharacterIds = new Set<WorldCharacterId>();

	constructor(worldId: WorldId, debug: boolean = false) {
		this.debug = debug;
		this.worldId = worldId;
		this.engine = Engine.create();
		this.runner = Runner.create();
		this.camera = new Camera(this);
		this.event = new WorldEvent(this, this.camera);
		this.blueprint = new WorldContextBlueprint(this);
	}

	private get terrain(): Terrain | null | undefined {
		const world = get(useWorld().worldStore).data[this.worldId];
		if (!world?.terrain_id) return null;
		return get(useTerrain().store).data[world.terrain_id];
	}

	// debug 변경 시 모든 엔티티 업데이트
	setDebugEntities(debug: boolean) {
		this.terrainBody.setDebug(debug);
		for (const entity of Object.values(this.entities)) {
			entity.setDebug(debug);
		}
	}

	// 마우스 클릭 처리
	private handleMouseDown(event: Matter.IEvent<Matter.MouseConstraint>) {
		const { setSelectedEntityId, selectedEntityStore } = useWorld();
		const selectedEntityId = get(selectedEntityStore).entityId;

		// 마우스 위치에서 모든 body 찾기 (건물 포함)
		if (!this.mouseConstraint?.mouse) return;
		const mousePosition = this.mouseConstraint.mouse.position;
		const bodies = Matter.Query.point(Composite.allBodies(this.engine.world), mousePosition);

		// 엔티티 바디만 필터링 (지형 제외)
		const entityBody = bodies.find((body) => this.entities[body.label]);

		if (!entityBody) {
			// 빈 공간이나 지형 클릭 시 선택 해제
			setSelectedEntityId(undefined);
			return;
		}

		// 클릭한 바디의 엔티티 찾기
		const entity = this.entities[entityBody.label];
		if (entity) {
			// 이미 선택된 엔티티를 다시 클릭하면 해제
			if (selectedEntityId?.value === entity.id && selectedEntityId?.type === entity.type) {
				setSelectedEntityId(undefined);
			} else {
				setSelectedEntityId({ value: entity.id, type: entity.type });
			}
		}
	}

	// 월드 로드, cleanup 함수 반환
	load({
		element,
		width = WORLD_WIDTH,
		height = WORLD_HEIGHT,
	}: {
		element: HTMLDivElement;
		width?: number;
		height?: number;
	}) {
		this.render = Render.create({
			element,
			engine: this.engine,
			options: {
				width,
				height,
				wireframes: false,
				background: 'transparent',
				hasBounds: true,
			},
		});

		const mouse = Mouse.create(this.render.canvas);
		this.mouseConstraint = MouseConstraint.create(this.engine, {
			mouse,
			constraint: {
				stiffness: 0.8,
				damping: 0.2,
				render: { visible: false },
			},
			collisionFilter: {
				// static 바디(건물)는 선택 안 되도록 CATEGORY_BUILDING 제외
				mask: 0xffffffff & ~0x0008,
			},
		});

		this.render.mouse = mouse;
		this.initialized = true;

		// 지형 및 엔티티 로드
		this.reload();

		// 렌더링 시작
		Render.run(this.render);

		// 물리 시뮬레이션 시작
		Matter.Events.on(this.engine, 'beforeUpdate', () => this.checkWorldCharacterBounds());
		Matter.Events.on(this.engine, 'afterUpdate', () => this.updateWorldCharacterEntityPositions());

		// 마우스 클릭 감지
		Matter.Events.on(this.mouseConstraint, 'mousedown', (event) => {
			this.handleMouseDown(event);
		});

		Runner.run(this.runner, this.engine);

		return () => {
			this.initialized = false;
			Runner.stop(this.runner);
			Engine.clear(this.engine);

			if (this.render) {
				Render.stop(this.render);
				this.render.canvas.remove();
			}
		};
	}

	reload() {
		if (!this.initialized) {
			console.warn('Cannot reload terrain: WorldContext not initialized');
			return;
		}

		if (!this.terrain) {
			console.warn('Cannot reload terrain: No terrain found');
			return;
		}

		// 기존 bodies 제거
		Composite.clear(this.engine.world, false);

		// 지형 로드
		this.terrainBody.load(this.terrain).then(() => {
			if (this.terrainBody.bodies.length > 0) {
				Composite.add(this.engine.world, this.terrainBody.bodies);
				this.terrainBody.setDebug(this.debug);
			}

			// 엔티티 바디 재추가
			for (const entity of Object.values(this.entities)) {
				entity.addToWorld();
			}

			// mouseConstraint 재추가
			if (this.mouseConstraint) {
				Composite.add(this.engine.world, this.mouseConstraint);
			}

			this.updateRenderBounds();
		});
	}

	// Matter.js render bounds 업데이트 및 카메라 변경 알림
	updateRenderBounds() {
		const { render, terrainBody, camera } = this;
		if (!render || terrainBody.width === 0 || terrainBody.height === 0) return;

		const viewWidth = terrainBody.width / camera.zoom;
		const viewHeight = terrainBody.height / camera.zoom;

		render.bounds.min.x = camera.x;
		render.bounds.min.y = camera.y;
		render.bounds.max.x = camera.x + viewWidth;
		render.bounds.max.y = camera.y + viewHeight;

		// Mouse 좌표 변환 업데이트
		if (this.mouseConstraint?.mouse) {
			Mouse.setOffset(this.mouseConstraint.mouse, { x: camera.x, y: camera.y });
			Mouse.setScale(this.mouseConstraint.mouse, { x: 1 / camera.zoom, y: 1 / camera.zoom });
		}

		this.oncamerachange?.(camera);
	}

	// 엔티티 동기화
	syncEntities(
		worldCharacters: Record<WorldCharacterId, WorldCharacter>,
		worldBuildings: Record<WorldBuildingId, WorldBuilding>,
		worldItems: Record<WorldItemId, WorldItem>
	) {
		// 제거될 엔티티들 cleanup
		for (const entity of Object.values(this.entities)) {
			const isCharacterRemoved =
				entity.type === 'character' && !worldCharacters[entity.id as WorldCharacterId];
			const isBuildingRemoved =
				entity.type === 'building' && !worldBuildings[entity.id as WorldBuildingId];
			const isItemRemoved = entity.type === 'item' && !worldItems[entity.id as WorldItemId];

			if (isCharacterRemoved || isBuildingRemoved || isItemRemoved) {
				entity.removeFromWorld();
				delete this.entities[entity.id];
			}
		}

		// 새 캐릭터 엔티티 추가
		for (const character of Object.values(worldCharacters)) {
			if (!this.entities[character.id]) {
				try {
					const entity = new WorldCharacterEntity(character.id);
					entity.addToWorld();
					this.entities[character.id] = entity;
				} catch (error) {
					console.warn('Skipping character creation:', error);
				}
			}
		}

		// 새 건물 엔티티 추가
		for (const building of Object.values(worldBuildings)) {
			if (!this.entities[building.id]) {
				try {
					const entity = new WorldBuildingEntity(building.id);
					entity.addToWorld();
					this.entities[building.id] = entity;
				} catch (error) {
					console.warn('Skipping building creation:', error);
				}
			}
		}

		// 새 아이템 엔티티 추가
		for (const item of Object.values(worldItems)) {
			if (!this.entities[item.id]) {
				try {
					const entity = new WorldItemEntity(item.id);
					entity.addToWorld();
					this.entities[item.id] = entity;
				} catch (error) {
					console.warn('Skipping item creation:', error);
				}
			}
		}
	}

	// Matter.js body 위치를 엔티티 state에 동기화
	private updateWorldCharacterEntityPositions() {
		for (const entity of Object.values(this.entities)) {
			if (entity.type === 'character' || entity.type === 'item') {
				entity.updatePosition();
			}
		}
	}

	// 바디가 경계를 벗어나면 제거 후 0.2초 뒤 리스폰 위치에 다시 추가
	private checkWorldCharacterBounds() {
		const { width, height } = this.terrainBody;
		if (width === 0 || height === 0) return;

		for (const entity of Object.values(this.entities)) {
			if (
				entity.type === 'character' &&
				this.isOutOfWorldCharacterEntityBounds(entity as WorldCharacterEntity)
			) {
				this.respawnWorldCharacterEntity(entity.id as WorldCharacterId);
			}
		}
	}

	private isOutOfWorldCharacterEntityBounds(worldCharacterEntity: WorldCharacterEntity) {
		const characterBody = worldCharacterEntity.characterBody;
		if (!characterBody) return false;

		const halfWidth = characterBody.width / 2;
		const halfHeight = characterBody.height / 2;
		const { x, y } = worldCharacterEntity.body.position;

		return (
			x - halfWidth < 0 ||
			x + halfWidth > this.terrainBody.width ||
			y - halfHeight < 0 ||
			y + halfHeight > this.terrainBody.height
		);
	}

	private respawnWorldCharacterEntity(worldCharacterId: WorldCharacterId) {
		if (this.respawningWorldCharacterIds.has(worldCharacterId)) return;
		this.respawningWorldCharacterIds.add(worldCharacterId);

		const worldCharacterEntity = this.entities[worldCharacterId] as WorldCharacterEntity;
		if (!worldCharacterEntity) return;

		// world에서만 제거 (엔티티는 유지)
		worldCharacterEntity.removeFromWorld();

		// 1초 후 리스폰 위치로 다시 추가
		setTimeout(() => {
			const x = this.terrain?.start_x ?? 0;
			const y = this.terrain?.start_y ?? 0;

			// Body 위치 재설정
			Body.setPosition(worldCharacterEntity.body, { x, y });

			// position state 업데이트
			worldCharacterEntity.x = x;
			worldCharacterEntity.y = y;
			worldCharacterEntity.angle = 0;

			// 다시 world에 추가
			worldCharacterEntity.addToWorld();

			this.respawningWorldCharacterIds.delete(worldCharacterId);
		}, 1000);
	}
}
