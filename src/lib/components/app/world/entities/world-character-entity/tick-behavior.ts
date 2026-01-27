import { get } from 'svelte/store';
import type {
	WorldItemId,
	NeedBehaviorActionId,
	ConditionBehaviorActionId,
	NeedBehaviorId,
	ConditionBehaviorId,
	ConditionBehavior,
	EntityId,
	BuildingInteractionId,
	ItemInteractionId,
	CharacterInteractionId,
	NeedFulfillmentId,
	ConditionFulfillmentId,
} from '$lib/types';
import type { WorldCharacterEntity } from './world-character-entity.svelte';
import { useBehavior } from '$lib/hooks/use-behavior';
import { useWorld } from '$lib/hooks/use-world';
import { useBuilding } from '$lib/hooks/use-building';
import { useItem } from '$lib/hooks/use-item';
import { useCharacter } from '$lib/hooks/use-character';
import { BehaviorActionIdUtils } from '$lib/utils/behavior-action-id';
import { vectorUtils } from '$lib/utils/vector';

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
	if (
		(action.type === 'go' || action.type === 'interact' || action.type === 'fulfill') &&
		entity.path.length === 0 &&
		!entity.currentTargetEntityId
	) {
		searchTargetAndSetPath(entity, action);
		return; // 경로 설정 후 다음 tick에서 실행
	}

	// 2. 행동 실행
	if (action.type === 'go') {
		executeGoAction(entity, action);
	} else if (action.type === 'interact') {
		executeInteractAction(entity, action);
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

/**
 * 대상 탐색 및 경로 설정 (target_selection_method에 따라)
 */
function searchTargetAndSetPath(
	entity: WorldCharacterEntity,
	action: {
		target_selection_method: string;
		building_interaction_id?: string | null;
		item_interaction_id?: string | null;
		character_interaction_id?: string | null;
	}
): void {
	const { getInteractableEntityTemplates } = useBehavior();
	const { buildingInteractionStore } = useBuilding();
	const { itemInteractionStore } = useItem();
	const { characterInteractionStore } = useCharacter();
	const { worldBuildingStore, worldItemStore, worldCharacterStore } = useWorld();
	const worldEntities = Object.values(entity.worldContext.entities);

	let targetEntity: any = undefined;

	if (action.target_selection_method === 'explicit') {
		// explicit: Interaction ID를 통해 타겟 엔티티 찾기
		if (action.building_interaction_id) {
			const interaction =
				get(buildingInteractionStore).data[action.building_interaction_id as BuildingInteractionId];
			if (interaction) {
				targetEntity = worldEntities.find(
					(e) => {
						if (e.type !== 'building') return false;
						const worldBuilding = get(worldBuildingStore).data[e.instanceId as any];
						return worldBuilding && worldBuilding.building_id === interaction.building_id;
					}
				);
			}
		} else if (action.item_interaction_id) {
			const interaction =
				get(itemInteractionStore).data[action.item_interaction_id as ItemInteractionId];
			if (interaction) {
				targetEntity = worldEntities.find(
					(e) => {
						if (e.type !== 'item') return false;
						const worldItem = get(worldItemStore).data[e.instanceId as any];
						return worldItem && worldItem.item_id === interaction.item_id;
					}
				);
			}
		} else if (action.character_interaction_id) {
			const interaction =
				get(characterInteractionStore).data[action.character_interaction_id as CharacterInteractionId];
			if (interaction) {
				targetEntity = worldEntities.find(
					(e) => {
						if (e.type !== 'character') return false;
						const worldCharacter = get(worldCharacterStore).data[e.instanceId as any];
						return worldCharacter && worldCharacter.character_id === interaction.target_character_id;
					}
				);
			}
		}
	} else if (
		action.target_selection_method === 'search' ||
		action.target_selection_method === 'search_or_continue'
	) {
		// search: 상호작용 가능한 대상 중 가장 가까운 것 선택
		const templates = getInteractableEntityTemplates(action as any);

		// 템플릿 ID 집합
		const templateIds = new Set(templates.map((t) => t.id));

		// 템플릿에 해당하는 월드 엔티티 찾기
		const candidateEntities = worldEntities.filter((e) => {
			if (e.type === 'building') {
				const worldBuilding = get(worldBuildingStore).data[e.instanceId as any];
				return worldBuilding && templateIds.has(worldBuilding.building_id);
			} else if (e.type === 'item') {
				const worldItem = get(worldItemStore).data[e.instanceId as any];
				return worldItem && templateIds.has(worldItem.item_id);
			} else if (e.type === 'character') {
				const worldCharacter = get(worldCharacterStore).data[e.instanceId as any];
				return worldCharacter && templateIds.has(worldCharacter.character_id);
			}
			return false;
		});

		// 가장 가까운 엔티티 중 경로를 찾을 수 있는 것 선택
		if (candidateEntities.length > 0) {
			// 거리순으로 정렬
			const sortedCandidates = candidateEntities.sort((a, b) => {
				const distA = Math.hypot(a.x - entity.x, a.y - entity.y);
				const distB = Math.hypot(b.x - entity.x, b.y - entity.y);
				return distA - distB;
			});

			// 경로를 찾을 수 있는 첫 번째 타겟 선택
			for (const candidate of sortedCandidates) {
				const testPath = entity.worldContext.pathfinder.findPath(
					vectorUtils.createVector(entity.body.position.x, entity.body.position.y),
					vectorUtils.createVector(candidate.x, candidate.y)
				);
				if (testPath.length > 0) {
					targetEntity = candidate;
					break;
				}
			}
		}
	}

	// 대상을 찾았으면 경로 확인 후 타겟 설정
	if (targetEntity) {
		// 경로를 찾을 수 있는지 확인
		const testPath = entity.worldContext.pathfinder.findPath(
			vectorUtils.createVector(entity.body.position.x, entity.body.position.y),
			vectorUtils.createVector(targetEntity.x, targetEntity.y)
		);

		if (testPath.length > 0) {
			entity.currentTargetEntityId = targetEntity.id as EntityId;
			entity.path = testPath;
		}
	}
}

/**
 * GO 행동 실행 (이동)
 */
function executeGoAction(entity: WorldCharacterEntity, action: any): void {
	// path를 따라 이동하는 로직은 updateMove에서 처리
	// 여기서는 특별히 할 일이 없음 (완료 조건만 체크)
}

/**
 * INTERACT 행동 실행 (상호작용 - once_interaction_type)
 */
function executeInteractAction(entity: WorldCharacterEntity, action: any): void {
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

	// 타겟에 도착: Interaction 가져오기
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
		console.error('Interaction not found or not a once_interaction_type:', action);
		return;
	}

	const interactType = interaction.once_interaction_type;

	if (interactType === 'item_pick') {
		if (targetEntity.type === 'item') {
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
		// 들고 있는 아이템 사용
		if (entity.heldWorldItemIds.length > 0) {
			const lastHeldItemId = entity.heldWorldItemIds[entity.heldWorldItemIds.length - 1];
			if (!lastHeldItemId) return;

			const heldItemEntity = Object.values(entity.worldContext.entities).find(
				(e) => e.type === 'item' && e.instanceId === lastHeldItemId
			);

			if (heldItemEntity && heldItemEntity.type === 'item') {
				// once 타입: InteractionAction 체인 1회 실행 후 소비
				// TODO: InteractionAction 체인 지원 (현재는 즉시 소비)
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
}

/**
 * FULFILL 행동 실행 (욕구/컨디션 충족 - repeat_interaction_type)
 */
function executeFulfillAction(entity: WorldCharacterEntity, action: any, currentTick: number): void {
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

	// TODO: InteractionAction 체인 반복 로직
	// 현재는 단순히 매 틱마다 증가만 처리
}

/**
 * IDLE 행동 실행 (대기)
 */
function executeIdleAction(entity: WorldCharacterEntity, action: any): void {
	// 대기는 특별히 할 일이 없음
	// 완료 조건만 체크 (idle_duration_ticks)
}

/**
 * 행동 완료 조건 확인
 */
function checkActionCompletion(
	entity: WorldCharacterEntity,
	action: any,
	currentTick: number
): boolean {
	// GO: path가 비면 완료
	if (action.type === 'go') {
		return entity.path.length === 0;
	}

	// INTERACT: once_interaction_type에 따라
	if (action.type === 'interact') {
		if (!entity.currentTargetEntityId) return false;
		const targetEntity = entity.worldContext.entities[entity.currentTargetEntityId];
		if (!targetEntity) return false;

		const distance = Math.hypot(targetEntity.x - entity.x, targetEntity.y - entity.y);
		if (distance >= 50) return false; // 아직 도착하지 않음

		// Interaction 가져오기
		const { buildingInteractionStore } = useBuilding();
		const { itemInteractionStore } = useItem();
		const { characterInteractionStore } = useCharacter();

		let interaction: any = undefined;
		if (action.building_interaction_id) {
			interaction =
				get(buildingInteractionStore).data[action.building_interaction_id as BuildingInteractionId];
		} else if (action.item_interaction_id) {
			interaction =
				get(itemInteractionStore).data[action.item_interaction_id as ItemInteractionId];
		} else if (action.character_interaction_id) {
			interaction =
				get(characterInteractionStore).data[
					action.character_interaction_id as CharacterInteractionId
				];
		}

		if (!interaction || !interaction.once_interaction_type) return false;

		// once_interaction_type에 따라 완료 조건 확인
		if (interaction.once_interaction_type === 'item_pick') {
			// immediate: 타겟 도달 시 즉시 완료
			return true;
		} else {
			// once: InteractionAction 체인 1회 완료 (TODO: 현재는 타겟 도달 시로 단순화)
			return true;
		}
	}

	// FULFILL: 욕구/컨디션 충족 여부 확인
	if (action.type === 'fulfill') {
		const isNeedAction = 'need_id' in action;

		if (isNeedAction) {
			const { needBehaviorStore } = useBehavior();
			const behavior = Object.values(get(needBehaviorStore).data).find(
				(b) => b.need_id === action.need_id
			);
			if (!behavior) return false;

			const need = entity.worldCharacterNeeds[action.need_id];
			if (!need) return false;

			// 욕구가 threshold를 넘으면 완료
			return need.value > behavior.need_threshold;
		} else {
			// TODO: Condition 충족 확인 (건물 수리/청소 완료 등)
			return false;
		}
	}

	// IDLE: idle_duration_ticks 경과 확인
	if (action.type === 'idle') {
		return currentTick - entity.actionStartTick >= action.idle_duration_ticks;
	}

	return false;
}

/**
 * 다음 액션으로 전환
 */
function transitionToNextAction(
	entity: WorldCharacterEntity,
	action: any,
	currentTick: number
): void {
	if (!entity.currentBehaviorActionId) return;

	const { type } = BehaviorActionIdUtils.parse(entity.currentBehaviorActionId);
	const behaviorId = BehaviorActionIdUtils.behaviorId(entity.currentBehaviorActionId);

	// 현재 액션 완료 시 path와 타겟 클리어
	entity.path = [];
	entity.currentTargetEntityId = undefined;

	// 다음 액션 ID 가져오기
	const nextActionId =
		type === 'need'
			? action.next_need_behavior_action_id
			: action.next_condition_behavior_action_id;

	if (nextActionId) {
		// 다음 액션으로 전환
		entity.currentBehaviorActionId = BehaviorActionIdUtils.create(type, behaviorId, nextActionId);
		entity.actionStartTick = currentTick;
	} else {
		// 다음 액션이 없으면 행동 종료
		entity.currentBehaviorActionId = undefined;
		entity.actionStartTick = 0;
	}
}

/**
 * 새로운 행동을 선택 (우선순위 기반)
 */
function selectNewBehavior(entity: WorldCharacterEntity, tick: number): void {
	const {
		needBehaviorStore,
		needBehaviorActionStore,
		conditionBehaviorStore,
		conditionBehaviorActionStore,
		behaviorPriorityStore,
	} = useBehavior();

	// 1. 후보 need behaviors 찾기 (threshold 이하인 욕구)
	const candidateNeedBehaviors = Object.values(get(needBehaviorStore).data).filter((behavior) => {
		const need = entity.worldCharacterNeeds[behavior.need_id];
		if (!need) return false;

		// 욕구 레벨이 threshold 이하이면 발동
		return need.value <= behavior.need_threshold;
	});

	// 2. 후보 condition behaviors 찾기
	// TODO: 컨디션 조건 체크 로직 (나중에 구현)
	const candidateConditionBehaviors: ConditionBehavior[] = [];

	// 3. 우선순위에 따라 정렬
	const allCandidates: Array<
		| { type: 'need'; behaviorId: NeedBehaviorId }
		| { type: 'condition'; behaviorId: ConditionBehaviorId }
	> = [
		...candidateNeedBehaviors.map((behavior) => ({
			type: 'need' as const,
			behaviorId: behavior.id,
		})),
		...candidateConditionBehaviors.map((behavior) => ({
			type: 'condition' as const,
			behaviorId: behavior.id,
		})),
	];

	if (allCandidates.length === 0) {
		// 후보가 없으면 종료
		return;
	}

	// BehaviorPriority에서 우선순위 가져오기
	const priorities = get(behaviorPriorityStore).data;
	const sortedCandidates = allCandidates.sort((a, b) => {
		const priorityA = Object.values(priorities).find((p) =>
			a.type === 'need'
				? p.need_behavior_id === a.behaviorId
				: p.condition_behavior_id === a.behaviorId
		);
		const priorityB = Object.values(priorities).find((p) =>
			b.type === 'need'
				? p.need_behavior_id === b.behaviorId
				: p.condition_behavior_id === b.behaviorId
		);

		const valA = priorityA?.priority ?? 0;
		const valB = priorityB?.priority ?? 0;

		// 높은 우선순위가 먼저 오도록 내림차순 정렬
		return valB - valA;
	});

	const selected = sortedCandidates[0];
	if (!selected) return;

	// 4. root action 찾기
	const actions =
		selected.type === 'need'
			? Object.values(get(needBehaviorActionStore).data).filter(
					(a) => a.behavior_id === selected.behaviorId && a.root
				)
			: Object.values(get(conditionBehaviorActionStore).data).filter(
					(a) => a.condition_behavior_id === selected.behaviorId && a.root
				);

	const rootAction = actions[0];
	if (!rootAction) {
		// root action이 없으면 종료
		return;
	}

	// 5. currentBehaviorActionId 설정 및 시작 tick 기록
	entity.currentBehaviorActionId = BehaviorActionIdUtils.create(
		selected.type,
		selected.behaviorId,
		rootAction.id
	);
	entity.actionStartTick = tick;
}
