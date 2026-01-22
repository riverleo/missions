import Matter from 'matter-js';
import { get } from 'svelte/store';
import { produce } from 'immer';
import type { WorldId, WorldCharacterId, CharacterBody } from '$lib/types';
import type { Vector } from '$lib/types/vector';
import { EntityIdUtils } from '$lib/utils/entity-id';
import { vectorUtils } from '$lib/utils/vector';
import { CATEGORY_BOUNDARY, CATEGORY_TILE, CATEGORY_CHARACTER } from '$lib/constants';
import { useWorld } from '$lib/hooks/use-world';
import { useCharacter } from '$lib/hooks/use-character';
import { Entity } from '../entity.svelte';
import type { BeforeUpdateEvent, WorldContext } from '../../context';
import type { WorldCharacterEntityDirection } from './index';
import { move } from './move';

export class WorldCharacterEntity extends Entity {
	readonly type = 'character' as const;
	body: Matter.Body;
	path: Vector[] = $state([]);
	direction: WorldCharacterEntityDirection = $state('right');
	heldWorldItemId = $state<string | undefined>(undefined);

	private worldHook = useWorld();
	private characterHook = useCharacter();

	override get instanceId(): WorldCharacterId {
		return EntityIdUtils.instanceId<WorldCharacterId>(this.id);
	}

	constructor(worldContext: WorldContext, worldId: WorldId, worldCharacterId: WorldCharacterId) {
		super(worldContext, 'character', worldId, worldCharacterId);

		// 스토어에서 데이터 조회 (초기값만)
		const { worldCharacterStore } = this.worldHook;
		const worldCharacter = get(worldCharacterStore).data[worldCharacterId];
		const characterBody = this.characterBody;

		if (!worldCharacter) {
			throw new Error(
				`Cannot create WorldCharacterEntity: missing data for id ${worldCharacterId}`
			);
		}

		// held_world_item_id 초기화
		this.heldWorldItemId = worldCharacter.held_world_item_id ?? undefined;

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
		const { worldCharacterStore } = this.worldHook;
		const { characterStore, characterBodyStore } = this.characterHook;

		const worldCharacter = get(worldCharacterStore).data[this.instanceId];
		if (!worldCharacter) throw new Error(`WorldCharacter not found for id ${this.instanceId}`);

		const characterStoreData = get(characterStore).data;
		const characterBodyStoreData = get(characterBodyStore).data;

		const character = characterStoreData[worldCharacter.character_id];
		if (character === undefined)
			throw new Error(`Character not found for id ${worldCharacter.character_id}`);

		const characterBody = characterBodyStoreData[character.character_body_id];
		if (characterBody === undefined)
			throw new Error(`CharacterBody not found for id ${character.character_body_id}`);

		return characterBody;
	}

	override save(): void {
		const { worldCharacterStore } = this.worldHook;
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
						held_world_item_id: this.heldWorldItemId ?? null,
					},
				},
			});
		}
	}

	override update(event: BeforeUpdateEvent): void {
		move(this, event);
	}

	tick(tick: number): void {
		// 모든 needs를 1씩 감소
		const { worldCharacterNeedStore } = this.worldHook;

		worldCharacterNeedStore.update((state) =>
			produce(state, (draft) => {
				const needs = Object.values(draft.data).filter(
					(need) => need.world_character_id === this.instanceId
				);

				for (const need of needs) {
					need.value = Math.max(0, need.value - 1);
				}
			})
		);
	}

	moveTo(targetX: number, targetY: number): void {
		// pathfinder로 경로 계산
		this.path = this.worldContext.pathfinder.findPath(
			vectorUtils.createVector(this.body.position.x, this.body.position.y),
			vectorUtils.createVector(targetX, targetY)
		);
	}
}
