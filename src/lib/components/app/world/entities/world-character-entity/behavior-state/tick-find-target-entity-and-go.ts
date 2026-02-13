import { useBehavior, useWorld, useInteraction } from '$lib/hooks';
import type { WorldCharacterEntityBehavior } from './world-character-entity-behavior.svelte';
import { EntityIdUtils } from '$lib/utils/entity-id';
import { InteractionIdUtils } from '$lib/utils/interaction-id';
import { vectorUtils } from '$lib/utils/vector';
import { TARGET_ARRIVAL_DISTANCE } from '$lib/constants';
import type { EntitySourceId, InteractionQueue, Interaction, WorldItemId } from '$lib/types';
import { getAllInteractionsByBehaviorTargetId } from '$lib/hooks/use-behavior/get-all-interactions-by-behavior-target-id';
import { getAllEntitySourcesByInteraction } from '$lib/hooks/use-behavior/get-all-entity-sources-by-interaction';

/**
 * # 타깃 엔티티 탐색 및 경로 설정
 *
 * 현재 행동에 필요한 타깃 엔티티를 찾고, 해당 타깃까지의 경로를 설정합니다.
 * - 들고 있는 아이템 중 사용 가능한 것이 있으면 우선 선택
 * - 타깃 선택 방식(target_selection_method)에 따라 대상 후보(EntitySource)를 필터링
 * - 거리 순으로 정렬하여 경로 탐색 (pathfinding)
 *
 * @param tick - 현재 게임 틱 번호
 * @returns {boolean} true = 중단, false = 계속 진행
 *
 * ## 명세
 * - [x] 행동 타입이 대기인 경우 타깃 엔티티를 탐색하지 않고 계속 진행한다.
 * - [x] 현재 타깃 엔티티가 들고 있는 아이템인 경우 경로를 초기화하고 계속 진행한다.
 * - [x] 현재 타깃 엔티티가 들고 있는 아이템이 아닌 경우 경로를 최신화하고 계속 진행한다.
 * - [x] 타깃 선택 방식이 명시적인 경우 지정된 상호작용 액션을 기반으로 대상 후보를 필터링한다.
 * - [x] 타깃 선택 방식이 검색인 경우 검색(searchEntitySources)으로 대상 후보를 필터링한다.
 * - [x] 아무런 대상 후보도 찾지 못한 경우 계속 진행한다.
 * - [x] 자기 자신은 타깃 엔티티가 될 수 없다.
 * - 들고 있는 아이템 중 대상 후보가 있는 경우
 *    - [x] 대상 후보와 일치하는 첫번째 아이템을 타깃 엔티티로 설정한다.
 *    - [x] 핵심 상호작용 대상을 상호작용 큐에 설정한다.
 * - 들고 있는 아이템 중 대상 후보가 없는 경우
 *    - [x] 캐릭터와 가장 가까운 엔티티 중 대상 후보와 일치하는 엔티티를 타깃 엔티티로 설정한다.
 *    - [x] 월드 캐릭터 아이디가 설정된 아이템은 캐릭터의 타깃 엔티티가 될 수 없다.
 * - [x] 현재 행동에 대한 타깃 엔티티를 찾지 못한 경우 계속 진행한다.
 */
