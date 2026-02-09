import { useBehavior, useWorld, useInteraction } from '$lib/hooks';
import type { WorldCharacterEntityBehavior } from './world-character-entity-behavior.svelte';
import type { Entity } from '../../entity.svelte';
import { EntityIdUtils } from '$lib/utils/entity-id';
import { vectorUtils } from '$lib/utils/vector';
import { TARGET_ARRIVAL_DISTANCE } from '$lib/constants';

/**
 * # 타겟 엔티티 탐색 및 경로 설정
 *
 * 현재 행동에 필요한 타겟 엔티티를 찾고, 해당 타겟까지의 경로를 설정합니다.
 * - 들고 있는 아이템 중 사용 가능한 것이 있으면 우선 선택
 * - target_selection_method에 따라 타겟 후보 필터링
 * - 거리 순으로 정렬하여 경로 탐색 (pathfinding)
 *
 * @param tick - 현재 게임 틱 번호
 * @returns {boolean} true = 중단, false = 계속 진행
 *
 * ## 명세
 * - [x] 인터렉션이 진행 중이면 계속 진행한다.
 * - [x] 현재 행동 타깃이 없으면 계속 진행한다.
 * - [x] 행동 타입이 idle이면 계속 진행한다.
 * - 타겟 엔티티가 있는 경우
 *   - [x] 타겟 엔티티를 찾을 수 없으면 중단한다.
 *   - [x] 도착 범위 내이면 경로를 초기화하고 계속 진행한다.
 *   - [x] 도착 범위 밖이면 경로를 최신화하고 중단한다.
 * - 타겟 엔티티가 없는 경우
 *   - [x] 들고 있는 아이템 중 사용 가능한 것이 있으면 타겟으로 설정하고 계속 진행한다.
 *   - [x] target_selection_method가 explicit인 경우 entity source로 후보를 필터링한다.
 *   - [x] target_selection_method가 search인 경우 entity sources로 후보를 필터링한다.
 *   - [x] 후보가 있으면 가장 가까운 엔티티를 타겟으로 설정하고 중단한다.
 *   - [x] 후보가 없으면 초기화하고 중단한다.
 */
export default function tickFindAndGo(
	this: WorldCharacterEntityBehavior,
	tick: number
): boolean {
	const { getEntitySourceId, getWorldItem } = useWorld();
	const { getBehaviorAction, searchEntitySources } = useBehavior();
	const { getInteractionByBehaviorAction } = useInteraction();

	// 1. 인터렉션이 진행 중이면 skip
	if (this.interactionTargetId) return false;

	// 2. 현재 행동 타깃이 없으면 skip
	if (!this.behaviorTargetId) return false;

	const behaviorAction = getBehaviorAction(this.behaviorTargetId);

	// 3. idle 타입은 타겟이 필요 없으므로 skip
	if (behaviorAction.type === 'idle') return false;

	// 4. 타겟이 있으면 도착 여부 확인
	if (this.targetEntityId) {
		const worldCharacterEntity = this.worldCharacterEntity;
		const targetEntity = worldCharacterEntity.worldContext.entities[this.targetEntityId];

		if (targetEntity === undefined) return true;

		const distance = vectorUtils.getDistance(worldCharacterEntity, targetEntity);

		// 도착 범위 내: 남은 경로 초기화하고 행동 실행
		if (distance < TARGET_ARRIVAL_DISTANCE) {
			this.path = [];
			return false;
		}

		// 아직 도착 안 함: 경로 최신화
		this.path = worldCharacterEntity.worldContext.pathfinder.findPath(
			worldCharacterEntity,
			targetEntity
		);
		return true;
	}

	// 5. 타겟이 없는 경우: 타겟 찾기
	const entities = Object.values(this.worldCharacterEntity.worldContext.entities);
	const entitySources = searchEntitySources(behaviorAction);
	const entitySourceIds = new Set(entitySources.map((es) => es.id));

	// 6. 들고 있는 아이템 중 사용 가능한 것이 있으면 우선 선택
	for (const heldItemEntityId of this.worldCharacterEntity.heldItemIds) {
		const worldItem = getWorldItem(EntityIdUtils.instanceId(heldItemEntityId));
		if (worldItem && entitySourceIds.has(worldItem.item_id)) {
			this.targetEntityId = heldItemEntityId;
			this.path = [];
			return false; // 들고 있는 아이템이므로 바로 실행 가능
		}
	}

	let candidateEntities: Entity[] = [];

	// 7. target_selection_method에 따라 후보 필터링
	if (behaviorAction.target_selection_method === 'explicit') {
		const interaction = getInteractionByBehaviorAction(behaviorAction);
		if (interaction) {
			const entitySourceId = getEntitySourceId(behaviorAction);
			if (!entitySourceId) {
				throw new Error(
					`Explicit target selection requires entity source but none found for behaviorAction: ${behaviorAction.id}`
				);
			}

			candidateEntities = entities.filter(
				(e) => e.sourceId === entitySourceId && e.id !== this.worldCharacterEntity.id
			);
		}
	} else if (behaviorAction.target_selection_method === 'search') {
		candidateEntities = entities.filter(
			(e) => entitySourceIds.has(e.sourceId) && e.id !== this.worldCharacterEntity.id
		);
	}

	// 8. 후보가 있으면 가장 가까운 것을 타겟으로 설정
	if (candidateEntities.length > 0) {
		const sortedCandidates = vectorUtils.sortByDistance(
			this.worldCharacterEntity,
			candidateEntities
		);

		// 가장 가까운 후보를 타겟으로 설정 (경로는 다음 틱에서 계산)
		this.targetEntityId = sortedCandidates[0]!.id;
		return true;
	}

	// 9. 타겟을 찾을 수 없음 - 행동 종료
	this.clear();
	return true;
}
