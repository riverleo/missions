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

const { Bodies, Body, Composite } = Matter;

export class WorldCharacterEntity {
	readonly id: WorldCharacterId;
	readonly body: Matter.Body;

	private world = useWorldContext();

	constructor(id: WorldCharacterId) {
		this.id = id;

		// 스토어에서 데이터 조회
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
			restitution: 0.1,
			friction: 0.8,
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

		// 초기 위치 동기화
		this.updatePosition();
	}

	get characterBody(): CharacterBody | undefined {
		const worldCharacter = get(useWorld().worldCharacterStore).data[this.id];
		if (!worldCharacter) return undefined;

		const characterStore = get(useCharacter().store).data;
		const characterBodyStore = get(useCharacterBody().store).data;
		const character = characterStore[worldCharacter.character_id];

		return character ? characterBodyStore[character.character_body_id] : undefined;
	}

	updatePosition(): void {
		this.world.updateWorldCharacterPosition(this.id, this.body.position.x, this.body.position.y);
	}

	setDebug(debug: boolean): void {
		this.body.render.visible = debug;

		if (debug) {
			this.body.render.fillStyle = DEBUG_CHARACTER_FILL_STYLE;
		}
	}

	addToWorld(): void {
		Composite.add(this.world.engine.world, this.body);
	}

	removeFromWorld(): void {
		Composite.remove(this.world.engine.world, this.body);
	}
}
