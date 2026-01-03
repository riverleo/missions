import Matter from 'matter-js';
import { get } from 'svelte/store';
import type { WorldCharacterId, CharacterBody } from '$lib/types';
import {
	CATEGORY_WALL,
	CATEGORY_TERRAIN,
	CATEGORY_CHARACTER,
	DEBUG_CHARACTER_FILL_STYLE,
} from '../../constants';
import { createEllipseVertices } from '../../vertices';
import { useWorldContext, useWorld } from '$lib/hooks/use-world';
import { useCharacter } from '$lib/hooks/use-character';
import { useCharacterBody } from '$lib/hooks/use-character-body';
import { Entity } from '../entity.svelte';

const { Bodies, Body } = Matter;

export class WorldCharacterEntity extends Entity {
	readonly id: WorldCharacterId;
	readonly type = 'character' as const;
	readonly body: Matter.Body;

	protected readonly world = useWorldContext();
	protected get debugFillStyle(): string {
		return DEBUG_CHARACTER_FILL_STYLE;
	}

	constructor(id: WorldCharacterId) {
		super();
		this.id = id;

		// 스토어에서 데이터 조회 (초기값만)
		const worldCharacter = get(useWorld().worldCharacterStore).data[id];
		const characterBody = this.characterBody;

		if (!worldCharacter || !characterBody) {
			throw new Error(`Cannot create WorldCharacterEntity: missing data for id ${id}`);
		}

		// 타원형 바디 생성
		const rx = characterBody.width / 2;
		const ry = characterBody.height / 2;
		const vertices = createEllipseVertices(0, 0, rx, ry);

		this.body = Bodies.fromVertices(0, 0, [vertices], {
			label: id,
			restitution: 0.1,
			friction: 0.8,
			frictionAir: 0.1,
			inertia: Infinity,
			collisionFilter: {
				category: CATEGORY_CHARACTER,
				mask: CATEGORY_WALL | CATEGORY_TERRAIN,
			},
			render: { visible: this.world.debug },
		});

		if (this.world.debug) {
			this.body.render.fillStyle = DEBUG_CHARACTER_FILL_STYLE;
		}

		// 바디 위치 설정
		Body.setPosition(this.body, { x: worldCharacter.x, y: worldCharacter.y });

		// 초기 위치 설정
		this.x = worldCharacter.x;
		this.y = worldCharacter.y;
		this.angle = 0;
	}

	get characterBody(): CharacterBody | undefined {
		const worldCharacter = get(useWorld().worldCharacterStore).data[this.id];
		if (!worldCharacter) return undefined;

		const characterStore = get(useCharacter().store).data;
		const characterBodyStore = get(useCharacterBody().store).data;
		const character = characterStore[worldCharacter.character_id];

		return character ? characterBodyStore[character.character_body_id] : undefined;
	}

	saveToStore(): void {
		// 스토어에 현재 위치 저장 (수동 호출)
	}
}
