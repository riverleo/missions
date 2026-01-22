import Matter from 'matter-js';
import { get } from 'svelte/store';
import type { Unsubscriber } from 'svelte/store';
import type {
	Terrain,
	WorldCharacterId,
	WorldBuildingId,
	WorldItemId,
	WorldId,
	EntityId,
	VectorKey,
	TileId,
	Vector,
	TileCellKey,
} from '$lib/types';
import { EntityIdUtils } from '$lib/utils/entity-id';
import { vectorUtils } from '$lib/utils/vector';
import { useWorld } from '$lib/hooks/use-world';
import { useTerrain } from '$lib/hooks/use-terrain';
import { useCurrent } from '$lib/hooks/use-current';
import { Camera } from '../camera.svelte';
import { WorldEvent } from '../world-event.svelte';
import { WorldCharacterEntity } from '../entities/world-character-entity';
import { Entity } from '../entities/entity.svelte';
import type { BeforeUpdateEvent } from './index';
import { WorldContextBlueprint } from './world-context-blueprint.svelte';
import { Pathfinder } from '../pathfinder';
import { createBoundaries, type Boundaries } from './create-boundaries';
import { createWorldCharacter, deleteWorldCharacter } from './world-character';
import { createWorldBuilding, deleteWorldBuilding } from './world-building';
import { createWorldItem, deleteWorldItem } from './world-item';
import { createTilesInWorldTileMap, deleteTileFromWorldTileMap } from './world-tile-map';
import { initializeEntities } from './initialize-entities';
import { WORLD_WIDTH, WORLD_HEIGHT, CATEGORY_CHARACTER, CATEGORY_ITEM } from '$lib/constants';

const { Engine, Runner, Render, Mouse, MouseConstraint, Composite, Body } = Matter;

export class WorldContext {
	readonly engine: Matter.Engine;
	readonly runner: Matter.Runner;
	readonly camera: Camera;
	readonly event: WorldEvent;
	readonly worldId: WorldId;
	readonly blueprint: WorldContextBlueprint;
	readonly pathfinder: Pathfinder;

	boundaries: Boundaries | undefined = $state.raw(undefined);
	entities = $state<Record<EntityId, Entity>>({});
	debug = $state(false);
	initialized = $state(false);
	pathfinderUpdated = $state(0);
	render: Matter.Render | undefined = $state.raw(undefined);
	mouseConstraint: Matter.MouseConstraint | undefined = $state.raw(undefined);
	oncamerachange: ((camera: Camera) => void) | undefined;

	private respawningEntityIds = new Set<EntityId>();
	private mouseDownScreenPosition: { x: number; y: number } | undefined;
	private entityClickedInMouseDown = false;
	private draggedEntityId: EntityId | undefined;
	private tickUnsubscriber: Unsubscriber | undefined;

	constructor(worldId: WorldId, debug: boolean = false) {
		this.debug = debug;
		this.worldId = worldId;
		this.engine = Engine.create();
		this.runner = Runner.create();
		this.camera = new Camera(this);
		this.event = new WorldEvent(this, this.camera);
		this.blueprint = new WorldContextBlueprint(this);
		this.pathfinder = new Pathfinder(this, WORLD_WIDTH, WORLD_HEIGHT);
	}

	get terrain(): Terrain | undefined {
		const { worldStore } = useWorld();
		const { terrainStore } = useTerrain();

		const world = get(worldStore).data[this.worldId];
		if (!world?.terrain_id) return undefined;
		return get(terrainStore).data[world.terrain_id];
	}

	// debug 변경 시 모든 엔티티 및 바운더리 업데이트
	setDebug(debug: boolean) {
		this.debug = debug;

		for (const entity of Object.values(this.entities)) {
			entity.setDebug(debug);
		}

		// 바운더리 visibility 업데이트
		if (this.boundaries) {
			for (const boundary of Object.values(this.boundaries)) {
				boundary.render.visible = debug;
			}
		}
	}

