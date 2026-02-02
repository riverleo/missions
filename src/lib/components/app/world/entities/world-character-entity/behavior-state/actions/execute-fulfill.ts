import type {
	BuildingInteractionId,
	CharacterInteractionId,
	ConditionFulfillmentId,
	NeedFulfillmentId,
	WorldItemId,
	InteractionType,
	BehaviorAction,
	BuildingInteraction,
	ItemInteraction,
	CharacterInteraction,
	BuildingInteractionAction,
	ItemInteractionAction,
	CharacterInteractionAction,
	Fulfillment,
} from '$lib/types';
import type { WorldCharacterEntity } from '../../world-character-entity.svelte';
import { produce } from 'immer';
import { useBuilding } from '$lib/hooks/use-building';
import { useItem } from '$lib/hooks/use-item';
import { useCharacter } from '$lib/hooks/use-character';
import { useWorld } from '$lib/hooks/use-world';
import { vectorUtils } from '$lib/utils/vector';
import { EntityIdUtils } from '$lib/utils/entity-id';
import { InteractionIdUtils } from '$lib/utils/interaction-id';
import { FulfillmentIdUtils } from '$lib/utils/fulfillment-id';

/**
 * FULFILL 행동 실행 (욕구/컨디션 충족 - repeat_interaction_type)
 */
