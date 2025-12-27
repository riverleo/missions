import Matter from 'matter-js';
import { get } from 'svelte/store';
import type { Supabase, Terrain, WorldCharacter, WorldBuilding, Building } from '$lib/types';
import { getGameAssetUrl } from '$lib/utils/storage.svelte';
import { Camera } from './camera.svelte';
import { WorldEvent } from './world-event.svelte';
import { TerrainBody } from './terrain-body.svelte';
import { CharacterBody } from './character-body.svelte';
import { BuildingBody } from './building-body.svelte';
import { Pathfinder } from './pathfinder';
import {
	getBuildingOccupiedCells,
	getOverlappingCells,
	tileToCenterPixel,
	type TileCell,
} from './tiles';
import { useBuilding } from '$lib/hooks/use-building';
import { useCharacter } from '$lib/hooks/use-character';
import { useCharacterBody } from '$lib/hooks/use-character-body';

const { Engine, Runner, Render, Mouse, MouseConstraint, Composite } = Matter;

export interface WorldPlanningPlacement {
	building: Building;
	x: number;
	y: number;
}

export class WorldPlanning {
	showGrid = $state(false);
	placement = $state<WorldPlanningPlacement | undefined>(undefined);

	private worldContext: WorldContext | undefined;

	setWorldContext(context: WorldContext) {
		this.worldContext = context;
	}

	/**
	 * 현재 배치하려는 건물과 기존 건물들의 겹치는 셀들 계산
	 */
	getOverlappingCells(): TileCell[] {
		if (!this.placement || !this.worldContext) return [];

		const { building, x, y } = this.placement;
		const placementCells = getBuildingOccupiedCells(x, y, building.tile_cols, building.tile_rows);

		// 기존 건물들이 차지하는 모든 셀 수집
		const buildingStore = get(useBuilding().store).data;
		const existingCells: TileCell[] = [];
		for (const worldBuilding of Object.values(this.worldContext.buildings)) {
			const buildingData = buildingStore[worldBuilding.building_id];
			if (!buildingData) continue;

			// tile_x, tile_y는 타일 인덱스이므로 픽셀 좌표로 변환
			const centerX = tileToCenterPixel(worldBuilding.tile_x);
			const centerY = tileToCenterPixel(worldBuilding.tile_y);
			const cells = getBuildingOccupiedCells(
				centerX,
				centerY,
				buildingData.tile_cols,
				buildingData.tile_rows
			);
			existingCells.push(...cells);
		}

		return getOverlappingCells(placementCells, existingCells);
	}

	/**
	 * 현재 배치가 유효한지 (겹치는 셀이 없는지)
	 */
	get canPlace(): boolean {
		return this.getOverlappingCells().length === 0;
	}
}

export class WorldContext {
	readonly supabase: Supabase;
	readonly engine: Matter.Engine;
	readonly runner: Matter.Runner;
	readonly camera: Camera;
	readonly event: WorldEvent;
	readonly terrainBody = new TerrainBody();

	terrain = $state<Terrain | undefined>();
	buildings = $state<Record<string, WorldBuilding>>({});
	characters = $state<Record<string, WorldCharacter>>({});

	get terrainAssetUrl() {
		return this.terrain ? getGameAssetUrl(this.supabase, 'terrain', this.terrain) : undefined;
	}
	buildingBodies = $state<Record<string, BuildingBody>>({});
	characterBodies = $state<Record<string, CharacterBody>>({});

