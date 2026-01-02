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
export type UserId = Brand<string, 'UserId'>;
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
export type ConditionBehaviorId = Brand<string, 'ConditionBehaviorId'>;
export type ConditionBehaviorActionId = Brand<string, 'ConditionBehaviorActionId'>;
export type WorldBuildingId = Brand<string, 'WorldBuildingId'>;
export type ConditionId = Brand<string, 'ConditionId'>;
export type ConditionFulfillmentId = Brand<string, 'ConditionFulfillmentId'>;
export type BuildingConditionId = Brand<string, 'BuildingConditionId'>;
export type ConditionEffectId = Brand<string, 'ConditionEffectId'>;
export type WorldBuildingConditionId = Brand<string, 'WorldBuildingConditionId'>;
export type NeedId = Brand<string, 'NeedId'>;
export type NeedFulfillmentId = Brand<string, 'NeedFulfillmentId'>;
export type NeedBehaviorId = Brand<string, 'NeedBehaviorId'>;
export type NeedBehaviorActionId = Brand<string, 'NeedBehaviorActionId'>;
export type ItemId = Brand<string, 'ItemId'>;
export type ItemStateId = Brand<string, 'ItemStateId'>;
export type ItemBehaviorId = Brand<string, 'ItemBehaviorId'>;
export type ItemBehaviorActionId = Brand<string, 'ItemBehaviorActionId'>;
export type BehaviorPriorityId = Brand<string, 'BehaviorPriorityId'>;
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
type ScenarioInsertRow = TablesInsert<'scenarios'>;
export type ScenarioInsert = ScenarioInsertRow;
type ScenarioUpdateRow = TablesUpdate<'scenarios'>;
export type ScenarioUpdate = Omit<ScenarioUpdateRow, 'id'> & {
	id?: ScenarioId;
};
type PlayerScenarioRow = Tables<'player_scenarios'>;
export type PlayerScenario = Omit<PlayerScenarioRow, 'id' | 'user_id' | 'player_id' | 'scenario_id'> & {
	id: PlayerScenarioId;
	user_id: UserId;
	player_id: PlayerId;
	scenario_id: ScenarioId;
};
type PlayerScenarioInsertRow = TablesInsert<'player_scenarios'>;
export type PlayerScenarioInsert = Omit<PlayerScenarioInsertRow, 'user_id' | 'player_id' | 'scenario_id'> & {
	user_id?: UserId;
	player_id: PlayerId;
	scenario_id: ScenarioId;
};

// Chapter types
type ChapterRow = Tables<'chapters'>;
export type Chapter = Omit<ChapterRow, 'id' | 'scenario_id'> & {
	id: ChapterId;
	scenario_id: ScenarioId;
};
type ChapterInsertRow = TablesInsert<'chapters'>;
export type ChapterInsert = Omit<ChapterInsertRow, 'scenario_id'> & {
	scenario_id: ScenarioId;
};
type ChapterUpdateRow = TablesUpdate<'chapters'>;
export type ChapterUpdate = Omit<ChapterUpdateRow, 'id' | 'scenario_id'> & {
	id?: ChapterId;
	scenario_id?: ScenarioId;
};
type PlayerChapterRow = Tables<'player_chapters'>;
export type PlayerChapter = Omit<
	PlayerChapterRow,
	'id' | 'user_id' | 'player_id' | 'scenario_id' | 'chapter_id'
> & {
	id: PlayerChapterId;
	user_id: UserId;
	player_id: PlayerId;
	scenario_id: ScenarioId;
	chapter_id: ChapterId;
};
type PlayerChapterInsertRow = TablesInsert<'player_chapters'>;
export type PlayerChapterInsert = Omit<
	PlayerChapterInsertRow,
	'user_id' | 'player_id' | 'scenario_id' | 'chapter_id'
> & {
	user_id?: UserId;
	player_id: PlayerId;
	scenario_id: ScenarioId;
	chapter_id: ChapterId;
};

// Quest types
type QuestRow = Tables<'quests'>;
export type Quest = Omit<QuestRow, 'id' | 'scenario_id' | 'chapter_id' | 'created_by'> & {
	id: QuestId;
	scenario_id: ScenarioId;
	chapter_id: ChapterId | null;
	created_by: UserRoleId | null;
};
type QuestInsertRow = TablesInsert<'quests'>;
export type QuestInsert = Omit<QuestInsertRow, 'scenario_id' | 'chapter_id'> & {
	scenario_id: ScenarioId;
	chapter_id?: ChapterId | null;
};
type QuestUpdateRow = TablesUpdate<'quests'>;
export type QuestUpdate = Omit<
	QuestUpdateRow,
	'id' | 'scenario_id' | 'chapter_id' | 'created_by'
> & {
	id?: QuestId;
	scenario_id?: ScenarioId;
	chapter_id?: ChapterId | null;
	created_by?: UserRoleId | null;
};
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
type QuestBranchInsertRow = TablesInsert<'quest_branches'>;
export type QuestBranchInsert = Omit<
	QuestBranchInsertRow,
	'quest_id' | 'parent_quest_branch_id'
> & {
	quest_id: QuestId;
	parent_quest_branch_id?: QuestBranchId | null;
};
type QuestBranchUpdateRow = TablesUpdate<'quest_branches'>;
export type QuestBranchUpdate = Omit<
	QuestBranchUpdateRow,
	'id' | 'quest_id' | 'parent_quest_branch_id' | 'created_by'
> & {
	id?: QuestBranchId;
	quest_id?: QuestId;
	parent_quest_branch_id?: QuestBranchId | null;
	created_by?: UserRoleId | null;
};
type PlayerQuestRow = Tables<'player_quests'>;
export type PlayerQuest = Omit<PlayerQuestRow, 'id' | 'user_id' | 'player_id' | 'scenario_id' | 'quest_id'> & {
	id: PlayerQuestId;
	user_id: UserId;
	player_id: PlayerId;
	scenario_id: ScenarioId;
	quest_id: QuestId;
};
type PlayerQuestInsertRow = TablesInsert<'player_quests'>;
export type PlayerQuestInsert = Omit<
	PlayerQuestInsertRow,
	'user_id' | 'player_id' | 'scenario_id' | 'quest_id'
