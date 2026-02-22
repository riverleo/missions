import type { WorldCharacterEntity } from '$lib/components/app/world/entities/world-character-entity';
import { WorldContext } from '$lib/components/app/world/context';
import { WorldCharacterEntity as WorldCharacterEntityClass } from '$lib/components/app/world/entities/world-character-entity';
import type { InteractionTargetId } from '$lib/types';
import { InteractionIdUtils } from '$lib/utils/interaction-id';
import {
	createItemInteraction,
	createItemInteractionAction,
	createOrGetBehaviorPriority,
	createOrGetItem,
	createOrGetNeed,
	createOrGetNeedBehavior,
	createOrGetWorldCharacterA,
	createWorldCharacterNeed,
} from '../utils';
import { BehaviorIdUtils } from '$lib/utils/behavior-id';

export type TickActionFulfillCharacterHugFixture = {
	entity: WorldCharacterEntity;
	matchingTargetId: InteractionTargetId;
	nonMatchingTargetId: InteractionTargetId;
};

export default function (): TickActionFulfillCharacterHugFixture {
	const need = createOrGetNeed();
	const worldCharacter = createOrGetWorldCharacterA();
	const worldCharacterNeed = createWorldCharacterNeed(worldCharacter, need);
	const needBehavior = createOrGetNeedBehavior(need, {
		character_id: worldCharacter.character_id,
		need_threshold: worldCharacterNeed.value,
	});
	createOrGetBehaviorPriority(BehaviorIdUtils.behavior.to(needBehavior), { priority: 100 });

	const entity = new WorldCharacterEntityClass(
		new WorldContext(worldCharacterNeed.world_id, false),
		worldCharacterNeed.world_id,
		worldCharacterNeed.world_character_id
	);

	const item = createOrGetItem();
	const matchingInteraction = createItemInteraction(item, {
		type: 'fulfill',
		fulfill_interaction_type: 'character_hug',
	});
	const matchingInteractionAction = createItemInteractionAction(matchingInteraction, { root: true });

	const nonMatchingInteraction = createItemInteraction(item, {
		type: 'fulfill',
		fulfill_interaction_type: 'building_clean',
	});
	const nonMatchingInteractionAction = createItemInteractionAction(nonMatchingInteraction, {
		root: true,
	});

	return {
		entity,
		matchingTargetId: InteractionIdUtils.create(
			InteractionIdUtils.interactionAction.to(matchingInteractionAction)
		),
		nonMatchingTargetId: InteractionIdUtils.create(
			InteractionIdUtils.interactionAction.to(nonMatchingInteractionAction)
		),
	};
}
