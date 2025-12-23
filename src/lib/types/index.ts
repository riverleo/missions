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

export interface RecordFetchState<T> {
	status: FetchStatus;
	data: Record<string, T>;
	error?: Error;
}

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
export type Scenario = Tables<'scenarios'>;
export type ScenarioInsert = TablesInsert<'scenarios'>;
export type ScenarioUpdate = TablesUpdate<'scenarios'>;
export type PlayerScenario = Tables<'player_scenarios'>;
export type PlayerScenarioInsert = TablesInsert<'player_scenarios'>;

// Chapter types
export type Chapter = Tables<'chapters'>;
export type ChapterInsert = TablesInsert<'chapters'>;
export type ChapterUpdate = TablesUpdate<'chapters'>;
export type PlayerChapter = Tables<'player_chapters'>;
export type PlayerChapterInsert = TablesInsert<'player_chapters'>;

// Quest types
export type Quest = Tables<'quests'>;
export type QuestInsert = TablesInsert<'quests'>;
export type QuestUpdate = TablesUpdate<'quests'>;
export type QuestBranch = Tables<'quest_branches'>;
export type QuestBranchInsert = TablesInsert<'quest_branches'>;
export type QuestBranchUpdate = TablesUpdate<'quest_branches'>;
export type PlayerQuest = Tables<'player_quests'>;
export type PlayerQuestInsert = TablesInsert<'player_quests'>;
export type PlayerQuestBranch = Tables<'player_quest_branches'>;
export type PlayerQuestBranchInsert = TablesInsert<'player_quest_branches'>;

// Narrative types
export type Narrative = Tables<'narratives'>;
export type NarrativeInsert = TablesInsert<'narratives'>;
export type NarrativeUpdate = TablesUpdate<'narratives'>;
export type NarrativeNode = Tables<'narrative_nodes'>;
export type NarrativeNodeInsert = TablesInsert<'narrative_nodes'>;
export type NarrativeNodeUpdate = TablesUpdate<'narrative_nodes'>;
export type NarrativeNodeChoice = Tables<'narrative_node_choices'>;
export type NarrativeNodeChoiceInsert = TablesInsert<'narrative_node_choices'>;
export type NarrativeNodeChoiceUpdate = TablesUpdate<'narrative_node_choices'>;

// Dice types
export type Dice = Tables<'dices'>;
export type DiceInsert = TablesInsert<'dices'>;
export type DiceUpdate = TablesUpdate<'dices'>;
export type NarrativeDiceRoll = Tables<'narrative_dice_rolls'>;
export type NarrativeDiceRollInsert = TablesInsert<'narrative_dice_rolls'>;
export type NarrativeDiceRollUpdate = TablesUpdate<'narrative_dice_rolls'>;
export type PlayerRolledDice = Tables<'player_rolled_dices'>;
export type PlayerRolledDiceInsert = TablesInsert<'player_rolled_dices'>;

// Player types
export type Player = Tables<'players'>;
export type PlayerInsert = TablesInsert<'players'>;
export type PlayerUpdate = TablesUpdate<'players'>;

// User types
export type UserRole = Tables<'user_roles'>;

// Terrain types
export type Terrain = Tables<'terrains'>;
export type TerrainInsert = TablesInsert<'terrains'>;
export type TerrainUpdate = TablesUpdate<'terrains'>;

// CharacterBody types
export type CharacterBodyStateType = Enums<'character_body_state_type'>;
export type LoopMode = Enums<'loop_mode'>;
export type CharacterBodyState = Tables<'character_body_states'>;
export type CharacterBodyStateInsert = TablesInsert<'character_body_states'>;
export type CharacterBodyStateUpdate = TablesUpdate<'character_body_states'>;

export type CharacterBody = Tables<'character_bodies'>;
export type CharacterBodyInsert = TablesInsert<'character_bodies'>;
export type CharacterBodyUpdate = TablesUpdate<'character_bodies'>;

// CharacterFaceState types
export type CharacterFaceStateType = Enums<'character_face_state_type'>;
export type CharacterFaceState = Tables<'character_face_states'>;
export type CharacterFaceStateInsert = TablesInsert<'character_face_states'>;
export type CharacterFaceStateUpdate = TablesUpdate<'character_face_states'>;

// Character types
export type Character = Tables<'characters'>;
export type CharacterInsert = TablesInsert<'characters'>;
export type CharacterUpdate = TablesUpdate<'characters'>;

// World types
export type World = Tables<'worlds'>;
export type WorldInsert = TablesInsert<'worlds'>;
export type WorldUpdate = TablesUpdate<'worlds'>;

