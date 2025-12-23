import type { Database } from './supabase';
import type { SupabaseClient, User } from '@supabase/supabase-js';

type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
type TablesInsert<T extends keyof Database['public']['Tables']> =
	Database['public']['Tables'][T]['Insert'];
type TablesUpdate<T extends keyof Database['public']['Tables']> =
	Database['public']['Tables'][T]['Update'];
type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];

// Fetch types
export type FetchStatus = 'idle' | 'loading' | 'success' | 'error';

export interface FetchState<T> {
	status: FetchStatus;
	data: T;
	error?: Error;
}

export interface RecordFetchState<K extends string, T> {
	status: FetchStatus;
	data: Record<K, T>;
	error?: Error;
}

// Branded types for type-safe IDs
type Brand<T, B extends string> = T & { readonly __brand: B };

export type ScenarioId = Brand<string, 'ScenarioId'>;
export type ChapterId = Brand<string, 'ChapterId'>;
export type QuestId = Brand<string, 'QuestId'>;
export type QuestBranchId = Brand<string, 'QuestBranchId'>;
export type NarrativeId = Brand<string, 'NarrativeId'>;
export type NarrativeNodeId = Brand<string, 'NarrativeNodeId'>;
export type NarrativeNodeChoiceId = Brand<string, 'NarrativeNodeChoiceId'>;
export type NarrativeDiceRollId = Brand<string, 'NarrativeDiceRollId'>;
export type DiceId = Brand<string, 'DiceId'>;
export type PlayerId = Brand<string, 'PlayerId'>;
export type PlayerScenarioId = Brand<string, 'PlayerScenarioId'>;
export type PlayerChapterId = Brand<string, 'PlayerChapterId'>;
export type PlayerQuestId = Brand<string, 'PlayerQuestId'>;
export type PlayerQuestBranchId = Brand<string, 'PlayerQuestBranchId'>;
export type PlayerRolledDiceId = Brand<string, 'PlayerRolledDiceId'>;
export type UserRoleId = Brand<string, 'UserRoleId'>;
export type TerrainId = Brand<string, 'TerrainId'>;
export type CharacterId = Brand<string, 'CharacterId'>;
export type CharacterBodyId = Brand<string, 'CharacterBodyId'>;
export type CharacterBodyStateId = Brand<string, 'CharacterBodyStateId'>;
export type CharacterFaceStateId = Brand<string, 'CharacterFaceStateId'>;
export type CharacterNeedId = Brand<string, 'CharacterNeedId'>;
export type WorldId = Brand<string, 'WorldId'>;
export type WorldCharacterId = Brand<string, 'WorldCharacterId'>;
export type WorldCharacterNeedId = Brand<string, 'WorldCharacterNeedId'>;
export type BuildingId = Brand<string, 'BuildingId'>;
export type BuildingStateId = Brand<string, 'BuildingStateId'>;
export type BuildingBehaviorId = Brand<string, 'BuildingBehaviorId'>;
export type BuildingBehaviorActionId = Brand<string, 'BuildingBehaviorActionId'>;
export type WorldBuildingId = Brand<string, 'WorldBuildingId'>;
export type NeedId = Brand<string, 'NeedId'>;
export type NeedFulfillmentId = Brand<string, 'NeedFulfillmentId'>;
export type NeedBehaviorId = Brand<string, 'NeedBehaviorId'>;
export type NeedBehaviorActionId = Brand<string, 'NeedBehaviorActionId'>;
export type ItemId = Brand<string, 'ItemId'>;
export type ItemStateId = Brand<string, 'ItemStateId'>;
export type ItemBehaviorId = Brand<string, 'ItemBehaviorId'>;
export type ItemBehaviorActionId = Brand<string, 'ItemBehaviorActionId'>;
export type WorldItemId = Brand<string, 'WorldItemId'>;

// Bulk update types
export interface BulkChanges<T> {
	origin: T[];
	current: T[];
	created: Omit<T, 'id'>[];
	updated: T[];
	deleted: string[];
}

export type Supabase = SupabaseClient<Database>;

export interface ServerPayload {
	supabase: Supabase;
	user?: User;
}

