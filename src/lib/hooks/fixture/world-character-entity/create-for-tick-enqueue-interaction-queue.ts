import type { WorldCharacterEntity } from '$lib/components/app/world/entities/world-character-entity';
import { WorldContext } from '$lib/components/app/world/context';
import { WorldCharacterEntity as WorldCharacterEntityClass } from '$lib/components/app/world/entities/world-character-entity';
import { WorldItemEntity } from '$lib/components/app/world/entities/world-item-entity';
import type { InteractionTargetId } from '$lib/types';
import { InteractionIdUtils } from '$lib/utils/interaction-id';
import {
	createItemInteraction,
	createItemInteractionAction,
	createNeedFulfillment,
	createOrGetBehaviorPriority,
	createOrGetItem,
	createOrGetNeed,
	createOrGetNeedBehavior,
	createOrGetWorldCharacterA,
	createWorldCharacterNeed,
	createWorldItem,
} from '../utils';
import { BehaviorIdUtils } from '$lib/utils/behavior-id';

type TickEnqueueInteractionQueueFixture = {
	entity: WorldCharacterEntity;
	targetItemEntity: WorldItemEntity;
	coreInteractionTargetId: InteractionTargetId;
	systemItemPickTargetId: InteractionTargetId;
};

export default function (): TickEnqueueInteractionQueueFixture {
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

	const targetItem = createOrGetItem();
	const targetWorldItem = createWorldItem(targetItem, { x: entity.x + 20, y: entity.y + 20 });
	const targetItemEntity = new WorldItemEntity(entity.worldContext, entity.worldId, targetWorldItem.id);
	targetItemEntity.addToWorld();

	const coreInteraction = createItemInteraction(targetItem, {
		type: 'once',
		once_interaction_type: 'item_use',
	});
	const coreRootAction = createItemInteractionAction(coreInteraction, { root: true });
	const coreInteractionTargetId = InteractionIdUtils.create(
		InteractionIdUtils.interactionAction.to(coreRootAction)
	);

	const systemItemPickInteraction = createItemInteraction(targetItem, {
		type: 'once',
		system_interaction_type: 'item_pick',
	});
	const systemItemPickRootAction = createItemInteractionAction(systemItemPickInteraction, {
		root: true,
	});
	const systemItemPickTargetId = InteractionIdUtils.create(
		InteractionIdUtils.interactionAction.to(systemItemPickRootAction)
	);

	// tie fulfillment so search-based behavior can also resolve interaction in integration flow
	createNeedFulfillment(need, {
		fulfillment_type: 'item',
		item_interaction_id: coreInteraction.id,
		increase_per_tick: 10,
	});

	return {
		entity,
		targetItemEntity,
		coreInteractionTargetId,
		systemItemPickTargetId,
	};
}
