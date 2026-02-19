import type {
	Behavior,
	BehaviorPriority,
	BehaviorPriorityId,
	Building,
	Character,
	CharacterNeed,
	CharacterNeedId,
	CharacterBody,
	CharacterBodyId,
	CharacterId,
	Condition,
	Item,
	Need,
	NeedBehavior,
	NeedBehaviorAction,
	NeedBehaviorActionId,
	NeedBehaviorId,
	NeedId,
	Player,
	PlayerId,
	RecordFetchState,
	Scenario,
	ScenarioId,
	UserId,
	UserRoleId,
	World,
	WorldCharacter,
	WorldCharacterId,
	WorldCharacterNeed,
	WorldCharacterNeedId,
	WorldId,
} from '$lib/types';
import { useBehavior } from '$lib/hooks/use-behavior';
import { useBuilding } from '$lib/hooks/use-building';
import { useCharacter } from '$lib/hooks/use-character';
import { useItem } from '$lib/hooks/use-item';
import { usePlayer } from '$lib/hooks/use-player';
import { useScenario } from '$lib/hooks/use-scenario';
import { useWorld } from '$lib/hooks/use-world';
import { v4 as uuidv4 } from 'uuid';
import { get } from 'svelte/store';
import type { Readable, Writable } from 'svelte/store';

function set<K extends string, T extends { id: K }>(
	store: Readable<RecordFetchState<K, T>>,
	value: T | T[]
): void {
	const values = Array.isArray(value) ? value : [value];
	const nextData = {} as Record<K, T>;

	for (const item of values) {
		nextData[item.id] = item;
	}

	(store as Writable<RecordFetchState<K, T>>).set({
		status: 'success',
		data: nextData,
	});
}

function add<K extends string, T extends { id: K }>(
	store: Readable<RecordFetchState<K, T>>,
	value: T | T[]
): void {
	const values = Array.isArray(value) ? value : [value];
	const currentState = get(store);
	const nextData = { ...currentState.data };

	for (const item of values) {
		nextData[item.id] = item;
	}

	(store as Writable<RecordFetchState<K, T>>).set({
		status: 'success',
		data: nextData,
	});
}

function getIdPrefix(prefix: string, id: string): string {
	return `${prefix}-${id.slice(0, 8)}`;
}

let characterA: Character | undefined;
let itemA: Item | undefined;
let needA: Need | undefined;
let conditionA: Condition | undefined;
let buildingA: Building | undefined;
let worldCharacterA: WorldCharacter | undefined;

export function createOrGetWorld(): World {
	const worldStore = useWorld().worldStore;
	const existingWorld = Object.values(get(worldStore).data)[0];
	if (existingWorld) return existingWorld;

	const scenario = createOrGetScenario();
	const player = createOrGetPlayer();
	const createdAt = new Date().toISOString();
	const worldId = uuidv4() as WorldId;
	const value: World = {
		id: worldId,
		user_id: player.user_id,
		player_id: player.id,
		scenario_id: scenario.id,
		name: getIdPrefix('world', worldId),
		terrain_id: null,
		deleted_at: null,
		created_at: createdAt,
	};
	set(useWorld().worldStore, value);
	return value;
}

export function createOrGetScenario(overrides: Partial<Scenario> = {}): Scenario {
	const createdAt = new Date().toISOString();
	const createdBy = uuidv4() as UserRoleId;
	const scenarioId = uuidv4() as ScenarioId;
	const value: Scenario = {
		id: scenarioId,
		title: getIdPrefix('scenario', scenarioId),
		status: 'draft',
		display_order: 1,
		created_at: createdAt,
		created_by: createdBy,
		...overrides,
	};
	set(useScenario().scenarioStore, value);
	return value;
}

export function createOrGetPlayer(overrides: Partial<Player> = {}): Player {
	const userId = uuidv4() as UserId;
	const createdAt = new Date().toISOString();
	const playerId = uuidv4() as PlayerId;
	const value: Player = {
		id: playerId,
		user_id: userId,
		name: getIdPrefix('player', playerId),
		bio: null,
		avatar: null,
		deleted_at: null,
		created_at: createdAt,
		updated_at: createdAt,
		...overrides,
	};
	set(usePlayer().playerStore, value);
	return value;
}