> & {
	user_id?: UserId;
	player_id: PlayerId;
	scenario_id: ScenarioId;
	quest_id: QuestId;
};
type PlayerQuestBranchRow = Tables<'player_quest_branches'>;
export type PlayerQuestBranch = Omit<
	PlayerQuestBranchRow,
	'id' | 'user_id' | 'player_id' | 'scenario_id' | 'quest_id' | 'quest_branch_id' | 'player_quest_id'
> & {
	id: PlayerQuestBranchId;
	user_id: UserId;
	player_id: PlayerId;
	scenario_id: ScenarioId;
	quest_id: QuestId;
	quest_branch_id: QuestBranchId;
	player_quest_id: PlayerQuestId;
};
type PlayerQuestBranchInsertRow = TablesInsert<'player_quest_branches'>;
export type PlayerQuestBranchInsert = Omit<
	PlayerQuestBranchInsertRow,
	'user_id' | 'player_id' | 'scenario_id' | 'quest_id' | 'quest_branch_id' | 'player_quest_id'
> & {
	user_id?: UserId;
	player_id: PlayerId;
	scenario_id: ScenarioId;
	quest_id: QuestId;
	quest_branch_id: QuestBranchId;
	player_quest_id: PlayerQuestId;
};

// Narrative types
type NarrativeRow = Tables<'narratives'>;
export type Narrative = Omit<NarrativeRow, 'id' | 'scenario_id' | 'created_by'> & {
	id: NarrativeId;
	scenario_id: ScenarioId;
	created_by: UserRoleId | null;
};
type NarrativeInsertRow = TablesInsert<'narratives'>;
export type NarrativeInsert = Omit<NarrativeInsertRow, 'scenario_id'> & {
	scenario_id: ScenarioId;
};
type NarrativeUpdateRow = TablesUpdate<'narratives'>;
export type NarrativeUpdate = Omit<NarrativeUpdateRow, 'id' | 'scenario_id' | 'created_by'> & {
	id?: NarrativeId;
	scenario_id?: ScenarioId;
	created_by?: UserRoleId | null;
};
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
type NarrativeNodeInsertRow = TablesInsert<'narrative_nodes'>;
export type NarrativeNodeInsert = Omit<
	NarrativeNodeInsertRow,
	'narrative_id' | 'scenario_id' | 'narrative_dice_roll_id'
> & {
	narrative_id: NarrativeId;
	scenario_id: ScenarioId;
	narrative_dice_roll_id?: NarrativeDiceRollId | null;
};
type NarrativeNodeUpdateRow = TablesUpdate<'narrative_nodes'>;
export type NarrativeNodeUpdate = Omit<
	NarrativeNodeUpdateRow,
	'id' | 'narrative_id' | 'scenario_id' | 'narrative_dice_roll_id'
> & {
	id?: NarrativeNodeId;
	narrative_id?: NarrativeId;
	scenario_id?: ScenarioId;
	narrative_dice_roll_id?: NarrativeDiceRollId | null;
};
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
type NarrativeNodeChoiceInsertRow = TablesInsert<'narrative_node_choices'>;
export type NarrativeNodeChoiceInsert = Omit<
	NarrativeNodeChoiceInsertRow,
	'narrative_node_id' | 'scenario_id' | 'narrative_dice_roll_id'
> & {
	narrative_node_id: NarrativeNodeId;
	scenario_id: ScenarioId;
	narrative_dice_roll_id?: NarrativeDiceRollId | null;
};
type NarrativeNodeChoiceUpdateRow = TablesUpdate<'narrative_node_choices'>;
export type NarrativeNodeChoiceUpdate = Omit<
	NarrativeNodeChoiceUpdateRow,
	'id' | 'narrative_node_id' | 'scenario_id' | 'narrative_dice_roll_id'
> & {
	id?: NarrativeNodeChoiceId;
	narrative_node_id?: NarrativeNodeId;
	scenario_id?: ScenarioId;
	narrative_dice_roll_id?: NarrativeDiceRollId | null;
};

// Dice types
type DiceRow = Tables<'dices'>;
export type Dice = Omit<DiceRow, 'id' | 'created_by'> & {
	id: DiceId;
	created_by: UserRoleId | null;
};
type DiceInsertRow = TablesInsert<'dices'>;
export type DiceInsert = DiceInsertRow;
type DiceUpdateRow = TablesUpdate<'dices'>;
export type DiceUpdate = Omit<DiceUpdateRow, 'id' | 'created_by'> & {
	id?: DiceId;
	created_by?: UserRoleId | null;
};
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
type NarrativeDiceRollInsertRow = TablesInsert<'narrative_dice_rolls'>;
export type NarrativeDiceRollInsert = Omit<
	NarrativeDiceRollInsertRow,
	'narrative_id' | 'scenario_id' | 'success_narrative_node_id' | 'failure_narrative_node_id'
> & {
	narrative_id: NarrativeId;
	scenario_id: ScenarioId;
	success_narrative_node_id?: NarrativeNodeId | null;
	failure_narrative_node_id?: NarrativeNodeId | null;
};
type NarrativeDiceRollUpdateRow = TablesUpdate<'narrative_dice_rolls'>;
export type NarrativeDiceRollUpdate = Omit<
	NarrativeDiceRollUpdateRow,
	| 'id'
	| 'narrative_id'
	| 'scenario_id'
	| 'success_narrative_node_id'
	| 'failure_narrative_node_id'
	| 'created_by'
