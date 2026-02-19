import type { WorldCharacterEntity } from '$lib/components/app/world/entities/world-character-entity';
import { WorldContext } from '$lib/components/app/world/context';
import { WorldCharacterEntity as WorldCharacterEntityClass } from '$lib/components/app/world/entities/world-character-entity';
import type { BehaviorTargetId } from '$lib/types';
import { BehaviorIdUtils } from '$lib/utils/behavior-id';
import {
	createOrGetBehaviorPriority,
	createOrGetNeed,
	createOrGetNeedBehavior,
	createOrGetNeedBehaviorAction,
	createOrGetWorldCharacterA,
	createWorldCharacterNeed,
} from '../utils';

type TickNextOrClearFixture = {
	entity: WorldCharacterEntity;
	currentBehaviorTargetId: BehaviorTargetId;
	nextBehaviorTargetId: BehaviorTargetId;
};

export default function (): TickNextOrClearFixture {
	const need = createOrGetNeed();
	const worldCharacter = createOrGetWorldCharacterA();
	const worldCharacterNeed = createWorldCharacterNeed(worldCharacter, need);
	const needBehavior = createOrGetNeedBehavior(need, {
		character_id: worldCharacter.character_id,
		need_threshold: worldCharacterNeed.value,
	}, { withRootAction: false });
	createOrGetBehaviorPriority(BehaviorIdUtils.behavior.to(needBehavior), { priority: 100 });

	const nextAction = createOrGetNeedBehaviorAction(needBehavior, {
		root: false,
		type: 'idle',
		target_selection_method: 'search',
	});
	const currentRootAction = createOrGetNeedBehaviorAction(needBehavior, {
		root: true,
		next_need_behavior_action_id: nextAction.id,
		type: 'fulfill',
		target_selection_method: 'search',
	});

	const entity = new WorldCharacterEntityClass(
		new WorldContext(worldCharacterNeed.world_id, false),
		worldCharacterNeed.world_id,
		worldCharacterNeed.world_character_id
	);

	return {
		entity,
		currentBehaviorTargetId: BehaviorIdUtils.create(currentRootAction),
		nextBehaviorTargetId: BehaviorIdUtils.create(nextAction),
	};
}