	// 마우스 클릭 처리 (canvas mousedown에서 screen 좌표 저장)
	private handleCanvasMouseDown = (e: MouseEvent) => {
		this.mouseDownScreenPosition = vectorUtils.createVector(e.clientX, e.clientY);
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

				// 엔티티를 클릭했다는 플래그 설정
				this.entityClickedInMouseDown = true;

				// 드래그 가능한 엔티티면 ID 저장
				if (entity.type === 'character' || entity.type === 'item') {
					this.draggedEntityId = entity.id;
				}
			}
		} else {
			// 엔티티를 클릭하지 않았으면 플래그 클리어
			this.entityClickedInMouseDown = false;
		}
	};

	// canvas mouseup 처리
	private handleCanvasMouseUp = (e: MouseEvent) => {
		const { selectedEntityIdStore, setSelectedEntityId } = useWorld();

		if (!this.mouseDownScreenPosition) return;

		// 드래그 거리 계산 (클릭 판정: 5px 이내)
		const dx = e.clientX - this.mouseDownScreenPosition.x;
		const dy = e.clientY - this.mouseDownScreenPosition.y;
		const distance = Math.sqrt(dx * dx + dy * dy);
		const isClick = distance < 5;

		// 드래그 가능한 엔티티를 드래그했으면 클릭 처리 안 함
		const wasEntityDragged = this.draggedEntityId !== undefined;

		// 클릭이고 엔티티 드래그가 없었으면 엔티티 배치 또는 캐릭터 이동 처리
		if (isClick && !wasEntityDragged) {
			const worldPos = this.camera.screenToWorld(
				vectorUtils.createScreenVector(e.clientX, e.clientY)
			);
			if (worldPos) {
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
							this.blueprint.setCursorStart(this.blueprint.cursor.current);
						} else {
							// 두 번째 클릭: 타일 일괄 설치 (placable이면)
							if (this.blueprint.placable) {
								this.blueprint.cursorToEntities();
							}
							// placable 여부와 관계없이 start 클리어 (다시 선택할 수 있도록)
							this.blueprint.setCursorStart(undefined);
						}
					} else {
						// 타일이 아니면 바로 배치
						this.blueprint.cursorToEntities();
					}
				}
				// 빈 공간 클릭: 엔티티 선택 해제 (엔티티를 클릭하지 않았을 때만)
				else if (!this.entityClickedInMouseDown) {
					setSelectedEntityId(undefined);
				}
			}
		}

		this.mouseDownScreenPosition = undefined;
		this.entityClickedInMouseDown = false;

		// 커서 업데이트 (마우스를 움직이지 않아도 배치 후 커서가 갱신되도록)
		this.blueprint.updateCursor(vectorUtils.createScreenVector(e.clientX, e.clientY));
	};

	// Matter.js mouseup 처리
	private handleMouseUp = (event: Matter.IEvent<Matter.MouseConstraint>) => {
		// 드래그했던 엔티티가 있으면 충돌 체크
		if (this.draggedEntityId) {
			const entity = this.entities[this.draggedEntityId];
			if (entity) {
				// 현재 위치에서 충돌 체크 (타일, 벽, 건물과 충돌하는지)
				const collisions = Matter.Query.collides(
					entity.body,
					Composite.allBodies(this.engine.world)
				);

				// static 바디(타일, 벽, 건물)와 충돌하면 가장 가까운 walkable 셀로 이동
				const hasStaticCollision = collisions.some((collision) => {
					const otherBody = collision.bodyA === entity.body ? collision.bodyB : collision.bodyA;
					return otherBody.isStatic;
				});

				if (hasStaticCollision) {
					const nearestWalkable = this.pathfinder.findNearestWalkableCell(
						vectorUtils.createVector(entity.body.position.x, entity.body.position.y)
					);

					if (nearestWalkable) {
						Body.setPosition(entity.body, {
							x: nearestWalkable.x,
							y: nearestWalkable.y,
						});
					}

					// velocity와 force 초기화
					Body.setVelocity(entity.body, { x: 0, y: 0 });
					entity.body.force = { x: 0, y: 0 };
				}
			}
			this.draggedEntityId = undefined;
		}
	};

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

		this.blueprint.updateCursor(vectorUtils.createScreenVector(e.clientX, e.clientY));
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
				// static 바디(벽, 타일, 건물)는 드래그 불가, 캐릭터와 아이템만 드래그 가능
				mask: CATEGORY_CHARACTER | CATEGORY_ITEM,
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

		// 틱 구독 (틱이 변경될 때마다 모든 엔티티의 tick 메서드 호출)
		const currentHook = useCurrent();
		this.tickUnsubscriber = currentHook.tickStore.subscribe((currentTick) => {
			this.tickEntities(currentTick);
		});

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

			// 틱 구독 해제
			if (this.tickUnsubscriber) {
				this.tickUnsubscriber();
				this.tickUnsubscriber = undefined;
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

		// 바운더리 생성
		this.boundaries = createBoundaries(this.terrain.width, this.terrain.height, this.debug);
		Composite.add(this.engine.world, Object.values(this.boundaries));

		// 엔티티 바디 재추가
		for (const entity of Object.values(this.entities)) {
			entity.addToWorld();
		}

		// mouseConstraint 재추가
		if (this.mouseConstraint) {
			Composite.add(this.engine.world, this.mouseConstraint);
		}

		this.pathfinder.update();
		this.pathfinderUpdated++;

		// 스토어 데이터로부터 엔티티 초기화
		initializeEntities(this);

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

	// 엔티티 틱 (1초마다 호출)
	private tickEntities(tick: number) {
		for (const entity of Object.values(this.entities)) {
			entity.tick(tick);
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

		// 리스폰 위치로 다시 추가
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
		}, 100);
	}

	// 엔티티 생성/삭제 메서드들
	createWorldCharacter(insert: Parameters<typeof createWorldCharacter>[1]) {
		createWorldCharacter(this, insert);
	}

	createWorldBuilding(insert: Parameters<typeof createWorldBuilding>[1]) {
		createWorldBuilding(this, insert);
	}

	createWorldItem(insert: Parameters<typeof createWorldItem>[1]) {
		createWorldItem(this, insert);
	}

	createTilesInWorldTileMap(tiles: Record<TileCellKey, TileId>) {
		createTilesInWorldTileMap(this, tiles);
	}

	deleteWorldCharacter(worldCharacterId: WorldCharacterId) {
		deleteWorldCharacter(this, worldCharacterId);
	}

	deleteWorldBuilding(worldBuildingId: WorldBuildingId) {
		deleteWorldBuilding(this, worldBuildingId);
	}

	deleteWorldItem(worldItemId: WorldItemId) {
		deleteWorldItem(this, worldItemId);
	}

	deleteTileFromWorldTileMap(tileCellKey: TileCellKey) {
		deleteTileFromWorldTileMap(this, tileCellKey);
	}
}
