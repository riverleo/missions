import Matter from 'matter-js';
import { get } from 'svelte/store';
import { produce } from 'immer';
import type {
	WorldId,
	WorldCharacterId,
	CharacterBody,
	WorldItemId,
	WorldCharacterNeed,
	NeedId,
} from '$lib/types';
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
	heldWorldItemId = $state<WorldItemId | undefined>(undefined);
	worldCharacterNeeds: Record<NeedId, WorldCharacterNeed> = $state({});

	override get instanceId(): WorldCharacterId {
		return EntityIdUtils.instanceId<WorldCharacterId>(this.id);
	}

	constructor(worldContext: WorldContext, worldId: WorldId, worldCharacterId: WorldCharacterId) {
		super(worldContext, 'character', worldId, worldCharacterId);

		const { worldCharacterStore, worldCharacterNeedStore } = useWorld();
		const worldCharacter = get(worldCharacterStore).data[worldCharacterId];
		const characterBody = this.characterBody;

		if (!worldCharacter) {
			throw new Error(
				`Cannot create WorldCharacterEntity: missing data for id ${worldCharacterId}`
			);
		}

		// held_world_item_id 초기화
		this.heldWorldItemId = worldCharacter.held_world_item_id ?? undefined;

		// needs 초기화 (스토어와 연결을 끊기 위해 spread로 복사)
		const characterNeeds = Object.values(get(worldCharacterNeedStore).data).filter(
			(need) => need.world_character_id === worldCharacterId
		);
		this.worldCharacterNeeds = {};
		for (const need of characterNeeds) {
			this.worldCharacterNeeds[need.need_id] = { ...need };
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
		const { worldCharacterStore } = useWorld();
		const { characterStore, characterBodyStore } = useCharacter();

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
		const { worldCharacterStore, worldCharacterNeedStore } = useWorld();
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

		// needs 저장
		worldCharacterNeedStore.update((state) =>
			produce(state, (draft) => {
				for (const need of Object.values(this.worldCharacterNeeds)) {
					const storeNeed = draft.data[need.id];
					if (storeNeed) {
						storeNeed.value = need.value;
					}
				}
			})
		);
	}

	override update(event: BeforeUpdateEvent): void {
		move(this, event);
	}

	tick(tick: number): void {
		// 모든 needs를 1씩 감소
		for (const need of Object.values(this.worldCharacterNeeds)) {
			need.value = Math.max(0, need.value - 1);
		}
	}

	moveTo(targetX: number, targetY: number): void {
		// pathfinder로 경로 계산
		this.path = this.worldContext.pathfinder.findPath(
			vectorUtils.createVector(this.body.position.x, this.body.position.y),
			vectorUtils.createVector(targetX, targetY)
		);
	}
}
