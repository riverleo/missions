import type {
	BuildingInteractionId,
	ItemInteractionId,
	CharacterInteractionId,
	WorldBuildingId,
	WorldItemId,
	WorldCharacterId,
	NeedBehaviorAction,
	ConditionBehaviorAction,
} from '$lib/types';
import type { WorldCharacterEntity } from '../world-character-entity.svelte';
import { useBehavior } from '$lib/hooks/use-behavior';
import { useWorld } from '$lib/hooks/use-world';
import { useBuilding } from '$lib/hooks/use-building';
import { useItem } from '$lib/hooks/use-item';
import { useCharacter } from '$lib/hooks/use-character';
import { vectorUtils } from '$lib/utils/vector';
import { EntityIdUtils } from '$lib/utils/entity-id';

/**
 * 대상 탐색 및 경로 설정 (target_selection_method에 따라)
 */
export default function searchTargetAndSetPath(
	entity: WorldCharacterEntity,
	action: NeedBehaviorAction | ConditionBehaviorAction
): void {
	const { getInteractableEntityTemplates } = useBehavior();
	const { getBuildingInteraction } = useBuilding();
	const { getItemInteraction } = useItem();
	const { getCharacterInteraction } = useCharacter();
	const { getWorldBuilding, getWorldItem, getWorldCharacter } = useWorld();
	const worldEntities = Object.values(entity.worldContext.entities);

	let targetEntity: any = undefined;

	if (action.target_selection_method === 'explicit') {
		// explicit: Interaction ID를 통해 타겟 엔티티 찾기
		if (action.building_interaction_id) {
			const interaction = getBuildingInteraction(
				action.building_interaction_id as BuildingInteractionId
			);
			if (interaction) {
				if (!interaction.building_id) {
					// 기본 인터렉션 (NULL building_id): 모든 건물 중 가장 가까운 것 선택
					const buildingEntities = worldEntities.filter((e) => e.type === 'building');
					if (buildingEntities.length > 0) {
						const sortedBuildings = buildingEntities.sort((a, b) => {
							const distA = Math.hypot(a.x - entity.x, a.y - entity.y);
							const distB = Math.hypot(b.x - entity.x, b.y - entity.y);
							return distA - distB;
						});
						targetEntity = sortedBuildings[0];
					}
				} else {
					// 특정 건물 인터렉션
					targetEntity = worldEntities.find((e) => {
						if (e.type !== 'building') return false;
						const worldBuilding = getWorldBuilding(e.instanceId);
						return worldBuilding && worldBuilding.building_id === interaction.building_id;
					});
				}
			}
		} else if (action.item_interaction_id) {
			const interaction = getItemInteraction(action.item_interaction_id);
			if (interaction) {
				if (!interaction.item_id) {
					// 기본 인터렉션 (NULL item_id): 모든 아이템 중 가장 가까운 것 선택
					const itemEntities = worldEntities.filter((e) => e.type === 'item');
					if (itemEntities.length > 0) {
						const sortedItems = itemEntities.sort((a, b) => {
							const distA = Math.hypot(a.x - entity.x, a.y - entity.y);
							const distB = Math.hypot(b.x - entity.x, b.y - entity.y);
							return distA - distB;
						});
						targetEntity = sortedItems[0];
					}
				} else {
					// 특정 아이템 인터렉션
					targetEntity = worldEntities.find((e) => {
						if (e.type !== 'item') return false;
						const worldItem = getWorldItem(e.instanceId);
						return worldItem && worldItem.item_id === interaction.item_id;
					});
				}
			}
		} else if (action.character_interaction_id) {
			const interaction = getCharacterInteraction(
				action.character_interaction_id as CharacterInteractionId
			);
			if (interaction) {
				targetEntity = worldEntities.find((e) => {
					if (e.type !== 'character') return false;
					const worldCharacter = getWorldCharacter(e.instanceId);
					return worldCharacter && worldCharacter.character_id === interaction.target_character_id;
				});
			}
		}
	} else if (
		action.target_selection_method === 'search' ||
		action.target_selection_method === 'search_or_continue'
	) {
		// search: 상호작용 가능한 대상 중 가장 가까운 것 선택
		const templates = getInteractableEntityTemplates(action);

		// 템플릿 ID 집합
		const templateIds = new Set(templates.map((t) => t.id));

		// 1. 먼저 들고 있는 아이템 확인
		for (const heldItemId of entity.heldWorldItemIds) {
			const worldItem = getWorldItem(heldItemId);
			if (worldItem && templateIds.has(worldItem.item_id)) {
				// 들고 있는 아이템이 적합한 대상이면 선택
				const heldItemEntityId = EntityIdUtils.createId('item', entity.worldContext.worldId, heldItemId);
				entity.currentTargetEntityId = heldItemEntityId;
				entity.path = []; // 들고 있는 아이템은 경로 불필요
				return; // 검색 종료
			}
		}

		// 2. 템플릿에 해당하는 월드 엔티티 찾기
		const candidateEntities = worldEntities.filter((e) => {
			if (e.type === 'building') {
				const worldBuilding = getWorldBuilding(e.instanceId);
				return worldBuilding && templateIds.has(worldBuilding.building_id);
			} else if (e.type === 'item') {
				const worldItem = getWorldItem(e.instanceId);
				return worldItem && templateIds.has(worldItem.item_id);
			} else if (e.type === 'character') {
				const worldCharacter = getWorldCharacter(e.instanceId);
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
				const fromPos = vectorUtils.createVector(entity.body.position.x, entity.body.position.y);
				const toPos = vectorUtils.createVector(candidate.x, candidate.y);
				const testPath = entity.worldContext.pathfinder.findPath(fromPos, toPos);
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
			entity.currentTargetEntityId = targetEntity.id;
			entity.path = testPath;
		}
	}
}
