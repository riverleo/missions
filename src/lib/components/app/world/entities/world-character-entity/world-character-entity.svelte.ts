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

const { Bodies, Body, Composite } = Matter;

export class WorldCharacterEntity extends Entity {
	readonly id: WorldCharacterId;
	readonly type = 'character' as const;
	body: Matter.Body;

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

		// 바디 생성
		this.body = this.createBody(characterBody.width, characterBody.height);

		// 바디 위치 설정
		Body.setPosition(this.body, { x: worldCharacter.x, y: worldCharacter.y });

		// 초기 위치 설정
		this.x = worldCharacter.x;
		this.y = worldCharacter.y;
		this.angle = 0;
	}

	private createBody(width: number, height: number): Matter.Body {
		const rx = width / 2;
		const ry = height / 2;
		const vertices = createEllipseVertices(0, 0, rx, ry);

		const body = Bodies.fromVertices(0, 0, [vertices], {
			label: this.id,
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
			body.render.fillStyle = DEBUG_CHARACTER_FILL_STYLE;
		}

		return body;
	}

	get characterBody(): CharacterBody | undefined {
		const worldCharacter = get(useWorld().worldCharacterStore).data[this.id];
		if (!worldCharacter) return undefined;

		const characterStore = get(useCharacter().store).data;
		const characterBodyStore = get(useCharacterBody().store).data;
		const character = characterStore[worldCharacter.character_id];

		return character ? characterBodyStore[character.character_body_id] : undefined;
	}

	sync(): void {
		const characterBody = this.characterBody;
		if (!characterBody) return;

		// bounds에서 현재 바디 크기 추출 (타원 외접 사각형 기준)
		const currentWidth = this.body.bounds.max.x - this.body.bounds.min.x;
		const currentHeight = this.body.bounds.max.y - this.body.bounds.min.y;

		// 크기가 변경되었으면 바디 재생성
		if (
			Math.abs(currentWidth - characterBody.width) > 0.01 ||
			Math.abs(currentHeight - characterBody.height) > 0.01
		) {
			const currentPosition = this.body.position;
			const currentVelocity = this.body.velocity;
			const currentAngle = this.body.angle;

			// 월드에서 기존 바디 제거
			Composite.remove(this.world.engine.world, this.body);

			// 새 바디 생성
			this.body = this.createBody(characterBody.width, characterBody.height);

			// 위치/속도/각도 복원
			Body.setPosition(this.body, currentPosition);
			Body.setVelocity(this.body, currentVelocity);
			Body.setAngle(this.body, currentAngle);

			// 월드에 새 바디 추가
			Composite.add(this.world.engine.world, this.body);
		}
	}

	saveToStore(): void {
		// 스토어에 현재 위치 저장 (수동 호출)
	}
}
