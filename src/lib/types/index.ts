import type { Tables, TablesInsert, TablesUpdate, Enums } from '$lib/database.types';
import type { SupabaseClient, User } from '@supabase/supabase-js';

// Fetch types
export type FetchStatus = 'idle' | 'loading' | 'success' | 'error';

export interface FetchState<T> {
	status: FetchStatus;
	data: T | undefined;
	error: Error | undefined;
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
export type NarrativeNodeChoiceWithDiceRoll = NarrativeNodeChoice & {
	dice_roll: DiceRoll;
};

export type NarrativeNode = NarrativeNodeRow & {
	dice_roll: DiceRoll;
	narrative_node_choices?: NarrativeNodeChoiceWithDiceRoll[];
};

export type Narrative = NarrativeRow & {
	narrative_nodes?: NarrativeNode[];
};

// Dice types
export type Dice = Tables<'dice'>;
export type DiceInsert = TablesInsert<'dice'>;
export type DiceUpdate = TablesUpdate<'dice'>;
export type DiceRoll = Tables<'dice_roll'>;
export type DiceRollInsert = TablesInsert<'dice_roll'>;
export type DiceRollUpdate = TablesUpdate<'dice_roll'>;
export type PlayerDiceRolled = Tables<'player_dice_rolleds'>;
export type PlayerDiceRolledInsert = TablesInsert<'player_dice_rolleds'>;

// Player types
export type Player = Tables<'players'>;
export type PlayerInsert = TablesInsert<'players'>;
export type PlayerUpdate = TablesUpdate<'players'>;

// User types
export type UserRole = Tables<'user_roles'>;
