import createForTickFindBehaviorTarget from './world-character-entity/create-for-tick-find-behavior-target';
import createForTickFindTargetEntityAndGo from './world-character-entity/create-for-tick-find-target-entity-and-go';
import createForTickEnqueueInteractionQueue from './world-character-entity/create-for-tick-enqueue-interaction-queue';
import createForTickDequeueInteraction from './world-character-entity/create-for-tick-dequeue-interaction';
import createForTickActionSystemItemPick from './world-character-entity/create-for-tick-action-system-item-pick';
import createForTickActionOnceItemUse from './world-character-entity/create-for-tick-action-once-item-use';
import createForTickActionOnceBuildingUse from './world-character-entity/create-for-tick-action-once-building-use';
import createForTickActionOnceBuildingConstruct from './world-character-entity/create-for-tick-action-once-building-construct';
import createForTickActionOnceBuildingDemolish from './world-character-entity/create-for-tick-action-once-building-demolish';
import createForTickActionFulfillBuildingRepair from './world-character-entity/create-for-tick-action-fulfill-building-repair';
import createForTickActionFulfillBuildingClean from './world-character-entity/create-for-tick-action-fulfill-building-clean';
import createForTickActionFulfillBuildingUse from './world-character-entity/create-for-tick-action-fulfill-building-use';
import createForTickActionFulfillCharacterHug from './world-character-entity/create-for-tick-action-fulfill-character-hug';
import createForTickNextOrClear from './world-character-entity/create-for-tick-next-or-clear';
import {
	useBehavior,
	useBuilding,
	useCharacter,
	useFulfillment,
	useInteraction,
	useItem,
	usePlayer,
	useScenario,
	useWorld,
} from '$lib/hooks';
import type { RecordFetchState } from '$lib/types';
import type { Readable, Writable } from 'svelte/store';

function reset<K extends string, T>(store: Readable<RecordFetchState<K, T>>) {
	(store as Writable<RecordFetchState<K, T>>).set({
		status: 'success',
		data: {} as Record<K, T>,
	});
}

export const Fixture = {
	worldCharacterEntity: {
		createForTickFindBehaviorTarget,
		createForTickFindTargetEntityAndGo,
		createForTickEnqueueInteractionQueue,
		createForTickDequeueInteraction,
		createForTickActionSystemItemPick,
		createForTickActionOnceItemUse,
		createForTickActionOnceBuildingUse,
		createForTickActionOnceBuildingConstruct,
		createForTickActionOnceBuildingDemolish,
		createForTickActionFulfillBuildingRepair,
		createForTickActionFulfillBuildingClean,
		createForTickActionFulfillBuildingUse,
		createForTickActionFulfillCharacterHug,
		createForTickNextOrClear,
	},
	reset() {
		const behavior = useBehavior();
		const building = useBuilding();
		const character = useCharacter();
		const fulfillment = useFulfillment();
		const interaction = useInteraction();
		const item = useItem();
		const player = usePlayer();
		const scenario = useScenario();
		const world = useWorld();

		reset(behavior.behaviorPriorityStore);
		reset(behavior.needBehaviorStore);
		reset(behavior.needBehaviorActionStore);
		reset(behavior.conditionBehaviorStore);
		reset(behavior.conditionBehaviorActionStore);

		reset(building.buildingStore);
		reset(building.buildingItemStore);
		reset(building.buildingStateStore);
		reset(building.conditionStore);
		reset(building.buildingConditionStore);
		reset(building.conditionEffectStore);

		reset(character.characterStore);
		reset(character.characterFaceStateStore);
		reset(character.characterBodyStore);
		reset(character.characterBodyStateStore);
		reset(character.needStore);
		reset(character.characterNeedStore);

		reset(fulfillment.needFulfillmentStore);
		reset(fulfillment.conditionFulfillmentStore);

		reset(interaction.buildingInteractionStore);
		reset(interaction.itemInteractionStore);
		reset(interaction.characterInteractionStore);
		reset(interaction.buildingInteractionActionStore);
		reset(interaction.itemInteractionActionStore);
		reset(interaction.characterInteractionActionStore);

		reset(item.itemStore);
		reset(item.itemStateStore);
		reset(player.playerStore);
		reset(player.playerScenarioStore);
		reset(scenario.scenarioStore);
		reset(scenario.scenarioSnapshotStore);
		reset(world.worldStore);
		reset(world.worldCharacterStore);
		reset(world.worldCharacterNeedStore);
		reset(world.worldBuildingStore);
		reset(world.worldBuildingConditionStore);
		reset(world.worldItemStore);
		reset(world.worldTileMapStore);
		world.selectedEntityIdStore.set({ entityId: undefined });
	},
};
