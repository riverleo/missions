import type { WorldContext } from './context';

export class Camera {
	static readonly MIN_ZOOM = 0.25;
	static readonly MAX_ZOOM = 2;
	static readonly ZOOM_SPEED = 0.1;

	x = $state(0);
	y = $state(0);
	zoom = $state(1);
	isPanning = $state(false);

	// 팬 시작 시 저장할 상태
	private panStartX = 0;
	private panStartY = 0;
	private panStartCameraX = 0;
	private panStartCameraY = 0;

	private world: WorldContext;

	constructor(world: WorldContext) {
		this.world = world;
	}

	// 화면 좌표를 컨테이너 좌표로 변환
	screenToContainer(screenX: number, screenY: number): { x: number; y: number } | undefined {
		const canvas = this.world.render?.canvas;
		if (!canvas) return undefined;

		const rect = canvas.getBoundingClientRect();
		return {
			x: screenX - rect.left,
			y: screenY - rect.top,
		};
	}

	// 화면 좌표를 월드 좌표로 변환
	screenToWorld(screenX: number, screenY: number): { x: number; y: number } | undefined {
		const containerPos = this.screenToContainer(screenX, screenY);
		if (!containerPos) return undefined;

		return {
			x: containerPos.x / this.zoom + this.x,
			y: containerPos.y / this.zoom + this.y,
		};
	}

	// 맵 크기에 따른 최소 줌 레벨 계산
	private getMinZoom(): number {
		const terrain = this.world.terrain;
		const canvas = this.world.render?.canvas;
		if (!terrain || !canvas) return Camera.MIN_ZOOM;

		// 맵이 화면을 꽉 채울 수 있는 최소 줌 계산
		const minZoomX = canvas.width / terrain.width;
		const minZoomY = canvas.height / terrain.height;
		const minZoomForMap = Math.max(minZoomX, minZoomY);

		// 전역 최소값과 맵 기반 최소값 중 큰 값 사용
		return Math.max(Camera.MIN_ZOOM, minZoomForMap);
	}

	// 카메라 위치를 월드 경계 내로 제한
	private clampPosition(): void {
		const terrain = this.world.terrain;
		if (!terrain) return;

		const canvas = this.world.render?.canvas;
		if (!canvas) return;

		const viewWidth = canvas.width / this.zoom;
		const viewHeight = canvas.height / this.zoom;

		const maxX = Math.max(0, terrain.width - viewWidth);
		const maxY = Math.max(0, terrain.height - viewHeight);

		this.x = Math.max(0, Math.min(maxX, this.x));
		this.y = Math.max(0, Math.min(maxY, this.y));
	}

	// 줌 (마우스 위치 중심)
	applyZoom(deltaY: number, screenX: number, screenY: number): void {
		const mouseWorldPos = this.screenToWorld(screenX, screenY);
		if (!mouseWorldPos) return;

		const delta = deltaY > 0 ? -Camera.ZOOM_SPEED : Camera.ZOOM_SPEED;
		const minZoom = this.getMinZoom();
		const newZoom = Math.max(minZoom, Math.min(Camera.MAX_ZOOM, this.zoom + delta));
		const zoomRatio = newZoom / this.zoom;

		this.x = mouseWorldPos.x - (mouseWorldPos.x - this.x) / zoomRatio;
		this.y = mouseWorldPos.y - (mouseWorldPos.y - this.y) / zoomRatio;
		this.zoom = newZoom;

		this.clampPosition();
		this.world.updateRenderBounds();
	}

	// 팬 시작
	startPan(screenX: number, screenY: number): void {
		this.isPanning = true;
		this.panStartX = screenX;
		this.panStartY = screenY;
		this.panStartCameraX = this.x;
		this.panStartCameraY = this.y;
	}

	// 팬 업데이트
	applyPan(screenX: number, screenY: number): void {
		const dx = screenX - this.panStartX;
		const dy = screenY - this.panStartY;
		this.x = this.panStartCameraX - dx / this.zoom;
		this.y = this.panStartCameraY - dy / this.zoom;

		this.clampPosition();
		this.world.updateRenderBounds();
	}

	// 팬 종료
	stopPan(): void {
		this.isPanning = false;
	}
}