export function createWorldCharacter(
	character: Character,
	overrides: Partial<WorldCharacter> = {}
): WorldCharacter {
	const world = createOrGetWorld();
	const worldCharacterStore = useWorld().worldCharacterStore;
	const existingWorldCharacter = Object.values(get(worldCharacterStore).data).find(
		(worldCharacter) =>
			worldCharacter.world_id === world.id && worldCharacter.character_id === character.id
	);
	if (existingWorldCharacter) return existingWorldCharacter;

	const createdAt = new Date().toISOString();
	const value: WorldCharacter = {
		id: uuidv4() as WorldCharacterId,
		user_id: world.user_id,
		player_id: world.player_id,
		scenario_id: character.scenario_id,
		world_id: world.id,
		character_id: character.id,
		x: 0,
		y: 0,
		created_at: createdAt,
		created_at_tick: 0,
		deleted_at: null,
		...overrides,
	};
	add(useWorld().worldCharacterStore, value);
	return value;
}

export function createWorldCharacterNeed(
	worldCharacter: WorldCharacter,
	need: Need,
	overrides: Partial<WorldCharacterNeed> = {}
): WorldCharacterNeed {
	const character = useCharacter().getCharacter(worldCharacter.character_id);
	const characterNeed = createOrGetCharacterNeed(character, need);
	const worldCharacterNeedStore = useWorld().worldCharacterNeedStore;
	const existingWorldCharacterNeed = Object.values(get(worldCharacterNeedStore).data).find(
		(worldCharacterNeed) =>
			worldCharacterNeed.world_character_id === worldCharacter.id &&
			worldCharacterNeed.need_id === characterNeed.need_id
	);
	if (existingWorldCharacterNeed) return existingWorldCharacterNeed;

	const value: WorldCharacterNeed = {
		id: uuidv4() as WorldCharacterNeedId,
		user_id: worldCharacter.user_id,
		player_id: worldCharacter.player_id,
		scenario_id: worldCharacter.scenario_id,
		world_id: worldCharacter.world_id,
		world_character_id: worldCharacter.id,
		character_id: worldCharacter.character_id,
		need_id: characterNeed.need_id,
		deleted_at: null,
		value: 0,
		...overrides,
	};
	add(useWorld().worldCharacterNeedStore, value);
	return value;
}

export function createOrGetCharacter(overrides: Partial<Character> = {}): Character {
	const world = createOrGetWorld();
	const characterBody = createOrGetCharacterBody();
	const createdAt = new Date().toISOString();
	const createdBy = uuidv4() as UserRoleId;
	const characterId = uuidv4() as CharacterId;
	const value: Character = {
		id: characterId,
		scenario_id: world.scenario_id,
		character_body_id: characterBody.id,
		name: getIdPrefix('character', characterId),
		scale: 1,
		created_at: createdAt,
		created_by: createdBy,
		...overrides,
	};
	add(useCharacter().characterStore, value);
	return value;
}

export function createOrGetCharacterBody(overrides: Partial<CharacterBody> = {}): CharacterBody {
	const world = createOrGetWorld();
	const createdAt = new Date().toISOString();
	const createdBy = uuidv4() as UserRoleId;
	const characterBodyId = uuidv4() as CharacterBodyId;
	const value: CharacterBody = {
		id: characterBodyId,
		scenario_id: world.scenario_id,
		name: getIdPrefix('character-body', characterBodyId),
		collider_type: 'circle',
		collider_width: 32,
		collider_height: 32,
		collider_offset_x: 0,
		collider_offset_y: 0,
		created_at: createdAt,
		created_by: createdBy,
		...overrides,
	};
	add(useCharacter().characterBodyStore, value);
	return value;
}

