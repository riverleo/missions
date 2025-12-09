import type { Tables, TablesInsert, TablesUpdate, Enums } from './supabase';

// Quest enums
export type QuestStatus = Enums<'quest_status'>;
export type QuestType = Enums<'quest_type'>;
export type PlayerQuestStatus = Enums<'player_quest_status'>;

// Base types
export type QuestRow = Tables<'quests'>;
export type QuestBranch = Tables<'quest_branches'>;
export type PlayerQuestRow = Tables<'player_quests'>;
export type PlayerQuestBranchRow = Tables<'player_quest_branches'>;

// Insert/Update types
export type QuestInsert = TablesInsert<'quests'>;
export type QuestUpdate = TablesUpdate<'quests'>;
export type QuestBranchInsert = TablesInsert<'quest_branches'>;
export type QuestBranchUpdate = TablesUpdate<'quest_branches'>;
export type PlayerQuestInsert = TablesInsert<'player_quests'>;
export type PlayerQuestUpdate = TablesUpdate<'player_quests'>;
export type PlayerQuestBranchInsert = TablesInsert<'player_quest_branches'>;
export type PlayerQuestBranchUpdate = TablesUpdate<'player_quest_branches'>;

// Extended types with joins
export type Quest = QuestRow & {
	quest_branches?: QuestBranch[];
};
