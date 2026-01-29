import { get } from 'svelte/store';
import type {
	NeedBehaviorActionId,
	ConditionBehaviorActionId,
	NeedFulfillmentId,
	ConditionFulfillmentId,
	ItemInteractionId,
	BuildingInteractionId,
	CharacterInteractionId,
} from '$lib/types';
import type { WorldCharacterEntity } from '../world-character-entity.svelte';
import { useBehavior } from '$lib/hooks/use-behavior';
import { useBuilding } from '$lib/hooks/use-building';
import { useItem } from '$lib/hooks/use-item';
import { useCharacter } from '$lib/hooks/use-character';
import { BehaviorActionIdUtils } from '$lib/utils/behavior-action-id';
import searchTargetAndSetPath from './search-target';
import executeGoAction from './actions/execute-go';
import executeInteractAction from './actions/execute-interact';
import executeFulfillAction from './actions/execute-fulfill';
import executeIdleAction from './actions/execute-idle';
import checkActionCompletion from './completion/check-completion';
import transitionToNextAction from './completion/transition';
import selectNewBehavior from './selection/select-behavior';

/**
 * fulfill 액션이 item_use를 사용하는지 확인
 */
function isFulfillWithItemUse(action: any): boolean {
	if (action.type !== 'fulfill') return false;

	const isNeedAction = 'need_id' in action;
	let fulfillment: any = undefined;

	if (isNeedAction) {
		const { needFulfillmentStore } = useCharacter();
		if (action.need_fulfillment_id) {
			fulfillment = get(needFulfillmentStore).data[action.need_fulfillment_id as NeedFulfillmentId];
		} else {
			const fulfillments = Object.values(get(needFulfillmentStore).data).filter(
				(f) => f.need_id === action.need_id
			);
			fulfillment = fulfillments[0];
		}
	} else {
		const { conditionFulfillmentStore } = useBuilding();
		if (action.condition_fulfillment_id) {
			fulfillment =
				get(conditionFulfillmentStore).data[
					action.condition_fulfillment_id as ConditionFulfillmentId
				];
		} else {
			const fulfillments = Object.values(get(conditionFulfillmentStore).data).filter(
				(f) => f.condition_id === action.condition_id
			);
			fulfillment = fulfillments[0];
		}
	}

	if (!fulfillment) return false;

	// Interaction 확인
	const { buildingInteractionStore } = useBuilding();
	const { itemInteractionStore } = useItem();
	const { characterInteractionStore } = useCharacter();

	let interaction: any = undefined;
	if (fulfillment.building_interaction_id) {
		interaction =
			get(buildingInteractionStore).data[
				fulfillment.building_interaction_id as BuildingInteractionId
			];
	} else if (fulfillment.item_interaction_id) {
		interaction =
			get(itemInteractionStore).data[fulfillment.item_interaction_id as ItemInteractionId];
	} else if (fulfillment.character_interaction_id) {
		interaction =
			get(characterInteractionStore).data[
				fulfillment.character_interaction_id as CharacterInteractionId
			];
	}

	return interaction?.repeat_interaction_type === 'item_use';
}

/**
 * 캐릭터의 행동을 tick마다 처리
 */
export function tickBehavior(entity: WorldCharacterEntity, tick: number): void {
	const { needBehaviorActionStore, conditionBehaviorActionStore } = useBehavior();

	// 현재 행동 액션이 없으면 새로운 행동 선택
	if (!entity.currentBehaviorActionId) {
		selectNewBehavior(entity, tick);
		return;
	}

	// 현재 행동 액션 가져오기
	const { type } = BehaviorActionIdUtils.parse(entity.currentBehaviorActionId);

	const actionId = BehaviorActionIdUtils.actionId(entity.currentBehaviorActionId);
	const action =
		type === 'need'
			? get(needBehaviorActionStore).data[actionId as NeedBehaviorActionId]
			: get(conditionBehaviorActionStore).data[actionId as ConditionBehaviorActionId];

	if (!action) {
		// 액션을 찾을 수 없으면 행동 종료
		entity.currentBehaviorActionId = undefined;
		return;
	}

	// 1. Search: path가 없고 타겟이 없으면 대상 탐색 및 경로 설정
	// item_use는 들고 있는 아이템을 사용하므로 타겟 탐색 불필요
	const needsTargetSearch =
		(action.type === 'go' || action.type === 'interact' || action.type === 'fulfill') &&
		entity.path.length === 0 &&
		!entity.currentTargetEntityId &&
		!isFulfillWithItemUse(action);

	if (needsTargetSearch) {
		searchTargetAndSetPath(entity, action);
		return; // 경로 설정 후 다음 tick에서 실행
	}

	// 2. 행동 실행
	if (action.type === 'go') {
		executeGoAction(entity, action);
	} else if (action.type === 'interact') {
		executeInteractAction(entity, action, tick);
	} else if (action.type === 'fulfill') {
		executeFulfillAction(entity, action, tick);
	} else if (action.type === 'idle') {
		executeIdleAction(entity, action);
	}

	// 3. Do until behavior_completion_type: 완료 조건 확인
	const isCompleted = checkActionCompletion(entity, action, tick);
	if (isCompleted) {
		transitionToNextAction(entity, action, tick);
	}
}
