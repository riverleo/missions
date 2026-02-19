import type { WorldCharacterEntity } from '$lib/components/app/world/entities/world-character-entity';
import { WorldContext } from '$lib/components/app/world/context';
import { WorldCharacterEntity as WorldCharacterEntityClass } from '$lib/components/app/world/entities/world-character-entity';
import { WorldItemEntity } from '$lib/components/app/world/entities/world-item-entity';
import type { WorldCharacterId, WorldId } from '$lib/types';
import {
	createItemInteraction,
	createItemInteractionAction,
	createNeedFulfillment,
	createOrGetBehaviorPriority,
	createOrGetCharacter,
	createOrGetItem,
	createOrGetItemA,
	createOrGetNeed,
	createOrGetNeedBehavior,
	createOrGetNeedBehaviorAction,
	createWorldCharacter,
	createWorldCharacterNeed,
	createWorldItem,
} from '../utils';
import { BehaviorIdUtils } from '$lib/utils/behavior-id';

type TickFindTargetEntityAndGoFixture = {
	noBehaviorEntity: WorldCharacterEntity;
	idleEntity: WorldCharacterEntity;
	holdingEntity: WorldCharacterEntity;
	nonHoldingEntity: WorldCharacterEntity;
	closestCandidateEntity: WorldCharacterEntity;
	searchNoCandidateEntity: WorldCharacterEntity;
	heldItemEntity: WorldItemEntity;
	droppedItemEntity: WorldItemEntity;
	droppedNearItemEntity: WorldItemEntity;
	droppedFarItemEntity: WorldItemEntity;
};

const DROPPED_ITEM_X = 220;
const DROPPED_ITEM_Y = 100;

function createEntity(
	worldId: WorldId,
	worldCharacterId: WorldCharacterId
): WorldCharacterEntity {
	return new WorldCharacterEntityClass(new WorldContext(worldId, false), worldId, worldCharacterId);
}

function createEntityWithBehavior(
	need: ReturnType<typeof createOrGetNeed>,
	options: { rootActionType?: 'idle' | 'fulfill'; search?: boolean } = {}
): WorldCharacterEntity {
	const character = createOrGetCharacter();
	const worldCharacter = createWorldCharacter(character, { x: 100, y: 100 });
	const worldCharacterNeed = createWorldCharacterNeed(worldCharacter, need);
	const needBehavior = createOrGetNeedBehavior(need, {
		character_id: worldCharacter.character_id,
		need_threshold: worldCharacterNeed.value,
	});
	const rootNeedBehaviorAction = createOrGetNeedBehaviorAction(needBehavior, { root: true });
	rootNeedBehaviorAction.type = options.rootActionType ?? 'fulfill';
	rootNeedBehaviorAction.target_selection_method = options.search ? 'search' : 'explicit';

	createOrGetBehaviorPriority(BehaviorIdUtils.behavior.to(needBehavior), { priority: 100 });
	return createEntity(worldCharacter.world_id, worldCharacter.id);
}

export default function (): TickFindTargetEntityAndGoFixture {
	const noBehaviorNeed = createOrGetNeed();
	const idleNeed = createOrGetNeed();
	const holdingNeed = createOrGetNeed();
	const nonHoldingNeed = createOrGetNeed();
	const searchNoCandidateNeed = createOrGetNeed();

	const noBehaviorCharacter = createOrGetCharacter();
	const noBehaviorWorldCharacter = createWorldCharacter(noBehaviorCharacter, { x: 100, y: 100 });
	createWorldCharacterNeed(noBehaviorWorldCharacter, noBehaviorNeed);
	const noBehaviorEntity = createEntity(noBehaviorWorldCharacter.world_id, noBehaviorWorldCharacter.id);

	const idleEntity = createEntityWithBehavior(idleNeed, { rootActionType: 'idle' });
	const holdingEntity = createEntityWithBehavior(holdingNeed, {
		rootActionType: 'fulfill',
		search: true,
	});
	const nonHoldingEntity = createEntityWithBehavior(nonHoldingNeed, {
		rootActionType: 'fulfill',
		search: true,
	});
	const closestCandidateEntity = createEntityWithBehavior(nonHoldingNeed, {
		rootActionType: 'fulfill',
		search: true,
	});
	const searchNoCandidateEntity = createEntityWithBehavior(searchNoCandidateNeed, {
		rootActionType: 'fulfill',
		search: true,
	});

	const heldItem = createOrGetItemA();
	const heldWorldItem = createWorldItem(heldItem, {
		world_character_id: holdingEntity.instanceId,
		x: holdingEntity.x,
		y: holdingEntity.y,
	});
	const heldItemEntity = new WorldItemEntity(
		holdingEntity.worldContext,
		holdingEntity.worldId,
		heldWorldItem.id
	);
	holdingEntity.heldItemIds.push(heldItemEntity.id);
	heldItemEntity.addToWorld();

	const droppedItem = createOrGetItem();
	const droppedWorldItem = createWorldItem(droppedItem, {
		x: DROPPED_ITEM_X,
		y: DROPPED_ITEM_Y,
	});
	const droppedItemEntity = new WorldItemEntity(
		nonHoldingEntity.worldContext,
		nonHoldingEntity.worldId,
		droppedWorldItem.id
	);
	droppedItemEntity.addToWorld();

	const droppedNearWorldItem = createWorldItem(droppedItem, { x: 110, y: 100 });
	const droppedNearItemEntity = new WorldItemEntity(
		closestCandidateEntity.worldContext,
		closestCandidateEntity.worldId,
		droppedNearWorldItem.id
	);
	droppedNearItemEntity.addToWorld();

	const droppedFarWorldItem = createWorldItem(droppedItem, { x: 500, y: 500 });
	const droppedFarItemEntity = new WorldItemEntity(
		closestCandidateEntity.worldContext,
		closestCandidateEntity.worldId,
		droppedFarWorldItem.id
	);
	droppedFarItemEntity.addToWorld();

	const heldInteraction = createItemInteraction(heldItem);
	createItemInteractionAction(heldInteraction, { root: true });
	createNeedFulfillment(holdingNeed, {
		item_interaction_id: heldInteraction.id,
		increase_per_tick: 10,
	});

	const droppedInteraction = createItemInteraction(droppedItem);
	createItemInteractionAction(droppedInteraction, { root: true });
	createNeedFulfillment(nonHoldingNeed, {
		item_interaction_id: droppedInteraction.id,
		increase_per_tick: 10,
	});

	const unmatchedItem = createOrGetItem();
	const unmatchedInteraction = createItemInteraction(unmatchedItem);
	createItemInteractionAction(unmatchedInteraction, { root: true });
	createNeedFulfillment(searchNoCandidateNeed, {
		item_interaction_id: unmatchedInteraction.id,
		increase_per_tick: 10,
	});

	return {
		noBehaviorEntity,
		idleEntity,
		holdingEntity,
		nonHoldingEntity,
		closestCandidateEntity,
		searchNoCandidateEntity,
		heldItemEntity,
		droppedItemEntity,
		droppedNearItemEntity,
		droppedFarItemEntity,
	};
}
