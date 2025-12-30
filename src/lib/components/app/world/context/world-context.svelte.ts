import Matter from 'matter-js';
import { get } from 'svelte/store';
import type { Supabase, Terrain, WorldCharacter, WorldBuilding } from '$lib/types';
import { getGameAssetUrl } from '$lib/utils/storage.svelte';
import { Camera } from '../camera.svelte';
import { WorldEvent } from '../world-event.svelte';
import { TerrainBody } from '../terrain-body.svelte';
import { BuildingBody } from '../building-body.svelte';
import { Pathfinder } from '../pathfinder';
import { useBuilding } from '$lib/hooks/use-building';
import { WorldCharacterEntity } from '../entities/world-character-entity';
import { WorldPlanning } from './world-planning.svelte';

const { Engine, Runner, Render, Mouse, MouseConstraint, Composite } = Matter;

export class WorldContext {
	readonly supabase: Supabase;
	readonly engine: Matter.Engine;
	readonly runner: Matter.Runner;
	readonly camera: Camera;
	readonly event: WorldEvent;
	readonly terrainBody = new TerrainBody();

	terrain = $state<Terrain | undefined>();
	buildings = $state<Record<string, WorldBuilding>>({});
	worldCharacters = $state<Record<string, WorldCharacter>>({});

	get terrainAssetUrl() {
		return this.terrain ? getGameAssetUrl(this.supabase, 'terrain', this.terrain) : undefined;
	}
	buildingBodies = $state<Record<string, BuildingBody>>({});
	worldCharacterEntities = $state<Record<string, WorldCharacterEntity>>({});

	readonly planning = new WorldPlanning();
	pathfinder = $state<Pathfinder | undefined>(undefined);
	debug = $state(false);
	initialized = $state(false);
	container: HTMLDivElement | undefined = $state.raw(undefined);
	render: Matter.Render | undefined = $state.raw(undefined);
	mouseConstraint: Matter.MouseConstraint | undefined = $state.raw(undefined);
	oncamerachange: ((camera: Camera) => void) | undefined;

	private resizeObserver: ResizeObserver | undefined;
	private respawningIds = new Set<string>();

	constructor(supabase: Supabase, debug: boolean) {
		this.supabase = supabase;
		this.debug = debug;
		this.engine = Engine.create();
		this.runner = Runner.create();
		this.camera = new Camera(this);
		this.event = new WorldEvent(this, this.camera);
		this.planning.setWorldContext(this);

		// terrain 변경 감지하여 재로드
		$effect(() => {
			if (this.initialized && this.terrain) {
				this.reload();
			}
		});

		// debug 변경 시 바디들의 렌더 스타일 업데이트
		$effect(() => {
			this.terrainBody.setDebug(this.debug);
			for (const body of Object.values(this.buildingBodies)) {
				body.setDebug(this.debug);
			}
			for (const entity of Object.values(this.worldCharacterEntities)) {
				entity.setDebug(this.debug);
			}
		});

		// buildings 변경 시 바디 동기화 (건물을 먼저 처리)
		$effect(() => {
			if (!this.initialized) return;
			this.syncBuildingBodies(this.buildings);
		});

		// characters 변경 시 바디 동기화 (캐릭터를 나중에 처리)
		$effect(() => {
			if (!this.initialized) return;
			this.syncCharacterBodies(this.worldCharacters);
		});

		// 카메라 변경 시 렌더 바운드 업데이트
		$effect(() => {
			this.updateRenderBounds(this.render, this.terrainBody, this.camera);
		});
	}