> & {
	id?: NarrativeDiceRollId;
	narrative_id?: NarrativeId;
	scenario_id?: ScenarioId;
	success_narrative_node_id?: NarrativeNodeId | null;
	failure_narrative_node_id?: NarrativeNodeId | null;
	created_by?: UserRoleId | null;
};
type PlayerRolledDiceRow = Tables<'player_rolled_dices'>;
export type PlayerRolledDice = Omit<
	PlayerRolledDiceRow,
	| 'id'
	| 'user_id'
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
	user_id: UserId;
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
type PlayerRolledDiceInsertRow = TablesInsert<'player_rolled_dices'>;
export type PlayerRolledDiceInsert = Omit<
	PlayerRolledDiceInsertRow,
	| 'user_id'
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
	user_id?: UserId;
	player_id: PlayerId;
	scenario_id?: ScenarioId | null;
	narrative_id: NarrativeId;
	narrative_node_id: NarrativeNodeId;
	narrative_node_choice_id?: NarrativeNodeChoiceId | null;
	narrative_dice_roll_id: NarrativeDiceRollId;
	quest_id?: QuestId | null;
	quest_branch_id?: QuestBranchId | null;
	player_quest_id?: PlayerQuestId | null;
	player_quest_branch_id?: PlayerQuestBranchId | null;
	dice_id?: DiceId | null;
};

// Player types
type PlayerRow = Tables<'players'>;
export type Player = Omit<PlayerRow, 'id' | 'user_id'> & {
	id: PlayerId;
	user_id: UserId;
};
type PlayerInsertRow = TablesInsert<'players'>;
export type PlayerInsert = Omit<PlayerInsertRow, 'user_id'> & {
	user_id?: UserId;
};
type PlayerUpdateRow = TablesUpdate<'players'>;
export type PlayerUpdate = Omit<PlayerUpdateRow, 'id' | 'user_id'> & {
	id?: PlayerId;
	user_id?: UserId;
};

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
type TerrainInsertRow = TablesInsert<'terrains'>;
export type TerrainInsert = Omit<TerrainInsertRow, 'scenario_id'> & {
	scenario_id: ScenarioId;
};
type TerrainUpdateRow = TablesUpdate<'terrains'>;
export type TerrainUpdate = Omit<TerrainUpdateRow, 'id' | 'scenario_id' | 'created_by'> & {
	id?: TerrainId;
	scenario_id?: ScenarioId;
	created_by?: UserRoleId | null;
};

// CharacterBody types
export type CharacterBodyStateType = Enums<'character_body_state_type'>;
export type LoopMode = Enums<'loop_mode'>;
type CharacterBodyStateRow = Tables<'character_body_states'>;
export type CharacterBodyState = Omit<CharacterBodyStateRow, 'id' | 'body_id'> & {
	id: CharacterBodyStateId;
	body_id: CharacterBodyId;
};
type CharacterBodyStateInsertRow = TablesInsert<'character_body_states'>;
export type CharacterBodyStateInsert = Omit<CharacterBodyStateInsertRow, 'body_id'> & {
	body_id: CharacterBodyId;
};
type CharacterBodyStateUpdateRow = TablesUpdate<'character_body_states'>;
export type CharacterBodyStateUpdate = Omit<CharacterBodyStateUpdateRow, 'id' | 'body_id'> & {
	id?: CharacterBodyStateId;
	body_id?: CharacterBodyId;
};

type CharacterBodyRow = Tables<'character_bodies'>;
export type CharacterBody = Omit<CharacterBodyRow, 'id' | 'scenario_id' | 'created_by'> & {
	id: CharacterBodyId;
	scenario_id: ScenarioId;
	created_by: UserRoleId | null;
};
type CharacterBodyInsertRow = TablesInsert<'character_bodies'>;
export type CharacterBodyInsert = Omit<CharacterBodyInsertRow, 'scenario_id'> & {
	scenario_id: ScenarioId;
};
type CharacterBodyUpdateRow = TablesUpdate<'character_bodies'>;
export type CharacterBodyUpdate = Omit<
	CharacterBodyUpdateRow,
	'id' | 'scenario_id' | 'created_by'
> & {
	id?: CharacterBodyId;
	scenario_id?: ScenarioId;
	created_by?: UserRoleId | null;
};

// CharacterFaceState types
export type CharacterFaceStateType = Enums<'character_face_state_type'>;
type CharacterFaceStateRow = Tables<'character_face_states'>;
export type CharacterFaceState = Omit<CharacterFaceStateRow, 'id' | 'character_id'> & {
	id: CharacterFaceStateId;
	character_id: CharacterId;
};
type CharacterFaceStateInsertRow = TablesInsert<'character_face_states'>;
export type CharacterFaceStateInsert = Omit<CharacterFaceStateInsertRow, 'character_id'> & {
	character_id: CharacterId;
};
type CharacterFaceStateUpdateRow = TablesUpdate<'character_face_states'>;
export type CharacterFaceStateUpdate = Omit<CharacterFaceStateUpdateRow, 'id' | 'character_id'> & {
	id?: CharacterFaceStateId;
	character_id?: CharacterId;
};

// Character types
type CharacterRow = Tables<'characters'>;
export type Character = Omit<
	CharacterRow,
	'id' | 'scenario_id' | 'character_body_id' | 'created_by'
> & {
	id: CharacterId;
	scenario_id: ScenarioId;
	character_body_id: CharacterBodyId;
	created_by: UserRoleId | null;
};
type CharacterInsertRow = TablesInsert<'characters'>;
export type CharacterInsert = Omit<CharacterInsertRow, 'scenario_id' | 'character_body_id'> & {
	scenario_id: ScenarioId;
	character_body_id: CharacterBodyId;
};
type CharacterUpdateRow = TablesUpdate<'characters'>;
export type CharacterUpdate = Omit<
	CharacterUpdateRow,
	'id' | 'scenario_id' | 'character_body_id' | 'created_by'
> & {
	id?: CharacterId;
	scenario_id?: ScenarioId;
	character_body_id?: CharacterBodyId;
	created_by?: UserRoleId | null;
};