// WorldCharacter types
export type WorldCharacter = Tables<'world_characters'>;
export type WorldCharacterInsert = TablesInsert<'world_characters'>;
export type WorldCharacterUpdate = TablesUpdate<'world_characters'>;

// BuildingState types
export type BuildingStateType = Enums<'building_state_type'>;
export type BuildingState = Tables<'building_states'>;
export type BuildingStateInsert = TablesInsert<'building_states'>;
export type BuildingStateUpdate = TablesUpdate<'building_states'>;

// Building types
export type Building = Tables<'buildings'>;
export type BuildingInsert = TablesInsert<'buildings'>;
export type BuildingUpdate = TablesUpdate<'buildings'>;

// WorldBuilding types
export type WorldBuilding = Tables<'world_buildings'>;
export type WorldBuildingInsert = TablesInsert<'world_buildings'>;
export type WorldBuildingUpdate = TablesUpdate<'world_buildings'>;

// Need types
export type NeedFulfillmentType = Enums<'need_fulfillment_type'>;
export type NeedFulfillmentTaskCondition = Enums<'need_fulfillment_task_condition'>;
export type Need = Tables<'needs'>;
export type NeedInsert = TablesInsert<'needs'>;
export type NeedUpdate = TablesUpdate<'needs'>;
export type NeedFulfillment = Tables<'need_fulfillments'>;
export type NeedFulfillmentInsert = TablesInsert<'need_fulfillments'>;
export type NeedFulfillmentUpdate = TablesUpdate<'need_fulfillments'>;

// CharacterNeed types (skeleton)
export type CharacterNeed = Tables<'character_needs'>;
export type CharacterNeedInsert = TablesInsert<'character_needs'>;
export type CharacterNeedUpdate = TablesUpdate<'character_needs'>;

// WorldCharacterNeed types (runtime)
export type WorldCharacterNeed = Tables<'world_character_needs'>;
export type WorldCharacterNeedInsert = TablesInsert<'world_character_needs'>;
export type WorldCharacterNeedUpdate = TablesUpdate<'world_character_needs'>;

// NeedBehavior types
export type NeedBehavior = Tables<'need_behaviors'>;
export type NeedBehaviorInsert = TablesInsert<'need_behaviors'>;
export type NeedBehaviorUpdate = TablesUpdate<'need_behaviors'>;

// NeedBehaviorAction types
export type NeedBehaviorActionType = Enums<'need_behavior_action_type'>;
export type NeedBehaviorAction = Tables<'need_behavior_actions'>;
export type NeedBehaviorActionInsert = TablesInsert<'need_behavior_actions'>;
export type NeedBehaviorActionUpdate = TablesUpdate<'need_behavior_actions'>;

// BuildingBehavior types
export type BuildingBehaviorType = Enums<'building_behavior_type'>;
export type BuildingBehavior = Tables<'building_behaviors'>;
export type BuildingBehaviorInsert = TablesInsert<'building_behaviors'>;
export type BuildingBehaviorUpdate = TablesUpdate<'building_behaviors'>;

// BuildingBehaviorAction types
export type BuildingBehaviorAction = Tables<'building_behavior_actions'>;
export type BuildingBehaviorActionInsert = TablesInsert<'building_behavior_actions'>;
export type BuildingBehaviorActionUpdate = TablesUpdate<'building_behavior_actions'>;

// ItemState types
export type ItemStateType = Enums<'item_state_type'>;
export type ItemState = Tables<'item_states'>;
export type ItemStateInsert = TablesInsert<'item_states'>;
export type ItemStateUpdate = TablesUpdate<'item_states'>;

// Item types
export type Item = Tables<'items'>;
export type ItemInsert = TablesInsert<'items'>;
export type ItemUpdate = TablesUpdate<'items'>;

// WorldItem types
export type WorldItem = Tables<'world_items'>;
export type WorldItemInsert = TablesInsert<'world_items'>;
export type WorldItemUpdate = TablesUpdate<'world_items'>;

// ItemBehavior types
export type ItemBehaviorType = Enums<'item_behavior_type'>;
export type ItemBehavior = Tables<'item_behaviors'>;
export type ItemBehaviorInsert = TablesInsert<'item_behaviors'>;
export type ItemBehaviorUpdate = TablesUpdate<'item_behaviors'>;

// ItemBehaviorAction types
export type ItemBehaviorAction = Tables<'item_behavior_actions'>;
export type ItemBehaviorActionInsert = TablesInsert<'item_behavior_actions'>;
export type ItemBehaviorActionUpdate = TablesUpdate<'item_behavior_actions'>;
