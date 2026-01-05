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
	EntityId,
} from '$lib/types';
import { EntityIdUtils } from '$lib/utils/entity-id';
import { useWorld } from '$lib/hooks/use-world';
import { useTerrain } from '$lib/hooks/use-terrain';
import { Camera } from '../camera.svelte';
import { WorldEvent } from '../world-event.svelte';
import { WorldBuildingEntity } from '../entities/world-building-entity';
import { WorldCharacterEntity } from '../entities/world-character-entity';
import { WorldItemEntity } from '../entities/world-item-entity';
import { Entity } from '../entities/entity.svelte';
import type { BeforeUpdateEvent } from './index';
import { WorldContextBlueprint } from './world-context-blueprint.svelte';
import { Pathfinder } from '../pathfinder';
import { WORLD_WIDTH, WORLD_HEIGHT, WALL_THICKNESS, CATEGORY_WALL } from '../constants';

const { Engine, Runner, Render, Mouse, MouseConstraint, Composite, Body, Bodies } = Matter;

export class WorldContext {
	readonly engine: Matter.Engine;
	readonly runner: Matter.Runner;
	readonly camera: Camera;
	readonly event: WorldEvent;
	readonly worldId: WorldId;
	readonly blueprint: WorldContextBlueprint;
	readonly pathfinder: Pathfinder;

	entities = $state<Record<string, Entity>>({});

	debug = $state(false);
	initialized = $state(false);
	render: Matter.Render | undefined = $state.raw(undefined);
	mouseConstraint: Matter.MouseConstraint | undefined = $state.raw(undefined);
	oncamerachange: ((camera: Camera) => void) | undefined;

	private respawningEntityIds = new Set<EntityId>();

	constructor(worldId: WorldId, debug: boolean = false) {
		this.debug = debug;
		this.worldId = worldId;
		this.engine = Engine.create();
		this.runner = Runner.create();
		this.camera = new Camera(this);
		this.event = new WorldEvent(this, this.camera);
		this.blueprint = new WorldContextBlueprint(this);
		this.pathfinder = new Pathfinder(WORLD_WIDTH, WORLD_HEIGHT);
	}

	get terrain(): Terrain | undefined {
		const world = get(useWorld().worldStore).data[this.worldId];
		if (!world?.terrain_id) return undefined;
		return get(useTerrain().store).data[world.terrain_id];
	}

	// debug 변경 시 모든 엔티티 및 바운더리 업데이트
	setDebugEntities(debug: boolean) {
		for (const entity of Object.values(this.entities)) {
			entity.setDebug(debug);
		}

		// 바운더리 벽 visibility 업데이트
		const bodies = Composite.allBodies(this.engine.world);
		for (const body of bodies) {
			if (body.label.startsWith('boundary-')) {
				body.render.visible = debug;
			}
		}
	}