// World types
type WorldRow = Tables<'worlds'>;
export type World = Omit<WorldRow, 'id' | 'user_id' | 'player_id' | 'scenario_id' | 'terrain_id'> & {
	id: WorldId;
	user_id: UserId;
	player_id: PlayerId;
	scenario_id: ScenarioId;
	terrain_id: TerrainId | null;
};
type WorldInsertRow = TablesInsert<'worlds'>;
export type WorldInsert = Omit<WorldInsertRow, 'user_id' | 'player_id' | 'scenario_id' | 'terrain_id'> & {
	user_id: UserId;
	player_id: PlayerId;
	scenario_id: ScenarioId;
	terrain_id?: TerrainId | null;
};
type WorldUpdateRow = TablesUpdate<'worlds'>;
export type WorldUpdate = Omit<WorldUpdateRow, 'id' | 'user_id' | 'player_id' | 'scenario_id' | 'terrain_id'> & {
	id?: WorldId;
	user_id?: UserId;
	player_id?: PlayerId;
	scenario_id?: ScenarioId;
	terrain_id?: TerrainId | null;
};

// WorldCharacter types
type WorldCharacterRow = Tables<'world_characters'>;
export type WorldCharacter = Omit<
	WorldCharacterRow,
	'id' | 'user_id' | 'world_id' | 'character_id' | 'player_id' | 'scenario_id'
> & {
	id: WorldCharacterId;
	user_id: UserId;
	world_id: WorldId;
	character_id: CharacterId;
	player_id: PlayerId;
	scenario_id: ScenarioId;
};
type WorldCharacterInsertRow = TablesInsert<'world_characters'>;
export type WorldCharacterInsert = Omit<
	WorldCharacterInsertRow,
	'user_id' | 'world_id' | 'character_id' | 'player_id' | 'scenario_id'
> & {
	user_id?: UserId;
	world_id: WorldId;
	character_id: CharacterId;
	player_id: PlayerId;
	scenario_id: ScenarioId;
};
type WorldCharacterUpdateRow = TablesUpdate<'world_characters'>;
export type WorldCharacterUpdate = Omit<
	WorldCharacterUpdateRow,
	'id' | 'user_id' | 'world_id' | 'character_id' | 'player_id' | 'scenario_id'
> & {
	id?: WorldCharacterId;
	user_id?: UserId;
	world_id?: WorldId;
	character_id?: CharacterId;
	player_id?: PlayerId;
	scenario_id?: ScenarioId;
};

// BuildingState types
export type BuildingStateType = Enums<'building_state_type'>;
type BuildingStateRow = Tables<'building_states'>;
export type BuildingState = Omit<BuildingStateRow, 'id' | 'building_id'> & {
	id: BuildingStateId;
	building_id: BuildingId;
};
type BuildingStateInsertRow = TablesInsert<'building_states'>;
export type BuildingStateInsert = Omit<BuildingStateInsertRow, 'building_id'> & {
	building_id: BuildingId;
};
type BuildingStateUpdateRow = TablesUpdate<'building_states'>;
export type BuildingStateUpdate = Omit<BuildingStateUpdateRow, 'id' | 'building_id'> & {
	id?: BuildingStateId;
	building_id?: BuildingId;
};

// Building types
type BuildingRow = Tables<'buildings'>;
export type Building = Omit<BuildingRow, 'id' | 'scenario_id' | 'created_by'> & {
	id: BuildingId;
	scenario_id: ScenarioId;
	created_by: UserRoleId | null;
};
type BuildingInsertRow = TablesInsert<'buildings'>;
export type BuildingInsert = Omit<BuildingInsertRow, 'scenario_id'> & {
	scenario_id: ScenarioId;
};
type BuildingUpdateRow = TablesUpdate<'buildings'>;
export type BuildingUpdate = Omit<BuildingUpdateRow, 'id' | 'scenario_id' | 'created_by'> & {
	id?: BuildingId;
	scenario_id?: ScenarioId;
	created_by?: UserRoleId | null;
};

// WorldBuilding types
type WorldBuildingRow = Tables<'world_buildings'>;
export type WorldBuilding = Omit<
	WorldBuildingRow,
	'id' | 'user_id' | 'world_id' | 'building_id' | 'player_id' | 'scenario_id'
> & {
	id: WorldBuildingId;
	user_id: UserId;
	world_id: WorldId;
	building_id: BuildingId;
	player_id: PlayerId;
	scenario_id: ScenarioId;
};
type WorldBuildingInsertRow = TablesInsert<'world_buildings'>;
export type WorldBuildingInsert = Omit<
	WorldBuildingInsertRow,
	'user_id' | 'world_id' | 'building_id' | 'player_id' | 'scenario_id'
> & {
	user_id?: UserId;
	world_id: WorldId;
	building_id: BuildingId;
	player_id: PlayerId;
	scenario_id: ScenarioId;
};
type WorldBuildingUpdateRow = TablesUpdate<'world_buildings'>;
export type WorldBuildingUpdate = Omit<
	WorldBuildingUpdateRow,
	'id' | 'user_id' | 'world_id' | 'building_id' | 'player_id' | 'scenario_id'
> & {
	id?: WorldBuildingId;
	user_id?: UserId;
	world_id?: WorldId;
	building_id?: BuildingId;
	player_id?: PlayerId;
	scenario_id?: ScenarioId;
};

// Condition types
type ConditionRow = Tables<'conditions'>;
export type Condition = Omit<ConditionRow, 'id' | 'scenario_id' | 'created_by'> & {
	id: ConditionId;
	scenario_id: ScenarioId;
	created_by: UserRoleId | null;
};
type ConditionInsertRow = TablesInsert<'conditions'>;
export type ConditionInsert = Omit<ConditionInsertRow, 'scenario_id' | 'created_by'> & {
	scenario_id: ScenarioId;
	created_by?: UserRoleId | null;
};
type ConditionUpdateRow = TablesUpdate<'conditions'>;
export type ConditionUpdate = Omit<ConditionUpdateRow, 'id' | 'scenario_id' | 'created_by'> & {
	id?: ConditionId;
	scenario_id?: ScenarioId;
	created_by?: UserRoleId | null;
};

