import Matter from 'matter-js';
import type { Terrain, WorldCharacter, WorldBuilding } from '$lib/types';
import { getGameAssetUrl } from '$lib/utils/storage.svelte';
import { Camera } from './camera.svelte';
import { Interact } from './interact.svelte';
import { TerrainBody } from './terrain-body.svelte';
import { CharacterBody } from './character-body.svelte';
import { BuildingBody } from './building-body.svelte';

const { Engine, Runner, Render, Mouse, MouseConstraint, Composite } = Matter;

export class WorldContext {
	readonly engine: Matter.Engine;
	readonly runner: Matter.Runner;
	readonly camera: Camera;
	readonly event: Interact;
	readonly terrainBody = new TerrainBody();

	terrain = $state<Terrain | undefined>();
	buildings = $state<Record<string, WorldBuilding>>({});
	characters = $state<Record<string, WorldCharacter>>({});

	get terrainAssetUrl(): string | undefined {
		return this.terrain ? getGameAssetUrl('terrain', this.terrain) : undefined;
	}
	buildingBodies = $state<Record<string, BuildingBody>>({});
	characterBodies = $state<Record<string, CharacterBody>>({});

	debug = $state(false);
	initialized = $state(false);
	container: HTMLDivElement | undefined = $state.raw(undefined);
	render: Matter.Render | undefined = $state.raw(undefined);
	mouseConstraint: Matter.MouseConstraint | undefined = $state.raw(undefined);
	oncamerachange: ((camera: Camera) => void) | undefined;

	private resizeObserver: ResizeObserver | undefined;

	constructor(debug: boolean) {
		this.debug = debug;
		this.engine = Engine.create();
		this.runner = Runner.create();
		this.camera = new Camera(this);
		this.event = new Interact(this, this.camera);

		// terrain 변경 감지하여 재로드
		$effect(() => {
			const terrain = this.terrain;
			if (this.initialized && terrain) {
				this.reload();
			}
		});

		// debug 변경 시 바디들의 렌더 스타일 업데이트
		$effect(() => {
			this.terrainBody.setDebug(this.debug);
			for (const characterBody of Object.values(this.characterBodies)) {
				characterBody.setDebug(this.debug);
			}
			for (const buildingBody of Object.values(this.buildingBodies)) {
				buildingBody.setDebug(this.debug);
			}
		});

		// characters 변경 시 바디 동기화
		$effect(() => {
			const _ = Object.keys(this.characters).join(',');
			if (this.initialized) {
				this.syncCharacterBodies();
			}
		});

		// buildings 변경 시 바디 동기화
		$effect(() => {
			const _ = Object.keys(this.buildings).join(',');
			if (this.initialized) {
				this.syncBuildingBodies();
			}
		});

		// 카메라 변경 시 렌더 바운드 업데이트
		$effect(() => {
			const _ = [this.camera.x, this.camera.y, this.camera.zoom];
			this.updateRenderBounds();
		});
	}

	// 월드 마운트, cleanup 함수 반환
	mount(container: HTMLDivElement): () => void {
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
				this.updateRenderBounds();
			}
		});
		this.resizeObserver.observe(container);

		// 지형 로드 (비동기)
		if (this.terrain) {
			this.terrainBody.load(this.terrain).then(() => {
				if (this.terrainBody.bodies.length > 0) {
					Composite.add(this.engine.world, this.terrainBody.bodies);
					this.terrainBody.setDebug(this.debug);
				}
				this.updateRenderBounds();
			});
		}

		// 초기 캐릭터/건물 바디 생성
		this.syncCharacterBodies();
		this.syncBuildingBodies();

		Render.run(this.render);
		this.updateRenderBounds();
		this.initialized = true;

		// 물리 시뮬레이션 시작
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

	async reload(): Promise<void> {
		if (!this.terrain) return;

		// 기존 bodies 제거
		Composite.clear(this.engine.world, false);

		// 지형 로드
		await this.terrainBody.load(this.terrain);
		if (this.terrainBody.bodies.length > 0) {
			Composite.add(this.engine.world, this.terrainBody.bodies);
			this.terrainBody.setDebug(this.debug);
		}

		// 캐릭터/건물 바디 재추가
		for (const characterBody of Object.values(this.characterBodies)) {
			characterBody.addToWorld(this.engine.world);
		}
		for (const buildingBody of Object.values(this.buildingBodies)) {
			buildingBody.addToWorld(this.engine.world);
		}

		// mouseConstraint 재추가
		if (this.mouseConstraint) {
			Composite.add(this.engine.world, this.mouseConstraint);
		}

		this.updateRenderBounds();
	}

	// Matter.js render bounds 업데이트 및 카메라 변경 알림
	private updateRenderBounds(): void {
		if (!this.render) return;

		const viewWidth = this.terrainBody.width / this.camera.zoom;
		const viewHeight = this.terrainBody.height / this.camera.zoom;

		this.render.bounds.min.x = this.camera.x;
		this.render.bounds.min.y = this.camera.y;
		this.render.bounds.max.x = this.camera.x + viewWidth;
		this.render.bounds.max.y = this.camera.y + viewHeight;

		this.oncamerachange?.(this.camera);
	}

	// 캐릭터 바디 동기화
	private syncCharacterBodies(): void {
		const currentIds = new Set(Object.keys(this.characters));
		let changed = false;

		// 새로 추가된 캐릭터
		for (const char of Object.values(this.characters)) {
			if (!this.characterBodies[char.id]) {
				const characterBody = new CharacterBody(char, this.debug);
				characterBody.addToWorld(this.engine.world);
				this.characterBodies[char.id] = characterBody;
				changed = true;
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
	private syncBuildingBodies(): void {
		const currentIds = new Set(Object.keys(this.buildings));
		let changed = false;

		// 새로 추가된 건물
		for (const building of Object.values(this.buildings)) {
			if (!this.buildingBodies[building.id]) {
				const buildingBody = new BuildingBody(building, this.debug);
				buildingBody.addToWorld(this.engine.world);
				this.buildingBodies[building.id] = buildingBody;
				changed = true;
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

	// 물리 업데이트 후 위치 동기화
	private updatePositions(): void {
		for (const characterBody of Object.values(this.characterBodies)) {
			characterBody.updatePosition();
		}
		for (const buildingBody of Object.values(this.buildingBodies)) {
			buildingBody.updatePosition();
		}
	}
}
