import Matter from 'matter-js';
import { BOUNDARY_THICKNESS, CATEGORY_BOUNDARY } from '$lib/constants';

const { Bodies } = Matter;

export interface Boundaries {
	top: Matter.Body;
	bottom: Matter.Body;
	left: Matter.Body;
	right: Matter.Body;
}

export function createBoundaries(width: number, height: number, debug: boolean): Boundaries {
	const boundaryOptions = {
		isStatic: true,
		collisionFilter: {
			category: CATEGORY_BOUNDARY,
			mask: 0xffffffff, // 모든 카테고리와 충돌
		},
		render: { visible: debug },
	};

	// 상단 벽 (좌우로 두께만큼 더 넓게)
	const top = Bodies.rectangle(
		width / 2,
		-BOUNDARY_THICKNESS / 2,
		width + BOUNDARY_THICKNESS * 2,
		BOUNDARY_THICKNESS,
		{
			...boundaryOptions,
			label: 'boundary-top',
		}
	);

	// 하단 벽 (좌우로 두께만큼 더 넓게)
	const bottom = Bodies.rectangle(
		width / 2,
		height + BOUNDARY_THICKNESS / 2,
		width + BOUNDARY_THICKNESS * 2,
		BOUNDARY_THICKNESS,
		{
			...boundaryOptions,
			label: 'boundary-bottom',
		}
	);

	// 좌측 벽
	const left = Bodies.rectangle(-BOUNDARY_THICKNESS / 2, height / 2, BOUNDARY_THICKNESS, height, {
		...boundaryOptions,
		label: 'boundary-left',
	});

	// 우측 벽
	const right = Bodies.rectangle(
		width + BOUNDARY_THICKNESS / 2,
		height / 2,
		BOUNDARY_THICKNESS,
		height,
		{
			...boundaryOptions,
			label: 'boundary-right',
		}
	);

	return { top, bottom, left, right };
}