export type ConditionFulfillmentType = Enums<'condition_fulfillment_type'>;
type ConditionFulfillmentRow = Tables<'condition_fulfillments'>;
export type ConditionFulfillment = Omit<
	ConditionFulfillmentRow,
	'id' | 'condition_id' | 'scenario_id' | 'character_id' | 'item_id' | 'created_by'
> & {
	id: ConditionFulfillmentId;
	condition_id: ConditionId;
	scenario_id: ScenarioId;
	character_id: CharacterId | null;
	item_id: ItemId | null;
	created_by: UserRoleId | null;
};
type ConditionFulfillmentInsertRow = TablesInsert<'condition_fulfillments'>;
export type ConditionFulfillmentInsert = Omit<
	ConditionFulfillmentInsertRow,
	'condition_id' | 'scenario_id' | 'character_id' | 'item_id'
> & {
	condition_id: ConditionId;
	scenario_id: ScenarioId;
	character_id?: CharacterId | null;
	item_id?: ItemId | null;
};
type ConditionFulfillmentUpdateRow = TablesUpdate<'condition_fulfillments'>;
export type ConditionFulfillmentUpdate = Omit<
	ConditionFulfillmentUpdateRow,
	'id' | 'condition_id' | 'scenario_id' | 'character_id' | 'item_id' | 'created_by'
> & {
	id?: ConditionFulfillmentId;
	condition_id?: ConditionId;
	scenario_id?: ScenarioId;
	character_id?: CharacterId | null;
	item_id?: ItemId | null;
	created_by?: UserRoleId | null;
};

type BuildingConditionRow = Tables<'building_conditions'>;
export type BuildingCondition = Omit<
	BuildingConditionRow,
	'id' | 'scenario_id' | 'building_id' | 'condition_id' | 'created_by'
> & {
	id: BuildingConditionId;
	scenario_id: ScenarioId;
	building_id: BuildingId;
	condition_id: ConditionId;
	created_by: UserRoleId | null;
};
type BuildingConditionInsertRow = TablesInsert<'building_conditions'>;
export type BuildingConditionInsert = Omit<
	BuildingConditionInsertRow,
	'scenario_id' | 'building_id' | 'condition_id' | 'created_by'
> & {
	scenario_id: ScenarioId;
	building_id: BuildingId;
	condition_id: ConditionId;
	created_by?: UserRoleId | null;
};
type BuildingConditionUpdateRow = TablesUpdate<'building_conditions'>;
export type BuildingConditionUpdate = Omit<
	BuildingConditionUpdateRow,
	'id' | 'scenario_id' | 'building_id' | 'condition_id' | 'created_by'
> & {
	id?: BuildingConditionId;
	scenario_id?: ScenarioId;
	building_id?: BuildingId;
	condition_id?: ConditionId;
	created_by?: UserRoleId | null;
};

type ConditionEffectRow = Tables<'condition_effects'>;
export type ConditionEffect = Omit<
	ConditionEffectRow,
	'id' | 'scenario_id' | 'condition_id' | 'character_id' | 'need_id' | 'created_by'
> & {
	id: ConditionEffectId;
	scenario_id: ScenarioId;
	condition_id: ConditionId;
	character_id: CharacterId | null;
	need_id: NeedId;
	created_by: UserRoleId | null;
};
type ConditionEffectInsertRow = TablesInsert<'condition_effects'>;
export type ConditionEffectInsert = Omit<
	ConditionEffectInsertRow,
	'scenario_id' | 'condition_id' | 'character_id' | 'need_id' | 'created_by'
> & {
	scenario_id: ScenarioId;
	condition_id: ConditionId;
	character_id?: CharacterId | null;
	need_id: NeedId;
	created_by?: UserRoleId | null;
};
type ConditionEffectUpdateRow = TablesUpdate<'condition_effects'>;
export type ConditionEffectUpdate = Omit<
	ConditionEffectUpdateRow,
	'id' | 'scenario_id' | 'condition_id' | 'character_id' | 'need_id' | 'created_by'
> & {
	id?: ConditionEffectId;
	scenario_id?: ScenarioId;
	condition_id?: ConditionId;
	character_id?: CharacterId | null;
	need_id?: NeedId;
	created_by?: UserRoleId | null;
};

type WorldBuildingConditionRow = Tables<'world_building_conditions'>;
export type WorldBuildingCondition = Omit<
	WorldBuildingConditionRow,
	| 'id'
	| 'scenario_id'
	| 'user_id'
	| 'player_id'
	| 'world_id'
	| 'world_building_id'
	| 'building_id'
	| 'building_condition_id'
	| 'condition_id'
> & {
	id: WorldBuildingConditionId;
	scenario_id: ScenarioId;
	user_id: UserId;
	player_id: PlayerId;
	world_id: WorldId;
	world_building_id: WorldBuildingId;
	building_id: BuildingId;
	building_condition_id: BuildingConditionId;
	condition_id: ConditionId;
};
type WorldBuildingConditionInsertRow = TablesInsert<'world_building_conditions'>;
export type WorldBuildingConditionInsert = Omit<
	WorldBuildingConditionInsertRow,
	| 'scenario_id'
	| 'user_id'
	| 'player_id'
	| 'world_id'
	| 'world_building_id'
	| 'building_id'
	| 'building_condition_id'
	| 'condition_id'
> & {
	scenario_id: ScenarioId;
	user_id?: UserId;
	player_id: PlayerId;
	world_id: WorldId;
	world_building_id: WorldBuildingId;
	building_id: BuildingId;
	building_condition_id: BuildingConditionId;
	condition_id: ConditionId;
};
type WorldBuildingConditionUpdateRow = TablesUpdate<'world_building_conditions'>;
export type WorldBuildingConditionUpdate = Omit<
	WorldBuildingConditionUpdateRow,
	| 'id'
	| 'scenario_id'
	| 'user_id'
	| 'player_id'
	| 'world_id'
	| 'world_building_id'
	| 'building_id'
	| 'building_condition_id'
	| 'condition_id'
