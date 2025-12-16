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
	user: User | undefined;
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

// CharacterState types
export type CharacterStateType = Enums<'character_state_type'>;
export type LoopMode = Enums<'loop_mode'>;
export type CharacterState = Tables<'character_states'>;
export type CharacterStateInsert = TablesInsert<'character_states'>;
export type CharacterStateUpdate = TablesUpdate<'character_states'>;

// Character types
type CharacterRow = Tables<'characters'>;
export type Character = CharacterRow & {
	character_states: CharacterState[];
};
export type CharacterInsert = TablesInsert<'characters'>;
export type CharacterUpdate = TablesUpdate<'characters'>;

// PlayerCharacter types
type PlayerCharacterRow = Tables<'player_characters'>;
export type PlayerCharacter = PlayerCharacterRow & {
	character: Character;
};
export type PlayerCharacterInsert = TablesInsert<'player_characters'>;
export type PlayerCharacterUpdate = TablesUpdate<'player_characters'>;
