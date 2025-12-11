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

export interface ServerPayload {
	supabase: SupabaseClient;
	user: User | undefined;
}

// Enums
export type QuestStatus = Enums<'quest_status'>;
export type QuestType = Enums<'quest_type'>;
export type PlayerQuestStatus = Enums<'player_quest_status'>;
export type PlayerChapterStatus = Enums<'player_chapter_status'>;
export type DiceRollAction = Enums<'dice_roll_action'>;
export type NarrativeNodeType = Enums<'narrative_node_type'>;

// Chapter types
export type Chapter = Tables<'chapters'>;
export type ChapterInsert = TablesInsert<'chapters'>;
export type ChapterUpdate = TablesUpdate<'chapters'>;
export type PlayerChapter = Tables<'player_chapters'>;
export type PlayerChapterInsert = TablesInsert<'player_chapters'>;

// Quest types
export type QuestRow = Tables<'quests'>;
export type QuestInsert = TablesInsert<'quests'>;
export type QuestUpdate = TablesUpdate<'quests'>;
export type QuestBranch = Tables<'quest_branches'>;
export type QuestBranchInsert = TablesInsert<'quest_branches'>;
export type QuestBranchUpdate = TablesUpdate<'quest_branches'>;
export type PlayerQuest = Tables<'player_quests'>;
export type PlayerQuestInsert = TablesInsert<'player_quests'>;
export type PlayerQuestBranch = Tables<'player_quest_branches'>;
export type PlayerQuestBranchInsert = TablesInsert<'player_quest_branches'>;

// Extended Quest with relations
export type Quest = QuestRow & {
	quest_branches?: QuestBranch[];
};

// Narrative types
export type NarrativeRow = Tables<'narratives'>;
export type NarrativeInsert = TablesInsert<'narratives'>;
export type NarrativeUpdate = TablesUpdate<'narratives'>;
export type NarrativeNodeRow = Tables<'narrative_nodes'>;
export type NarrativeNodeInsert = TablesInsert<'narrative_nodes'>;
export type NarrativeNodeUpdate = TablesUpdate<'narrative_nodes'>;
export type NarrativeNodeChoice = Tables<'narrative_node_choices'>;
export type NarrativeNodeChoiceInsert = TablesInsert<'narrative_node_choices'>;
export type NarrativeNodeChoiceUpdate = TablesUpdate<'narrative_node_choices'>;

// Extended Narrative with relations
export type NarrativeNode = NarrativeNodeRow & {
	narrative_node_choices?: NarrativeNodeChoice[];
};

export type Narrative = NarrativeRow & {
	narrative_nodes?: NarrativeNode[];
};

// Dice types
export type Dice = Tables<'dices'>;
export type DiceInsert = TablesInsert<'dices'>;
export type DiceUpdate = TablesUpdate<'dices'>;
export type NarrativeDiceRoll = Tables<'narrative_dice_rolls'>;
export type NarrativeDiceRollInsert = TablesInsert<'narrative_dice_rolls'>;
export type NarrativeDiceRollUpdate = TablesUpdate<'narrative_dice_rolls'>;
export type PlayerDiceRoll = Tables<'player_dice_rolls'>;
export type PlayerDiceRollInsert = TablesInsert<'player_dice_rolls'>;

// Player types
export type Player = Tables<'players'>;
export type PlayerInsert = TablesInsert<'players'>;
export type PlayerUpdate = TablesUpdate<'players'>;

// User types
export type UserRole = Tables<'user_roles'>;
