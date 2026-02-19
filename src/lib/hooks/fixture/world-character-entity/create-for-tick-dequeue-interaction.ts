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

type TickDequeueInteractionFixture = {
	entity: WorldCharacterEntity;
	firstInteractionTargetId: InteractionTargetId;
	secondInteractionTargetId: InteractionTargetId;
};

export default function (): TickDequeueInteractionFixture {
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
	const interaction = createItemInteraction(item, { type: 'once' });
	const secondAction = createItemInteractionAction(interaction, { root: false, duration_ticks: 1 });
	const firstAction = createItemInteractionAction(interaction, {
		root: true,
		next_item_interaction_action_id: secondAction.id,
		duration_ticks: 1,
	});

	return {
		entity,
		firstInteractionTargetId: InteractionIdUtils.create(
			InteractionIdUtils.interactionAction.to(firstAction)
		),
		secondInteractionTargetId: InteractionIdUtils.create(
			InteractionIdUtils.interactionAction.to(secondAction)
		),
	};
}
