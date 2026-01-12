import Matter from 'matter-js';
import { WALL_THICKNESS, CATEGORY_WALL } from '$lib/constants';

const { Bodies } = Matter;

export function createBoundaryWalls(width: number, height: number, debug: boolean): Matter.Body[] {
	const thickness = WALL_THICKNESS;

	const wallOptions = {
		isStatic: true,
		collisionFilter: {
			category: CATEGORY_WALL,
			mask: 0xffffffff, // 모든 카테고리와 충돌
		},
		render: { visible: debug },
	};

	// 상단 벽 (좌우로 두께만큼 더 넓게)
	const topWall = Bodies.rectangle(width / 2, -thickness / 2, width + thickness * 2, thickness, {
		...wallOptions,
		label: 'boundary-top',
	});

	// 하단 벽 (좌우로 두께만큼 더 넓게)
	const bottomWall = Bodies.rectangle(
		width / 2,
		height + thickness / 2,
		width + thickness * 2,
		thickness,
		{
			...wallOptions,
			label: 'boundary-bottom',
		}
	);

	// 좌측 벽
	const leftWall = Bodies.rectangle(-thickness / 2, height / 2, thickness, height, {
		...wallOptions,
		label: 'boundary-left',
	});

	// 우측 벽
	const rightWall = Bodies.rectangle(width + thickness / 2, height / 2, thickness, height, {
		...wallOptions,
		label: 'boundary-right',
	});

	return [topWall, bottomWall, leftWall, rightWall];
}
