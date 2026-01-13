import Matter from 'matter-js';
import { get } from 'svelte/store';
import type { WorldId, WorldCharacterId, CharacterBody } from '$lib/types';
import type { Vector } from '$lib/utils/vector';
import { EntityIdUtils } from '$lib/utils/entity-id';
import { CATEGORY_BOUNDARY, CATEGORY_TILE, CATEGORY_CHARACTER } from '$lib/constants';
import { useWorld } from '$lib/hooks/use-world';
import { useCharacter } from '$lib/hooks/use-character';
import { useCharacterBody } from '$lib/hooks/use-character-body';
import { Entity } from '../entity.svelte';
import type { BeforeUpdateEvent, WorldContext } from '../../context';
import type { WorldCharacterEntityDirection } from './index';
import { followPath } from './follow-path';

const { Body } = Matter;

export class WorldCharacterEntity extends Entity {
	readonly type = 'character' as const;
	body: Matter.Body;
	path: Vector[] = $state([]);
	direction: WorldCharacterEntityDirection = $state('right');

	override get instanceId(): WorldCharacterId {
		return EntityIdUtils.instanceId<WorldCharacterId>(this.id);
	}

	constructor(worldContext: WorldContext, worldId: WorldId, worldCharacterId: WorldCharacterId) {
		super(worldContext, 'character', worldId, worldCharacterId);

		// 스토어에서 데이터 조회 (초기값만)
		const worldCharacter = get(useWorld().worldCharacterStore).data[worldCharacterId];
		const characterBody = this.characterBody;

		if (!worldCharacter) {
			throw new Error(
				`Cannot create WorldCharacterEntity: missing data for id ${worldCharacterId}`
			);
		}

		// 바디 생성 (collider 및 위치 상태도 함께 설정됨)
		this.body = this.createBody(
			characterBody.collider_type,
			characterBody.collider_width,
			characterBody.collider_height,
			worldCharacter.x,
			worldCharacter.y,
			{
				restitution: 0.1,
				friction: 0.8,
				inertia: Infinity,
				collisionFilter: {
					category: CATEGORY_CHARACTER,
					mask: CATEGORY_BOUNDARY | CATEGORY_TILE,
				},
			}
		);
	}

	get characterBody(): CharacterBody {
		const worldCharacter = get(useWorld().worldCharacterStore).data[this.instanceId];
		if (!worldCharacter) throw new Error(`WorldCharacter not found for id ${this.instanceId}`);

		const characterStore = get(useCharacter().store).data;
		const characterBodyStore = get(useCharacterBody().store).data;

		const character = characterStore[worldCharacter.character_id];
		if (character === undefined)
			throw new Error(`Character not found for id ${worldCharacter.character_id}`);

		const characterBody = characterBodyStore[character.character_body_id];
		if (characterBody === undefined)
			throw new Error(`CharacterBody not found for id ${character.character_body_id}`);

		return characterBody;
	}

	override save(): void {
		const { worldCharacterStore } = useWorld();
		const store = get(worldCharacterStore);
		const worldCharacter = store.data[this.instanceId];

		if (worldCharacter) {
			worldCharacterStore.set({
				...store,
				data: {
					...store.data,
					[this.instanceId]: {
						...worldCharacter,
						x: this.x,
						y: this.y,
					},
				},
			});
		}
	}

	override update(event: BeforeUpdateEvent): void {
		followPath(this, event);
	}

	moveTo(targetX: number, targetY: number): void {
		// pathfinder로 경로 계산
		this.path = this.worldContext.pathfinder.findPath(
			{ x: this.body.position.x, y: this.body.position.y },
			{ x: targetX, y: targetY }
		);
	}
}