// Enums
export type PublishStatus = Enums<'publish_status'>;
export type QuestType = Enums<'quest_type'>;
export type PlayerQuestStatus = Enums<'player_quest_status'>;
export type PlayerChapterStatus = Enums<'player_chapter_status'>;
export type PlayerScenarioStatus = Enums<'player_scenario_status'>;
export type DiceRollAction = Enums<'dice_roll_action'>;
export type NarrativeNodeType = Enums<'narrative_node_type'>;

// Scenario types
type ScenarioRow = Tables<'scenarios'>;
export type Scenario = Omit<ScenarioRow, 'id'> & { id: ScenarioId };
export type ScenarioInsert = TablesInsert<'scenarios'>;
export type ScenarioUpdate = TablesUpdate<'scenarios'>;
type PlayerScenarioRow = Tables<'player_scenarios'>;
export type PlayerScenario = Omit<PlayerScenarioRow, 'id' | 'player_id' | 'scenario_id'> & {
	id: PlayerScenarioId;
	player_id: PlayerId;
	scenario_id: ScenarioId;
};
export type PlayerScenarioInsert = TablesInsert<'player_scenarios'>;

// Chapter types
type ChapterRow = Tables<'chapters'>;
export type Chapter = Omit<ChapterRow, 'id' | 'scenario_id'> & {
	id: ChapterId;
	scenario_id: ScenarioId;
};
export type ChapterInsert = TablesInsert<'chapters'>;
export type ChapterUpdate = TablesUpdate<'chapters'>;
type PlayerChapterRow = Tables<'player_chapters'>;
export type PlayerChapter = Omit<
	PlayerChapterRow,
	'id' | 'player_id' | 'scenario_id' | 'chapter_id'
> & {
	id: PlayerChapterId;
	player_id: PlayerId;
	scenario_id: ScenarioId;
	chapter_id: ChapterId;
};
export type PlayerChapterInsert = TablesInsert<'player_chapters'>;

// Quest types
type QuestRow = Tables<'quests'>;
export type Quest = Omit<QuestRow, 'id' | 'scenario_id' | 'chapter_id' | 'created_by'> & {
	id: QuestId;
	scenario_id: ScenarioId;
	chapter_id: ChapterId | null;
	created_by: UserRoleId | null;
};
export type QuestInsert = TablesInsert<'quests'>;
export type QuestUpdate = TablesUpdate<'quests'>;
type QuestBranchRow = Tables<'quest_branches'>;
export type QuestBranch = Omit<
	QuestBranchRow,
	'id' | 'quest_id' | 'parent_quest_branch_id' | 'created_by'
> & {
	id: QuestBranchId;
	quest_id: QuestId;
	parent_quest_branch_id: QuestBranchId | null;
	created_by: UserRoleId | null;
};
export type QuestBranchInsert = TablesInsert<'quest_branches'>;
export type QuestBranchUpdate = TablesUpdate<'quest_branches'>;
type PlayerQuestRow = Tables<'player_quests'>;
export type PlayerQuest = Omit<PlayerQuestRow, 'id' | 'player_id' | 'scenario_id' | 'quest_id'> & {
	id: PlayerQuestId;
	player_id: PlayerId;
	scenario_id: ScenarioId;
	quest_id: QuestId;
};
export type PlayerQuestInsert = TablesInsert<'player_quests'>;
type PlayerQuestBranchRow = Tables<'player_quest_branches'>;
export type PlayerQuestBranch = Omit<
	PlayerQuestBranchRow,
	'id' | 'player_id' | 'scenario_id' | 'quest_id' | 'quest_branch_id' | 'player_quest_id'
> & {
	id: PlayerQuestBranchId;
	player_id: PlayerId;
	scenario_id: ScenarioId;
	quest_id: QuestId;
	quest_branch_id: QuestBranchId;
	player_quest_id: PlayerQuestId;
};
export type PlayerQuestBranchInsert = TablesInsert<'player_quest_branches'>;

// Narrative types
type NarrativeRow = Tables<'narratives'>;
export type Narrative = Omit<NarrativeRow, 'id' | 'scenario_id' | 'created_by'> & {
	id: NarrativeId;
	scenario_id: ScenarioId;
	created_by: UserRoleId | null;
};
export type NarrativeInsert = TablesInsert<'narratives'>;
export type NarrativeUpdate = TablesUpdate<'narratives'>;
type NarrativeNodeRow = Tables<'narrative_nodes'>;
export type NarrativeNode = Omit<
	NarrativeNodeRow,
	'id' | 'narrative_id' | 'scenario_id' | 'narrative_dice_roll_id'
