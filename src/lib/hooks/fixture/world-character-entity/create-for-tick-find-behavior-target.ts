import { WorldContext } from '$lib/components/app/world/context';
import { WorldCharacterEntity } from '$lib/components/app/world/entities/world-character-entity';
import { createWorldCharacterNeed, getOrCreateNeedA, getOrCreateWorldCharacterA } from '../utils';

export default function createForTickFindBehaviorTarget(): WorldCharacterEntity {
	const needA = getOrCreateNeedA();
	const worldCharacterA = getOrCreateWorldCharacterA();
	const worldCharacterNeed = createWorldCharacterNeed(worldCharacterA, needA);

	return new WorldCharacterEntity(
		new WorldContext(worldCharacterNeed.world_id, false),
		worldCharacterNeed.world_id,
		worldCharacterNeed.world_character_id
	);
}
