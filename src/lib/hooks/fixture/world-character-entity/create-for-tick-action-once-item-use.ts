import type { WorldCharacterEntity } from '$lib/components/app/world/entities/world-character-entity';
import { WorldContext } from '$lib/components/app/world/context';
import { WorldCharacterEntity as WorldCharacterEntityClass } from '$lib/components/app/world/entities/world-character-entity';
import type { EntityId, InteractionTargetId, NeedId } from '$lib/types';
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
import { EntityIdUtils } from '$lib/utils/entity-id';

export type TickActionOnceItemUseFixture = {
	startTick: number;
	runningTick: number;
	completedTick: number;
	entity: WorldCharacterEntity;
	matchingTargetId: InteractionTargetId;
	nonMatchingTargetId: InteractionTargetId;
	holdingTargetEntityId: EntityId;
	needId: NeedId;
	increasePerTick: number;
};

const START_TICK = 10;
const ITEM_USE_DURATION_TICKS = 3;
const ITEM_USE_INCREASE_PER_TICK = 4;

export default function (): TickActionOnceItemUseFixture {
	const need = createOrGetNeed();
	const worldCharacter = createOrGetWorldCharacterA();
	const worldCharacterNeed = createWorldCharacterNeed(worldCharacter, need);
	const needBehavior = createOrGetNeedBehavior(need, {
		character_id: worldCharacter.character_id,
		need_threshold: worldCharacterNeed.value,
	});
	createOrGetBehaviorPriority(BehaviorIdUtils.behavior.to(needBehavior), { priority: 100 });

	const item = createOrGetItem();
	const heldWorldItem = createWorldItem(item, {
		world_character_id: worldCharacterNeed.world_character_id,
	});

	const entity = new WorldCharacterEntityClass(
		new WorldContext(worldCharacterNeed.world_id, false),
		worldCharacterNeed.world_id,
		worldCharacterNeed.world_character_id
	);

	const matchingInteraction = createItemInteraction(item, {
		type: 'once',
		once_interaction_type: 'item_use',
	});
	const matchingInteractionAction = createItemInteractionAction(matchingInteraction, {
		root: true,
		duration_ticks: ITEM_USE_DURATION_TICKS,
	});
	createNeedFulfillment(need, {
		item_interaction_id: matchingInteraction.id,
		increase_per_tick: ITEM_USE_INCREASE_PER_TICK,
	});

	const nonMatchingInteraction = createItemInteraction(item, {
		type: 'once',
		once_interaction_type: 'building_use',
	});
	const nonMatchingInteractionAction = createItemInteractionAction(nonMatchingInteraction, {
		root: true,
	});

	return {
		startTick: START_TICK,
		runningTick: START_TICK + 1,
		completedTick: START_TICK + matchingInteractionAction.duration_ticks,
		entity,
		matchingTargetId: InteractionIdUtils.create(
			InteractionIdUtils.interactionAction.to(matchingInteractionAction)
		),
		nonMatchingTargetId: InteractionIdUtils.create(
			InteractionIdUtils.interactionAction.to(nonMatchingInteractionAction)
		),
		holdingTargetEntityId: EntityIdUtils.create(EntityIdUtils.to(heldWorldItem)),
		needId: need.id,
		increasePerTick: ITEM_USE_INCREASE_PER_TICK,
	};
}
