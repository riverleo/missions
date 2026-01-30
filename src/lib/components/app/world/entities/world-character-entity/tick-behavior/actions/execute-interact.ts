import { get } from 'svelte/store';
import type {
	BuildingInteractionId,
	ItemInteractionId,
	CharacterInteractionId,
	WorldItemId,
	NeedFulfillmentId,
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
 * INTERACT 행동 실행 (상호작용 - once_interaction_type)
 */
export default function executeInteractAction(
	entity: WorldCharacterEntity,
	action: any,
	currentTick: number
): void {
	console.log('[executeInteract] Start');

	if (!entity.currentTargetEntityId) {
		console.log('[executeInteract] No target entity');
		return;
	}

	const targetEntity = entity.worldContext.entities[entity.currentTargetEntityId];
	const { type: targetType, instanceId: targetInstanceId } = EntityIdUtils.parse(entity.currentTargetEntityId);

	// 타겟 엔티티가 없는 경우: 들고 있는 아이템일 수 있음
	let isHeldItem = false;
	if (!targetEntity) {
		// 아이템이고 들고 있는 경우: 계속 진행 (사용하기 위해)
		if (targetType === 'item' && entity.heldWorldItemIds.includes(targetInstanceId as WorldItemId)) {
			console.log('[executeInteract] Target item is held, continuing without entity');
			isHeldItem = true;
		} else {
			// 타겟이 사라졌으면 타겟 클리어하고 재탐색
			console.log('[executeInteract] Target entity not found in world and not held');
			entity.currentTargetEntityId = undefined;
			entity.path = [];
			return;
		}
	}

	// 타겟과의 거리 확인 (임계값: 50) - 들고 있는 아이템은 스킵
	if (targetEntity && !isHeldItem) {
		const distance = Math.hypot(targetEntity.x - entity.x, targetEntity.y - entity.y);
		console.log(`[executeInteract] Distance to target: ${distance.toFixed(1)}`);

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

	// 타겟에 도착: InteractionAction 체인 시작 또는 실행
	const { buildingInteractionStore } = useBuilding();
	const { itemInteractionStore } = useItem();
	const { characterInteractionStore } = useCharacter();

	console.log('[executeInteract] Action interaction IDs:', {
		buildingId: action.building_interaction_id,
		itemId: action.item_interaction_id,
		characterId: action.character_interaction_id,
	});

	// 아이템 타겟인 경우 자동 줍기/사용 판단
	let autoInteractType: 'item_pick' | 'item_use' | undefined;
	if (targetEntity?.type === 'item' || isHeldItem) {
		const { worldItemStore } = useWorld();
		const worldItemId = (targetEntity?.instanceId || targetInstanceId) as WorldItemId;
		const worldItem = get(worldItemStore).data[worldItemId];

		if (worldItem) {
			const isInWorld = worldItem.world_building_id === null && worldItem.world_character_id === null;
			const isHeld = entity.heldWorldItemIds.includes(worldItemId);

			if (isInWorld && !isHeld) {
				// 월드에 존재하고 들고 있지 않음 → 줍기
				autoInteractType = 'item_pick';
				console.log('[executeInteract] Auto interaction type: item_pick (item in world)');
			} else if (isHeld) {
				// 들고 있음 → 사용
				autoInteractType = 'item_use';
				console.log('[executeInteract] Auto interaction type: item_use (item held)');
			}
		}
	}

	let interaction: any = undefined;
	if (action.building_interaction_id) {
		interaction =
			get(buildingInteractionStore).data[action.building_interaction_id as BuildingInteractionId];
		console.log('[executeInteract] Building interaction:', interaction);
	} else if (action.item_interaction_id) {
		interaction = get(itemInteractionStore).data[action.item_interaction_id as ItemInteractionId];
		console.log('[executeInteract] Item interaction:', interaction);
	} else if (action.character_interaction_id) {
		interaction =
			get(characterInteractionStore).data[action.character_interaction_id as CharacterInteractionId];
		console.log('[executeInteract] Character interaction:', interaction);
	}

	// interaction이 없고 auto type이 있으면 interaction 없이 진행
	let interactType: string | undefined;
	if (interaction) {
		if (!interaction.once_interaction_type) {
			console.error('[executeInteract] Interaction has no once_interaction_type:', interaction);
			return;
		}
		interactType = interaction.once_interaction_type;
		console.log('[executeInteract] Interaction type:', interactType);
	} else if (autoInteractType) {
		interactType = autoInteractType;
		console.log('[executeInteract] Using auto interaction type:', interactType);
	} else {
		console.error('[executeInteract] No interaction and no auto interaction type');
		return;
	}

	// InteractionAction 체인 시작 및 실행 (interaction이 있는 경우만)
	let interactionCompleted = false;
	if (interaction) {
		if (!entity.currentInteractionActionId) {
			console.log('[executeInteract] Starting interaction chain');
			startInteractionChain(entity, interaction, currentTick);
			return;
		}

		// InteractionAction 체인 실행
		console.log('[executeInteract] Ticking interaction chain');
		interactionCompleted = tickInteractionAction(entity, interaction, currentTick);
		console.log('[executeInteract] Chain completed:', interactionCompleted);
	} else {
		// interaction이 없으면 체인 없이 바로 완료
		interactionCompleted = true;
		console.log('[executeInteract] No interaction chain, proceeding directly');
	}

	// 매 틱마다 increase_per_tick 적용 (once 상호작용도 체인 실행 중 욕구 충족)
	const isNeedAction = 'need_id' in action;
	if (isNeedAction && action.need_fulfillment_id) {
		const { needFulfillmentStore } = useCharacter();
		const fulfillment = get(needFulfillmentStore).data[action.need_fulfillment_id as NeedFulfillmentId];

		if (fulfillment && fulfillment.increase_per_tick) {
			const needId = action.need_id;
			const currentNeed = entity.worldCharacterNeeds[needId];
			if (currentNeed) {
				const newValue = Math.min(100, currentNeed.value + fulfillment.increase_per_tick);
				entity.worldCharacterNeeds = {
					...entity.worldCharacterNeeds,
					[needId]: {
						...currentNeed,
						value: newValue,
					},
				};
			}
		}
	}

	if (!interactionCompleted) {
		return; // 아직 체인 실행 중
	}

	// 체인 완료: 상호작용 타입별 로직 실행
	console.log('[executeInteract] Executing interaction type:', interactType);

	if (interactType === 'item_pick') {
		console.log('[executeInteract] item_pick - target type:', targetEntity?.type || 'held');
		if (targetEntity?.type === 'item' || isHeldItem) {
			const { worldItemStore } = useWorld();
			const worldItemId = (targetEntity?.instanceId || targetInstanceId) as WorldItemId;
			console.log('[executeInteract] Picking up item:', worldItemId);

			// 아이템 줍기: heldWorldItemIds에 추가
			if (!entity.heldWorldItemIds.includes(worldItemId)) {
				entity.heldWorldItemIds.push(worldItemId);
			}

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

			// 타겟 클리어
			entity.currentTargetEntityId = undefined;
		}
	} else if (interactType === 'item_use') {
		// item_use: 타겟 아이템 사용 (들고 있는 아이템)
		if (targetEntity?.type === 'item' || isHeldItem) {
			const { worldItemStore } = useWorld();
			const worldItemId = (targetEntity?.instanceId || targetInstanceId) as WorldItemId;
			console.log('[executeInteract] Using item:', worldItemId);

			// 월드에 있는 아이템이면 먼저 줍기
			const worldItem = get(worldItemStore).data[worldItemId];
			if (worldItem && worldItem.world_building_id === null && worldItem.world_character_id === null) {
				// 줍기
				if (!entity.heldWorldItemIds.includes(worldItemId)) {
					entity.heldWorldItemIds.push(worldItemId);
				}

				// 바디 제거 (targetEntity가 있는 경우만)
				if (targetEntity) {
					targetEntity.removeFromWorld();
				}

				// worldItem.world_character_id 업데이트
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

			// 아이템 사용 (소비)
			const itemIndex = entity.heldWorldItemIds.indexOf(worldItemId);
			if (itemIndex !== -1) {
				entity.heldWorldItemIds.splice(itemIndex, 1);
				entity.worldContext.deleteWorldItem(worldItemId);
			}

			// 타겟 클리어
			entity.currentTargetEntityId = undefined;
		}
	} else if (interactType === 'building_execute') {
		if (targetEntity.type === 'building') {
			// TODO: 건물 실행 로직
		}
	} else if (interactType === 'building_construct') {
		if (targetEntity.type === 'building') {
			// TODO: 건물 건설 로직
		}
	} else if (interactType === 'building_demolish') {
		if (targetEntity.type === 'building') {
			// TODO: 건물 철거 로직
		}
	}

	// once_interaction_type: 체인 완료 후 InteractionAction 상태 초기화
	entity.currentInteractionActionId = undefined;
	entity.interactionActionStartTick = 0;
}
