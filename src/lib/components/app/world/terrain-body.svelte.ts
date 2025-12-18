import Matter from 'matter-js';
import type { Terrain } from '$lib/types';
import { getGameAssetUrl } from '$lib/utils/storage.svelte';
import {
	WALL_THICKNESS,
	CATEGORY_WALL,
	CATEGORY_TERRAIN,
	CATEGORY_CHARACTER,
	CATEGORY_BUILDING,
	DEBUG_TERRAIN_FILL_STYLE,
	HIDDEN_BODY_STYLE,
} from './constants';

const { Bodies, Vertices, Svg } = Matter;

interface PathStyle {
	fill: string | undefined;
	stroke: string | undefined;
	strokeWidth: number;
}

export class TerrainBody {
	width = $state(0);
	height = $state(0);
	bodies: Matter.Body[] = [];

	private getPathStyle(path: SVGPathElement): PathStyle {
		const style = path.getAttribute('style') || '';

		const fillMatch = style.match(/fill\s*:\s*([^;]+)/);
		const strokeMatch = style.match(/stroke\s*:\s*([^;]+)/);
		const strokeWidthMatch = style.match(/stroke-width\s*:\s*([^;]+)/);

		const fillValue = fillMatch?.[1]?.trim() || path.getAttribute('fill');
		const strokeValue = strokeMatch?.[1]?.trim() || path.getAttribute('stroke');
		const strokeWidthStr =
			strokeWidthMatch?.[1]?.trim() || path.getAttribute('stroke-width') || '1';

		return {
			fill: fillValue === 'none' ? undefined : (fillValue ?? undefined),
			stroke: strokeValue === 'none' ? undefined : (strokeValue ?? undefined),
			strokeWidth: parseFloat(strokeWidthStr) || 1,
		};
	}

	private createStrokeBody(
		x1: number,
		y1: number,
		x2: number,
		y2: number,
		width: number
	): Matter.Body {
		const cx = (x1 + x2) / 2;
		const cy = (y1 + y2) / 2;
		const dx = x2 - x1;
		const dy = y2 - y1;
		const length = Math.sqrt(dx * dx + dy * dy);
		const angle = Math.atan2(dy, dx);

		return Bodies.rectangle(cx, cy, length, width, {
			isStatic: true,
			angle,
			collisionFilter: {
				category: CATEGORY_TERRAIN,
				mask: CATEGORY_CHARACTER | CATEGORY_BUILDING,
			},
			render: HIDDEN_BODY_STYLE,
		});
	}

	private createPolygonBody(vertices: Matter.Vector[]): Matter.Body | undefined {
		if (vertices.length < 3) return;

		const center = Vertices.centre(vertices);
		return Bodies.fromVertices(center.x, center.y, [vertices], {
			isStatic: true,
			collisionFilter: {
				category: CATEGORY_TERRAIN,
				mask: CATEGORY_CHARACTER | CATEGORY_BUILDING,
			},
			render: HIDDEN_BODY_STYLE,
		});
	}

	private createBoundaryWalls(): Matter.Body[] {
		const wallOptions = {
			isStatic: true,
			render: HIDDEN_BODY_STYLE,
			collisionFilter: {
				category: CATEGORY_WALL,
				mask: CATEGORY_CHARACTER | CATEGORY_BUILDING,
			},
		};

		const ground = Bodies.rectangle(
			this.width / 2,
			this.height - WALL_THICKNESS / 2,
			this.width,
			WALL_THICKNESS,
			wallOptions
		);
		const leftWall = Bodies.rectangle(
			WALL_THICKNESS / 2,
			this.height / 2,
			WALL_THICKNESS,
			this.height,
			wallOptions
		);
		const rightWall = Bodies.rectangle(
			this.width - WALL_THICKNESS / 2,
			this.height / 2,
			WALL_THICKNESS,
			this.height,
			wallOptions
		);
		const ceiling = Bodies.rectangle(
			this.width / 2,
			WALL_THICKNESS / 2,
			this.width,
			WALL_THICKNESS,
			wallOptions
		);

		return [ground, leftWall, rightWall, ceiling];
	}

	async load(terrain: Terrain): Promise<void> {
		if (!terrain.game_asset) return;

		const url = getGameAssetUrl('terrain', terrain);
		if (!url) return;

		try {
			const response = await fetch(url);
			const svgText = await response.text();

			const parser = new DOMParser();
			const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');

			// SVG viewBox에서 월드 크기 추출
			const svgElement = svgDoc.querySelector('svg');
			if (svgElement) {
				const viewBox = svgElement.getAttribute('viewBox');
				if (viewBox) {
					const [, , vbWidth, vbHeight] = viewBox.split(/\s+/).map(Number);
					if (vbWidth && vbHeight) {
						this.width = vbWidth;
						this.height = vbHeight;
					}
				}
			}

			const paths = svgDoc.querySelectorAll('path');
			const bodies: Matter.Body[] = [];

			// 경계 벽 추가
			bodies.push(...this.createBoundaryWalls());

			// SVG 경로에서 지형 바디 생성
			paths.forEach((path) => {
				const pathStyle = this.getPathStyle(path);
				const vertices = Svg.pathToVertices(path, 15);

				if (pathStyle.fill && pathStyle.stroke) {
					// 둘 다 있으면 fill은 다각형으로
					const body = this.createPolygonBody(vertices);
					if (body) {
						bodies.push(body);
					}
					// stroke는 선으로
					for (let i = 0; i < vertices.length - 1; i++) {
						const v1 = vertices[i];
						const v2 = vertices[i + 1];
						if (!v1 || !v2) continue;
						bodies.push(this.createStrokeBody(v1.x, v1.y, v2.x, v2.y, pathStyle.strokeWidth));
					}
				} else {
					// fill만 또는 stroke만 있으면 선으로 처리
					const width = pathStyle.strokeWidth;
					for (let i = 0; i < vertices.length - 1; i++) {
						const v1 = vertices[i];
						const v2 = vertices[i + 1];
						if (!v1 || !v2) continue;
						bodies.push(this.createStrokeBody(v1.x, v1.y, v2.x, v2.y, width));
					}
				}
			});

			this.bodies = bodies;
		} catch (error) {
			console.error('Failed to load terrain SVG:', error);
			this.bodies = [];
		}
	}

	setDebug(debug: boolean): void {
		for (const body of this.bodies) {
			body.render.visible = debug;
			if (debug) {
				body.render.fillStyle = DEBUG_TERRAIN_FILL_STYLE;
			}
		}
	}
}