export function createOrGetNeed(overrides: Partial<Need> = {}): Need {
	const world = createOrGetWorld();
	const createdAt = new Date().toISOString();
	const createdBy = uuidv4() as UserRoleId;
	const needId = uuidv4() as NeedId;
	const value: Need = {
		id: needId,
		scenario_id: world.scenario_id,
		name: getIdPrefix('need', needId),
		initial_value: 10,
		max_value: 10,
		decrease_per_tick: 1,
		created_at: createdAt,
		created_by: createdBy,
		...overrides,
	};
	add(useCharacter().needStore, value);
	return value;
}

export function createOrGetCharacterNeed(
	character: Character,
	need: Need,
	overrides: Partial<CharacterNeed> = {}
): CharacterNeed {
	const characterNeedStore = useCharacter().characterNeedStore;
	const existingCharacterNeed = Object.values(get(characterNeedStore).data).find(
		(characterNeed) => characterNeed.character_id === character.id && characterNeed.need_id === need.id
	);
	if (existingCharacterNeed) return existingCharacterNeed;

	const value: CharacterNeed = {
		id: uuidv4() as CharacterNeedId,
		scenario_id: character.scenario_id,
		character_id: character.id,
		need_id: need.id,
		decay_multiplier: 1,
		created_at: new Date().toISOString(),
		created_by: null,
		...overrides,
	};
	add(characterNeedStore, value);
	return value;
}

export function createOrGetNeedBehavior(
	need: Need,
	overrides: Partial<NeedBehavior> = {},
	options: { withRootAction?: boolean } = {}
): NeedBehavior {
	const { withRootAction = true } = options;
	const createdAt = new Date().toISOString();
	const createdBy = uuidv4() as UserRoleId;
	const needBehaviorId = uuidv4() as NeedBehaviorId;
	const value: NeedBehavior = {
		id: needBehaviorId,
		name: getIdPrefix('need-behavior', needBehaviorId),
		scenario_id: need.scenario_id,
		need_id: need.id,
		character_id: overrides.character_id ?? null,
		need_threshold: 0,
		created_at: createdAt,
		created_by: createdBy,
		...overrides,
	};
	add(useBehavior().needBehaviorStore, value);

	if (withRootAction) {
		createOrGetNeedBehaviorAction(value, { root: true });
	}

	return value;
}

export function createOrGetNeedBehaviorAction(
	needBehavior: NeedBehavior,
	overrides: Partial<NeedBehaviorAction> = {}
): NeedBehaviorAction {
	const root = overrides.root ?? true;
	if (root) {
		const existingRootAction = Object.values(get(useBehavior().needBehaviorActionStore).data).find(
			(action) => action.need_behavior_id === needBehavior.id && action.root
		);
		if (existingRootAction) return existingRootAction;
	}

	const value: NeedBehaviorAction = {
		id: uuidv4() as NeedBehaviorActionId,
		scenario_id: needBehavior.scenario_id,
		need_behavior_id: needBehavior.id,
		need_id: needBehavior.need_id,
		need_fulfillment_id: null,
		building_interaction_id: null,
		item_interaction_id: null,
		character_interaction_id: null,
		next_need_behavior_action_id: null,
		root: true,
		type: 'fulfill',
		target_selection_method: 'search',
		idle_duration_ticks: 0,
		...overrides,
	};
	add(useBehavior().needBehaviorActionStore, value);
	return value;
}

export function createOrGetBehaviorPriority(
	behavior: Behavior,
	overrides: Partial<BehaviorPriority> = {}
): BehaviorPriority {
	const behaviorPriorityStore = useBehavior().behaviorPriorityStore;
	const existingBehaviorPriority = Object.values(get(behaviorPriorityStore).data).find(
		(priority) =>
			behavior.behaviorType === 'need'
				? priority.need_behavior_id === behavior.id
				: priority.condition_behavior_id === behavior.id
	);
	if (existingBehaviorPriority) return existingBehaviorPriority;

	const createdAt = new Date().toISOString();
	const createdBy = uuidv4() as UserRoleId;
	const value: BehaviorPriority = {
		id: uuidv4() as BehaviorPriorityId,
		priority: 1,
		need_behavior_id: behavior.behaviorType === 'need' ? behavior.id : null,
		condition_behavior_id: behavior.behaviorType === 'condition' ? behavior.id : null,
		scenario_id: behavior.scenario_id,
		created_at: createdAt,
		created_by: createdBy,
		...overrides,
	};
	add(useBehavior().behaviorPriorityStore, value);
	return value;
}

