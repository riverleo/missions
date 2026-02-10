import type { BehaviorTargetId, Interaction, EntitySource, CharacterId } from '$lib/types';
import { EntityIdUtils } from '$lib/utils/entity-id';
import { useBuilding, useCharacter, useItem } from '$lib/hooks';
import { searchInteractions } from './search-interactions';

/**
 * 액션의 타입과 Interaction 참조에 따라 상호작용 가능한 엔티티 템플릿 목록을 반환합니다.
 *
 * searchInteractions의 래퍼로, Interaction[]을 EntitySource[]로 변환합니다.
 *
 * @param behaviorTargetId - 행동 타겟 ID (BehaviorTargetId)
 * @param characterId - 캐릭터 ID (캐릭터 제약 필터링용, 선택적)
 * @returns 상호작용 가능한 엔티티 템플릿 배열
 */
export function searchEntitySources(
	behaviorTargetId: BehaviorTargetId,
	characterId?: CharacterId
): EntitySource[] {
	const interactions = searchInteractions(behaviorTargetId, characterId);
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
	const entitySourceMap = new Map<string, EntitySource>();

	for (const interaction of interactions) {
		if (interaction.entitySourceType === 'building') {
			// BuildingInteraction
			if (interaction.building_id) {
				// 특정 건물
				const building = getBuilding(interaction.building_id);
				const template = EntityIdUtils.source.to(building);
				entitySourceMap.set(building.id, template);
			} else {
				// 기본 인터랙션: 모든 건물
				getAllBuildings().forEach((b) => {
					const template = EntityIdUtils.source.to(b);
					entitySourceMap.set(b.id, template);
				});
			}
		} else if (interaction.entitySourceType === 'item') {
			// ItemInteraction
			if (interaction.item_id) {
				// 특정 아이템
				const entitySource = EntityIdUtils.source.to(getItem(interaction.item_id));
				entitySourceMap.set(entitySource.id, entitySource);
			} else {
				// 기본 인터랙션: 모든 아이템
				getAllItems().forEach((i) => {
					const entitySource = EntityIdUtils.source.to(i);
					entitySourceMap.set(i.id, entitySource);
				});
			}
		} else if (interaction.entitySourceType === 'character') {
			// CharacterInteraction
			if (interaction.target_character_id) {
				// 특정 캐릭터
				const entitySource = EntityIdUtils.source.to(getCharacter(interaction.target_character_id));
				entitySourceMap.set(entitySource.id, entitySource);
			} else {
				// 기본 인터랙션: 모든 캐릭터
				getAllCharacters().forEach((c) => {
					const entitySource = EntityIdUtils.source.to(c);
					entitySourceMap.set(c.id, entitySource);
				});
			}
		}
	}

	return Array.from(entitySourceMap.values());
}