> & {
	id: NarrativeNodeId;
	narrative_id: NarrativeId;
	scenario_id: ScenarioId;
	narrative_dice_roll_id: NarrativeDiceRollId | null;
};
export type NarrativeNodeInsert = TablesInsert<'narrative_nodes'>;
export type NarrativeNodeUpdate = TablesUpdate<'narrative_nodes'>;
type NarrativeNodeChoiceRow = Tables<'narrative_node_choices'>;
export type NarrativeNodeChoice = Omit<
	NarrativeNodeChoiceRow,
	'id' | 'narrative_node_id' | 'scenario_id' | 'narrative_dice_roll_id'
> & {
	id: NarrativeNodeChoiceId;
	narrative_node_id: NarrativeNodeId;
	scenario_id: ScenarioId;
	narrative_dice_roll_id: NarrativeDiceRollId | null;
};
export type NarrativeNodeChoiceInsert = TablesInsert<'narrative_node_choices'>;
export type NarrativeNodeChoiceUpdate = TablesUpdate<'narrative_node_choices'>;

// Dice types
type DiceRow = Tables<'dices'>;
export type Dice = Omit<DiceRow, 'id' | 'created_by'> & {
	id: DiceId;
	created_by: UserRoleId | null;
};
export type DiceInsert = TablesInsert<'dices'>;
export type DiceUpdate = TablesUpdate<'dices'>;
type NarrativeDiceRollRow = Tables<'narrative_dice_rolls'>;
export type NarrativeDiceRoll = Omit<
	NarrativeDiceRollRow,
	| 'id'
	| 'narrative_id'
	| 'scenario_id'
	| 'success_narrative_node_id'
	| 'failure_narrative_node_id'
	| 'created_by'
> & {
	id: NarrativeDiceRollId;
	narrative_id: NarrativeId;
	scenario_id: ScenarioId;
	success_narrative_node_id: NarrativeNodeId | null;
	failure_narrative_node_id: NarrativeNodeId | null;
	created_by: UserRoleId | null;
};
export type NarrativeDiceRollInsert = TablesInsert<'narrative_dice_rolls'>;
export type NarrativeDiceRollUpdate = TablesUpdate<'narrative_dice_rolls'>;
type PlayerRolledDiceRow = Tables<'player_rolled_dices'>;
export type PlayerRolledDice = Omit<
	PlayerRolledDiceRow,
	| 'id'
	| 'player_id'
	| 'scenario_id'
	| 'narrative_id'
	| 'narrative_node_id'
	| 'narrative_node_choice_id'
	| 'narrative_dice_roll_id'
	| 'quest_id'
	| 'quest_branch_id'
	| 'player_quest_id'
	| 'player_quest_branch_id'
	| 'dice_id'
> & {
	id: PlayerRolledDiceId;
	player_id: PlayerId;
	scenario_id: ScenarioId | null;
	narrative_id: NarrativeId;
	narrative_node_id: NarrativeNodeId;
	narrative_node_choice_id: NarrativeNodeChoiceId | null;
	narrative_dice_roll_id: NarrativeDiceRollId;
	quest_id: QuestId | null;
	quest_branch_id: QuestBranchId | null;
	player_quest_id: PlayerQuestId | null;
	player_quest_branch_id: PlayerQuestBranchId | null;
	dice_id: DiceId | null;
};
export type PlayerRolledDiceInsert = TablesInsert<'player_rolled_dices'>;

// Player types
type PlayerRow = Tables<'players'>;
export type Player = Omit<PlayerRow, 'id'> & {
	id: PlayerId;
};
export type PlayerInsert = TablesInsert<'players'>;
export type PlayerUpdate = TablesUpdate<'players'>;

// User types
type UserRoleRow = Tables<'user_roles'>;
export type UserRole = Omit<UserRoleRow, 'id' | 'created_by' | 'deleted_by'> & {
	id: UserRoleId;
	created_by: UserRoleId | null;
	deleted_by: UserRoleId | null;
};

