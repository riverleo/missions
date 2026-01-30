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
	// Fulfillment와 Interaction 가져오기 (타겟 확인 전에 먼저 가져옴)
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

	// 타겟 엔티티 확인
	if (!entity.currentTargetEntityId) {
		console.log('[executeFulfill] No target entity ID');
		return;
	}

	const targetEntity = entity.worldContext.entities[entity.currentTargetEntityId];
	const { type: targetType, instanceId: targetInstanceId } = EntityIdUtils.parse(entity.currentTargetEntityId);

	// 타겟 엔티티가 없는 경우: 들고 있는 아이템일 수 있음 (이미 주워서 월드에서 제거됨)
	let isHeldItem = false;
	if (!targetEntity) {
		// 아이템이고 들고 있는 경우: 계속 진행 (사용하기 위해)
		if (targetType === 'item' && entity.heldWorldItemIds.includes(targetInstanceId as WorldItemId)) {
			console.log('[executeFulfill] Target item is held, continuing without entity');
			isHeldItem = true;
		} else {
			// 타겟이 사라졌으면 타겟 클리어하고 재탐색
			console.log('[executeFulfill] Target entity not found and not held, clearing');
			entity.currentTargetEntityId = undefined;
			entity.path = [];
			return;
		}
	}

	// 아이템 타겟인 경우 자동 줍기/사용 판단
	let autoInteractType: 'item_pick' | 'item_use' | undefined;
	if (targetEntity?.type === 'item' || isHeldItem) {
		const { worldItemStore } = useWorld();
		const worldItemId = (targetEntity?.instanceId || targetInstanceId) as WorldItemId;
		const worldItem = get(worldItemStore).data[worldItemId];

		console.log('[executeFulfill] Item check:', {
			worldItemId,
			worldItem: worldItem ? {
				world_building_id: worldItem.world_building_id,
				world_character_id: worldItem.world_character_id,
			} : 'not found',
			heldWorldItemIds: entity.heldWorldItemIds,
		});

		if (worldItem) {
			const isInWorld = worldItem.world_building_id === null && worldItem.world_character_id === null;
			const isHeld = entity.heldWorldItemIds.includes(worldItemId);

			console.log('[executeFulfill] Item state:', { isInWorld, isHeld });

			if (isInWorld && !isHeld) {
				// 월드에 존재하고 들고 있지 않음 → 줍기
				autoInteractType = 'item_pick';
				console.log('[executeFulfill] Auto interaction type: item_pick');
			} else if (isHeld) {
				// 들고 있음 → 사용
				autoInteractType = 'item_use';
				console.log('[executeFulfill] Auto interaction type: item_use');
			}
		}
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

	// interaction이 없고 auto type이 있으면 interaction 없이 진행
	let repeatInteractType: string | undefined;
	if (interaction) {
		if (!interaction.repeat_interaction_type) {
			console.error('Interaction has no repeat_interaction_type:', fulfillment);
			return;
		}
		repeatInteractType = interaction.repeat_interaction_type;
	} else if (autoInteractType) {
		repeatInteractType = autoInteractType;
	} else {
		console.error('No interaction and no auto interaction type:', fulfillment);
		return;
	}

	// 타겟과의 거리 확인 (임계값: 50) - 들고 있는 아이템은 스킵
	if (targetEntity && !isHeldItem) {
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
	}

	// InteractionAction 체인 시작 및 실행 (interaction이 있는 경우만)
	let interactionCompleted = false;
	if (interaction) {
		if (!entity.currentInteractionActionId) {
			startInteractionChain(entity, interaction, currentTick);
			return;
		}

		// InteractionAction 체인 실행
		interactionCompleted = tickInteractionAction(entity, interaction, currentTick);
	} else {
		// interaction이 없으면 체인 없이 매 틱마다 실행
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

	// repeat_interaction_type: 체인 완료 시 처리
	if (interactionCompleted) {
		entity.currentInteractionActionId = undefined;
		entity.interactionActionStartTick = 0;

		// 자동 줍기/사용 처리
		if (targetEntity?.type === 'item' || isHeldItem) {
			const { worldItemStore } = useWorld();
			const worldItemId = (targetEntity?.instanceId || targetInstanceId) as WorldItemId;

			if (autoInteractType === 'item_pick') {
				// 줍기만
				if (!entity.heldWorldItemIds.includes(worldItemId)) {
					entity.heldWorldItemIds.push(worldItemId);

					// 바디만 월드에서 제거 (targetEntity가 있는 경우만)
					if (targetEntity) {
						targetEntity.removeFromWorld();
					}

					// worldItem.world_character_id 업데이트
					const worldItem = get(worldItemStore).data[worldItemId];
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
			} else if (autoInteractType === 'item_use') {
				// 이미 들고 있는 아이템 사용 (소비)
				const itemIndex = entity.heldWorldItemIds.indexOf(worldItemId);
				if (itemIndex !== -1) {
					entity.heldWorldItemIds.splice(itemIndex, 1);
					entity.worldContext.deleteWorldItem(worldItemId);
				}
			}
		}
		// 다음 틱에서 체인이 다시 시작됨
	}
}
