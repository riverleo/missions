import { useBehavior, useWorld } from '$lib/hooks';
import type { WorldCharacterEntityBehavior } from './world-character-entity-behavior.svelte';
import { EntityIdUtils } from '$lib/utils/entity-id';
import { vectorUtils } from '$lib/utils/vector';
import { TARGET_ARRIVAL_DISTANCE } from '$lib/constants';
import type { EntitySourceId } from '$lib/types';

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
 * - 들고 있는 아이템 중 대상 후보가 있는 경우
 *    - [x] 대상 후보와 일치하는 첫번째 아이템을 타깃 엔티티로 설정한다.
 *    - [x] 아이템의 월드 캐릭터 아이디를 현재 캐릭터로 설정한다.
 * - 들고 있는 아이템 중 대상 후보가 없는 경우
 *    - [x] 캐릭터와 가장 가까운 엔티티 중 대상 후보와 일치하는 엔티티를 타깃 엔티티로 설정한다.
 *    - [x] 스토어에서 월드 아이템의 캐릭터 아이디를 현재 캐릭터로 설정한다.
 *    - [x] 월드 캐릭터 아이디가 설정된 아이템은 캐릭터의 타깃 엔티티가 될 수 없다.
 * - [x] 현재 행동에 대한 타깃 엔티티를 찾지 못한 경우 계속 진행한다.
 */
export default function tickFindTargetEntityAndGo(
	this: WorldCharacterEntityBehavior,
	tick: number
): boolean {
	const { getEntitySourceId, getWorldItem, updateWorldItem } = useWorld();
	const { getBehaviorAction, searchEntitySources } = useBehavior();

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

	// 3. 타깃이 없는 경우: 대상 후보 필터링
	let targetEntitySourceIds: Set<EntitySourceId> = new Set();

	// 타깃 선택 방식에 따라 후보 필터링
	if (behaviorAction.target_selection_method === 'explicit') {
		const entitySourceId = getEntitySourceId(behaviorAction);
		targetEntitySourceIds = new Set([entitySourceId]);
	} else if (behaviorAction.target_selection_method === 'search') {
		targetEntitySourceIds = new Set(
			searchEntitySources(this.behaviorTargetId, this.worldCharacterEntity.sourceId).map(
				(entitySource) => entitySource.id
			)
		);
	}

	// 아무런 대상 후보도 찾지 못한 경우
	if (targetEntitySourceIds.size === 0) {
		return false;
	}

	// 4. 들고 있는 아이템 중 대상 후보가 있는 경우
	for (const heldItemEntityId of this.worldCharacterEntity.heldItemIds) {
		const worldItem = getWorldItem(EntityIdUtils.instanceId(heldItemEntityId));
		if (worldItem && targetEntitySourceIds.has(worldItem.item_id)) {
			// 타깃 엔티티로 설정
			this.targetEntityId = heldItemEntityId;
			this.path = [];

			// 아이템의 월드 캐릭터 아이디를 현재 캐릭터로 설정
			updateWorldItem(worldItem.id, {
				world_character_id: this.worldCharacterEntity.instanceId,
			});

			return false;
		}
	}

	// 5. 들고 있는 아이템 중 대상 후보가 없는 경우
	const entities = Object.values(this.worldCharacterEntity.worldContext.entities);

	// 월드 캐릭터 아이디가 설정된 아이템은 제외
	const candidateEntities = entities.filter((e) => {
		if (!targetEntitySourceIds.has(e.sourceId)) return false;
		if (e.id === this.worldCharacterEntity.id) return false;

		// 아이템인 경우 캐릭터 ID가 없는 것만
		const worldItem = getWorldItem(EntityIdUtils.instanceId(e.id));
		if (worldItem && worldItem.world_character_id) return false;

		return true;
	});

	// 가장 가까운 엔티티를 타깃으로 설정
	if (candidateEntities.length > 0) {
		const sortedCandidates = vectorUtils.sortByDistance(
			this.worldCharacterEntity,
			candidateEntities
		);
		const targetEntity = sortedCandidates[0]!;

		this.targetEntityId = targetEntity.id;

		// 스토어에서 월드 아이템의 캐릭터 아이디를 현재 캐릭터로 설정
		const worldItem = getWorldItem(EntityIdUtils.instanceId(targetEntity.id));
		if (worldItem) {
			updateWorldItem(worldItem.id, {
				world_character_id: this.worldCharacterEntity.instanceId,
			});
		}

		return false;
	}

	// 6. 타깃 엔티티를 찾지 못한 경우
	return false;
}