// Terrain types
type TerrainRow = Tables<'terrains'>;
export type Terrain = Omit<TerrainRow, 'id' | 'scenario_id' | 'created_by'> & {
	id: TerrainId;
	scenario_id: ScenarioId;
	created_by: UserRoleId | null;
};
export type TerrainInsert = TablesInsert<'terrains'>;
export type TerrainUpdate = TablesUpdate<'terrains'>;

// CharacterBody types
export type CharacterBodyStateType = Enums<'character_body_state_type'>;
export type LoopMode = Enums<'loop_mode'>;
type CharacterBodyStateRow = Tables<'character_body_states'>;
export type CharacterBodyState = Omit<CharacterBodyStateRow, 'id' | 'body_id'> & {
	id: CharacterBodyStateId;
	body_id: CharacterBodyId;
};
export type CharacterBodyStateInsert = TablesInsert<'character_body_states'>;
export type CharacterBodyStateUpdate = TablesUpdate<'character_body_states'>;

type CharacterBodyRow = Tables<'character_bodies'>;
export type CharacterBody = Omit<CharacterBodyRow, 'id' | 'scenario_id' | 'created_by'> & {
	id: CharacterBodyId;
	scenario_id: ScenarioId;
	created_by: UserRoleId | null;
};
export type CharacterBodyInsert = TablesInsert<'character_bodies'>;
export type CharacterBodyUpdate = TablesUpdate<'character_bodies'>;

// CharacterFaceState types
export type CharacterFaceStateType = Enums<'character_face_state_type'>;
type CharacterFaceStateRow = Tables<'character_face_states'>;
export type CharacterFaceState = Omit<CharacterFaceStateRow, 'id' | 'character_id'> & {
	id: CharacterFaceStateId;
	character_id: CharacterId;
};
export type CharacterFaceStateInsert = TablesInsert<'character_face_states'>;
export type CharacterFaceStateUpdate = TablesUpdate<'character_face_states'>;

// Character types
type CharacterRow = Tables<'characters'>;
export type Character = Omit<CharacterRow, 'id' | 'scenario_id' | 'body_id' | 'created_by'> & {
	id: CharacterId;
	scenario_id: ScenarioId;
	body_id: CharacterBodyId;
	created_by: UserRoleId | null;
};
export type CharacterInsert = TablesInsert<'characters'>;
export type CharacterUpdate = TablesUpdate<'characters'>;

// World types
type WorldRow = Tables<'worlds'>;
export type World = Omit<WorldRow, 'id' | 'player_id' | 'terrain_id'> & {
	id: WorldId;
	player_id: PlayerId;
	terrain_id: TerrainId | null;
};
export type WorldInsert = TablesInsert<'worlds'>;
export type WorldUpdate = TablesUpdate<'worlds'>;

// WorldCharacter types
type WorldCharacterRow = Tables<'world_characters'>;
export type WorldCharacter = Omit<WorldCharacterRow, 'id' | 'world_id' | 'character_id' | 'player_id'> & {
	id: WorldCharacterId;
	world_id: WorldId;
	character_id: CharacterId;
	player_id: PlayerId;
};
export type WorldCharacterInsert = TablesInsert<'world_characters'>;
export type WorldCharacterUpdate = TablesUpdate<'world_characters'>;

// BuildingState types
export type BuildingStateType = Enums<'building_state_type'>;
type BuildingStateRow = Tables<'building_states'>;
export type BuildingState = Omit<BuildingStateRow, 'id' | 'building_id'> & {
	id: BuildingStateId;
	building_id: BuildingId;
};
export type BuildingStateInsert = TablesInsert<'building_states'>;
export type BuildingStateUpdate = TablesUpdate<'building_states'>;

// Building types
type BuildingRow = Tables<'buildings'>;
export type Building = Omit<BuildingRow, 'id' | 'scenario_id' | 'created_by'> & {
	id: BuildingId;
	scenario_id: ScenarioId;
	created_by: UserRoleId | null;
};
export type BuildingInsert = TablesInsert<'buildings'>;
export type BuildingUpdate = TablesUpdate<'buildings'>;

// WorldBuilding types
type WorldBuildingRow = Tables<'world_buildings'>;
export type WorldBuilding = Omit<WorldBuildingRow, 'id' | 'world_id' | 'building_id' | 'player_id'> & {
	id: WorldBuildingId;
	world_id: WorldId;
	building_id: BuildingId;
	player_id: PlayerId;
};
export type WorldBuildingInsert = TablesInsert<'world_buildings'>;
export type WorldBuildingUpdate = TablesUpdate<'world_buildings'>;

