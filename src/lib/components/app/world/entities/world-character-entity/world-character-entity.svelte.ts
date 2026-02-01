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
	BehaviorTargetId,
	InteractionTargetId,
	EntityId,
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
import { updateMove } from './update-move';
import { tickWorldCharacterNeeds } from './tick-world-character-needs';
import { tickBehavior } from './tick-behavior/index';

export class WorldCharacterEntity extends Entity {
	readonly type = 'character' as const;
	body: Matter.Body;
	path: Vector[] = $state([]);
	direction: WorldCharacterEntityDirection = $state('right');
	heldWorldItemIds = $state<WorldItemId[]>([]);
	worldCharacterNeeds: Record<NeedId, WorldCharacterNeed> = $state({});
	currentTargetEntityId = $state<EntityId | undefined>(undefined);
	currentBehaviorTargetId = $state<BehaviorTargetId | undefined>(undefined);
	behaviorActionStartTick = $state<number>(0);
	currentInteractionTargetId = $state<InteractionTargetId | undefined>(undefined);
	interactionTargetStartTick = $state<number>(0);

	override get instanceId(): WorldCharacterId {
		return EntityIdUtils.instanceId<WorldCharacterId>(this.id);
	}

	constructor(worldContext: WorldContext, worldId: WorldId, worldCharacterId: WorldCharacterId) {
		super(worldContext, 'character', worldId, worldCharacterId);

		const { getWorldCharacter, getAllWorldItems, getAllWorldCharacterNeeds } = useWorld();
		const worldCharacter = getWorldCharacter(worldCharacterId);
		const characterBody = this.characterBody;

		if (!worldCharacter) {
			throw new Error(
				`Cannot create WorldCharacterEntity: missing data for id ${worldCharacterId}`
			);
		}

		// heldWorldItemIds 초기화 (worldItemStore에서 world_character_id가 자신인 아이템들 검색)
		this.heldWorldItemIds = getAllWorldItems()
			.filter((item) => item.world_character_id === worldCharacterId)
			.map((item) => item.id);

		// needs 초기화 (스토어와 연결을 끊기 위해 spread로 복사)
		const characterNeeds = getAllWorldCharacterNeeds().filter(
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
		updateMove(this, event);
	}

	tick(tick: number): void {
		tickWorldCharacterNeeds(this, tick);
		tickBehavior(this, tick);
	}

	moveTo(targetX: number, targetY: number): void {
		// pathfinder로 경로 계산
		this.path = this.worldContext.pathfinder.findPath(
			vectorUtils.createVector(this.body.position.x, this.body.position.y),
			vectorUtils.createVector(targetX, targetY)
		);
	}
}