	// 마우스 클릭 처리
	private handleMouseDown(event: Matter.IEvent<Matter.MouseConstraint>) {
		const { setSelectedEntityId } = useWorld();

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
			setSelectedEntityId(entity.toEntityId());
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
		Matter.Events.on(this.engine, 'beforeUpdate', (event) => {
			this.syncEntities();
			this.updateEntities(event as BeforeUpdateEvent);
			this.checkEntityBounds();
		});
		Matter.Events.on(this.engine, 'afterUpdate', () => this.updateEntityPositions());

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

	// 월드 바운더리 생성
	private createBoundaryWalls() {
		if (!this.terrain) return;

		const { width, height } = this.terrain;
		const thickness = WALL_THICKNESS;

		const wallOptions = {
			isStatic: true,
			collisionFilter: {
				category: CATEGORY_WALL,
				mask: 0xffffffff, // 모든 카테고리와 충돌
			},
			render: { visible: this.debug },
		};

		// 상단 벽 (좌우로 두께만큼 더 넓게)
		const topWall = Bodies.rectangle(width / 2, -thickness / 2, width + thickness * 2, thickness, {
			...wallOptions,
			label: 'boundary-top',
		});

		// 하단 벽 (좌우로 두께만큼 더 넓게)
		const bottomWall = Bodies.rectangle(
			width / 2,
			height + thickness / 2,
			width + thickness * 2,
			thickness,
			{
				...wallOptions,
				label: 'boundary-bottom',
			}
		);

		// 좌측 벽
		const leftWall = Bodies.rectangle(-thickness / 2, height / 2, thickness, height, {
			...wallOptions,
			label: 'boundary-left',
		});

		// 우측 벽
		const rightWall = Bodies.rectangle(width + thickness / 2, height / 2, thickness, height, {
			...wallOptions,
			label: 'boundary-right',
		});

		Composite.add(this.engine.world, [topWall, bottomWall, leftWall, rightWall]);

		// pathfinder에도 경계 벽 추가
		this.pathfinder.blockBody(topWall);
		this.pathfinder.blockBody(bottomWall);
		this.pathfinder.blockBody(leftWall);
		this.pathfinder.blockBody(rightWall);
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

		// pathfinder 초기화 (모든 타일을 walkable로)
		this.pathfinder.reset();

		// 바운더리 생성
		this.createBoundaryWalls();

		// 엔티티 바디 재추가
		for (const entity of Object.values(this.entities)) {
			entity.addToWorld();
		}

		// mouseConstraint 재추가
		if (this.mouseConstraint) {
			Composite.add(this.engine.world, this.mouseConstraint);
		}

		this.updateRenderBounds();
	}

	// Matter.js render bounds 업데이트 및 카메라 변경 알림
	updateRenderBounds() {
		const { render, terrain, camera } = this;
		if (!render || !terrain) return;

		const viewWidth = render.canvas.width / camera.zoom;
		const viewHeight = render.canvas.height / camera.zoom;

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

	// 엔티티 생성 또는 삭제
	createOrDeleteEntities(
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

	// 스토어 데이터 변경사항을 엔티티에 동기화
	private syncEntities() {
		for (const entity of Object.values(this.entities)) {
			entity.sync();
		}
	}

	// Matter.js body 위치를 엔티티 state에 동기화
	private updateEntityPositions() {
		for (const entity of Object.values(this.entities)) {
			entity.updatePosition();
		}
	}

	// 엔티티 업데이트 (경로 따라가기 등)
	private updateEntities(event: BeforeUpdateEvent) {
		for (const entity of Object.values(this.entities)) {
			entity.update(event);
		}
	}

	// 바디가 경계를 벗어나면 제거 후 1초 뒤 리스폰 위치에 다시 추가
	private checkEntityBounds() {
		if (!this.terrain) return;

		for (const entity of Object.values(this.entities)) {
			if (!this.isOutOfEntityBounds(entity)) continue;

			this.respawnEntity(entity.toEntityId());
		}
	}

	private isOutOfEntityBounds(entity: Entity) {
		if (!this.terrain) return false;

		const { x, y } = entity.body.position;

		// 엔티티 중심점이 경계를 완전히 벗어난 경우만 체크 (바운더리 벽이 있으므로 여유롭게)
		return x < 0 || x > this.terrain.width || y < 0 || y > this.terrain.height;
	}

	private respawnEntity(entityId: EntityId) {
		if (this.respawningEntityIds.has(entityId)) return;

		this.respawningEntityIds.add(entityId);

		const { value: id } = EntityIdUtils.parse(entityId);
		const entity = this.entities[id];
		if (!entity) return;

		// 1초 후 리스폰 위치로 다시 추가
		setTimeout(() => {
			const x = this.terrain?.respawn_x ?? 0;
			const y = this.terrain?.respawn_y ?? 0;

			entity.removeFromWorld();

			// Body 위치 재설정
			Body.setPosition(entity.body, { x, y });

			// position state 업데이트
			entity.x = x;
			entity.y = y;
			entity.angle = 0;

			// 다시 world에 추가
			entity.addToWorld();

			this.respawningEntityIds.delete(entityId);
		}, 1000);
	}
}