	// 월드 마운트, cleanup 함수 반환
	mount(container: HTMLDivElement) {
		this.container = container;

		this.render = Render.create({
			element: container,
			engine: this.engine,
			options: {
				width: container.clientWidth,
				height: container.clientHeight,
				wireframes: false,
				background: 'transparent',
				hasBounds: true,
			},
		});

		const mouse = Mouse.create(this.render.canvas);
		this.mouseConstraint = MouseConstraint.create(this.engine, {
			mouse,
			constraint: { stiffness: 0.2, render: { visible: false } },
			collisionFilter: {
				// static 바디(건물)는 선택 안 되도록 CATEGORY_BUILDING 제외
				mask: 0xffffffff & ~0x0008,
			},
		});
		Composite.add(this.engine.world, this.mouseConstraint);
		this.render.mouse = mouse;

		// ResizeObserver 설정
		this.resizeObserver = new ResizeObserver((entries) => {
			const entry = entries[0];
			if (!entry) return;

			const { width, height } = entry.contentRect;
			if (width === 0 || height === 0) return;

			if (this.render) {
				this.render.canvas.width = width;
				this.render.canvas.height = height;
				this.render.options.width = width;
				this.render.options.height = height;
				this.updateRenderBounds(this.render, this.terrainBody, this.camera);
			}
		});
		this.resizeObserver.observe(container);

		// 지형 로드 (비동기)
		if (this.terrain) {
			this.terrainBody.load(this.supabase, this.terrain).then(() => {
				if (this.terrainBody.bodies.length > 0) {
					Composite.add(this.engine.world, this.terrainBody.bodies);
					this.terrainBody.setDebug(this.debug);
				}
				this.pathfinder = new Pathfinder(this.terrainBody.width, this.terrainBody.height);
				this.updateRenderBounds(this.render, this.terrainBody, this.camera);
			});
		}

		// 초기 건물/캐릭터 바디 생성 (건물을 먼저 추가하여 캐릭터가 나중에 추가되도록)
		this.syncBuildingBodies(this.buildings);
		this.syncCharacterBodies(this.worldCharacters);

		Render.run(this.render);
		this.updateRenderBounds(this.render, this.terrainBody, this.camera);
		this.initialized = true;

		// 물리 시뮬레이션 시작
		Matter.Events.on(this.engine, 'beforeUpdate', () => this.checkBounds());
		Matter.Events.on(this.engine, 'afterUpdate', () => this.updateCharacterPositions());
		Runner.run(this.runner, this.engine);

		return () => {
			this.initialized = false;
			this.resizeObserver?.disconnect();
			Runner.stop(this.runner);
			Engine.clear(this.engine);

			if (this.render) {
				Render.stop(this.render);
				this.render.canvas.remove();
			}
		};
	}

	async reload() {
		if (!this.terrain) return;

		// 기존 bodies 제거
		Composite.clear(this.engine.world, false);

		// 지형 로드
		await this.terrainBody.load(this.supabase, this.terrain);
		if (this.terrainBody.bodies.length > 0) {
			Composite.add(this.engine.world, this.terrainBody.bodies);
			this.terrainBody.setDebug(this.debug);
		}

		// pathfinder 재생성
		this.pathfinder = new Pathfinder(this.terrainBody.width, this.terrainBody.height);

		// 건물 바디 재추가
		for (const body of Object.values(this.buildingBodies)) {
			body.addToWorld(this.engine.world);
		}

		// 캐릭터 바디 재추가
		for (const entity of Object.values(this.worldCharacterEntities)) {
			entity.addToWorld();
		}

		// mouseConstraint 재추가
		if (this.mouseConstraint) {
			Composite.add(this.engine.world, this.mouseConstraint);
		}

		this.updateRenderBounds(this.render, this.terrainBody, this.camera);
	}

	// Matter.js render bounds 업데이트 및 카메라 변경 알림
	private updateRenderBounds(
		render: Matter.Render | undefined,
		terrainBody: TerrainBody,
		camera: Camera
	) {
		if (!render) return;

		const viewWidth = terrainBody.width / camera.zoom;
		const viewHeight = terrainBody.height / camera.zoom;

		render.bounds.min.x = camera.x;
		render.bounds.min.y = camera.y;
		render.bounds.max.x = camera.x + viewWidth;
		render.bounds.max.y = camera.y + viewHeight;

		this.oncamerachange?.(camera);
	}

