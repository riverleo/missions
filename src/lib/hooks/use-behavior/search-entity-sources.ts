import type { BehaviorAction, Interaction, EntitySource } from '$lib/types';
import { EntityIdUtils } from '$lib/utils/entity-id';
import { BehaviorIdUtils } from '$lib/utils/behavior-id';
import { useBuilding, useCharacter, useItem } from '$lib/hooks';
import { searchInteractions } from './search-interactions';

/**
 * 액션의 타입과 Interaction 참조에 따라 상호작용 가능한 엔티티 템플릿 목록을 반환합니다.
 *
 * searchInteractions의 래퍼로, Interaction[]을 EntitySource[]로 변환합니다.
 *
 * @param behaviorAction - 행동 액션 (BehaviorAction)
 * @returns 상호작용 가능한 엔티티 템플릿 배열
 */
export function searchEntitySources(behaviorAction: BehaviorAction): EntitySource[] {
	const behaviorTargetId = BehaviorIdUtils.create(behaviorAction);
	const interactions = searchInteractions(behaviorTargetId);
	return interactionsToEntitySources(interactions);
}

/**
 * Interaction 배열을 EntitySource 배열로 변환합니다.
 * 기본 인터랙션(NULL entity_id)의 경우 모든 해당 타입 엔티티를 반환합니다.
 */
function interactionsToEntitySources(interactions: Interaction[]): EntitySource[] {
	const { getBuilding, getAllBuildings } = useBuilding();
	const { getAllItems, getItem } = useItem();
	const { getAllCharacters, getCharacter } = useCharacter();

	// ID 기준 중복 제거를 위해 Map 사용
	const templateMap = new Map<string, EntitySource>();

	for (const interaction of interactions) {
		if (interaction.entitySourceType === 'building') {
			// BuildingInteraction
			if (interaction.building_id) {
				// 특정 건물
				const building = getBuilding(interaction.building_id);
				const template = EntityIdUtils.source.to(building);
				templateMap.set(building.id, template);
			} else {
				// 기본 인터랙션: 모든 건물
				getAllBuildings().forEach((b) => {
					const template = EntityIdUtils.source.to(b);
					templateMap.set(b.id, template);
				});
			}
		} else if (interaction.entitySourceType === 'item') {
			// ItemInteraction
			if (interaction.item_id) {
				// 특정 아이템
				const item = getItem(interaction.item_id);
				const template = EntityIdUtils.source.to(item);
				templateMap.set(item.id, template);
			} else {
				// 기본 인터랙션: 모든 아이템
				getAllItems().forEach((i) => {
					const template = EntityIdUtils.source.to(i);
					templateMap.set(i.id, template);
				});
			}
		} else if (interaction.entitySourceType === 'character') {
			// CharacterInteraction
			if (interaction.target_character_id) {
				// 특정 캐릭터
				const character = getCharacter(interaction.target_character_id);
				const template = EntityIdUtils.source.to(character);
				templateMap.set(character.id, template);
			} else {
				// 기본 인터랙션: 모든 캐릭터
				getAllCharacters().forEach((c) => {
					const template = EntityIdUtils.source.to(c);
					templateMap.set(c.id, template);
				});
			}
		}
	}

	return Array.from(templateMap.values());
}