> & {
	id?: WorldBuildingConditionId;
	scenario_id?: ScenarioId;
	user_id?: UserId;
	player_id?: PlayerId;
	world_id?: WorldId;
	world_building_id?: WorldBuildingId;
	building_id?: BuildingId;
	building_condition_id?: BuildingConditionId;
	condition_id?: ConditionId;
};

// Need types
export type NeedFulfillmentType = Enums<'need_fulfillment_type'>;
export type NeedFulfillmentTaskCondition = Enums<'need_fulfillment_task_condition'>;
type NeedRow = Tables<'needs'>;
export type Need = Omit<NeedRow, 'id' | 'scenario_id' | 'created_by'> & {
	id: NeedId;
	scenario_id: ScenarioId;
	created_by: UserRoleId | null;
};
type NeedInsertRow = TablesInsert<'needs'>;
export type NeedInsert = Omit<NeedInsertRow, 'scenario_id'> & {
	scenario_id: ScenarioId;
};
type NeedUpdateRow = TablesUpdate<'needs'>;
export type NeedUpdate = Omit<NeedUpdateRow, 'id' | 'scenario_id' | 'created_by'> & {
	id?: NeedId;
	scenario_id?: ScenarioId;
	created_by?: UserRoleId | null;
};
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
type NeedFulfillmentInsertRow = TablesInsert<'need_fulfillments'>;
export type NeedFulfillmentInsert = Omit<
	NeedFulfillmentInsertRow,
	'need_id' | 'scenario_id' | 'building_id' | 'item_id' | 'character_id'
> & {
	need_id: NeedId;
	scenario_id: ScenarioId;
	building_id?: BuildingId | null;
	item_id?: ItemId | null;
	character_id?: CharacterId | null;
};
type NeedFulfillmentUpdateRow = TablesUpdate<'need_fulfillments'>;
export type NeedFulfillmentUpdate = Omit<
	NeedFulfillmentUpdateRow,
	'id' | 'need_id' | 'scenario_id' | 'building_id' | 'item_id' | 'character_id' | 'created_by'
> & {
	id?: NeedFulfillmentId;
	need_id?: NeedId;
	scenario_id?: ScenarioId;
	building_id?: BuildingId | null;
	item_id?: ItemId | null;
	character_id?: CharacterId | null;
	created_by?: UserRoleId | null;
};

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
type CharacterNeedInsertRow = TablesInsert<'character_needs'>;
export type CharacterNeedInsert = Omit<
	CharacterNeedInsertRow,
	'scenario_id' | 'character_id' | 'need_id'
> & {
	scenario_id: ScenarioId;
	character_id: CharacterId;
	need_id: NeedId;
};
type CharacterNeedUpdateRow = TablesUpdate<'character_needs'>;
export type CharacterNeedUpdate = Omit<
	CharacterNeedUpdateRow,
	'id' | 'scenario_id' | 'character_id' | 'need_id' | 'created_by'
> & {
	id?: CharacterNeedId;
	scenario_id?: ScenarioId;
	character_id?: CharacterId;
	need_id?: NeedId;
	created_by?: UserRoleId | null;
};

// WorldCharacterNeed types (runtime)
type WorldCharacterNeedRow = Tables<'world_character_needs'>;
export type WorldCharacterNeed = Omit<
	WorldCharacterNeedRow,
	| 'id'
	| 'user_id'
	| 'world_id'
	| 'world_character_id'
	| 'character_id'
	| 'need_id'
	| 'player_id'
	| 'scenario_id'
> & {
	id: WorldCharacterNeedId;
	user_id: UserId;
	world_id: WorldId;
	world_character_id: WorldCharacterId;
	character_id: CharacterId;
	need_id: NeedId;
	player_id: PlayerId;
	scenario_id: ScenarioId;
};
type WorldCharacterNeedInsertRow = TablesInsert<'world_character_needs'>;
export type WorldCharacterNeedInsert = Omit<
	WorldCharacterNeedInsertRow,
	'user_id' | 'world_id' | 'world_character_id' | 'character_id' | 'need_id' | 'player_id' | 'scenario_id'
> & {
	user_id?: UserId;
	world_id: WorldId;
	world_character_id: WorldCharacterId;
	character_id: CharacterId;
	need_id: NeedId;
	player_id: PlayerId;
	scenario_id: ScenarioId;
};
type WorldCharacterNeedUpdateRow = TablesUpdate<'world_character_needs'>;
export type WorldCharacterNeedUpdate = Omit<
	WorldCharacterNeedUpdateRow,
	| 'id'
	| 'user_id'
	| 'world_id'
	| 'world_character_id'
	| 'character_id'
	| 'need_id'
	| 'player_id'
	| 'scenario_id'
> & {
	id?: WorldCharacterNeedId;
	user_id?: UserId;
	world_id?: WorldId;
	world_character_id?: WorldCharacterId;
	character_id?: CharacterId;
	need_id?: NeedId;
	player_id?: PlayerId;
	scenario_id?: ScenarioId;
};

// NeedBehavior types
type NeedBehaviorRow = Tables<'need_behaviors'>;
export type NeedBehavior = Omit<
	NeedBehaviorRow,
	'id' | 'scenario_id' | 'need_id' | 'created_by'
> & {
	id: NeedBehaviorId;
	scenario_id: ScenarioId;
	need_id: NeedId;
	created_by: UserRoleId | null;
};
type NeedBehaviorInsertRow = TablesInsert<'need_behaviors'>;
export type NeedBehaviorInsert = Omit<NeedBehaviorInsertRow, 'scenario_id' | 'need_id'> & {
	scenario_id: ScenarioId;
	need_id: NeedId;
};
type NeedBehaviorUpdateRow = TablesUpdate<'need_behaviors'>;
export type NeedBehaviorUpdate = Omit<
	NeedBehaviorUpdateRow,
	'id' | 'scenario_id' | 'need_id' | 'created_by'
