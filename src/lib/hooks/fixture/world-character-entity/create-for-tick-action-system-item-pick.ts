import type { WorldCharacterEntity } from '$lib/components/app/world/entities/world-character-entity';
import { WorldContext } from '$lib/components/app/world/context';
import { WorldCharacterEntity as WorldCharacterEntityClass } from '$lib/components/app/world/entities/world-character-entity';
import { WorldItemEntity } from '$lib/components/app/world/entities/world-item-entity';
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
	createWorldItem,
} from '../utils';
import { BehaviorIdUtils } from '$lib/utils/behavior-id';

type TickActionSystemItemPickFixture = {
	entity: WorldCharacterEntity;
	targetItemEntity: WorldItemEntity;
	systemItemPickTargetId: InteractionTargetId;
	nonSystemTargetId: InteractionTargetId;
};

export default function (): TickActionSystemItemPickFixture {
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
	const worldItem = createWorldItem(item, { x: entity.x + 1, y: entity.y });
	const targetItemEntity = new WorldItemEntity(entity.worldContext, entity.worldId, worldItem.id);
	targetItemEntity.addToWorld();

	const systemInteraction = createItemInteraction(item, {
		type: 'once',
		system_interaction_type: 'item_pick',
	});
	const systemAction = createItemInteractionAction(systemInteraction, { root: true, duration_ticks: 1 });

	const nonSystemInteraction = createItemInteraction(item, {
		type: 'fulfill',
		system_interaction_type: null,
	});
	const nonSystemAction = createItemInteractionAction(nonSystemInteraction, {
		root: true,
		duration_ticks: 1,
	});

	return {
		entity,
		targetItemEntity,
		systemItemPickTargetId: InteractionIdUtils.create(
			InteractionIdUtils.interactionAction.to(systemAction)
		),
		nonSystemTargetId: InteractionIdUtils.create(
			InteractionIdUtils.interactionAction.to(nonSystemAction)
		),
	};
}
