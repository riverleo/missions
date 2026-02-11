import type { Interaction, EntitySource } from '$lib/types';
import { EntityIdUtils } from '$lib/utils/entity-id';
import { useBuilding, useCharacter, useItem } from '$lib/hooks';

/**
 * Interaction으로부터 상호작용 가능한 EntitySource 배열을 반환합니다.
 * 기본 인터랙션(NULL entity_id)의 경우 모든 해당 타입 엔티티를 반환합니다.
 *
 * @param interaction - 인터렉션
 * @returns 상호작용 가능한 엔티티 소스 배열
 */
export function getAllEntitySourcesByInteraction(interaction: Interaction): EntitySource[] {
	const { getBuilding, getAllBuildings } = useBuilding();
	const { getAllItems, getItem } = useItem();
	const { getAllCharacters, getCharacter } = useCharacter();

	const entitySources: EntitySource[] = [];

	if (interaction.entitySourceType === 'building') {
		// BuildingInteraction
		if (interaction.building_id) {
			// 특정 건물
			const building = getBuilding(interaction.building_id);
			entitySources.push(EntityIdUtils.source.to(building));
		} else {
			// 기본 인터랙션: 모든 건물
			getAllBuildings().forEach((b) => {
				entitySources.push(EntityIdUtils.source.to(b));
			});
		}
	} else if (interaction.entitySourceType === 'item') {
		// ItemInteraction
		if (interaction.item_id) {
			// 특정 아이템
			entitySources.push(EntityIdUtils.source.to(getItem(interaction.item_id)));
		} else {
			// 기본 인터랙션: 모든 아이템
			getAllItems().forEach((i) => {
				entitySources.push(EntityIdUtils.source.to(i));
			});
		}
	} else if (interaction.entitySourceType === 'character') {
		// CharacterInteraction
		if (interaction.target_character_id) {
			// 특정 캐릭터
			entitySources.push(EntityIdUtils.source.to(getCharacter(interaction.target_character_id)));
		} else {
			// 기본 인터랙션: 모든 캐릭터
			getAllCharacters().forEach((c) => {
				entitySources.push(EntityIdUtils.source.to(c));
			});
		}
	}

	return entitySources;
}