> & {
	id?: NeedBehaviorId;
	scenario_id?: ScenarioId;
	need_id?: NeedId;
	created_by?: UserRoleId | null;
};

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
type NeedBehaviorActionInsertRow = TablesInsert<'need_behavior_actions'>;
export type NeedBehaviorActionInsert = Omit<
	NeedBehaviorActionInsertRow,
	| 'scenario_id'
	| 'need_id'
	| 'behavior_id'
	| 'building_id'
	| 'item_id'
	| 'character_id'
	| 'success_need_behavior_action_id'
	| 'failure_need_behavior_action_id'
> & {
	scenario_id: ScenarioId;
	need_id: NeedId;
	behavior_id: NeedBehaviorId;
	building_id?: BuildingId | null;
	item_id?: ItemId | null;
	character_id?: CharacterId | null;
	success_need_behavior_action_id?: NeedBehaviorActionId | null;
	failure_need_behavior_action_id?: NeedBehaviorActionId | null;
};
type NeedBehaviorActionUpdateRow = TablesUpdate<'need_behavior_actions'>;
export type NeedBehaviorActionUpdate = Omit<
	NeedBehaviorActionUpdateRow,
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
	id?: NeedBehaviorActionId;
	scenario_id?: ScenarioId;
	need_id?: NeedId;
	behavior_id?: NeedBehaviorId;
	building_id?: BuildingId | null;
	item_id?: ItemId | null;
	character_id?: CharacterId | null;
	success_need_behavior_action_id?: NeedBehaviorActionId | null;
	failure_need_behavior_action_id?: NeedBehaviorActionId | null;
};

// CharacterBehavior types
export type CharacterBehaviorType = Enums<'character_behavior_type'>;

// ConditionBehavior types
type ConditionBehaviorRow = Tables<'condition_behaviors'>;
export type ConditionBehavior = Omit<
	ConditionBehaviorRow,
	'id' | 'scenario_id' | 'building_id' | 'condition_id' | 'character_id' | 'created_by'
> & {
	id: ConditionBehaviorId;
	scenario_id: ScenarioId;
	building_id: BuildingId;
	condition_id: ConditionId;
	character_id: CharacterId | null;
	created_by: UserRoleId | null;
};
type ConditionBehaviorInsertRow = TablesInsert<'condition_behaviors'>;
export type ConditionBehaviorInsert = Omit<
	ConditionBehaviorInsertRow,
	'scenario_id' | 'building_id' | 'condition_id' | 'character_id'
> & {
	scenario_id: ScenarioId;
	building_id: BuildingId;
	condition_id: ConditionId;
	character_id?: CharacterId | null;
};
type ConditionBehaviorUpdateRow = TablesUpdate<'condition_behaviors'>;
export type ConditionBehaviorUpdate = Omit<
	ConditionBehaviorUpdateRow,
	'id' | 'scenario_id' | 'building_id' | 'condition_id' | 'character_id' | 'created_by'
> & {
	id?: ConditionBehaviorId;
	building_id?: BuildingId;
	scenario_id?: ScenarioId;
	condition_id?: ConditionId;
	character_id?: CharacterId | null;
	created_by?: UserRoleId | null;
};

// ConditionBehaviorAction types
type ConditionBehaviorActionRow = Tables<'condition_behavior_actions'>;
export type ConditionBehaviorAction = Omit<
	ConditionBehaviorActionRow,
	| 'id'
	| 'scenario_id'
	| 'condition_id'
	| 'condition_behavior_id'
	| 'success_condition_behavior_action_id'
	| 'failure_condition_behavior_action_id'
> & {
	id: ConditionBehaviorActionId;
	scenario_id: ScenarioId;
	condition_id: ConditionId;
	condition_behavior_id: ConditionBehaviorId;
	success_condition_behavior_action_id: ConditionBehaviorActionId | null;
	failure_condition_behavior_action_id: ConditionBehaviorActionId | null;
};
type ConditionBehaviorActionInsertRow = TablesInsert<'condition_behavior_actions'>;
export type ConditionBehaviorActionInsert = Omit<
	ConditionBehaviorActionInsertRow,
	| 'scenario_id'
	| 'condition_id'
	| 'condition_behavior_id'
	| 'success_condition_behavior_action_id'
	| 'failure_condition_behavior_action_id'
> & {
	scenario_id: ScenarioId;
	condition_id: ConditionId;
	condition_behavior_id: ConditionBehaviorId;
	success_condition_behavior_action_id?: ConditionBehaviorActionId | null;
	failure_condition_behavior_action_id?: ConditionBehaviorActionId | null;
};
type ConditionBehaviorActionUpdateRow = TablesUpdate<'condition_behavior_actions'>;
export type ConditionBehaviorActionUpdate = Omit<
	ConditionBehaviorActionUpdateRow,
	| 'id'
	| 'scenario_id'
	| 'condition_id'
	| 'condition_behavior_id'
	| 'success_condition_behavior_action_id'
	| 'failure_condition_behavior_action_id'
> & {
	id?: ConditionBehaviorActionId;
	scenario_id?: ScenarioId;
	condition_id?: ConditionId;
	condition_behavior_id?: ConditionBehaviorId;
	success_condition_behavior_action_id?: ConditionBehaviorActionId | null;
	failure_condition_behavior_action_id?: ConditionBehaviorActionId | null;
};

// ItemState types
export type ItemStateType = Enums<'item_state_type'>;
type ItemStateRow = Tables<'item_states'>;
export type ItemState = Omit<ItemStateRow, 'id' | 'item_id'> & {
	id: ItemStateId;
	item_id: ItemId;
};
type ItemStateInsertRow = TablesInsert<'item_states'>;
export type ItemStateInsert = Omit<ItemStateInsertRow, 'item_id'> & {
	item_id: ItemId;
};
type ItemStateUpdateRow = TablesUpdate<'item_states'>;
export type ItemStateUpdate = Omit<ItemStateUpdateRow, 'id' | 'item_id'> & {
	id?: ItemStateId;
	item_id?: ItemId;
};

