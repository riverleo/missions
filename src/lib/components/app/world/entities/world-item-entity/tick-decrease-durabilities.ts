import { useWorld } from '$lib/hooks';
import type { WorldItemEntity } from './world-item-entity.svelte';
import type { WorldCharacterEntity } from '../world-character-entity';
import { EntityIdUtils } from '$lib/utils/entity-id';

/**
 * 아이템의 내구도를 tick마다 감소시킵니다.
 */
export default function tickDecreaseDurabilities(this: WorldItemEntity, tick: number): void {
	// 내구도 감소
	if (this.durabilityTicks !== undefined && this.durabilityTicks > 0) {
		this.durabilityTicks -= 1;

		// durability가 0이 되면 아이템 삭제
		if (this.durabilityTicks === 0) {
			const { worldItemStore, getWorldItem } = useWorld();
			const worldItem = getWorldItem(this.instanceId);

			// 캐릭터가 들고 있다면 heldWorldItemIds에서 제거
			if (worldItem?.world_character_id) {
				const worldCharacterId = worldItem.world_character_id;
				const characterEntity = Object.values(this.worldContext.entities).find(
					(e) => e.type === 'character' && e.instanceId === worldCharacterId
				) as WorldCharacterEntity | undefined;

				if (characterEntity) {
					const itemEntityId = EntityIdUtils.createId(
						'item',
						this.worldContext.worldId,
						worldItem.item_id,
						this.instanceId
					);
					const index = characterEntity.heldItemIds.indexOf(itemEntityId);
					if (index !== -1) {
						characterEntity.heldItemIds.splice(index, 1);
					}
				}
			}

			// worldContext를 통해 아이템 삭제
			this.worldContext.deleteWorldItem(this.instanceId);
		}
	}
}
