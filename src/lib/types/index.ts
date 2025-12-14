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
	data: T | undefined;
	error: Error | undefined;
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
	user: User | undefined;
}

// Enums
export type PublishStatus = Enums<'publish_status'>;
export type ScenarioQuestType = Enums<'scenario_quest_type'>;
export type PlayerScenarioQuestStatus = Enums<'player_scenario_quest_status'>;
export type PlayerScenarioChapterStatus = Enums<'player_scenario_chapter_status'>;
export type PlayerScenarioStatus = Enums<'player_scenario_status'>;
export type DiceRollAction = Enums<'dice_roll_action'>;
export type NarrativeNodeType = Enums<'narrative_node_type'>;

// Scenario types
type ScenarioRow = Tables<'scenarios'>;
export type ScenarioInsert = TablesInsert<'scenarios'>;
export type ScenarioUpdate = TablesUpdate<'scenarios'>;
export type Scenario = ScenarioRow & {
	created_by: UserRole | null;
};
export type PlayerScenario = Tables<'player_scenarios'>;
export type PlayerScenarioInsert = TablesInsert<'player_scenarios'>;

// Scenario Chapter types
export type ScenarioChapter = Tables<'scenario_chapters'>;
export type ScenarioChapterInsert = TablesInsert<'scenario_chapters'>;
export type ScenarioChapterUpdate = TablesUpdate<'scenario_chapters'>;
export type PlayerScenarioChapter = Tables<'player_scenario_chapters'>;
export type PlayerScenarioChapterInsert = TablesInsert<'player_scenario_chapters'>;

// Scenario Quest types
export type ScenarioQuestRow = Tables<'scenario_quests'>;
export type ScenarioQuestInsert = TablesInsert<'scenario_quests'>;
export type ScenarioQuestUpdate = TablesUpdate<'scenario_quests'>;
export type ScenarioQuestBranch = Tables<'scenario_quest_branches'>;
export type ScenarioQuestBranchInsert = TablesInsert<'scenario_quest_branches'>;
export type ScenarioQuestBranchUpdate = TablesUpdate<'scenario_quest_branches'>;
export type PlayerScenarioQuest = Tables<'player_scenario_quests'>;
export type PlayerScenarioQuestInsert = TablesInsert<'player_scenario_quests'>;
export type PlayerScenarioQuestBranch = Tables<'player_scenario_quest_branches'>;
export type PlayerScenarioQuestBranchInsert = TablesInsert<'player_scenario_quest_branches'>;

// Extended Scenario Quest with relations
export type ScenarioQuest = ScenarioQuestRow & {
	scenario_quest_branches?: ScenarioQuestBranch[];
	scenario_chapter?: ScenarioChapter | null;
};

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
