import Matter from 'matter-js';
import type { WorldContext } from './world-context.svelte';
import type { Camera } from './camera.svelte';

const { Query, Composite } = Matter;

export class Interact {
	isPanning = $state(false);
	isOverDraggable = $state(false);

	private world: WorldContext;
	private camera: Camera;

	constructor(world: WorldContext, camera: Camera) {
		this.world = world;
		this.camera = camera;
	}

	private checkDraggableAtPosition(screenX: number, screenY: number): boolean {
		const engine = this.world.engine;
		if (!engine) return false;

		const worldPos = this.camera.screenToWorld(screenX, screenY);
		if (!worldPos) return false;

		const bodies = Query.point(Composite.allBodies(engine.world), worldPos);
		return bodies.some((b) => !b.isStatic);
	}

	onmousedown = (e: MouseEvent) => {
		// 중간 버튼 또는 좌클릭으로 팬 (Command 키가 눌려있지 않을 때)
		if (e.button === 1 || (e.button === 0 && !e.metaKey)) {
			// 드래그 가능한 바디 위면 카메라 이동하지 않음
			if (this.isOverDraggable) return;

			e.preventDefault();
			this.isPanning = true;
			this.camera.startPan(e.clientX, e.clientY);
		}
	};

	onmousemove = (e: MouseEvent) => {
		// 호버 상태 업데이트
		if (!this.isPanning) {
			const newValue = this.checkDraggableAtPosition(e.clientX, e.clientY);
			if (newValue !== this.isOverDraggable) {
				this.isOverDraggable = newValue;
			}
		}

		if (!this.isPanning) return;

		this.camera.updatePan(e.clientX, e.clientY);
	};

	onmouseup = () => {
		this.isPanning = false;
	};
}
