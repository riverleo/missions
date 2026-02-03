import { useCharacter, useWorld } from '$lib/hooks';
import Matter from 'matter-js';
import { produce } from 'immer';
import type {
	WorldId,
	WorldCharacterId,
	CharacterBody,
	WorldItemId,
	WorldCharacterNeed,
	NeedId,
	Vector,
	EntityId,
} from '$lib/types';
import { WorldCharacterEntityBehavior } from './behavior-state';
import { EntityIdUtils } from '$lib/utils/entity-id';
import { vectorUtils } from '$lib/utils/vector';
import { CATEGORY_BOUNDARY, CATEGORY_TILE, CATEGORY_CHARACTER } from '$lib/constants';
import { Entity } from '../entity.svelte';
import type { BeforeUpdateEvent, WorldContext } from '../../context';
import { tickWorldCharacterNeeds } from './tick-world-character-needs';

export class WorldCharacterEntity extends Entity {
	readonly type = 'character' as const;
	body: Matter.Body;
	heldItemIds = $state<EntityId[]>([]);
	needs: Record<NeedId, WorldCharacterNeed> = $state({});
	behavior: WorldCharacterEntityBehavior;

	override get instanceId(): WorldCharacterId {
		return EntityIdUtils.instanceId<WorldCharacterId>(this.id);
	}

	get sourceId() {
		const { getWorldCharacter } = useWorld();
		const worldCharacter = getWorldCharacter(this.instanceId);
		if (!worldCharacter) throw new Error(`WorldCharacter not found for id ${this.instanceId}`);
		return worldCharacter.character_id;
	}

	constructor(worldContext: WorldContext, worldId: WorldId, worldCharacterId: WorldCharacterId) {
		super(worldContext, 'character', worldId, worldCharacterId);

		this.behavior = new WorldCharacterEntityBehavior(this);

		const { getWorldCharacter, getAllWorldItems, getAllWorldCharacterNeeds } = useWorld();
		const worldCharacter = getWorldCharacter(worldCharacterId);
		const characterBody = this.characterBody;

		if (!worldCharacter) {
			throw new Error(
				`Cannot create WorldCharacterEntity: missing data for id ${worldCharacterId}`
			);
		}

		// heldWorldItemIds 초기화 (worldItemStore에서 world_character_id가 자신인 아이템들 검색)
		this.heldItemIds = getAllWorldItems()
			.filter((item) => item.world_character_id === worldCharacterId)
			.map((item) => EntityIdUtils.createId('item', worldId, item.id));

		// needs 초기화 (스토어와 연결을 끊기 위해 spread로 복사)
		const characterNeeds = getAllWorldCharacterNeeds().filter(
			(need) => need.world_character_id === worldCharacterId
		);
		this.needs = {};
		for (const need of characterNeeds) {
			this.needs[need.need_id] = { ...need };
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
		const { getWorldCharacter } = useWorld();
		const { getCharacter, getCharacterBody } = useCharacter();

		const worldCharacter = getWorldCharacter(this.instanceId);
		if (!worldCharacter) throw new Error(`WorldCharacter not found for id ${this.instanceId}`);

		const character = getCharacter(worldCharacter.character_id);
		if (character === undefined)
			throw new Error(`Character not found for id ${worldCharacter.character_id}`);

		const characterBody = getCharacterBody(character.character_body_id);
		if (characterBody === undefined)
			throw new Error(`CharacterBody not found for id ${character.character_body_id}`);

		return characterBody;
	}

	override save(): void {
		const { worldCharacterStore, worldCharacterNeedStore } = useWorld();

		worldCharacterStore.update((state) =>
			produce(state, (draft) => {
				const worldCharacter = draft.data[this.instanceId];
				if (worldCharacter) {
					worldCharacter.x = this.x;
					worldCharacter.y = this.y;
				}
			})
		);

		// needs 저장
		worldCharacterNeedStore.update((state) =>
			produce(state, (draft) => {
				for (const need of Object.values(this.needs)) {
					const storeNeed = draft.data[need.id];
					if (storeNeed) {
						storeNeed.value = need.value;
					}
				}
			})
		);
	}

	override update(event: BeforeUpdateEvent): void {
		this.behavior.update(event);
	}

	tick(tick: number): void {
		tickWorldCharacterNeeds(this, tick);
		this.behavior.tick(tick);
	}

	moveTo(vector: Vector): void {
		// pathfinder로 경로 계산
		this.behavior.path = this.worldContext.pathfinder.findPath(
			vectorUtils.createVector(this.body.position.x, this.body.position.y),
			vector
		);
	}
}
