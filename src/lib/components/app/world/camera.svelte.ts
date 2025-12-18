export class Camera {
	static readonly MIN_ZOOM = 0.25;
	static readonly MAX_ZOOM = 2;
	static readonly ZOOM_SPEED = 0.1;

	x = $state(0);
	y = $state(0);
	zoom = $state(1);

	// 팬 시작 시 저장할 상태
	private panStartX = 0;
	private panStartY = 0;
	private panStartCameraX = 0;
	private panStartCameraY = 0;

	// 화면 좌표를 월드 좌표로 변환
	screenToWorld(screenX: number, screenY: number, containerRect: DOMRect): { x: number; y: number } {
		const containerX = screenX - containerRect.left;
		const containerY = screenY - containerRect.top;
		return {
			x: containerX / this.zoom + this.x,
			y: containerY / this.zoom + this.y,
		};
	}

	// 줌 (마우스 위치 중심)
	applyZoom(deltaY: number, containerRect: DOMRect, screenX: number, screenY: number): void {
		const mouseWorldPos = this.screenToWorld(screenX, screenY, containerRect);
		const delta = deltaY > 0 ? -Camera.ZOOM_SPEED : Camera.ZOOM_SPEED;
		const newZoom = Math.max(Camera.MIN_ZOOM, Math.min(Camera.MAX_ZOOM, this.zoom + delta));
		const zoomRatio = newZoom / this.zoom;

		this.x = mouseWorldPos.x - (mouseWorldPos.x - this.x) / zoomRatio;
		this.y = mouseWorldPos.y - (mouseWorldPos.y - this.y) / zoomRatio;
		this.zoom = newZoom;
	}

	// 팬 시작
	startPan(screenX: number, screenY: number): void {
		this.panStartX = screenX;
		this.panStartY = screenY;
		this.panStartCameraX = this.x;
		this.panStartCameraY = this.y;
	}

	// 팬 업데이트
	updatePan(screenX: number, screenY: number): void {
		const dx = screenX - this.panStartX;
		const dy = screenY - this.panStartY;
		this.x = this.panStartCameraX - dx / this.zoom;
		this.y = this.panStartCameraY - dy / this.zoom;
	}
}
