import Matter from 'matter-js';
import { get } from 'svelte/store';
import type {
	Terrain,
	WorldCharacter,
	WorldCharacterId,
	WorldBuilding,
	WorldBuildingId,
	WorldItem,
	WorldItemId,
	WorldId,
	EntityId,
	WorldTileMap,
	TileVector,
	CharacterId,
	ItemId,
	TileId,
	BuildingId,
	UserId,
} from '$lib/types';
import { EntityIdUtils } from '$lib/utils/entity-id';
import type { Vector } from '$lib/utils/vector';
import { useWorld } from '$lib/hooks/use-world';
import { TEST_PLAYER_ID, TEST_SCENARIO_ID } from '$lib/hooks/use-world';
import { useTerrain } from '$lib/hooks/use-terrain';
import { Camera } from '../camera.svelte';
import { WorldEvent } from '../world-event.svelte';
import { WorldBuildingEntity } from '../entities/world-building-entity';
import { WorldCharacterEntity } from '../entities/world-character-entity';
import { WorldItemEntity } from '../entities/world-item-entity';
import { WorldTileEntity } from '../entities/world-tile-entity';
import { Entity } from '../entities/entity.svelte';
import type { BeforeUpdateEvent } from './index';
import { WorldContextBlueprint } from './world-context-blueprint.svelte';
import { Pathfinder } from '../pathfinder';
import {
	WORLD_WIDTH,
	WORLD_HEIGHT,
	WALL_THICKNESS,
	CATEGORY_WALL,
	CELL_SIZE,
} from '$lib/constants';

const { Engine, Runner, Render, Mouse, MouseConstraint, Composite, Body, Bodies } = Matter;

export class WorldContext {
	readonly engine: Matter.Engine;
	readonly runner: Matter.Runner;
	readonly camera: Camera;
	readonly event: WorldEvent;
	readonly worldId: WorldId;
	readonly blueprint: WorldContextBlueprint;
	readonly pathfinder: Pathfinder;

	entities = $state<Record<EntityId, Entity>>({});
	debug = $state(false);
	initialized = $state(false);
	pathfinderVersion = $state(0);
	render: Matter.Render | undefined = $state.raw(undefined);
	mouseConstraint: Matter.MouseConstraint | undefined = $state.raw(undefined);
	oncamerachange: ((camera: Camera) => void) | undefined;

	private respawningEntityIds = new Set<EntityId>();
	private draggedEntityPosition: { entityId: EntityId; x: number; y: number } | undefined;
	private mouseDownScreenPosition: { x: number; y: number } | undefined;

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

	// 마우스 클릭 처리 (canvas mousedown에서 screen 좌표 저장)
	private handleCanvasMouseDown = (e: MouseEvent) => {
		this.mouseDownScreenPosition = { x: e.clientX, y: e.clientY };
	};

	// Matter.js mousedown 처리
	private handleMouseDown = (event: Matter.IEvent<Matter.MouseConstraint>) => {
		const { setSelectedEntityId } = useWorld();

		// 마우스 위치에서 모든 body 찾기 (건물 포함)
		if (!this.mouseConstraint?.mouse) return;
		const mousePosition = this.mouseConstraint.mouse.position;
		const bodies = Matter.Query.point(Composite.allBodies(this.engine.world), mousePosition);

		// 엔티티 바디만 필터링 (지형 제외)
		const entityBody = bodies.find((body) => this.entities[body.label as EntityId]);

		// 엔티티를 찾았으면 선택 (빈 공간은 handleClick에서 처리)
		if (entityBody) {
			const entity = this.entities[entityBody.label as EntityId];
			if (entity) {
				setSelectedEntityId(entity.id);
				// 엔티티 선택 시 템플릿 선택 해제
				this.blueprint.setSelectedEntityTemplateId(undefined);

				// 드래그 시작 위치 저장
				this.draggedEntityPosition = {
					entityId: entity.id,
					x: entity.body.position.x,
					y: entity.body.position.y,
				};
			}
		}
	};

