import { useCharacter, useWorld } from '$lib/hooks';
import Matter from 'matter-js';
import type {
	WorldId,
	WorldCharacterId,
	CharacterBody,
	CharacterId,
	WorldCharacterNeed,
	NeedId,
	Vector,
	EntityId,
} from '$lib/types';
import { WorldCharacterEntityBehavior } from './behavior';
import { EntityIdUtils } from '$lib/utils/entity-id';
import { vectorUtils } from '$lib/utils/vector';
import { CATEGORY_BOUNDARY, CATEGORY_TILE, CATEGORY_CHARACTER } from '$lib/constants';
import { Entity } from '../entity.svelte';
import type { BeforeUpdateEvent, WorldContext } from '../../context';
import tickDecreaseNeeds from './tick-decrease-needs';

export class WorldCharacterEntity extends Entity {
	readonly type = 'character' as const;
	body: Matter.Body;
	heldItemIds = $state<EntityId[]>([]);
	needs: Record<NeedId, WorldCharacterNeed> = $state({});
	behavior: WorldCharacterEntityBehavior;
	private bodyAnimationCompleteListeners = new Set<() => void>();

	tickDecreaseNeeds = tickDecreaseNeeds;

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
		const { getWorldCharacter, getAllWorldItems, getAllWorldCharacterNeeds } = useWorld();
		const worldCharacter = getWorldCharacter(worldCharacterId);

		if (!worldCharacter) {
			throw new Error(
				`Cannot create WorldCharacterEntity: missing data for id ${worldCharacterId}`
			);
		}

		super(worldContext, 'character', worldId, worldCharacter.character_id, worldCharacterId);

		this.behavior = new WorldCharacterEntityBehavior(this);
		const characterBody = this.characterBody;

		// heldWorldItemIds 초기화 (worldItemStore에서 world_character_id가 자신인 아이템들 검색)
		this.heldItemIds = getAllWorldItems()
			.filter((item) => item.world_character_id === worldCharacterId)
			.map((item) => EntityIdUtils.createId(EntityIdUtils.to(item)));

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
		const { getCharacter, getCharacterBody } = useCharacter();
		const character = getCharacter(EntityIdUtils.sourceId<CharacterId>(this.id));
		return getCharacterBody(character.character_body_id);
	}

	override save(): void {
		const { updateWorldCharacter, updateWorldCharacterNeed } = useWorld();

		updateWorldCharacter(this.instanceId, {
			x: this.x,
			y: this.y,
		});

		// needs 저장
		for (const need of Object.values(this.needs)) {
			updateWorldCharacterNeed(need.id, {
				value: need.value,
			});
		}
	}

	override update(event: BeforeUpdateEvent): void {
		this.behavior.update(event);
	}

	tick(tick: number): void {
		this.tickDecreaseNeeds(tick);
		this.behavior.tick(tick);
	}

	moveTo(vector: Vector): void {
		// pathfinder로 경로 계산
		this.behavior.path = this.worldContext.pathfinder.findPath(
			vectorUtils.createVector(this.body.position.x, this.body.position.y),
			vector
		);
	}

	/**
	 * 바디 애니메이션 완료 콜백을 등록합니다.
	 * 반환값을 호출하면 등록 해제됩니다.
	 */
	onBodyAnimationComplete(listener: () => void): () => void {
		this.bodyAnimationCompleteListeners.add(listener);
		return () => {
			this.bodyAnimationCompleteListeners.delete(listener);
		};
	}

	/**
	 * 현재 등록된 바디 애니메이션 완료 콜백을 실행합니다.
	 */
	emitBodyAnimationComplete(): void {
		for (const listener of this.bodyAnimationCompleteListeners) {
			listener();
		}
	}
}