export function createOrGetItem(overrides: Partial<Item> = {}): Item {
	const world = createOrGetWorld();
	const createdAt = new Date().toISOString();
	const createdBy = uuidv4() as UserRoleId;
	const itemId = uuidv4() as Item['id'];
	const value: Item = {
		id: itemId,
		scenario_id: world.scenario_id,
		name: getIdPrefix('item', itemId),
		scale: 1,
		collider_type: 'circle',
		collider_width: 32,
		collider_height: 32,
		collider_offset_x: 0,
		collider_offset_y: 0,
		max_durability_ticks: null,
		created_at: createdAt,
		created_by: createdBy,
		...overrides,
	};
	add(useItem().itemStore, value);
	return value;
}

export function createOrGetCondition(overrides: Partial<Condition> = {}): Condition {
	const world = createOrGetWorld();
	const createdAt = new Date().toISOString();
	const createdBy = uuidv4() as UserRoleId;
	const conditionId = uuidv4() as Condition['id'];
	const value: Condition = {
		id: conditionId,
		scenario_id: world.scenario_id,
		name: getIdPrefix('condition', conditionId),
		initial_value: 0,
		max_value: 10,
		decrease_per_tick: 0,
		created_at: createdAt,
		created_by: createdBy,
		...overrides,
	};
	add(useBuilding().conditionStore, value);
	return value;
}

export function createOrGetBuilding(overrides: Partial<Building> = {}): Building {
	const world = createOrGetWorld();
	const createdAt = new Date().toISOString();
	const createdBy = uuidv4() as UserRoleId;
	const buildingId = uuidv4() as Building['id'];
	const value: Building = {
		id: buildingId,
		scenario_id: world.scenario_id,
		name: getIdPrefix('building', buildingId),
		scale: 1,
		cell_rows: 1,
		cell_cols: 1,
		collider_offset_x: 0,
		collider_offset_y: 0,
		item_max_capacity: 10,
		created_at: createdAt,
		created_by: createdBy,
		...overrides,
	};
	add(useBuilding().buildingStore, value);
	return value;
}

export function createOrGetCharacterA(): Character {
	if (characterA) {
		const existing = get(useCharacter().characterStore).data[characterA.id];
		if (existing) return existing;
	}
	characterA = createOrGetCharacter();
	return characterA;
}

export function createOrGetItemA(): Item {
	if (itemA) {
		const existing = get(useItem().itemStore).data[itemA.id];
		if (existing) return existing;
	}
	itemA = createOrGetItem();
	return itemA;
}

export function createOrGetNeedA(): Need {
	if (needA) {
		const existing = get(useCharacter().needStore).data[needA.id];
		if (existing) return existing;
	}
	needA = createOrGetNeed();
	return needA;
}

export function createOrGetConditionA(): Condition {
	if (conditionA) {
		const existing = get(useBuilding().conditionStore).data[conditionA.id];
		if (existing) return existing;
	}
	conditionA = createOrGetCondition();
	return conditionA;
}

export function createOrGetBuildingA(): Building {
	if (buildingA) {
		const existing = get(useBuilding().buildingStore).data[buildingA.id];
		if (existing) return existing;
	}
	buildingA = createOrGetBuilding();
	return buildingA;
}

export function createOrGetWorldCharacterA(): WorldCharacter {
	if (worldCharacterA) {
		const existing = get(useWorld().worldCharacterStore).data[worldCharacterA.id];
		if (existing) return existing;
	}
	const character = createOrGetCharacterA();
	worldCharacterA = createWorldCharacter(character, { x: 100, y: 100 });
	return worldCharacterA;
}