// Item types
type ItemRow = Tables<'items'>;
export type Item = Omit<ItemRow, 'id' | 'scenario_id' | 'created_by'> & {
	id: ItemId;
	scenario_id: ScenarioId;
	created_by: UserRoleId | null;
};
type ItemInsertRow = TablesInsert<'items'>;
export type ItemInsert = Omit<ItemInsertRow, 'scenario_id'> & {
	scenario_id: ScenarioId;
};
type ItemUpdateRow = TablesUpdate<'items'>;
export type ItemUpdate = Omit<ItemUpdateRow, 'id' | 'scenario_id' | 'created_by'> & {
	id?: ItemId;
	scenario_id?: ScenarioId;
	created_by?: UserRoleId | null;
};

// WorldItem types
type WorldItemRow = Tables<'world_items'>;
export type WorldItem = Omit<WorldItemRow, 'id' | 'user_id' | 'world_id' | 'item_id' | 'player_id' | 'scenario_id'> & {
	id: WorldItemId;
	user_id: UserId;
	world_id: WorldId;
	item_id: ItemId;
	player_id: PlayerId;
	scenario_id: ScenarioId;
};
type WorldItemInsertRow = TablesInsert<'world_items'>;
export type WorldItemInsert = Omit<WorldItemInsertRow, 'user_id' | 'world_id' | 'item_id' | 'player_id' | 'scenario_id'> & {
	user_id?: UserId;
	world_id: WorldId;
	item_id: ItemId;
	player_id: PlayerId;
	scenario_id: ScenarioId;
};
type WorldItemUpdateRow = TablesUpdate<'world_items'>;
export type WorldItemUpdate = Omit<
	WorldItemUpdateRow,
	'id' | 'user_id' | 'world_id' | 'item_id' | 'player_id' | 'scenario_id'
> & {
	id?: WorldItemId;
	user_id?: UserId;
	world_id?: WorldId;
	item_id?: ItemId;
	scenario_id?: ScenarioId;
	player_id?: PlayerId;
};

// ItemBehavior types
type ItemBehaviorRow = Tables<'item_behaviors'>;
export type ItemBehavior = Omit<
	ItemBehaviorRow,
	'id' | 'scenario_id' | 'item_id' | 'created_by'
> & {
	id: ItemBehaviorId;
	scenario_id: ScenarioId;
	item_id: ItemId;
	created_by: UserRoleId | null;
};
type ItemBehaviorInsertRow = TablesInsert<'item_behaviors'>;
export type ItemBehaviorInsert = Omit<ItemBehaviorInsertRow, 'scenario_id' | 'item_id'> & {
	scenario_id: ScenarioId;
	item_id: ItemId;
};
type ItemBehaviorUpdateRow = TablesUpdate<'item_behaviors'>;
export type ItemBehaviorUpdate = Omit<
	ItemBehaviorUpdateRow,
	'id' | 'scenario_id' | 'item_id' | 'created_by'
> & {
	id?: ItemBehaviorId;
	scenario_id?: ScenarioId;
	item_id?: ItemId;
	created_by?: UserRoleId | null;
};

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
type ItemBehaviorActionInsertRow = TablesInsert<'item_behavior_actions'>;
export type ItemBehaviorActionInsert = Omit<
	ItemBehaviorActionInsertRow,
	| 'scenario_id'
	| 'behavior_id'
	| 'success_item_behavior_action_id'
	| 'failure_item_behavior_action_id'
> & {
	scenario_id: ScenarioId;
	behavior_id: ItemBehaviorId;
	success_item_behavior_action_id?: ItemBehaviorActionId | null;
	failure_item_behavior_action_id?: ItemBehaviorActionId | null;
};
type ItemBehaviorActionUpdateRow = TablesUpdate<'item_behavior_actions'>;
export type ItemBehaviorActionUpdate = Omit<
	ItemBehaviorActionUpdateRow,
	| 'id'
	| 'scenario_id'
	| 'behavior_id'
	| 'success_item_behavior_action_id'
	| 'failure_item_behavior_action_id'
> & {
	id?: ItemBehaviorActionId;
	scenario_id?: ScenarioId;
	behavior_id?: ItemBehaviorId;
	success_item_behavior_action_id?: ItemBehaviorActionId | null;
	failure_item_behavior_action_id?: ItemBehaviorActionId | null;
};

// BehaviorPriority types
type BehaviorPriorityRow = Tables<'behavior_priorities'>;
export type BehaviorPriority = Omit<
	BehaviorPriorityRow,
	| 'id'
	| 'scenario_id'
	| 'need_behavior_id'
	| 'condition_behavior_id'
	| 'item_behavior_id'
	| 'created_by'
> & {
	id: BehaviorPriorityId;
	scenario_id: ScenarioId;
	need_behavior_id: NeedBehaviorId | null;
	condition_behavior_id: ConditionBehaviorId | null;
	item_behavior_id: ItemBehaviorId | null;
	created_by: UserRoleId | null;
};
type BehaviorPriorityInsertRow = TablesInsert<'behavior_priorities'>;
export type BehaviorPriorityInsert = Omit<
	BehaviorPriorityInsertRow,
	'scenario_id' | 'need_behavior_id' | 'condition_behavior_id' | 'item_behavior_id' | 'created_by'
> & {
	scenario_id: ScenarioId;
	need_behavior_id?: NeedBehaviorId | null;
	condition_behavior_id?: ConditionBehaviorId | null;
	item_behavior_id?: ItemBehaviorId | null;
	created_by?: UserRoleId | null;
};
type BehaviorPriorityUpdateRow = TablesUpdate<'behavior_priorities'>;
export type BehaviorPriorityUpdate = Omit<
	BehaviorPriorityUpdateRow,
	| 'id'
	| 'scenario_id'
	| 'need_behavior_id'
	| 'condition_behavior_id'
	| 'item_behavior_id'
	| 'created_by'
> & {
	id?: BehaviorPriorityId;
	scenario_id?: ScenarioId;
	need_behavior_id?: NeedBehaviorId | null;
	condition_behavior_id?: ConditionBehaviorId | null;
	item_behavior_id?: ItemBehaviorId | null;
	created_by?: UserRoleId | null;
};