	// 캐릭터 바디 동기화
	private syncCharacterBodies(characters: Record<string, WorldCharacter>) {
		const currentIds = new Set(Object.keys(characters));
		let changed = false;

		// 새로 추가된 캐릭터
		for (const worldCharacter of Object.values(characters)) {
			if (!this.worldCharacterEntities[worldCharacter.id]) {
				try {
					const entity = new WorldCharacterEntity(worldCharacter.id);
					entity.addToWorld();
					this.worldCharacterEntities[worldCharacter.id] = entity;
					changed = true;
				} catch (error) {
					// 스토어에 없는 삭제된 캐릭터는 건너뜀 (localStorage 정리 필요)
					console.warn('Skipping character creation:', error);
				}
			}
		}

		// 제거된 캐릭터
		for (const id of Object.keys(this.worldCharacterEntities)) {
			if (!currentIds.has(id)) {
				const entity = this.worldCharacterEntities[id];
				if (entity) {
					entity.removeFromWorld();
					delete this.worldCharacterEntities[id];
					changed = true;
				}
			}
		}

		// 변경 감지를 위해 재할당
		if (changed) {
			this.worldCharacterEntities = { ...this.worldCharacterEntities };
		}
	}

	// 건물 바디 동기화
	private syncBuildingBodies(buildings: Record<string, WorldBuilding>) {
		const currentIds = new Set(Object.keys(buildings));
		let changed = false;

		// 새로 추가된 건물
		const buildingStore = get(useBuilding().store).data;
		for (const worldBuilding of Object.values(buildings)) {
			if (!this.buildingBodies[worldBuilding.id]) {
				const buildingData = buildingStore[worldBuilding.building_id];
				if (buildingData) {
					const buildingBody = new BuildingBody(worldBuilding, buildingData, this.debug);
					buildingBody.addToWorld(this.engine.world);
					this.buildingBodies[worldBuilding.id] = buildingBody;
					changed = true;
				}
			}
		}

		// 제거된 건물
		for (const id of Object.keys(this.buildingBodies)) {
			if (!currentIds.has(id)) {
				this.buildingBodies[id]?.removeFromWorld(this.engine.world);
				delete this.buildingBodies[id];
				changed = true;
			}
		}

		// 변경 감지를 위해 재할당
		if (changed) {
			this.buildingBodies = { ...this.buildingBodies };
		}
	}

	// Matter.js body 위치를 CharacterEntity의 $state로 동기화
	private updateCharacterPositions() {
		for (const entity of Object.values(this.worldCharacterEntities)) {
			entity.updatePosition();
		}
	}

	// 바디가 경계를 벗어나면 제거 후 0.2초 뒤 시작 위치에 다시 추가
	private checkBounds() {
		const { width, height } = this.terrainBody;
		if (width === 0 || height === 0) return;

		for (const character of Object.values(this.worldCharacters)) {
			const body = this.worldCharacterEntities[character.id];
			if (body && this.isOutOfBounds(body)) {
				this.respawnCharacter(character);
			}
		}
	}

	private isOutOfBounds(entity: WorldCharacterEntity) {
		const characterBody = entity.characterBody;
		if (!characterBody) return false;

		const halfWidth = characterBody.width / 2;
		const halfHeight = characterBody.height / 2;
		const { x, y } = entity.body.position;

		return (
			x - halfWidth < 0 ||
			x + halfWidth > this.terrainBody.width ||
			y - halfHeight < 0 ||
			y + halfHeight > this.terrainBody.height
		);
	}

	private respawnCharacter(character: WorldCharacter) {
		const { id } = character;
		if (this.respawningIds.has(id)) return;
		this.respawningIds.add(id);

		// characters에서 제거 (바디도 자동 제거됨)
		const { [id]: _, ...rest } = this.worldCharacters;
		this.worldCharacters = rest;

		// 1초 후 시작 위치로 다시 추가
		setTimeout(() => {
			const x = this.terrain?.start_x ?? 0;
			const y = this.terrain?.start_y ?? 0;
			this.worldCharacters = { ...this.worldCharacters, [id]: { ...character, x, y } };
			this.respawningIds.delete(id);
		}, 1000);
	}
}
