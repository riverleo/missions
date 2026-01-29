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
	if (!targetEntity) {
		// 타겟이 사라졌으면 타겟 클리어하고 재탐색
		console.log('[executeInteract] Target entity not found in world');
		entity.currentTargetEntityId = undefined;
		entity.path = [];
		return;
	}

	// 타겟과의 거리 확인 (임계값: 50)
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

	// 타겟에 도착: InteractionAction 체인 시작 또는 실행
	const { buildingInteractionStore } = useBuilding();
	const { itemInteractionStore } = useItem();
	const { characterInteractionStore } = useCharacter();

	let interaction: any = undefined;
	if (action.building_interaction_id) {
		interaction =
			get(buildingInteractionStore).data[action.building_interaction_id as BuildingInteractionId];
	} else if (action.item_interaction_id) {
		interaction = get(itemInteractionStore).data[action.item_interaction_id as ItemInteractionId];
	} else if (action.character_interaction_id) {
		interaction =
			get(characterInteractionStore).data[action.character_interaction_id as CharacterInteractionId];
	}

	if (!interaction || !interaction.once_interaction_type) {
		console.error('[executeInteract] Interaction not found or not a once_interaction_type:', action);
		return;
	}

	console.log('[executeInteract] Interaction type:', interaction.once_interaction_type);

	// InteractionAction 체인이 아직 시작되지 않았으면 시작
	if (!entity.currentInteractionActionId) {
		console.log('[executeInteract] Starting interaction chain');
		startInteractionChain(entity, interaction, currentTick);
		return;
	}

	// InteractionAction 체인 실행
	console.log('[executeInteract] Ticking interaction chain');
	const interactionCompleted = tickInteractionAction(entity, interaction, currentTick);
	console.log('[executeInteract] Chain completed:', interactionCompleted);

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
	const interactType = interaction.once_interaction_type;
	console.log('[executeInteract] Executing interaction type:', interactType);

	if (interactType === 'item_pick') {
		console.log('[executeInteract] item_pick - target type:', targetEntity.type);
		if (targetEntity.type === 'item') {
			console.log('[executeInteract] Picking up item:', targetEntity.instanceId);
			const { worldItemStore } = useWorld();
			const worldItemId = targetEntity.instanceId as WorldItemId;

			// 아이템 줍기: heldWorldItemIds에 추가
			if (!entity.heldWorldItemIds.includes(worldItemId)) {
				entity.heldWorldItemIds.push(worldItemId);
			}

			// 바디만 월드에서 제거 (엔티티는 삭제 X)
			targetEntity.removeFromWorld();

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
		// item_use는 줍기가 내포됨: 타겟이 월드에 있으면 먼저 줍고, 그게 아니면 들고 있는 아이템 사용
		if (targetEntity.type === 'item') {
			const { worldItemStore } = useWorld();
			const worldItemId = targetEntity.instanceId as WorldItemId;

			// 월드에 있는 아이템: 줍기
			if (!entity.heldWorldItemIds.includes(worldItemId)) {
				entity.heldWorldItemIds.push(worldItemId);
			}

			// 바디만 월드에서 제거
			targetEntity.removeFromWorld();

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

			// 줍은 후 즉시 사용
			entity.heldWorldItemIds.splice(entity.heldWorldItemIds.length - 1, 1);
			entity.worldContext.deleteWorldItem(worldItemId);

			// 타겟 클리어
			entity.currentTargetEntityId = undefined;
		} else if (entity.heldWorldItemIds.length > 0) {
			// 이미 들고 있는 아이템 사용
			const lastHeldItemId = entity.heldWorldItemIds[entity.heldWorldItemIds.length - 1];
			if (!lastHeldItemId) return;

			const heldItemEntity = Object.values(entity.worldContext.entities).find(
				(e) => e.type === 'item' && e.instanceId === lastHeldItemId
			);

			if (heldItemEntity && heldItemEntity.type === 'item') {
				// once 타입: InteractionAction 체인 1회 실행 후 소비
				entity.heldWorldItemIds.splice(entity.heldWorldItemIds.length - 1, 1);
				entity.worldContext.deleteWorldItem(lastHeldItemId);
			}
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