// Need types
export type NeedFulfillmentType = Enums<'need_fulfillment_type'>;
export type NeedFulfillmentTaskCondition = Enums<'need_fulfillment_task_condition'>;
type NeedRow = Tables<'needs'>;
export type Need = Omit<NeedRow, 'id' | 'scenario_id' | 'created_by'> & {
	id: NeedId;
	scenario_id: ScenarioId;
	created_by: UserRoleId | null;
};
export type NeedInsert = TablesInsert<'needs'>;
export type NeedUpdate = TablesUpdate<'needs'>;
type NeedFulfillmentRow = Tables<'need_fulfillments'>;
export type NeedFulfillment = Omit<
	NeedFulfillmentRow,
	'id' | 'need_id' | 'scenario_id' | 'building_id' | 'item_id' | 'character_id' | 'created_by'
> & {
	id: NeedFulfillmentId;
	need_id: NeedId;
	scenario_id: ScenarioId;
	building_id: BuildingId | null;
	item_id: ItemId | null;
	character_id: CharacterId | null;
	created_by: UserRoleId | null;
};
export type NeedFulfillmentInsert = TablesInsert<'need_fulfillments'>;
export type NeedFulfillmentUpdate = TablesUpdate<'need_fulfillments'>;

// CharacterNeed types (skeleton)
type CharacterNeedRow = Tables<'character_needs'>;
export type CharacterNeed = Omit<
	CharacterNeedRow,
	'id' | 'scenario_id' | 'character_id' | 'need_id' | 'created_by'
> & {
	id: CharacterNeedId;
	scenario_id: ScenarioId;
	character_id: CharacterId;
	need_id: NeedId;
	created_by: UserRoleId | null;
};
export type CharacterNeedInsert = TablesInsert<'character_needs'>;
export type CharacterNeedUpdate = TablesUpdate<'character_needs'>;

// WorldCharacterNeed types (runtime)
type WorldCharacterNeedRow = Tables<'world_character_needs'>;
export type WorldCharacterNeed = Omit<
	WorldCharacterNeedRow,
	'id' | 'world_id' | 'world_character_id' | 'character_id' | 'need_id' | 'player_id' | 'scenario_id'
> & {
	id: WorldCharacterNeedId;
	world_id: WorldId;
	world_character_id: WorldCharacterId;
	character_id: CharacterId;
	need_id: NeedId;
	player_id: PlayerId;
	scenario_id: ScenarioId;
};
export type WorldCharacterNeedInsert = TablesInsert<'world_character_needs'>;
export type WorldCharacterNeedUpdate = TablesUpdate<'world_character_needs'>;

// NeedBehavior types
type NeedBehaviorRow = Tables<'need_behaviors'>;
export type NeedBehavior = Omit<NeedBehaviorRow, 'id' | 'scenario_id' | 'need_id' | 'created_by'> & {
	id: NeedBehaviorId;
	scenario_id: ScenarioId;
	need_id: NeedId;
	created_by: UserRoleId | null;
};
export type NeedBehaviorInsert = TablesInsert<'need_behaviors'>;
export type NeedBehaviorUpdate = TablesUpdate<'need_behaviors'>;

// NeedBehaviorAction types
export type NeedBehaviorActionType = Enums<'need_behavior_action_type'>;
type NeedBehaviorActionRow = Tables<'need_behavior_actions'>;
export type NeedBehaviorAction = Omit<
	NeedBehaviorActionRow,
	| 'id'
	| 'scenario_id'
	| 'need_id'
	| 'behavior_id'
	| 'building_id'
	| 'item_id'
	| 'character_id'
	| 'success_need_behavior_action_id'
	| 'failure_need_behavior_action_id'
> & {
	id: NeedBehaviorActionId;
	scenario_id: ScenarioId;
	need_id: NeedId;
	behavior_id: NeedBehaviorId;
	building_id: BuildingId | null;
	item_id: ItemId | null;
	character_id: CharacterId | null;
	success_need_behavior_action_id: NeedBehaviorActionId | null;
	failure_need_behavior_action_id: NeedBehaviorActionId | null;
};
export type NeedBehaviorActionInsert = TablesInsert<'need_behavior_actions'>;
export type NeedBehaviorActionUpdate = TablesUpdate<'need_behavior_actions'>;