	// canvas mouseup 처리
	private handleCanvasMouseUp = (e: MouseEvent) => {
		if (!this.mouseDownScreenPosition) return;

		// 드래그 거리 계산 (클릭 판정: 5px 이내)
		const dx = e.clientX - this.mouseDownScreenPosition.x;
		const dy = e.clientY - this.mouseDownScreenPosition.y;
		const distance = Math.sqrt(dx * dx + dy * dy);
		const isClick = distance < 5;

		// 엔티티를 드래그했으면 클릭 처리 안 함
		const wasEntityDragged = this.draggedEntityPosition !== undefined;

		// 클릭이고 엔티티 드래그가 없었으면 엔티티 배치 또는 캐릭터 이동 처리
		if (isClick && !wasEntityDragged) {
			const worldPos = this.camera.screenToWorld(e.clientX, e.clientY);
			if (worldPos) {
				const { selectedEntityIdStore, setSelectedEntityId } = useWorld();

				// 캐릭터 이동 우선 처리 (selectedEntityId가 character면)
				const selectedEntityId = get(selectedEntityIdStore).entityId;
				if (EntityIdUtils.is('character', selectedEntityId)) {
					const entity = this.entities[selectedEntityId!];
					if (entity && entity.type === 'character') {
						(entity as WorldCharacterEntity).moveTo(worldPos.x, worldPos.y);
					}
				}
				// 엔티티 배치 (cursor가 있으면)
				else if (this.blueprint.cursor) {
					const { entityTemplateId } = this.blueprint.cursor;

					// 타일 배치는 두 번의 클릭 필요
					if (EntityIdUtils.template.is('tile', entityTemplateId)) {
						if (!this.blueprint.cursor.start) {
							// 첫 번째 클릭: 시작점 저장
							this.blueprint.cursor = {
								...this.blueprint.cursor,
								start: { ...this.blueprint.cursor.current },
							};
						} else {
							// 두 번째 클릭: 타일 일괄 설치
							this.placeEntity();
							// start 클리어
							this.blueprint.cursor = {
								...this.blueprint.cursor,
								start: undefined,
							};
						}
					} else {
						// 타일이 아니면 바로 배치
						this.placeEntity();
					}
				}
				// 빈 공간 클릭: 엔티티 선택 해제 (템플릿 선택은 유지)
				else {
					setSelectedEntityId(undefined);
				}
			}
		}

		this.mouseDownScreenPosition = undefined;

		// 커서 업데이트 (마우스를 움직이지 않아도 배치 후 커서가 갱신되도록)
		this.blueprint.updateCursor(e.clientX, e.clientY);
	};

	// Matter.js mouseup 처리
	private handleMouseUp = (event: Matter.IEvent<Matter.MouseConstraint>) => {
		// 엔티티 드래그 처리
		if (this.draggedEntityPosition) {
			const entity = this.entities[this.draggedEntityPosition.entityId];
			if (entity) {
				// 현재 위치에서 충돌 체크 (타일, 벽, 건물과 충돌하는지)
				const collisions = Matter.Query.collides(
					entity.body,
					Composite.allBodies(this.engine.world)
				);

				// static 바디(타일, 벽, 건물)와 충돌하면 이전 위치로 복원
				const hasStaticCollision = collisions.some((collision) => {
					const otherBody = collision.bodyA === entity.body ? collision.bodyB : collision.bodyA;
					return otherBody.isStatic;
				});

				if (hasStaticCollision) {
					Body.setPosition(entity.body, {
						x: this.draggedEntityPosition.x,
						y: this.draggedEntityPosition.y,
					});
				}
			}
			this.draggedEntityPosition = undefined;
		}
	};


	// 엔티티 배치
	private placeEntity() {
		if (!this.blueprint.cursor) return;

		const { entityTemplateId, current } = this.blueprint.cursor;
		const { x, y } = current;
		const { type } = EntityIdUtils.template.parse(entityTemplateId);

		if (type === 'building') {
			// 겹치는 셀이 있으면 배치하지 않음
			if (!this.blueprint.placable) return;
			this.addWorldBuilding(EntityIdUtils.template.id<BuildingId>(entityTemplateId), { x, y });
		} else if (type === 'tile') {
			// 타일 벡터들 계산 (start가 있으면 범위, 없으면 단일)
			for (const vector of this.blueprint.getVectorsFromStart()) {
				this.addTileToWorldTileMap(EntityIdUtils.template.id<TileId>(entityTemplateId), vector);
			}
		} else if (type === 'character') {
			// character는 픽셀 좌표를 사용 (cell 좌표 → 픽셀 변환)
			this.addWorldCharacter(EntityIdUtils.template.id<CharacterId>(entityTemplateId), {
				x: x * CELL_SIZE + CELL_SIZE / 2,
				y: y * CELL_SIZE + CELL_SIZE / 2,
			});
		} else if (type === 'item') {
			// item은 픽셀 좌표를 사용 (cell 좌표 → 픽셀 변환)
			this.addWorldItem(EntityIdUtils.template.id<ItemId>(entityTemplateId), {
				x: x * CELL_SIZE + CELL_SIZE / 2,
				y: y * CELL_SIZE + CELL_SIZE / 2,
			});
		}
	}