export default function tickFindTargetEntityAndGo(
	this: WorldCharacterEntityBehavior,
	tick: number
): boolean {
	const { getEntitySourceId, getWorldItem } = useWorld();
	const { getBehaviorAction } = useBehavior();
	const { getOrUndefinedRootInteractionAction } = useInteraction();

	if (!this.behaviorTargetId) return false;

	const behaviorAction = getBehaviorAction(this.behaviorTargetId);

	// 1. 행동 타입이 대기인 경우 계속 진행
	if (behaviorAction.type === 'idle') return false;

	// 2. 현재 타깃 엔티티가 있는 경우
	if (this.targetEntityId) {
		const worldCharacterEntity = this.worldCharacterEntity;
		const targetEntity = worldCharacterEntity.worldContext.entities[this.targetEntityId];

		if (targetEntity === undefined) return false;

		// 들고 있는 아이템인 경우
		const isHeldItem = worldCharacterEntity.heldItemIds.includes(this.targetEntityId);
		if (isHeldItem) {
			this.path = [];
			return false;
		}

		// 들고 있는 아이템이 아닌 경우
		const distance = vectorUtils.getDistance(worldCharacterEntity, targetEntity);
		if (distance < TARGET_ARRIVAL_DISTANCE) {
			this.path = [];
			return false;
		}

		// 경로 최신화
		this.path = worldCharacterEntity.worldContext.pathfinder.findPath(
			worldCharacterEntity,
			targetEntity
		);
		return false;
	}

	// 3. 타깃이 없는 경우: 대상 후보 탐색
	const setCoreInteractionTargetId = (coreInteraction: Interaction | undefined): void => {
		const rootAction = getOrUndefinedRootInteractionAction(coreInteraction);
		if (!rootAction) return;

		this.interactionQueue.coreInteractionTargetId = InteractionIdUtils.create(rootAction);
	};

	const isItemTargetedByOtherCharacter = (itemEntityId: string): boolean => {
		for (const entity of Object.values(this.worldCharacterEntity.worldContext.entities)) {
			if (entity.id === this.worldCharacterEntity.id) continue;

			const targetEntityId = entity.behavior?.targetEntityId;
			if (targetEntityId === itemEntityId) return true;
		}

		return false;
	};

	const trySetTargetEntity = (
		targetEntitySourceIds: EntitySourceId[],
		coreInteraction?: Interaction
	): boolean => {
		if (targetEntitySourceIds.length === 0) {
			return false;
		}

		// 4. 들고 있는 아이템 중 대상 후보가 있는 경우
		for (const heldItemEntityId of this.worldCharacterEntity.heldItemIds) {
			const { sourceId } = EntityIdUtils.parse(heldItemEntityId);
			if (targetEntitySourceIds.includes(sourceId)) {
				// 타깃 엔티티로 설정
				// 소유 상태(world_character_id)는 여기서 변경하지 않음.
				// 실제 소지 확정은 item_pick 상호작용 완료 시점에 처리한다.
				this.targetEntityId = heldItemEntityId;
				this.path = [];

				// InteractionQueue 생성
				setCoreInteractionTargetId(coreInteraction);

				return true;
			}
		}

		// 5. 들고 있는 아이템 중 대상 후보가 없는 경우
		const entities = Object.values(this.worldCharacterEntity.worldContext.entities);

		// 월드 캐릭터 아이디가 설정된 아이템은 제외
		const candidateEntities = entities.filter((e) => {
			if (!targetEntitySourceIds.includes(e.sourceId)) return false;
			if (e.id === this.worldCharacterEntity.id) return false;

			// 아이템인 경우 다른 캐릭터가 이미 소지 중인 아이템은 제외
			// world_character_id는 "실제 소지 상태"로만 사용한다.
			if (EntityIdUtils.is('item', e.id)) {
				const worldItemId = EntityIdUtils.instanceId<WorldItemId>(e.id);
				const worldItem = getWorldItem(worldItemId);
				if (
					worldItem.world_character_id &&
					worldItem.world_character_id !== this.worldCharacterEntity.instanceId
				) {
					return false;
				}

				// 아이템 타깃 예약은 별도 맵이 아니라 각 캐릭터의 targetEntityId로 판단한다.
				if (isItemTargetedByOtherCharacter(e.id)) {
					return false;
				}
			}

			return true;
		});

		// 가장 가까운 엔티티를 타깃으로 설정
		if (candidateEntities.length > 0) {
			const sortedCandidates = vectorUtils.sortByDistance(
				this.worldCharacterEntity,
				candidateEntities
			);
			this.targetEntityId = sortedCandidates[0]!.id;

			// InteractionQueue 생성
			setCoreInteractionTargetId(coreInteraction);

			return true;
		}

		return false;
	};

	// 타깃 선택 방식이 명시적인 경우
	if (behaviorAction.target_selection_method === 'explicit') {
		const entitySourceId = getEntitySourceId(behaviorAction);
		trySetTargetEntity([entitySourceId]);
		return false;
	}

	// 타깃 선택 방식이 검색인 경우
	if (behaviorAction.target_selection_method === 'search') {
		const interactions = getAllInteractionsByBehaviorTargetId(
			this.behaviorTargetId,
			this.worldCharacterEntity.sourceId
		);

		for (const coreInteraction of interactions) {
			const targetEntitySourceIds = getAllEntitySourcesByInteraction(coreInteraction).map((es) => es.id);
			if (trySetTargetEntity(targetEntitySourceIds, coreInteraction)) {
				return false;
			}
		}
	}

	// 6. 타깃 엔티티를 찾지 못한 경우
	return false;
}
