import { get } from 'svelte/store';
import type {
	BuildingInteractionId,
	ItemInteractionId,
	CharacterInteractionId,
	NeedFulfillmentId,
	ConditionFulfillmentId,
	WorldItemId,
} from '$lib/types';
import type { WorldCharacterEntity } from '../../world-character-entity.svelte';
import { useBuilding } from '$lib/hooks/use-building';
import { useItem } from '$lib/hooks/use-item';
import { useCharacter } from '$lib/hooks/use-character';
import { useWorld } from '$lib/hooks/use-world';
import { vectorUtils } from '$lib/utils/vector';
import { EntityIdUtils } from '$lib/utils/entity-id';
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
	const { getBuildingInteraction, getBuildingInteractionActions } = useBuilding();
	const { getItem, getItemInteraction, getItemInteractionActions, itemInteractionStore } = useItem();
	const { getCharacterInteraction, getCharacterInteractionActions, getNeedFulfillment, needFulfillmentStore } =
		useCharacter();
	const { getWorldItem, worldItemStore } = useWorld();

	// Fulfillment와 Interaction 가져오기 (타겟 확인 전에 먼저 가져옴)
	const isNeedAction = 'need_id' in action;
	let fulfillment: any = undefined;

	if (isNeedAction) {		if (action.need_fulfillment_id) {
			fulfillment = getNeedFulfillment(action.need_fulfillment_id as NeedFulfillmentId);
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

	// 타겟 엔티티 확인
	if (!entity.currentTargetEntityId) {
		return;
	}

	const targetEntity = entity.worldContext.entities[entity.currentTargetEntityId];
	const { type: targetType, instanceId: targetInstanceId } = EntityIdUtils.parse(entity.currentTargetEntityId);

	// 타겟 엔티티가 없는 경우: 들고 있는 아이템일 수 있음 (이미 주워서 월드에서 제거됨)
	let isHeldItem = false;
	if (!targetEntity) {
		// 아이템이고 들고 있는 경우: 계속 진행 (사용하기 위해)
		if (targetType === 'item' && entity.heldWorldItemIds.includes(targetInstanceId as WorldItemId)) {
			isHeldItem = true;
		} else {
			// 타겟이 사라졌으면 타겟 클리어하고 재탐색
			entity.currentTargetEntityId = undefined;
			entity.path = [];
			return;
		}
	}

	// 아이템 타겟인 경우 자동 줍기/사용 판단
	let autoInteractType: 'item_pick' | 'item_use' | undefined;
	if (targetEntity?.type === 'item' || isHeldItem) {		const worldItemId = (targetEntity?.instanceId || targetInstanceId) as WorldItemId;
		const worldItem = getWorldItem(worldItemId);

		if (worldItem) {
			const isInWorld = worldItem.world_building_id === null && worldItem.world_character_id === null;
			const isHeld = entity.heldWorldItemIds.includes(worldItemId);

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
	console.log('[executeFulfill] Fulfillment:', {
		building_interaction_id: fulfillment.building_interaction_id,
		item_interaction_id: fulfillment.item_interaction_id,
		character_interaction_id: fulfillment.character_interaction_id,
	});

	let interaction: any = undefined;
	if (fulfillment.building_interaction_id) {
		interaction =
			getBuildingInteraction(
				fulfillment.building_interaction_id as BuildingInteractionId
			);
	} else if (fulfillment.item_interaction_id) {
		interaction =
			getItemInteraction(fulfillment.item_interaction_id as ItemInteractionId);
	} else if (fulfillment.character_interaction_id) {
		interaction =
			getCharacterInteraction(
				fulfillment.character_interaction_id as CharacterInteractionId
			);
	}

	// 2. autoInteractType이 있으면 타겟 아이템의 ItemInteraction 찾기
	if (!interaction && autoInteractType && (targetEntity?.type === 'item' || isHeldItem)) {		const worldItemId = (targetEntity?.instanceId || targetInstanceId) as WorldItemId;
		const worldItem = getWorldItem(worldItemId);

		if (worldItem) {			const item = getItem(worldItem.item_id);

			if (item) {
				// 아이템의 기본 ItemInteraction 찾기 (item_id가 일치하는 것)
				const itemInteractions = Object.values(get(itemInteractionStore).data);
				interaction = itemInteractions.find((i) => i.item_id === item.id);
				console.log('[executeFulfill] Found item interaction for auto type:', interaction?.id);
			}
		}
	}

	console.log('[executeFulfill] Interaction found:', !!interaction, 'autoInteractType:', autoInteractType);

	// 3. interaction_type 결정 (autoInteractType 우선)
	let repeatInteractType: string | undefined;
	if (autoInteractType) {
		repeatInteractType = autoInteractType;
		console.log('[executeFulfill] Using autoInteractType:', repeatInteractType);
	} else if (interaction) {
		if (!interaction.repeat_interaction_type) {
			return;
		}
		repeatInteractType = interaction.repeat_interaction_type;
		console.log('[executeFulfill] Using interaction.repeat_interaction_type:', repeatInteractType);
	} else {
		return;
	}

	// 타겟과의 거리 확인 (임계값: 100) - 들고 있는 아이템은 스킵
	if (targetEntity && !isHeldItem) {
		const distance = Math.hypot(targetEntity.x - entity.x, targetEntity.y - entity.y);

		if (distance >= 100) {
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
	}

	// InteractionAction 가져오기 및 실행
	let interactionCompleted = false;
	if (interaction) {
		// InteractionAction 가져오기
		let interactionActions: any[] = [];
		if (interaction.building_id !== undefined) {
			interactionActions = getBuildingInteractionActions(interaction.id as BuildingInteractionId) || [];
		} else if (interaction.item_id !== undefined) {
			interactionActions = getItemInteractionActions(interaction.id as ItemInteractionId) || [];
		} else if (interaction.target_character_id !== undefined) {
			interactionActions = getCharacterInteractionActions(interaction.id as CharacterInteractionId) || [];
		}

		if (interactionActions.length > 0) {
			// InteractionAction이 있으면 첫 번째 것 사용
			if (!entity.currentInteractionActionId) {
				const firstAction = interactionActions[0];
				entity.currentInteractionActionId = firstAction.id;
				entity.interactionActionStartTick = currentTick;
				console.log('[executeFulfill] Set currentInteractionActionId:', firstAction.id);

				// InteractionAction 시작과 동시에 item_pick 실행 (item_use는 duration 완료 후)
				if (repeatInteractType === 'item_pick') {
					console.log('[executeFulfill] Executing item_pick on start');
					if (!entity.heldWorldItemIds.includes((targetEntity?.instanceId || targetInstanceId) as WorldItemId)) {						const worldItemId = (targetEntity?.instanceId || targetInstanceId) as WorldItemId;

						entity.heldWorldItemIds.push(worldItemId);
						console.log('[executeFulfill] Picked up item:', worldItemId);

						// 바디만 월드에서 제거
						if (targetEntity) {
							targetEntity.removeFromWorld();
						}

						// worldItem.world_character_id 업데이트
						const worldItem = getWorldItem(worldItemId);
						if (worldItem) {
							worldItemStore.update((state) => ({
								...state,
								data: {
									...state.data,
									[worldItemId]: {
										...worldItem,
										world_character_id: entity.instanceId,
										world_building_id: null,
									},
								},
							}));
						}
					}
				}

				return;
			}

			// duration_ticks 확인
			const currentAction = interactionActions.find(a => a.id === entity.currentInteractionActionId);
			if (currentAction && currentAction.duration_ticks) {
				const elapsed = currentTick - entity.interactionActionStartTick;
				if (elapsed < currentAction.duration_ticks) {
					console.log('[executeFulfill] Action in progress:', elapsed, '/', currentAction.duration_ticks);
					return;
				}
			}

			// duration 완료 - item_use는 여기서 실행
			if (repeatInteractType === 'item_use') {
				console.log('[executeFulfill] Executing item_use on completion');				const worldItemId = (targetEntity?.instanceId || targetInstanceId) as WorldItemId;

				// 이미 들고 있는 아이템 사용 (소비)
				const itemIndex = entity.heldWorldItemIds.indexOf(worldItemId);
				if (itemIndex !== -1) {
					entity.heldWorldItemIds.splice(itemIndex, 1);
					entity.worldContext.deleteWorldItem(worldItemId);
					console.log('[executeFulfill] Used item:', worldItemId);
				}
			}

			interactionCompleted = true;
		} else {
			// InteractionAction이 없으면 매 틱마다 실행
			console.log('[executeFulfill] No InteractionAction, executing every tick');

			// item_pick/use 매 틱마다 실행
			if (repeatInteractType === 'item_pick') {
				if (targetEntity?.type === 'item' || isHeldItem) {					const worldItemId = (targetEntity?.instanceId || targetInstanceId) as WorldItemId;

					if (!entity.heldWorldItemIds.includes(worldItemId)) {
						entity.heldWorldItemIds.push(worldItemId);
						console.log('[executeFulfill] Picked up item (no action):', worldItemId);

						// 바디만 월드에서 제거
						if (targetEntity) {
							targetEntity.removeFromWorld();
						}

						// worldItem.world_character_id 업데이트
						const worldItem = getWorldItem(worldItemId);
						if (worldItem) {
							worldItemStore.update((state) => ({
								...state,
								data: {
									...state.data,
									[worldItemId]: {
										...worldItem,
										world_character_id: entity.instanceId,
										world_building_id: null,
									},
								},
							}));
						}
					}
				}
			} else if (repeatInteractType === 'item_use') {
				if (targetEntity?.type === 'item' || isHeldItem) {					const worldItemId = (targetEntity?.instanceId || targetInstanceId) as WorldItemId;

					const itemIndex = entity.heldWorldItemIds.indexOf(worldItemId);
					if (itemIndex !== -1) {
						entity.heldWorldItemIds.splice(itemIndex, 1);
						entity.worldContext.deleteWorldItem(worldItemId);
						console.log('[executeFulfill] Used item (no action):', worldItemId);
					}
				}
			}

			interactionCompleted = true;
		}
	} else {
		// interaction이 없으면 체인 없이 매 틱마다 실행
		console.log('[executeFulfill] No interaction, executing every tick');
		interactionCompleted = true;
	}

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

	// repeat_interaction_type: InteractionAction 완료 시 초기화 (다음 틱에서 다시 시작)
	if (interactionCompleted) {
		console.log('[executeFulfill] InteractionAction completed, clearing for next repeat');
		entity.currentInteractionActionId = undefined;
		entity.interactionActionStartTick = 0;
	}
}