	// 마우스가 월드 바깥으로 나갔을 때 처리
	private handleMouseLeave = () => {
		if (!this.mouseConstraint?.mouse) return;

		// 마우스 버튼 상태를 -1로 설정하여 마우스 제약 해제
		this.mouseConstraint.mouse.button = -1;
	};

	// 마우스 이동 처리
	private handleMouseMove = (e: MouseEvent) => {
		// 카메라 팬 중에는 cursor 업데이트 안 함
		if (this.camera.panning) return;

		this.blueprint.updateCursor(e.clientX, e.clientY);
	};

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
				// static 바디(벽, 타일, 건물)는 선택 안 되도록 제외
				mask: 0xffffffff,
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
			this.updateEntities(event as BeforeUpdateEvent);
			this.checkEntityBounds();
		});
		Matter.Events.on(this.engine, 'afterUpdate', this.updateEntityPositions);

		// 마우스 클릭 감지
		Matter.Events.on(this.mouseConstraint, 'mousedown', this.handleMouseDown);
		Matter.Events.on(this.mouseConstraint, 'mouseup', this.handleMouseUp);

		// 캔버스 마우스 이벤트 처리
		this.render.canvas.addEventListener('mousedown', this.handleCanvasMouseDown);
		this.render.canvas.addEventListener('mouseup', this.handleCanvasMouseUp);
		this.render.canvas.addEventListener('mousemove', this.handleMouseMove);
		this.render.canvas.addEventListener('mouseleave', this.handleMouseLeave);

		Runner.run(this.runner, this.engine);

		return () => {
			this.initialized = false;
			Runner.stop(this.runner);
			Engine.clear(this.engine);

			if (this.render) {
				Render.stop(this.render);
				this.render.canvas.removeEventListener('mousedown', this.handleCanvasMouseDown);
				this.render.canvas.removeEventListener('mouseup', this.handleCanvasMouseUp);
				this.render.canvas.removeEventListener('mousemove', this.handleMouseMove);
				this.render.canvas.removeEventListener('mouseleave', this.handleMouseLeave);
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

		// 스토어 데이터로부터 엔티티 초기화
		this.initializeEntitiesFromStore();

		this.updateRenderBounds();
	}

	// 스토어 데이터로부터 엔티티 생성
	private initializeEntitiesFromStore() {
		const { worldCharacterStore, worldBuildingStore, worldItemStore, worldTileMapStore } =
			useWorld();

		// 현재 worldId에 해당하는 데이터만 필터링
		const characters = Object.values(get(worldCharacterStore).data).filter(
			(c) => c.world_id === this.worldId
		);
		const buildings = Object.values(get(worldBuildingStore).data).filter(
			(b) => b.world_id === this.worldId
		);
		const items = Object.values(get(worldItemStore).data).filter(
			(i) => i.world_id === this.worldId
		);
		const worldTileMap = get(worldTileMapStore).data[this.worldId];

		// 캐릭터 엔티티 생성
		for (const character of characters) {
			const entityId = EntityIdUtils.create('character', this.worldId, character.id);
			if (!this.entities[entityId]) {
				try {
					const entity = new WorldCharacterEntity(this, this.worldId, character.id);
					entity.addToWorld();
				} catch (error) {
					console.warn('Skipping character creation:', error);
				}
			}
		}

		// 건물 엔티티 생성
		for (const building of buildings) {
			const entityId = EntityIdUtils.create('building', this.worldId, building.id);
			if (!this.entities[entityId]) {
				try {
					const entity = new WorldBuildingEntity(this, this.worldId, building.id);
					entity.addToWorld();
				} catch (error) {
					console.warn('Skipping building creation:', error);
				}
			}
		}

		// 아이템 엔티티 생성
		for (const item of items) {
			const entityId = EntityIdUtils.create('item', this.worldId, item.id);
			if (!this.entities[entityId]) {
				try {
					const entity = new WorldItemEntity(this, this.worldId, item.id);
					entity.addToWorld();
				} catch (error) {
					console.warn('Skipping item creation:', error);
				}
			}
		}

		// 타일 엔티티 생성
		if (worldTileMap) {
			for (const [vector, tileData] of Object.entries(worldTileMap.data)) {
				const entityId = EntityIdUtils.create('tile', this.worldId, vector as TileVector);
				if (!this.entities[entityId]) {
					try {
						const entity = new WorldTileEntity(
							this,
							this.worldId,
							vector as TileVector,
							tileData.tile_id
						);
						entity.addToWorld();
					} catch (error) {
						console.warn('Skipping tile creation:', error);
					}
				}
			}
		}
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

	// Matter.js body 위치를 엔티티 state에 동기화
	private updateEntityPositions = () => {
		for (const entity of Object.values(this.entities)) {
			entity.updatePosition();
		}
	};

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

			this.respawnEntity(entity.id);
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

		const entity = this.entities[entityId];
		if (!entity) return;

		// 1초 후 리스폰 위치로 다시 추가
		setTimeout(() => {
			const x = this.terrain?.respawn_x ?? 0;
			const y = this.terrain?.respawn_y ?? 0;

			entity.removeFromWorld();

			// Body 위치 재설정
			Body.setPosition(entity.body, { x, y });

			// velocity와 force 초기화
			Body.setVelocity(entity.body, { x: 0, y: 0 });
			Body.setAngularVelocity(entity.body, 0);
			entity.body.force = { x: 0, y: 0 };

			// position state 업데이트
			entity.x = x;
			entity.y = y;
			entity.angle = 0;

			// 다시 world에 추가
			entity.addToWorld();

			this.respawningEntityIds.delete(entityId);
		}, 1000);
	}

	// 엔티티 추가/제거 메서드들
	addWorldCharacter(characterId: CharacterId, vector: Vector) {
		const { worldCharacterStore } = useWorld();

		const worldCharacter: WorldCharacter = {
			id: crypto.randomUUID() as WorldCharacterId,
			user_id: crypto.randomUUID() as UserId,
			player_id: TEST_PLAYER_ID,
			scenario_id: TEST_SCENARIO_ID,
			world_id: this.worldId,
			character_id: characterId,
			x: vector.x,
			y: vector.y,
			created_at: new Date().toISOString(),
		} as WorldCharacter;

		// 스토어 업데이트
		worldCharacterStore.update((state) => ({
			...state,
			data: { ...state.data, [worldCharacter.id]: worldCharacter },
		}));

		// 엔티티 생성
		const entity = new WorldCharacterEntity(this, this.worldId, worldCharacter.id);
		entity.addToWorld();
	}

	removeWorldCharacter(worldCharacterId: WorldCharacterId) {
		const { worldCharacterStore } = useWorld();

		// 엔티티 제거
		const entityId = EntityIdUtils.create('character', this.worldId, worldCharacterId);
		const entity = this.entities[entityId];
		if (entity) {
			entity.removeFromWorld();
		}

		// 스토어 업데이트
		worldCharacterStore.update((state) => {
			const newData = { ...state.data };
			delete newData[worldCharacterId];
			return { ...state, data: newData };
		});
	}

	addWorldBuilding(buildingId: BuildingId, vector: Vector) {
		const { worldBuildingStore } = useWorld();

		const worldBuilding: WorldBuilding = {
			id: crypto.randomUUID() as WorldBuildingId,
			user_id: crypto.randomUUID() as UserId,
			player_id: TEST_PLAYER_ID,
			scenario_id: TEST_SCENARIO_ID,
			world_id: this.worldId,
			building_id: buildingId,
			cell_x: vector.x,
			cell_y: vector.y,
			created_at: new Date().toISOString(),
			created_at_tick: 0,
		} as WorldBuilding;

		// 스토어 업데이트
		worldBuildingStore.update((state) => ({
			...state,
			data: { ...state.data, [worldBuilding.id]: worldBuilding },
		}));

		// 엔티티 생성
		const entity = new WorldBuildingEntity(this, this.worldId, worldBuilding.id);
		entity.addToWorld();
	}

	removeWorldBuilding(worldBuildingId: WorldBuildingId) {
		const { worldBuildingStore } = useWorld();

		// 엔티티 제거
		const entityId = EntityIdUtils.create('building', this.worldId, worldBuildingId);
		const entity = this.entities[entityId];
		if (entity) {
			entity.removeFromWorld();
		}

		// 스토어 업데이트
		worldBuildingStore.update((state) => {
			const newData = { ...state.data };
			delete newData[worldBuildingId];
			return { ...state, data: newData };
		});
	}

	addWorldItem(itemId: ItemId, vector: Vector, rotation: number = 0) {
		const { worldItemStore } = useWorld();

		const worldItem: WorldItem = {
			id: crypto.randomUUID() as WorldItemId,
			user_id: crypto.randomUUID() as UserId,
			player_id: TEST_PLAYER_ID,
			scenario_id: TEST_SCENARIO_ID,
			world_id: this.worldId,
			item_id: itemId,
			x: vector.x,
			y: vector.y,
			rotation,
			created_at: new Date().toISOString(),
			created_at_tick: 0,
		} as WorldItem;

		// 스토어 업데이트
		worldItemStore.update((state) => ({
			...state,
			data: { ...state.data, [worldItem.id]: worldItem },
		}));

		// 엔티티 생성
		const entity = new WorldItemEntity(this, this.worldId, worldItem.id);
		entity.addToWorld();
	}

	removeWorldItem(worldItemId: WorldItemId) {
		const { worldItemStore } = useWorld();

		// 엔티티 제거
		const entityId = EntityIdUtils.create('item', this.worldId, worldItemId);
		const entity = this.entities[entityId];
		if (entity) {
			entity.removeFromWorld();
		}

		// 스토어 업데이트
		worldItemStore.update((state) => {
			const newData = { ...state.data };
			delete newData[worldItemId];
			return { ...state, data: newData };
		});
	}

	addTileToWorldTileMap(tileId: TileId, vector: Vector) {
		const { worldTileMapStore } = useWorld();

		let worldTileMap = get(worldTileMapStore).data[this.worldId];

		// WorldTileMap이 없으면 생성
		if (!worldTileMap) {
			const testWorld = get(useWorld().worldStore).data[this.worldId];
			if (!testWorld) {
				return console.error('Test world not found');
			}

			const newWorldTileMap: WorldTileMap = {
				id: crypto.randomUUID(),
				scenario_id: TEST_SCENARIO_ID,
				user_id: crypto.randomUUID() as UserId,
				player_id: TEST_PLAYER_ID,
				world_id: this.worldId,
				terrain_id: testWorld.terrain_id!,
				data: {},
				created_at: new Date().toISOString(),
			};

			worldTileMapStore.update((state) => ({
				...state,
				data: { ...state.data, [this.worldId]: newWorldTileMap },
			}));

			worldTileMap = newWorldTileMap;
		}

		// 타일 추가
		const tileVector: TileVector = `${vector.x},${vector.y}` as TileVector;
		worldTileMapStore.update((state) => {
			const tileMap = state.data[this.worldId];
			if (tileMap) {
				return {
					...state,
					data: {
						...state.data,
						[this.worldId]: {
							...tileMap,
							data: {
								...tileMap.data,
								[tileVector]: {
									tile_id: tileId,
									durability: 100,
								},
							},
						},
					},
				};
			}
			return state;
		});

		// 엔티티 생성
		const entityId = EntityIdUtils.create('tile', this.worldId, tileVector);
		if (!this.entities[entityId]) {
			try {
				const entity = new WorldTileEntity(this, this.worldId, tileVector, tileId);
				entity.addToWorld();
			} catch (error) {
				console.warn('Skipping tile creation:', error);
			}
		}
	}

	removeTileFromWorldTileMap(tileVector: TileVector) {
		const { worldTileMapStore } = useWorld();

		// 엔티티 제거
		const entityId = EntityIdUtils.create('tile', this.worldId, tileVector);
		const entity = this.entities[entityId];
		if (entity) {
			entity.removeFromWorld();
		}

		// 스토어 업데이트
		worldTileMapStore.update((state) => {
			const tileMap = state.data[this.worldId];
			if (tileMap) {
				const newData = { ...tileMap.data };
				delete newData[tileVector];
				return {
					...state,
					data: {
						...state.data,
						[this.worldId]: {
							...tileMap,
							data: newData,
						},
					},
				};
			}
			return state;
		});
	}
}
