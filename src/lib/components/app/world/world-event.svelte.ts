import Matter from 'matter-js';
import type { WorldContext } from './context';
import type { Camera } from './camera.svelte';

const { Query, Composite } = Matter;

const MOUSE_BUTTON_LEFT = 0;
const MOUSE_BUTTON_MIDDLE = 1;

export class WorldEvent {
	/** 마우스가 드래그 가능한 바디 위에 있는지 여부 */
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
		if (e.button === MOUSE_BUTTON_MIDDLE || (e.button === MOUSE_BUTTON_LEFT && !e.metaKey)) {
			// 드래그 가능한 바디 위면 카메라 이동하지 않음
			if (this.isOverDraggable) return;

			e.preventDefault();
			this.camera.startPan(e.clientX, e.clientY);
		}
	};

	onmousemove = (e: MouseEvent) => {
		// 호버 상태 업데이트
		if (!this.camera.panning) {
			const newValue = this.checkDraggableAtPosition(e.clientX, e.clientY);
			if (newValue !== this.isOverDraggable) {
				this.isOverDraggable = newValue;
			}
			return;
		}

		this.camera.applyPan(e.clientX, e.clientY);
	};

	onmouseup = () => {
		this.camera.stopPan();
	};
}
