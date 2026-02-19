import * as worldCharacterEntity from './world-character-entity';
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

function resetRecordFetchStateStore<K extends string, T>(
	store: Readable<RecordFetchState<K, T>>
) {
	(store as Writable<RecordFetchState<K, T>>).set({
		status: 'success',
		data: {} as Record<K, T>,
	});
}

export const Fixture = {
	worldCharacterEntity,
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

		resetRecordFetchStateStore(behavior.behaviorPriorityStore);
		resetRecordFetchStateStore(behavior.needBehaviorStore);
		resetRecordFetchStateStore(behavior.needBehaviorActionStore);
		resetRecordFetchStateStore(behavior.conditionBehaviorStore);
		resetRecordFetchStateStore(behavior.conditionBehaviorActionStore);

		resetRecordFetchStateStore(building.buildingStore);
		resetRecordFetchStateStore(building.buildingItemStore);
		resetRecordFetchStateStore(building.buildingStateStore);
		resetRecordFetchStateStore(building.conditionStore);
		resetRecordFetchStateStore(building.buildingConditionStore);
		resetRecordFetchStateStore(building.conditionEffectStore);

		resetRecordFetchStateStore(character.characterStore);
		resetRecordFetchStateStore(character.characterFaceStateStore);
		resetRecordFetchStateStore(character.characterBodyStore);
		resetRecordFetchStateStore(character.characterBodyStateStore);
		resetRecordFetchStateStore(character.needStore);
		resetRecordFetchStateStore(character.characterNeedStore);

		resetRecordFetchStateStore(fulfillment.needFulfillmentStore);
		resetRecordFetchStateStore(fulfillment.conditionFulfillmentStore);

		resetRecordFetchStateStore(interaction.buildingInteractionStore);
		resetRecordFetchStateStore(interaction.itemInteractionStore);
		resetRecordFetchStateStore(interaction.characterInteractionStore);
		resetRecordFetchStateStore(interaction.buildingInteractionActionStore);
		resetRecordFetchStateStore(interaction.itemInteractionActionStore);
		resetRecordFetchStateStore(interaction.characterInteractionActionStore);

		resetRecordFetchStateStore(item.itemStore);
		resetRecordFetchStateStore(item.itemStateStore);
		resetRecordFetchStateStore(player.playerStore);
		resetRecordFetchStateStore(player.playerScenarioStore);
		resetRecordFetchStateStore(scenario.scenarioStore);
		resetRecordFetchStateStore(scenario.scenarioSnapshotStore);
		resetRecordFetchStateStore(world.worldStore);
		resetRecordFetchStateStore(world.worldCharacterStore);
		resetRecordFetchStateStore(world.worldCharacterNeedStore);
		resetRecordFetchStateStore(world.worldBuildingStore);
		resetRecordFetchStateStore(world.worldBuildingConditionStore);
		resetRecordFetchStateStore(world.worldItemStore);
		resetRecordFetchStateStore(world.worldTileMapStore);
		world.selectedEntityIdStore.set({ entityId: undefined });
	},
};
