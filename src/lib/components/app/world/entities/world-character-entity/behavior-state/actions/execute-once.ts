import { useCharacter, useItem, useWorld, useInteraction } from '$lib/hooks';
import type { WorldItemId, BehaviorAction, Interaction } from '$lib/types';
import type { WorldCharacterEntity } from '../../world-character-entity.svelte';
import { produce } from 'immer';
import { EntityIdUtils } from '$lib/utils/entity-id';
import { InteractionIdUtils } from '$lib/utils/interaction-id';
import { vectorUtils } from '$lib/utils/vector';
import { TARGET_ARRIVAL_DISTANCE } from '$lib/constants';

/**
 * ONCE 행동 실행 (상호작용 - once_interaction_type)
 */
export default function executeOnceAction(
	worldCharacterEntity: WorldCharacterEntity,
	behaviorAction: BehaviorAction,
	tick: number
): void {
	const { getItem } = useItem();
	const { getAllItemInteractions } = useInteraction();
	const { getNeedFulfillment } = useCharacter();
	const { getWorldItem, worldItemStore, getInteraction, getInteractionActions } = useWorld();

	if (!worldCharacterEntity.behavior.targetEntityId) {
		return;
	}

	const targetEntity =
		worldCharacterEntity.worldContext.entities[worldCharacterEntity.behavior.targetEntityId];
	const { type: targetType, instanceId: targetInstanceId } = EntityIdUtils.parse(
		worldCharacterEntity.behavior.targetEntityId
	);

	// 타겟 엔티티가 없는 경우: 들고 있는 아이템일 수 있음
	let isHeldItem = false;
	if (!targetEntity) {
		// 아이템이고 들고 있는 경우: 계속 진행 (사용하기 위해)
		if (targetType === 'item') {
			const itemEntityId = EntityIdUtils.createId(
				'item',
				worldCharacterEntity.worldContext.worldId,
				targetInstanceId as WorldItemId
			);
			if (worldCharacterEntity.heldItemIds.includes(itemEntityId)) {
				isHeldItem = true;
			} else {
				// 타겟이 사라졌으면 타겟 클리어하고 재탐색
				worldCharacterEntity.behavior.targetEntityId = undefined;
				worldCharacterEntity.behavior.path = [];
				return;
			}
		} else {
			// 타겟이 사라졌으면 타겟 클리어하고 재탐색
			worldCharacterEntity.behavior.targetEntityId = undefined;
			worldCharacterEntity.behavior.path = [];
			return;
		}
	}

	// 타겟과의 거리 확인 (임계값: 100) - 들고 있는 아이템은 스킵
	if (targetEntity && !isHeldItem) {
		const distance = vectorUtils.getDistance(worldCharacterEntity, targetEntity);

		if (distance >= TARGET_ARRIVAL_DISTANCE) {
			// 아직 도착하지 않았으면, path가 없다면 다시 경로 설정
			if (worldCharacterEntity.behavior.path.length === 0) {
				const testPath = worldCharacterEntity.worldContext.pathfinder.findPath(
					worldCharacterEntity,
					targetEntity
				);
				if (testPath.length > 0) {
					worldCharacterEntity.behavior.path = testPath;
				} else {
					// 경로를 찾을 수 없으면 타겟 클리어 (다음 tick에서 재탐색)
					worldCharacterEntity.behavior.targetEntityId = undefined;
				}
			}
			return;
		}
	}

	// 타겟에 도착: InteractionAction 체인 시작 또는 실행

	// 아이템 타겟인 경우 자동 줍기/사용 판단
	let autoInteractType: 'item_pick' | 'item_use' | undefined;
	if (targetEntity?.type === 'item' || isHeldItem) {
		const worldItemId = (targetEntity?.instanceId || targetInstanceId) as WorldItemId;
		const worldItem = getWorldItem(worldItemId);

		if (worldItem) {
			const isInWorld =
				worldItem.world_building_id === null && worldItem.world_character_id === null;
			const itemEntityId = EntityIdUtils.createId(
				'item',
				worldCharacterEntity.worldContext.worldId,
				worldItemId
			);
			const isHeld = worldCharacterEntity.heldItemIds.includes(itemEntityId);

			if (isInWorld && !isHeld) {
				// 월드에 존재하고 들고 있지 않음 → 줍기
				autoInteractType = 'item_pick';
			} else if (isHeld) {
				// 들고 있음 → 사용
				autoInteractType = 'item_use';
			}
		}
	}

	// 1. Interaction 찾기 (BehaviorAction에 명시된 경우)
	let interaction = getInteraction(behaviorAction);

	// 2. autoInteractType이 있으면 타겟 아이템의 ItemInteraction 찾기
	if (!interaction && autoInteractType && (targetEntity?.type === 'item' || isHeldItem)) {
		const worldItemId = (targetEntity?.instanceId || targetInstanceId) as WorldItemId;
		const worldItem = getWorldItem(worldItemId);

		if (worldItem) {
			const item = getItem(worldItem.item_id);

			if (item) {
				// 아이템의 기본 ItemInteraction 찾기 (item_id가 일치하는 것)
				const itemInteractions = getAllItemInteractions();
				const plainInteraction = itemInteractions.find((i) => i.item_id === item.id);
				interaction = plainInteraction
					? InteractionIdUtils.interaction.to(plainInteraction)
					: undefined;
			}
		}
	}

	// 3. interaction_type 결정 (autoInteractType 우선)
	let interactType: string | undefined;
	if (autoInteractType) {
		interactType = autoInteractType;
	} else if (interaction) {
		if (!interaction.once_interaction_type) {
			return;
		}
		interactType = interaction.once_interaction_type;
	} else {
		return;
	}

	// 4. InteractionAction 가져오기 및 실행
	let interactionCompleted = false;
	if (interaction) {
		const interactionActions = getInteractionActions(interaction);

		if (interactionActions.length > 0) {
			// InteractionAction이 있으면 첫 번째 것 사용
			if (!worldCharacterEntity.behavior.interactionTargetId) {
				const firstAction = interactionActions[0];
				if (!firstAction) return;
				worldCharacterEntity.behavior.interactionTargetId = InteractionIdUtils.create(firstAction);
				worldCharacterEntity.behavior.interactionTargetStartTick = tick;

				// InteractionAction 시작과 동시에 item_pick 실행 (item_use는 duration 완료 후)
				if (interactType === 'item_pick') {
					if (targetEntity?.type === 'item' || isHeldItem) {
						const worldItemId = (targetEntity?.instanceId || targetInstanceId) as WorldItemId;
						const itemEntityId = EntityIdUtils.createId(
							'item',
							worldCharacterEntity.worldContext.worldId,
							worldItemId
						);

						// 아이템 줍기: heldWorldItemIds에 추가
						if (!worldCharacterEntity.heldItemIds.includes(itemEntityId)) {
							worldCharacterEntity.heldItemIds.push(itemEntityId);
						}

						// 바디만 월드에서 제거 (targetEntity가 있는 경우만)
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

						// 타겟 클리어
						worldCharacterEntity.behavior.targetEntityId = undefined;
					}
				}

				return;
			}

			// duration_ticks 확인
			const { interactionActionId } = InteractionIdUtils.parse(
				worldCharacterEntity.behavior.interactionTargetId
			);
			const currentAction = interactionActions.find((a) => a.id === interactionActionId);
			if (currentAction && currentAction.duration_ticks) {
				const elapsed = tick - (worldCharacterEntity.behavior.interactionTargetStartTick ?? 0);
				if (elapsed < currentAction.duration_ticks) {
					return;
				}
			}

			// duration 완료 - item_use는 여기서 실행

			if (interactType === 'item_use') {
				if (targetEntity?.type === 'item' || isHeldItem) {
					const worldItemId = (targetEntity?.instanceId || targetInstanceId) as WorldItemId;
					const itemEntityId = EntityIdUtils.createId(
						'item',
						worldCharacterEntity.worldContext.worldId,
						worldItemId
					);

					// 월드에 있는 아이템이면 먼저 줍기
					const worldItem = getWorldItem(worldItemId);
					if (
						worldItem &&
						worldItem.world_building_id === null &&
						worldItem.world_character_id === null
					) {
						// 줍기
						if (!worldCharacterEntity.heldItemIds.includes(itemEntityId)) {
							worldCharacterEntity.heldItemIds.push(itemEntityId);
						}

						// 바디 제거 (targetEntity가 있는 경우만)
						if (targetEntity) {
							targetEntity.removeFromWorld();
						}

						// worldItem.world_character_id 업데이트
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

					// 아이템 사용 (소비)
					const itemIndex = worldCharacterEntity.heldItemIds.indexOf(itemEntityId);
					if (itemIndex !== -1) {
						worldCharacterEntity.heldItemIds.splice(itemIndex, 1);
						worldCharacterEntity.worldContext.deleteWorldItem(worldItemId);
					}

					// 타겟 클리어
					worldCharacterEntity.behavior.targetEntityId = undefined;
				}
			}

			interactionCompleted = true;
		} else {
			// InteractionAction이 없으면 바로 실행하고 완료

			// item_pick/use 실행
			if (interactType === 'item_pick') {
				if (targetEntity?.type === 'item' || isHeldItem) {
					const worldItemId = (targetEntity?.instanceId || targetInstanceId) as WorldItemId;
					const itemEntityId = EntityIdUtils.createId(
						'item',
						worldCharacterEntity.worldContext.worldId,
						worldItemId
					);

					// 아이템 줍기: heldWorldItemIds에 추가
					if (!worldCharacterEntity.heldItemIds.includes(itemEntityId)) {
						worldCharacterEntity.heldItemIds.push(itemEntityId);
					}

					// 바디만 월드에서 제거 (targetEntity가 있는 경우만)
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

					// 타겟 클리어
					worldCharacterEntity.behavior.targetEntityId = undefined;
				}
			} else if (interactType === 'item_use') {
				if (targetEntity?.type === 'item' || isHeldItem) {
					const worldItemId = (targetEntity?.instanceId || targetInstanceId) as WorldItemId;
					const itemEntityId = EntityIdUtils.createId(
						'item',
						worldCharacterEntity.worldContext.worldId,
						worldItemId
					);

					// 월드에 있는 아이템이면 먼저 줍기
					const worldItem = getWorldItem(worldItemId);
					if (
						worldItem &&
						worldItem.world_building_id === null &&
						worldItem.world_character_id === null
					) {
						// 줍기
						if (!worldCharacterEntity.heldItemIds.includes(itemEntityId)) {
							worldCharacterEntity.heldItemIds.push(itemEntityId);
						}

						// 바디 제거 (targetEntity가 있는 경우만)
						if (targetEntity) {
							targetEntity.removeFromWorld();
						}

						// worldItem.world_character_id 업데이트
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

					// 아이템 사용 (소비)
					const itemIndex = worldCharacterEntity.heldItemIds.indexOf(itemEntityId);
					if (itemIndex !== -1) {
						worldCharacterEntity.heldItemIds.splice(itemIndex, 1);
						worldCharacterEntity.worldContext.deleteWorldItem(worldItemId);
					}

					// 타겟 클리어
					worldCharacterEntity.behavior.targetEntityId = undefined;
				}
			}

			interactionCompleted = true;
		}
	} else {
		// interaction이 없으면 체인 없이 바로 완료
		interactionCompleted = true;
	}

	// 매 틱마다 increase_per_tick 적용 (once 상호작용도 체인 실행 중 욕구 충족)
	const isNeedAction = 'need_id' in behaviorAction;
	if (isNeedAction && behaviorAction.need_fulfillment_id) {
		const fulfillment = getNeedFulfillment(behaviorAction.need_fulfillment_id);

		if (fulfillment && fulfillment.increase_per_tick) {
			const needId = behaviorAction.need_id;
			const currentNeed = worldCharacterEntity.needs[needId];
			if (currentNeed) {
				const newValue = Math.min(100, currentNeed.value + fulfillment.increase_per_tick);
				worldCharacterEntity.needs[needId] = {
					...currentNeed,
					value: newValue,
				};
			}
		}
	}

	if (!interactionCompleted) {
		return; // 아직 InteractionAction 실행 중
	}

	// InteractionAction 완료: 상태 초기화
	worldCharacterEntity.behavior.interactionTargetId = undefined;
	worldCharacterEntity.behavior.interactionTargetStartTick = 0;
}
