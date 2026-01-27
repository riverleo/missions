import { get } from 'svelte/store';
import type { WorldItemEntity } from './world-item-entity.svelte';
import type { WorldCharacterEntity } from '../world-character-entity';
import { useWorld } from '$lib/hooks/use-world';

export function decreaseDurabilityTicks(entity: WorldItemEntity): void {
	// 내구도 감소
	if (entity.durabilityTicks !== undefined && entity.durabilityTicks > 0) {
		entity.durabilityTicks -= 1;

		// durability가 0이 되면 아이템 삭제
		if (entity.durabilityTicks === 0) {
			console.log('[decreaseDurabilityTicks] durability reached 0, deleting item:', entity.instanceId);

			const { worldItemStore } = useWorld();
			const worldItem = get(worldItemStore).data[entity.instanceId];

			// 캐릭터가 들고 있다면 heldWorldItemIds에서 제거
			if (worldItem?.world_character_id) {
				const worldCharacterId = worldItem.world_character_id;
				const characterEntity = Object.values(entity.worldContext.entities).find(
					(e) => e.type === 'character' && e.instanceId === worldCharacterId
				) as WorldCharacterEntity | undefined;

				if (characterEntity) {
					const index = characterEntity.heldWorldItemIds.indexOf(entity.instanceId);
					if (index !== -1) {
						characterEntity.heldWorldItemIds.splice(index, 1);
						console.log('[decreaseDurabilityTicks] removed from character heldWorldItemIds');
					}
				}
			}

			// worldContext를 통해 아이템 삭제
			entity.worldContext.deleteWorldItem(entity.instanceId);
		}
	}
}
