import type { WorldCharacterEntity } from '$lib/components/app/world/entities/world-character-entity';
import { WorldContext } from '$lib/components/app/world/context';
import { WorldCharacterEntity as WorldCharacterEntityClass } from '$lib/components/app/world/entities/world-character-entity';
import { WorldItemEntity } from '$lib/components/app/world/entities/world-item-entity';
import type {
	InteractionTargetId,
	ItemInteraction,
	ItemInteractionAction,
} from '$lib/types';
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
	startTick: number;
	runningTick: number;
	completedTick: number;
	entity: WorldCharacterEntity;
	targetItemEntity: WorldItemEntity;
	systemInteraction: ItemInteraction;
	systemInteractionAction: ItemInteractionAction;
	nonSystemInteraction: ItemInteraction;
	nonSystemInteractionAction: ItemInteractionAction;
	systemItemPickTargetId: InteractionTargetId;
	nonSystemTargetId: InteractionTargetId;
};

const SYSTEM_ITEM_PICK_DURATION_TICKS = 3;
const START_TICK = 10;

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
	const systemInteractionAction = createItemInteractionAction(systemInteraction, {
		root: true,
		duration_ticks: SYSTEM_ITEM_PICK_DURATION_TICKS,
	});

	const nonSystemInteraction = createItemInteraction(item, {
		type: 'fulfill',
		system_interaction_type: null,
	});
	const nonSystemInteractionAction = createItemInteractionAction(nonSystemInteraction, {
		root: true,
		duration_ticks: 1,
	});

	return {
		startTick: START_TICK,
		runningTick: START_TICK + 1,
		completedTick: START_TICK + systemInteractionAction.duration_ticks,
		entity,
		targetItemEntity,
		systemInteraction,
		systemInteractionAction,
		nonSystemInteraction,
		nonSystemInteractionAction,
		systemItemPickTargetId: InteractionIdUtils.create(
			InteractionIdUtils.interactionAction.to(systemInteractionAction)
		),
		nonSystemTargetId: InteractionIdUtils.create(
			InteractionIdUtils.interactionAction.to(nonSystemInteractionAction)
		),
	};
}
