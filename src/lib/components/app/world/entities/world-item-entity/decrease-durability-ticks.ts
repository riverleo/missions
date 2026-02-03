import { useWorld } from '$lib/hooks';
import type { WorldItemEntity } from './world-item-entity.svelte';
import type { WorldCharacterEntity } from '../world-character-entity';
import { EntityIdUtils } from '$lib/utils/entity-id';

export function decreaseDurabilityTicks(entity: WorldItemEntity): void {
	// 내구도 감소
	if (entity.durabilityTicks !== undefined && entity.durabilityTicks > 0) {
		entity.durabilityTicks -= 1;

		// durability가 0이 되면 아이템 삭제
		if (entity.durabilityTicks === 0) {
			const { worldItemStore, getWorldItem } = useWorld();
			const worldItem = getWorldItem(entity.instanceId);

			// 캐릭터가 들고 있다면 heldWorldItemIds에서 제거
			if (worldItem?.world_character_id) {
				const worldCharacterId = worldItem.world_character_id;
				const characterEntity = Object.values(entity.worldContext.entities).find(
					(e) => e.type === 'character' && e.instanceId === worldCharacterId
				) as WorldCharacterEntity | undefined;

				if (characterEntity) {
					const itemEntityId = EntityIdUtils.createId(
						'item',
						entity.worldContext.worldId,
						entity.instanceId
					);
					const index = characterEntity.heldItemIds.indexOf(itemEntityId);
					if (index !== -1) {
						characterEntity.heldItemIds.splice(index, 1);
					}
				}
			}

			// worldContext를 통해 아이템 삭제
			entity.worldContext.deleteWorldItem(entity.instanceId);
		}
	}
}
