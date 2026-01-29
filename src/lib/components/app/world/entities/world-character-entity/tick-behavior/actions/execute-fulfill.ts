import { get } from 'svelte/store';
import type {
	BuildingInteractionId,
	ItemInteractionId,
	CharacterInteractionId,
	NeedFulfillmentId,
	ConditionFulfillmentId,
} from '$lib/types';
import type { WorldCharacterEntity } from '../../world-character-entity.svelte';
import { useBuilding } from '$lib/hooks/use-building';
import { useItem } from '$lib/hooks/use-item';
import { useCharacter } from '$lib/hooks/use-character';
import { vectorUtils } from '$lib/utils/vector';
import startInteractionChain from '../interaction-chain/start-chain';
import tickInteractionAction from '../interaction-chain/tick-chain';

/**
 * FULFILL 행동 실행 (욕구/컨디션 충족 - repeat_interaction_type)
 */
export default function executeFulfillAction(
	entity: WorldCharacterEntity,
	action: any,
	currentTick: number
): void {
	if (!entity.currentTargetEntityId) return;

	const targetEntity = entity.worldContext.entities[entity.currentTargetEntityId];
	if (!targetEntity) {
		// 타겟이 사라졌으면 타겟 클리어하고 재탐색
		entity.currentTargetEntityId = undefined;
		entity.path = [];
		return;
	}

	// 타겟과의 거리 확인 (임계값: 50)
	const distance = Math.hypot(targetEntity.x - entity.x, targetEntity.y - entity.y);

	if (distance >= 50) {
		// 아직 도착하지 않았으면, path가 없다면 다시 경로 설정
		if (entity.path.length === 0) {
			const testPath = entity.worldContext.pathfinder.findPath(
				vectorUtils.createVector(entity.body.position.x, entity.body.position.y),
				vectorUtils.createVector(targetEntity.x, targetEntity.y)
			);
			if (testPath.length > 0) {
				entity.path = testPath;
			} else {
				// 경로를 찾을 수 없으면 타겟 클리어 (다음 tick에서 재탐색)
				entity.currentTargetEntityId = undefined;
			}
		}
		return;
	}

	// 타겟에 도착: Fulfillment와 Interaction 가져오기
	const isNeedAction = 'need_id' in action;
	let fulfillment: any = undefined;

	if (isNeedAction) {
		const { needFulfillmentStore } = useCharacter();
		if (action.need_fulfillment_id) {
			fulfillment = get(needFulfillmentStore).data[action.need_fulfillment_id as NeedFulfillmentId];
		} else {
			// 자동 탐색: need_id로 필터링
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
			// 자동 탐색: condition_id로 필터링
			const fulfillments = Object.values(get(conditionFulfillmentStore).data).filter(
				(f) => f.condition_id === action.condition_id
			);
			fulfillment = fulfillments[0];
		}
	}

	if (!fulfillment) {
		console.error('Fulfillment not found for action:', action);
		return;
	}

	// Interaction 가져오기
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

	if (!interaction || !interaction.repeat_interaction_type) {
		console.error('Interaction not found or not a repeat_interaction_type:', fulfillment);
		return;
	}

	// InteractionAction 체인이 아직 시작되지 않았으면 시작
	if (!entity.currentInteractionActionId) {
		startInteractionChain(entity, interaction, currentTick);
		return;
	}

	// InteractionAction 체인 실행
	const interactionCompleted = tickInteractionAction(entity, interaction, currentTick);

	// 매 틱마다 increase_per_tick 적용
	if (isNeedAction) {
		const needId = action.need_id;
		const currentNeed = entity.worldCharacterNeeds[needId];
		if (currentNeed && fulfillment.increase_per_tick) {
			const newValue = Math.min(100, currentNeed.value + fulfillment.increase_per_tick);
			entity.worldCharacterNeeds = {
				...entity.worldCharacterNeeds,
				[needId]: {
					...currentNeed,
					value: newValue,
				},
			};
		}
	} else {
		// TODO: Condition fulfillment 로직 (building durability/cleanliness 등)
		// 건물 수리/청소 등 구현 필요
	}

	// repeat_interaction_type: 체인 완료 시 root로 돌아가서 반복
	if (interactionCompleted) {
		entity.currentInteractionActionId = undefined;
		entity.interactionActionStartTick = 0;
		// 다음 틱에서 체인이 다시 시작됨
	}
}