	private get allBodies() {
		// 건물(static)을 먼저, 캐릭터(dynamic)를 나중에 추가하여 캐릭터가 렌더링 순서에서 위에 오도록 함
		return [...Object.values(this.buildingBodies), ...Object.values(this.characterBodies)];
	}

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
			for (const body of this.allBodies) {
				body.setDebug(this.debug);
			}
		});

		// buildings 변경 시 바디 동기화 (건물을 먼저 처리)
		$effect(() => {
			this.syncBuildingBodies(this.buildings, this.initialized);
		});

		// characters 변경 시 바디 동기화 (캐릭터를 나중에 처리)
		$effect(() => {
			this.syncCharacterBodies(this.characters, this.initialized);
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
		this.syncCharacterBodies(this.characters);

		Render.run(this.render);
		this.updateRenderBounds(this.render, this.terrainBody, this.camera);
		this.initialized = true;

		// 물리 시뮬레이션 시작
		Matter.Events.on(this.engine, 'beforeUpdate', () => this.checkBounds());
		Matter.Events.on(this.engine, 'afterUpdate', () => this.updatePositions());
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

		// 캐릭터/건물 바디 재추가
		for (const body of this.allBodies) {
			body.addToWorld(this.engine.world);
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
	private syncCharacterBodies(characters: Record<string, WorldCharacter>, initialized = true) {
		if (!initialized) return;

		const currentIds = new Set(Object.keys(characters));
		let changed = false;

		// 새로 추가된 캐릭터
		const characterStore = get(useCharacter().store).data;
		const characterBodyStore = get(useCharacterBody().store).data;
		for (const worldCharacter of Object.values(characters)) {
			if (!this.characterBodies[worldCharacter.id]) {
				// worldCharacter.character_id -> character.body_id -> characterBody
				const character = characterStore[worldCharacter.character_id];
				const bodyData = character ? characterBodyStore[character.body_id] : undefined;

				if (bodyData) {
					const body = new CharacterBody(worldCharacter, bodyData, this.debug);
					body.addToWorld(this.engine.world);
					this.characterBodies[worldCharacter.id] = body;
					changed = true;
				}
			}
		}

		// 제거된 캐릭터
		for (const id of Object.keys(this.characterBodies)) {
			if (!currentIds.has(id)) {
				this.characterBodies[id]?.removeFromWorld(this.engine.world);
				delete this.characterBodies[id];
				changed = true;
			}
		}

		// 변경 감지를 위해 재할당
		if (changed) {
			this.characterBodies = { ...this.characterBodies };
		}
	}

	// 건물 바디 동기화
	private syncBuildingBodies(buildings: Record<string, WorldBuilding>, initialized = true) {
		if (!initialized) return;

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

	// 바디가 경계를 벗어나면 제거 후 0.2초 뒤 시작 위치에 다시 추가
	private checkBounds() {
		const { width, height } = this.terrainBody;
		if (width === 0 || height === 0) return;

		for (const character of Object.values(this.characters)) {
			const body = this.characterBodies[character.id];
			if (body && this.isOutOfBounds(body.body, body.size, width, height)) {
				this.respawnCharacter(character);
			}
		}
	}

	private isOutOfBounds(
		body: Matter.Body,
		size: { width: number; height: number },
		worldWidth: number,
		worldHeight: number
	) {
		const halfWidth = size.width / 2;
		const halfHeight = size.height / 2;
		const { x, y } = body.position;

		return (
			x - halfWidth < 0 ||
			x + halfWidth > worldWidth ||
			y - halfHeight < 0 ||
			y + halfHeight > worldHeight
		);
	}

	private respawnCharacter(character: WorldCharacter) {
		const { id } = character;
		if (this.respawningIds.has(id)) return;
		this.respawningIds.add(id);

		// characters에서 제거 (바디도 자동 제거됨)
		const { [id]: _, ...rest } = this.characters;
		this.characters = rest;

		// 1초 후 시작 위치로 다시 추가
		setTimeout(() => {
			const x = this.terrain?.start_x ?? 0;
			const y = this.terrain?.start_y ?? 0;
			this.characters = { ...this.characters, [id]: { ...character, x, y } };
			this.respawningIds.delete(id);
		}, 1000);
	}

	// 물리 업데이트 후 위치 동기화
	private updatePositions() {
		for (const body of this.allBodies) {
			body.updatePosition();
		}
	}
}
