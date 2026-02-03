import type { WorldCharacterEntityBehavior } from './world-character-entity-behavior.svelte';
import type { Entity } from '../../entity.svelte';
import { useBehavior } from '$lib/hooks/use-behavior';
import { useWorld } from '$lib/hooks/use-world';
import { EntityIdUtils } from '$lib/utils/entity-id';
import { vectorUtils } from '$lib/utils/vector';
import { TARGET_ARRIVAL_DISTANCE } from '$lib/constants';
import type { WorldItemId } from '$lib/types';

/**
 * 타겟 엔티티 탐색 및 경로 설정
 *
 * 현재 행동에 필요한 타겟 엔티티를 찾고, 해당 타겟까지의 경로를 설정합니다.
 * - 들고 있는 아이템 중 사용 가능한 것이 있으면 우선 선택
 * - target_selection_method에 따라 타겟 후보 필터링
 * - 거리 순으로 정렬하여 경로 탐색 (pathfinding)
 *
 * @returns true: 행동 실행 중단, false: 행동 실행 계속 진행
 */
export default function tickFindAndGo(this: WorldCharacterEntityBehavior, tick: number): boolean {
	const { getInteraction, getEntitySourceId, getWorldItem } = useWorld();
	const { getBehaviorAction, searchEntitySources } = useBehavior();

	const behaviorAction = getBehaviorAction(this.behaviorTargetId)!;

	// idle 행동은 타겟이 필요 없음
	if (behaviorAction.type === 'idle') return false;

	// 타겟이 있으면 도착 여부 확인
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

	const entities = Object.values(this.worldCharacterEntity.worldContext.entities);
	const entitySourceIds = new Set(searchEntitySources(behaviorAction).map((es) => es.id));

	for (const heldItemEntityId of this.worldCharacterEntity.heldItemIds) {
		const worldItem = getWorldItem(EntityIdUtils.instanceId<WorldItemId>(heldItemEntityId));
		if (worldItem && entitySourceIds.has(worldItem.item_id)) {
			this.targetEntityId = heldItemEntityId;
			this.path = [];
			return false; // 들고 있는 아이템이므로 바로 실행 가능
		}
	}

	let candidateEntities: Entity[] = [];

	if (behaviorAction.target_selection_method === 'explicit') {
		const interaction = getInteraction(behaviorAction);
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
	} else if (
		behaviorAction.target_selection_method === 'search' ||
		behaviorAction.target_selection_method === 'search_or_continue'
	) {
		candidateEntities = entities.filter(
			(e) => entitySourceIds.has(e.sourceId) && e.id !== this.worldCharacterEntity.id
		);
	}

	if (candidateEntities.length > 0) {
		const sortedCandidates = vectorUtils.sortByDistance(
			this.worldCharacterEntity,
			candidateEntities
		);

		// 가장 가까운 후보를 타겟으로 설정 (경로는 다음 틱에서 계산)
		this.targetEntityId = sortedCandidates[0]!.id;
		return true;
	}

	return true; // 타겟을 찾을 수 없음, 행동 중단
}