// BuildingBehavior types
export type BuildingBehaviorType = Enums<'building_behavior_type'>;
type BuildingBehaviorRow = Tables<'building_behaviors'>;
export type BuildingBehavior = Omit<
	BuildingBehaviorRow,
	'id' | 'scenario_id' | 'building_id' | 'created_by'
> & {
	id: BuildingBehaviorId;
	scenario_id: ScenarioId;
	building_id: BuildingId;
	created_by: UserRoleId | null;
};
export type BuildingBehaviorInsert = TablesInsert<'building_behaviors'>;
export type BuildingBehaviorUpdate = TablesUpdate<'building_behaviors'>;

// BuildingBehaviorAction types
type BuildingBehaviorActionRow = Tables<'building_behavior_actions'>;
export type BuildingBehaviorAction = Omit<
	BuildingBehaviorActionRow,
	| 'id'
	| 'scenario_id'
	| 'behavior_id'
	| 'success_building_behavior_action_id'
	| 'failure_building_behavior_action_id'
> & {
	id: BuildingBehaviorActionId;
	scenario_id: ScenarioId;
	behavior_id: BuildingBehaviorId;
	success_building_behavior_action_id: BuildingBehaviorActionId | null;
	failure_building_behavior_action_id: BuildingBehaviorActionId | null;
};
export type BuildingBehaviorActionInsert = TablesInsert<'building_behavior_actions'>;
export type BuildingBehaviorActionUpdate = TablesUpdate<'building_behavior_actions'>;

// ItemState types
export type ItemStateType = Enums<'item_state_type'>;
type ItemStateRow = Tables<'item_states'>;
export type ItemState = Omit<ItemStateRow, 'id' | 'item_id'> & {
	id: ItemStateId;
	item_id: ItemId;
};
export type ItemStateInsert = TablesInsert<'item_states'>;
export type ItemStateUpdate = TablesUpdate<'item_states'>;

// Item types
type ItemRow = Tables<'items'>;
export type Item = Omit<ItemRow, 'id' | 'scenario_id' | 'created_by'> & {
	id: ItemId;
	scenario_id: ScenarioId;
	created_by: UserRoleId | null;
};
export type ItemInsert = TablesInsert<'items'>;
export type ItemUpdate = TablesUpdate<'items'>;

// WorldItem types
type WorldItemRow = Tables<'world_items'>;
export type WorldItem = Omit<WorldItemRow, 'id' | 'world_id' | 'item_id' | 'player_id'> & {
	id: WorldItemId;
	world_id: WorldId;
	item_id: ItemId;
	player_id: PlayerId;
};
export type WorldItemInsert = TablesInsert<'world_items'>;
export type WorldItemUpdate = TablesUpdate<'world_items'>;

// ItemBehavior types
export type ItemBehaviorType = Enums<'item_behavior_type'>;
type ItemBehaviorRow = Tables<'item_behaviors'>;
export type ItemBehavior = Omit<ItemBehaviorRow, 'id' | 'scenario_id' | 'item_id' | 'created_by'> & {
	id: ItemBehaviorId;
	scenario_id: ScenarioId;
	item_id: ItemId;
	created_by: UserRoleId | null;
};
export type ItemBehaviorInsert = TablesInsert<'item_behaviors'>;
export type ItemBehaviorUpdate = TablesUpdate<'item_behaviors'>;

// ItemBehaviorAction types
type ItemBehaviorActionRow = Tables<'item_behavior_actions'>;
export type ItemBehaviorAction = Omit<
	ItemBehaviorActionRow,
	| 'id'
	| 'scenario_id'
	| 'behavior_id'
	| 'success_item_behavior_action_id'
	| 'failure_item_behavior_action_id'
> & {
	id: ItemBehaviorActionId;
	scenario_id: ScenarioId;
	behavior_id: ItemBehaviorId;
	success_item_behavior_action_id: ItemBehaviorActionId | null;
	failure_item_behavior_action_id: ItemBehaviorActionId | null;
};
export type ItemBehaviorActionInsert = TablesInsert<'item_behavior_actions'>;
export type ItemBehaviorActionUpdate = TablesUpdate<'item_behavior_actions'>;
