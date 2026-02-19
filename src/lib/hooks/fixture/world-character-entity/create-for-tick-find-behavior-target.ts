import { WorldContext } from '$lib/components/app/world/context';
import { WorldCharacterEntity } from '$lib/components/app/world/entities/world-character-entity';
import {
	createWorldCharacterNeed,
	createOrGetBehaviorPriority,
	createOrGetNeedA,
	createOrGetNeedBehavior,
	createOrGetWorldCharacterA,
} from '../utils';
import { BehaviorIdUtils } from '$lib/utils/behavior-id';

type TickFindBehaviorTargetFixture = {
	entity: WorldCharacterEntity;
};

export default function (): TickFindBehaviorTargetFixture {
	const needA = createOrGetNeedA();
	const worldCharacterA = createOrGetWorldCharacterA();
	const worldCharacterNeed = createWorldCharacterNeed(worldCharacterA, needA);
	const needBehavior = createOrGetNeedBehavior(needA, {
		character_id: worldCharacterA.character_id,
		need_threshold: worldCharacterNeed.value,
	});
	createOrGetBehaviorPriority(BehaviorIdUtils.behavior.to(needBehavior), { priority: 100 });

	return {
		entity: new WorldCharacterEntity(
			new WorldContext(worldCharacterNeed.world_id, false),
			worldCharacterNeed.world_id,
			worldCharacterNeed.world_character_id
		),
	};
}
