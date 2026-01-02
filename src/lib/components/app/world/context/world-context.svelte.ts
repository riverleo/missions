import Matter from 'matter-js';
import { get } from 'svelte/store';
import type {
	Supabase,
	Terrain,
	WorldCharacter,
	WorldCharacterId,
	WorldBuilding,
	WorldBuildingId,
	WorldId,
} from '$lib/types';
import { useWorld } from '$lib/hooks/use-world';
import { useTerrain } from '$lib/hooks/use-terrain';
import { useServerPayload } from '$lib/hooks/use-server-payload.svelte';
import { Camera } from '../camera.svelte';
import { WorldEvent } from '../world-event.svelte';
import { TerrainBody } from '../terrain-body.svelte';
import { WorldBuildingEntity } from '../entities/world-building-entity';
import { WorldCharacterEntity } from '../entities/world-character-entity';
import { WorldPlanning } from './world-planning.svelte';

const { Engine, Runner, Render, Mouse, MouseConstraint, Composite, Body } = Matter;

export class WorldContext {
	readonly supabase: Supabase;
	readonly engine: Matter.Engine;
	readonly runner: Matter.Runner;
	readonly camera: Camera;
	readonly event: WorldEvent;
	readonly terrainBody = new TerrainBody();
	readonly worldId: WorldId;
	readonly planning = new WorldPlanning();

	worldBuildingEntities = $state<Record<WorldBuildingId, WorldBuildingEntity>>({});
	worldCharacterEntities = $state<Record<WorldCharacterId, WorldCharacterEntity>>({});

	debug = $state(false);
	initialized = $state(false);
	container: HTMLDivElement | undefined = $state.raw(undefined);
	render: Matter.Render | undefined = $state.raw(undefined);
	mouseConstraint: Matter.MouseConstraint | undefined = $state.raw(undefined);
	oncamerachange: ((camera: Camera) => void) | undefined;

	private respawningWorldCharacterIds = new Set<string>();

	constructor(worldId: WorldId, debug: boolean = false) {
		this.supabase = useServerPayload().supabase;
		this.debug = debug;
		this.worldId = worldId;
		this.engine = Engine.create();
		this.runner = Runner.create();
		this.camera = new Camera(this);
		this.event = new WorldEvent(this, this.camera);
		this.planning.setWorldContext(this);
	}

	private get terrain(): Terrain | null | undefined {
		const world = get(useWorld().worldStore).data[this.worldId];
		if (!world?.terrain_id) return null;
		return get(useTerrain().store).data[world.terrain_id];
	}

	// debug 변경 시 모든 엔티티 업데이트
	setDebugEntities(debug: boolean) {
		this.terrainBody.setDebug(debug);
		for (const entity of Object.values(this.worldBuildingEntities)) {
			entity.setDebug(debug);
		}
		for (const entity of Object.values(this.worldCharacterEntities)) {
			entity.setDebug(debug);
		}
	}

	// 월드 로드, cleanup 함수 반환
	load(container: HTMLDivElement) {
		this.container = container;

		this.render = Render.create({
			element: container,
			engine: this.engine,
			options: {
				width: 800,
				height: 400,
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
		this.terrainBody.load(this.supabase, this.terrain).then(() => {
			if (this.terrainBody.bodies.length > 0) {
				Composite.add(this.engine.world, this.terrainBody.bodies);
				this.terrainBody.setDebug(this.debug);
			}

			// 건물 바디 재추가
			for (const entity of Object.values(this.worldBuildingEntities)) {
				entity.addToWorld();
			}

			// 캐릭터 바디 재추가
			for (const entity of Object.values(this.worldCharacterEntities)) {
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

	// 캐릭터 바디 동기화
	syncWorldCharacterEntities(worldCharacters: Record<WorldCharacterId, WorldCharacter>) {
		// 제거될 엔티티들 cleanup
		for (const entity of Object.values(this.worldCharacterEntities)) {
			if (!worldCharacters[entity.id]) {
				entity.removeFromWorld();
				delete this.worldCharacterEntities[entity.id];
			}
		}

		// 새 엔티티 추가
		for (const character of Object.values(worldCharacters)) {
			if (!this.worldCharacterEntities[character.id]) {
				try {
					const entity = new WorldCharacterEntity(character.id);
					entity.addToWorld();
					this.worldCharacterEntities[character.id] = entity;
				} catch (error) {
					// 스토어에 없는 삭제된 캐릭터는 건너뜀 (localStorage 정리 필요)
					console.warn('Skipping character creation:', error);
				}
			}
		}
	}

	// 건물 엔티티 동기화
	syncWorldBuildingEntities(worldBuildings: Record<WorldBuildingId, WorldBuilding>) {
		// 제거될 엔티티들 cleanup
		for (const entity of Object.values(this.worldBuildingEntities)) {
			if (!worldBuildings[entity.id]) {
				entity.removeFromWorld();
				delete this.worldBuildingEntities[entity.id];
			}
		}

		// 새 엔티티 추가
		for (const worldBuilding of Object.values(worldBuildings)) {
			if (!this.worldBuildingEntities[worldBuilding.id]) {
				try {
					const entity = new WorldBuildingEntity(worldBuilding.id);
					entity.addToWorld();
					this.worldBuildingEntities[worldBuilding.id] = entity;
				} catch (error) {
					// 스토어에 없는 삭제된 건물은 건너뜀
					console.warn('Skipping building creation:', error);
				}
			}
		}
	}

	// Matter.js body 위치를 스토어에 동기화
	private updateWorldCharacterEntityPositions() {
		for (const worldCharacterEntity of Object.values(this.worldCharacterEntities)) {
			worldCharacterEntity.updatePosition();
		}
	}

	// 바디가 경계를 벗어나면 제거 후 0.2초 뒤 시작 위치에 다시 추가
	private checkWorldCharacterBounds() {
		const { width, height } = this.terrainBody;
		if (width === 0 || height === 0) return;

		for (const worldCharacterEntity of Object.values(this.worldCharacterEntities)) {
			if (this.isOutOfWorldCharacterEntityBounds(worldCharacterEntity)) {
				this.respawnWorldCharacterEntity(worldCharacterEntity.id);
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

		const worldCharacterEntity = this.worldCharacterEntities[worldCharacterId];
		if (!worldCharacterEntity) return;

		// world에서만 제거 (엔티티는 유지)
		worldCharacterEntity.removeFromWorld();

		// 1초 후 시작 위치로 다시 추가
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