export default function executeFulfillAction(
	worldCharacterEntity: WorldCharacterEntity,
	action: BehaviorAction,
	currentTick: number
): void {
	const {
		getBuildingInteraction,
		getBuildingInteractionActions,
		getConditionFulfillment,
		getAllConditionFulfillments,
	} = useBuilding();
	const { getItem, getItemInteraction, getItemInteractionActions, getAllItemInteractions } =
		useItem();
	const {
		getCharacterInteraction,
		getCharacterInteractionActions,
		getNeedFulfillment,
		getAllNeedFulfillments,
	} = useCharacter();
	const { getWorldItem, worldItemStore } = useWorld();

	// Fulfillment와 Interaction 가져오기 (타겟 확인 전에 먼저 가져옴)
	const isNeedAction = 'need_id' in action;
	let fulfillment: Fulfillment | undefined = undefined;

	if (isNeedAction) {
		if (action.need_fulfillment_id) {
			const plainFulfillment = getNeedFulfillment(action.need_fulfillment_id);
			fulfillment = plainFulfillment ? FulfillmentIdUtils.to(plainFulfillment) : undefined;
		} else {
			// 자동 탐색: need_id로 필터링
			const fulfillments = getAllNeedFulfillments().filter((f) => f.need_id === action.need_id);
			fulfillment = fulfillments[0] ? FulfillmentIdUtils.to(fulfillments[0]) : undefined;
		}
	} else {
		if (action.condition_fulfillment_id) {
			const plainFulfillment = getConditionFulfillment(
				action.condition_fulfillment_id as ConditionFulfillmentId
			);
			fulfillment = plainFulfillment ? FulfillmentIdUtils.to(plainFulfillment) : undefined;
		} else {
			// 자동 탐색: condition_id로 필터링
			const fulfillments = getAllConditionFulfillments().filter(
				(f) => f.condition_id === action.condition_id
			);
			fulfillment = fulfillments[0] ? FulfillmentIdUtils.to(fulfillments[0]) : undefined;
		}
	}

	if (!fulfillment) {
		return;
	}

	// 타겟 엔티티 확인
	if (!worldCharacterEntity.behaviorState.entityId) {
		return;
	}

	const targetEntity =
		worldCharacterEntity.worldContext.entities[worldCharacterEntity.behaviorState.entityId];
	const { type: targetType, instanceId: targetInstanceId } = EntityIdUtils.parse(
		worldCharacterEntity.behaviorState.entityId
	);

	// 타겟 엔티티가 없는 경우: 들고 있는 아이템일 수 있음 (이미 주워서 월드에서 제거됨)
	let isHeldItem = false;
	if (!targetEntity) {
		// 아이템이고 들고 있는 경우: 계속 진행 (사용하기 위해)
		if (
			targetType === 'item' &&
			worldCharacterEntity.heldItemIds.includes(targetInstanceId as WorldItemId)
		) {
			isHeldItem = true;
		} else {
			// 타겟이 사라졌으면 타겟 클리어하고 재탐색
			worldCharacterEntity.behaviorState.entityId = undefined;
			worldCharacterEntity.behaviorState.path = [];
			return;
		}
	}

	// 아이템 타겟인 경우 자동 줍기/사용 판단
	let autoInteractType: 'item_pick' | 'item_use' | undefined;
	if (targetEntity?.type === 'item' || isHeldItem) {
		const worldItemId = (targetEntity?.instanceId || targetInstanceId) as WorldItemId;
		const worldItem = getWorldItem(worldItemId);

		if (worldItem) {
			const isInWorld =
				worldItem.world_building_id === null && worldItem.world_character_id === null;
			const isHeld = worldCharacterEntity.heldItemIds.includes(worldItemId);

			if (isInWorld && !isHeld) {
				// 월드에 존재하고 들고 있지 않음 → 줍기
				autoInteractType = 'item_pick';
			} else if (isHeld) {
				// 들고 있음 → 사용
				autoInteractType = 'item_use';
			}
		}
	}

	// 1. Interaction 가져오기 (Fulfillment에 명시된 경우)

	let interaction: BuildingInteraction | ItemInteraction | CharacterInteraction | undefined =
		undefined;
	if (fulfillment.building_interaction_id) {
		interaction = getBuildingInteraction(
			fulfillment.building_interaction_id as BuildingInteractionId
		);
	} else if (fulfillment.item_interaction_id) {
		interaction = getItemInteraction(fulfillment.item_interaction_id);
	} else if (fulfillment.character_interaction_id) {
		interaction = getCharacterInteraction(
			fulfillment.character_interaction_id as CharacterInteractionId
		);
	}

	// 2. autoInteractType이 있으면 타겟 아이템의 ItemInteraction 찾기
	if (!interaction && autoInteractType && (targetEntity?.type === 'item' || isHeldItem)) {
		const worldItemId = (targetEntity?.instanceId || targetInstanceId) as WorldItemId;
		const worldItem = getWorldItem(worldItemId);

		if (worldItem) {
			const item = getItem(worldItem.item_id);

			if (item) {
				// 아이템의 기본 ItemInteraction 찾기 (item_id가 일치하는 것)
				const itemInteractions = getAllItemInteractions();
				interaction = itemInteractions.find((i) => i.item_id === item.id);
			}
		}
	}

	// 3. interaction_type 결정 (autoInteractType 우선)
	let repeatInteractType: string | undefined;
	if (autoInteractType) {
		repeatInteractType = autoInteractType;
	} else if (interaction) {
		if (!interaction.repeat_interaction_type) {
			return;
		}
		repeatInteractType = interaction.repeat_interaction_type;
	} else {
		return;
	}

	// 타겟과의 거리 확인 (임계값: 100) - 들고 있는 아이템은 스킵
	if (targetEntity && !isHeldItem) {
		const distance = Math.hypot(
			targetEntity.x - worldCharacterEntity.x,
			targetEntity.y - worldCharacterEntity.y
		);

		if (distance >= 100) {
			// 아직 도착하지 않았으면, path가 없다면 다시 경로 설정
			if (worldCharacterEntity.behaviorState.path.length === 0) {
				const testPath = worldCharacterEntity.worldContext.pathfinder.findPath(
					vectorUtils.createVector(
						worldCharacterEntity.body.position.x,
						worldCharacterEntity.body.position.y
					),
					vectorUtils.createVector(targetEntity.x, targetEntity.y)
				);
				if (testPath.length > 0) {
					worldCharacterEntity.behaviorState.path = testPath;
				} else {
					// 경로를 찾을 수 없으면 타겟 클리어 (다음 tick에서 재탐색)
					worldCharacterEntity.behaviorState.entityId = undefined;
				}
			}
			return;
		}
	}

	// InteractionAction 가져오기 및 실행
	let interactionCompleted = false;
	if (interaction) {
		// Interaction 타입 판별
		let interactionType: InteractionType;
		let interactionActions:
			| BuildingInteractionAction[]
			| ItemInteractionAction[]
			| CharacterInteractionAction[] = [];
		if ('building_id' in interaction) {
			interactionType = 'building';
			interactionActions = getBuildingInteractionActions(interaction.id) || [];
		} else if ('item_id' in interaction) {
			interactionType = 'item';
			interactionActions = getItemInteractionActions(interaction.id) || [];
		} else if ('target_character_id' in interaction) {
			interactionType = 'character';
			interactionActions = getCharacterInteractionActions(interaction.id) || [];
		} else {
			return;
		}

		if (interactionActions.length > 0) {
			// InteractionAction이 있으면 첫 번째 것 사용
			if (!worldCharacterEntity.behaviorState.interactionTargetId) {
				const firstAction = interactionActions[0];
				if (!firstAction) return;
				worldCharacterEntity.behaviorState.interactionTargetId = InteractionIdUtils.create(
					interactionType,
					interaction.id as any,
					firstAction.id
				);
				worldCharacterEntity.behaviorState.interactionStartTick = currentTick;

				// InteractionAction 시작과 동시에 item_pick 실행 (item_use는 duration 완료 후)
				if (repeatInteractType === 'item_pick') {
					if (
						!worldCharacterEntity.heldItemIds.includes(
							(targetEntity?.instanceId || targetInstanceId) as WorldItemId
						)
					) {
						const worldItemId = (targetEntity?.instanceId || targetInstanceId) as WorldItemId;

						worldCharacterEntity.heldItemIds.push(worldItemId);

						// 바디만 월드에서 제거
						if (targetEntity) {
							targetEntity.removeFromWorld();
						}

						// worldItem.world_character_id 업데이트
						const worldItem = getWorldItem(worldItemId);
						if (worldItem) {
							worldItemStore.update((state) =>
								produce(state, (draft) => {
									draft.data[worldItemId] = {
										...worldItem,
										world_character_id: worldCharacterEntity.instanceId,
										world_building_id: null,
									};
								})
							);
						}
					}
				}

				return;
			}

			// duration_ticks 확인
			const { interactionActionId } = InteractionIdUtils.parse(
				worldCharacterEntity.behaviorState.interactionTargetId
			);
			const currentAction = interactionActions.find((a) => a.id === interactionActionId);
			if (currentAction && currentAction.duration_ticks) {
				const elapsed =
					currentTick - (worldCharacterEntity.behaviorState.interactionStartTick ?? 0);
				if (elapsed < currentAction.duration_ticks) {
					return;
				}
			}

			// duration 완료 - item_use는 여기서 실행
			if (repeatInteractType === 'item_use') {
				const worldItemId = (targetEntity?.instanceId || targetInstanceId) as WorldItemId;

				// 이미 들고 있는 아이템 사용 (소비)
				const itemIndex = worldCharacterEntity.heldItemIds.indexOf(worldItemId);
				if (itemIndex !== -1) {
					worldCharacterEntity.heldItemIds.splice(itemIndex, 1);
					worldCharacterEntity.worldContext.deleteWorldItem(worldItemId);
				}
			}

			interactionCompleted = true;
		} else {
			// InteractionAction이 없으면 매 틱마다 실행

			// item_pick/use 매 틱마다 실행
			if (repeatInteractType === 'item_pick') {
				if (targetEntity?.type === 'item' || isHeldItem) {
					const worldItemId = (targetEntity?.instanceId || targetInstanceId) as WorldItemId;

					if (!worldCharacterEntity.heldItemIds.includes(worldItemId)) {
						worldCharacterEntity.heldItemIds.push(worldItemId);

						// 바디만 월드에서 제거
						if (targetEntity) {
							targetEntity.removeFromWorld();
						}

						// worldItem.world_character_id 업데이트
						const worldItem = getWorldItem(worldItemId);
						if (worldItem) {
							worldItemStore.update((state) =>
								produce(state, (draft) => {
									draft.data[worldItemId] = {
										...worldItem,
										world_character_id: worldCharacterEntity.instanceId,
										world_building_id: null,
									};
								})
							);
						}
					}
				}
			} else if (repeatInteractType === 'item_use') {
				if (targetEntity?.type === 'item' || isHeldItem) {
					const worldItemId = (targetEntity?.instanceId || targetInstanceId) as WorldItemId;

					const itemIndex = worldCharacterEntity.heldItemIds.indexOf(worldItemId);
					if (itemIndex !== -1) {
						worldCharacterEntity.heldItemIds.splice(itemIndex, 1);
						worldCharacterEntity.worldContext.deleteWorldItem(worldItemId);
					}
				}
			}

			interactionCompleted = true;
		}
	} else {
		// interaction이 없으면 체인 없이 매 틱마다 실행
		interactionCompleted = true;
	}

	// 매 틱마다 increase_per_tick 적용
	if (isNeedAction) {
		const needId = action.need_id;
		const currentNeed = worldCharacterEntity.needs[needId];
		if (currentNeed && fulfillment.increase_per_tick) {
			const newValue = Math.min(100, currentNeed.value + fulfillment.increase_per_tick);
			worldCharacterEntity.needs = {
				...worldCharacterEntity.needs,
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

	// repeat_interaction_type: InteractionAction 완료 시 초기화 (다음 틱에서 다시 시작)
	if (interactionCompleted) {
		worldCharacterEntity.behaviorState.interactionTargetId = undefined;
		worldCharacterEntity.behaviorState.interactionStartTick = 0;
	}
}
