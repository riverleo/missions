import type { Database } from './supabase.generated';
import type { Brand } from './core';
import type { VectorKey, TileCellKey } from './vector';

// ============================================================
// Helper Types for Supabase Database Access
// ============================================================
export type Tables<T extends keyof Database['public']['Tables']> =
	Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> =
	Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
	Database['public']['Tables'][T]['Update'];
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];

// ============================================================
// Branded ID Types
// ============================================================
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
export type BehaviorPriorityId = Brand<string, 'BehaviorPriorityId'>;
export type WorldItemId = Brand<string, 'WorldItemId'>;
export type BuildingInteractionId = Brand<string, 'BuildingInteractionId'>;
export type BuildingInteractionActionId = Brand<string, 'BuildingInteractionActionId'>;
export type ItemInteractionId = Brand<string, 'ItemInteractionId'>;
export type ItemInteractionActionId = Brand<string, 'ItemInteractionActionId'>;
export type CharacterInteractionId = Brand<string, 'CharacterInteractionId'>;
export type CharacterInteractionActionId = Brand<string, 'CharacterInteractionActionId'>;
export type TileId = Brand<string, 'TileId'>;
export type TileStateId = Brand<string, 'TileStateId'>;
export type TerrainTileId = Brand<string, 'TerrainTileId'>;
export type WorldTileMapId = Brand<string, 'WorldTileMapId'>;
export type ScenarioSnapshotId = Brand<string, 'ScenarioSnapshotId'>;

// ============================================================
// Entity Types (re-exported from core.ts)
// ============================================================
export type {
	EntityId,
	EntityType,
	EntityTemplateId,
	EntityInstanceId,
	EntityTemplateIdCandidate,
	EntityInstance,
} from './core';

// Re-export Database for hooks.server.ts
export type { Database };

// ============================================================
// Enum Type Exports
// ============================================================
export type LoopMode = Enums<'loop_mode'>;
export type ColliderType = Enums<'collider_type'>;
export type BuildingStateType = Enums<'building_state_type'>;
export type CharacterBodyStateType = Enums<'character_body_state_type'>;
export type CharacterFaceStateType = Enums<'character_face_state_type'>;
export type ItemStateType = Enums<'item_state_type'>;

// Additional enum exports
export type PublishStatus = Enums<'publish_status'>;
export type QuestType = Enums<'quest_type'>;
export type PlayerQuestStatus = Enums<'player_quest_status'>;
export type PlayerChapterStatus = Enums<'player_chapter_status'>;
export type PlayerScenarioStatus = Enums<'player_scenario_status'>;
export type DiceRollAction = Enums<'dice_roll_action'>;
export type CharacterBehaviorType = Enums<'character_behavior_type'>;
export type ConditionFulfillmentType = Enums<'condition_fulfillment_type'>;
export type NarrativeNodeType = Enums<'narrative_node_type'>;
export type BehaviorActionType = Enums<'behavior_action_type'>;
export type BehaviorTargetMethod = Enums<'behavior_target_method'>;
export type NeedFulfillmentTaskCondition = Enums<'need_fulfillment_task_condition'>;
export type NeedFulfillmentType = Enums<'need_fulfillment_type'>;
export type TileStateType = Enums<'tile_state_type'>;
export type UserRoleType = Enums<'user_role_type'>;

// ============================================================
// Table Type Redefinitions
// ============================================================

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
export type PlayerScenario = Omit<
	PlayerScenarioRow,
	'id' | 'user_id' | 'player_id' | 'scenario_id' | 'scenario_snapshot_id'
> & {
	id: PlayerScenarioId;
	user_id: UserId;
	player_id: PlayerId;
	scenario_id: ScenarioId;
	scenario_snapshot_id: ScenarioSnapshotId;
};
type PlayerScenarioInsertRow = TablesInsert<'player_scenarios'>;
export type PlayerScenarioInsert = Omit<
	PlayerScenarioInsertRow,
	'user_id' | 'player_id' | 'scenario_id' | 'scenario_snapshot_id'
> & {
	user_id?: UserId;
	player_id: PlayerId;
	scenario_id: ScenarioId;
	scenario_snapshot_id: ScenarioSnapshotId;
};
type PlayerScenarioUpdateRow = TablesUpdate<'player_scenarios'>;
export type PlayerScenarioUpdate = Omit<
	PlayerScenarioUpdateRow,
	'id' | 'user_id' | 'player_id' | 'scenario_id' | 'scenario_snapshot_id'
> & {
	id?: PlayerScenarioId;
	user_id?: UserId;
	player_id?: PlayerId;
	scenario_id?: ScenarioId;
	scenario_snapshot_id?: ScenarioSnapshotId;
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

// Player Chapter types
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
type PlayerChapterUpdateRow = TablesUpdate<'player_chapters'>;
export type PlayerChapterUpdate = Omit<
	PlayerChapterUpdateRow,
	'id' | 'user_id' | 'player_id' | 'scenario_id' | 'chapter_id'
> & {
	id?: PlayerChapterId;
	user_id?: UserId;
	player_id?: PlayerId;
	scenario_id?: ScenarioId;
	chapter_id?: ChapterId;
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
export type QuestInsert = Omit<QuestInsertRow, 'scenario_id' | 'chapter_id' | 'created_by'> & {
	scenario_id: ScenarioId;
	chapter_id: ChapterId | null;
	created_by?: UserRoleId | null;
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

// Quest Branch types
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
	'quest_id' | 'parent_quest_branch_id' | 'created_by'
> & {
	quest_id: QuestId;
	parent_quest_branch_id?: QuestBranchId | null;
	created_by?: UserRoleId | null;
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

// Player Quest types
type PlayerQuestRow = Tables<'player_quests'>;
export type PlayerQuest = Omit<
	PlayerQuestRow,
	'id' | 'user_id' | 'player_id' | 'scenario_id' | 'quest_id' | 'quest_branch_id'
> & {
	id: PlayerQuestId;
	user_id: UserId;
	player_id: PlayerId;
	scenario_id: ScenarioId;
	quest_id: QuestId;
	quest_branch_id?: QuestBranchId;
};
type PlayerQuestInsertRow = TablesInsert<'player_quests'>;
export type PlayerQuestInsert = Omit<
	PlayerQuestInsertRow,
	'user_id' | 'player_id' | 'scenario_id' | 'quest_id' | 'quest_branch_id'
> & {
	user_id?: UserId;
	player_id: PlayerId;
	scenario_id: ScenarioId;
	quest_id: QuestId;
	quest_branch_id?: QuestBranchId;
};
type PlayerQuestUpdateRow = TablesUpdate<'player_quests'>;
export type PlayerQuestUpdate = Omit<
	PlayerQuestUpdateRow,
	'id' | 'user_id' | 'player_id' | 'scenario_id' | 'quest_id' | 'quest_branch_id'
> & {
	id?: PlayerQuestId;
	user_id?: UserId;
	player_id?: PlayerId;
	scenario_id?: ScenarioId;
	quest_id?: QuestId;
	quest_branch_id?: QuestBranchId;
};

// Player Quest Branch types
type PlayerQuestBranchRow = Tables<'player_quest_branches'>;
export type PlayerQuestBranch = Omit<
	PlayerQuestBranchRow,
	| 'id'
	| 'user_id'
	| 'player_id'
	| 'scenario_id'
	| 'quest_id'
	| 'quest_branch_id'
	| 'player_quest_id'
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
type PlayerQuestBranchUpdateRow = TablesUpdate<'player_quest_branches'>;
export type PlayerQuestBranchUpdate = Omit<
	PlayerQuestBranchUpdateRow,
	| 'id'
	| 'user_id'
	| 'player_id'
	| 'scenario_id'
	| 'quest_id'
	| 'quest_branch_id'
	| 'player_quest_id'
> & {
	id?: PlayerQuestBranchId;
	user_id?: UserId;
	player_id?: PlayerId;
	scenario_id?: ScenarioId;
	quest_id?: QuestId;
	quest_branch_id?: QuestBranchId;
	player_quest_id?: PlayerQuestId;
};

// Narrative types
type NarrativeRow = Tables<'narratives'>;
export type Narrative = Omit<NarrativeRow, 'id' | 'scenario_id' | 'created_by'> & {
	id: NarrativeId;
	scenario_id: ScenarioId;
	created_by: UserRoleId | null;
};
type NarrativeInsertRow = TablesInsert<'narratives'>;
export type NarrativeInsert = Omit<NarrativeInsertRow, 'scenario_id' | 'created_by'> & {
	scenario_id: ScenarioId;
	created_by?: UserRoleId | null;
};
type NarrativeUpdateRow = TablesUpdate<'narratives'>;
export type NarrativeUpdate = Omit<NarrativeUpdateRow, 'id' | 'scenario_id' | 'created_by'> & {
	id?: NarrativeId;
	scenario_id?: ScenarioId;
	created_by?: UserRoleId | null;
};

// Narrative Node types
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

// Narrative Node Choice types
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
	narrative_dice_roll_id: NarrativeDiceRollId | null;
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

// Narrative Dice Roll types
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
	| 'narrative_id'
	| 'scenario_id'
	| 'success_narrative_node_id'
	| 'failure_narrative_node_id'
	| 'created_by'
> & {
	narrative_id: NarrativeId;
	scenario_id: ScenarioId;
	success_narrative_node_id?: NarrativeNodeId | null;
	failure_narrative_node_id?: NarrativeNodeId | null;
	created_by?: UserRoleId | null;
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

// Player Rolled Dice types
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
type PlayerRolledDiceUpdateRow = TablesUpdate<'player_rolled_dices'>;
export type PlayerRolledDiceUpdate = Omit<
	PlayerRolledDiceUpdateRow,
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
	id?: PlayerRolledDiceId;
	user_id?: UserId;
	player_id?: PlayerId;
	scenario_id?: ScenarioId | null;
	narrative_id?: NarrativeId;
	narrative_node_id?: NarrativeNodeId;
	narrative_node_choice_id?: NarrativeNodeChoiceId | null;
	narrative_dice_roll_id?: NarrativeDiceRollId;
	quest_id?: QuestId | null;
	quest_branch_id?: QuestBranchId | null;
	player_quest_id?: PlayerQuestId | null;
	player_quest_branch_id?: PlayerQuestBranchId | null;
	dice_id?: DiceId | null;
};

// Dice types
type DiceRow = Tables<'dices'>;
export type Dice = Omit<DiceRow, 'id'> & {
	id: DiceId;
};
type DiceInsertRow = TablesInsert<'dices'>;
export type DiceInsert = DiceInsertRow;
type DiceUpdateRow = TablesUpdate<'dices'>;
export type DiceUpdate = Omit<DiceUpdateRow, 'id'> & {
	id?: DiceId;
};

// Player types
type PlayerRow = Tables<'players'>;
export type Player = Omit<PlayerRow, 'id' | 'user_id'> & {
	id: PlayerId;
	user_id: UserId;
};
type PlayerInsertRow = TablesInsert<'players'>;
export type PlayerInsert = Omit<PlayerInsertRow, 'user_id'> & {
	user_id: UserId;
};
type PlayerUpdateRow = TablesUpdate<'players'>;
export type PlayerUpdate = Omit<PlayerUpdateRow, 'id' | 'user_id'> & {
	id?: PlayerId;
	user_id?: UserId;
};

// User Role types
type UserRoleRow = Tables<'user_roles'>;
export type UserRole = Omit<UserRoleRow, 'id' | 'created_by' | 'deleted_by'> & {
	id: UserRoleId;
	created_by: UserRoleId | null;
	deleted_by: UserRoleId | null;
};
type UserRoleInsertRow = TablesInsert<'user_roles'>;
export type UserRoleInsert = Omit<UserRoleInsertRow, 'created_by' | 'deleted_by'> & {
	created_by: UserRoleId | null;
	deleted_by: UserRoleId | null;
};
type UserRoleUpdateRow = TablesUpdate<'user_roles'>;
export type UserRoleUpdate = Omit<UserRoleUpdateRow, 'id' | 'created_by' | 'deleted_by'> & {
	id?: UserRoleId;
	created_by?: UserRoleId | null;
	deleted_by?: UserRoleId | null;
};

// Terrain types
type TerrainRow = Tables<'terrains'>;
export type Terrain = Omit<TerrainRow, 'id' | 'scenario_id' | 'created_by'> & {
	id: TerrainId;
	scenario_id: ScenarioId;
	created_by: UserRoleId | null;
};
type TerrainInsertRow = TablesInsert<'terrains'>;
export type TerrainInsert = Omit<TerrainInsertRow, 'scenario_id' | 'created_by'> & {
	scenario_id: ScenarioId;
	created_by?: UserRoleId | null;
};
type TerrainUpdateRow = TablesUpdate<'terrains'>;
export type TerrainUpdate = Omit<TerrainUpdateRow, 'id' | 'scenario_id' | 'created_by'> & {
	id?: TerrainId;
	scenario_id?: ScenarioId;
	created_by?: UserRoleId | null;
};

// Character Body types
type CharacterBodyRow = Tables<'character_bodies'>;
export type CharacterBody = Omit<CharacterBodyRow, 'id' | 'scenario_id' | 'created_by'> & {
	id: CharacterBodyId;
	scenario_id: ScenarioId;
	created_by: UserRoleId | null;
};
type CharacterBodyInsertRow = TablesInsert<'character_bodies'>;
export type CharacterBodyInsert = Omit<CharacterBodyInsertRow, 'scenario_id' | 'created_by'> & {
	scenario_id: ScenarioId;
	created_by?: UserRoleId | null;
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

// Character Body State types
type CharacterBodyStateRow = Tables<'character_body_states'>;
export type CharacterBodyState = Omit<CharacterBodyStateRow, 'id' | 'character_body_id'> & {
	id: CharacterBodyStateId;
	character_body_id: CharacterBodyId;
};
type CharacterBodyStateInsertRow = TablesInsert<'character_body_states'>;
export type CharacterBodyStateInsert = Omit<CharacterBodyStateInsertRow, 'character_body_id'> & {
	character_body_id?: CharacterBodyId;
};
type CharacterBodyStateUpdateRow = TablesUpdate<'character_body_states'>;
export type CharacterBodyStateUpdate = Omit<
	CharacterBodyStateUpdateRow,
	'id' | 'character_body_id'
> & {
	id?: CharacterBodyStateId;
	character_body_id?: CharacterBodyId;
};

// Character Face State types
type CharacterFaceStateRow = Tables<'character_face_states'>;
export type CharacterFaceState = Omit<CharacterFaceStateRow, 'id' | 'character_id' | 'need_id'> & {
	id: CharacterFaceStateId;
	character_id: CharacterId;
	need_id: NeedId | null;
};
type CharacterFaceStateInsertRow = TablesInsert<'character_face_states'>;
export type CharacterFaceStateInsert = Omit<
	CharacterFaceStateInsertRow,
	'character_id' | 'need_id'
> & {
	character_id: CharacterId;
	need_id?: NeedId | null;
};
type CharacterFaceStateUpdateRow = TablesUpdate<'character_face_states'>;
export type CharacterFaceStateUpdate = Omit<
	CharacterFaceStateUpdateRow,
	'id' | 'character_id' | 'need_id'
> & {
	id?: CharacterFaceStateId;
	character_id?: CharacterId;
	need_id?: NeedId | null;
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
	'id' | 'scenario_id' | 'character_body_id'
> & {
	id?: CharacterId;
	scenario_id?: ScenarioId;
	character_body_id?: CharacterBodyId;
};

// World types
type WorldRow = Tables<'worlds'>;
export type World = Omit<
	WorldRow,
	'id' | 'user_id' | 'player_id' | 'scenario_id' | 'terrain_id' | 'deleted_at'
> & {
	id: WorldId;
	user_id: UserId;
	player_id: PlayerId;
	scenario_id: ScenarioId;
	terrain_id: TerrainId | null;
	deleted_at: string | null;
};
type WorldInsertRow = TablesInsert<'worlds'>;
export type WorldInsert = Omit<
	WorldInsertRow,
	'user_id' | 'player_id' | 'scenario_id' | 'terrain_id' | 'deleted_at'
> & {
	user_id: UserId;
	player_id: PlayerId;
	scenario_id: ScenarioId;
	terrain_id: TerrainId | null;
	deleted_at?: string | null;
};
type WorldUpdateRow = TablesUpdate<'worlds'>;
export type WorldUpdate = Omit<
	WorldUpdateRow,
	'id' | 'user_id' | 'player_id' | 'scenario_id' | 'terrain_id' | 'deleted_at'
> & {
	id?: WorldId;
	user_id?: UserId;
	player_id?: PlayerId;
	scenario_id?: ScenarioId;
	terrain_id?: TerrainId | null;
	deleted_at?: string | null;
};

// World Character types
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
	user_id: UserId;
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

// World Building types
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
	user_id: UserId;
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

// Building types
type BuildingRow = Tables<'buildings'>;
export type Building = Omit<BuildingRow, 'id' | 'scenario_id' | 'created_by'> & {
	id: BuildingId;
	scenario_id: ScenarioId;
	created_by: UserRoleId | null;
};
type BuildingInsertRow = TablesInsert<'buildings'>;
export type BuildingInsert = Omit<BuildingInsertRow, 'scenario_id' | 'created_by'> & {
	scenario_id: ScenarioId;
	created_by?: UserRoleId | null;
};
type BuildingUpdateRow = TablesUpdate<'buildings'>;
export type BuildingUpdate = Omit<BuildingUpdateRow, 'id' | 'scenario_id' | 'created_by'> & {
	id?: BuildingId;
	scenario_id?: ScenarioId;
	created_by?: UserRoleId | null;
};

// Building State types
type BuildingStateRow = Tables<'building_states'>;
export type BuildingState = Omit<BuildingStateRow, 'id' | 'building_id' | 'condition_id'> & {
	id: BuildingStateId;
	building_id: BuildingId;
	condition_id: ConditionId | null;
};
type BuildingStateInsertRow = TablesInsert<'building_states'>;
export type BuildingStateInsert = Omit<BuildingStateInsertRow, 'building_id' | 'condition_id'> & {
	building_id: BuildingId;
	condition_id?: ConditionId | null;
};
type BuildingStateUpdateRow = TablesUpdate<'building_states'>;
export type BuildingStateUpdate = Omit<
	BuildingStateUpdateRow,
	'id' | 'building_id' | 'condition_id'
> & {
	id?: BuildingStateId;
	building_id?: BuildingId;
	condition_id?: ConditionId | null;
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

// Condition Behavior types
type ConditionBehaviorRow = Tables<'condition_behaviors'>;
export type ConditionBehavior = Omit<
	ConditionBehaviorRow,
	'id' | 'scenario_id' | 'condition_id' | 'character_id' | 'created_by'
> & {
	id: ConditionBehaviorId;
	scenario_id: ScenarioId;
	condition_id: ConditionId;
	character_id: CharacterId | null;
	created_by: UserRoleId | null;
};
type ConditionBehaviorInsertRow = TablesInsert<'condition_behaviors'>;
export type ConditionBehaviorInsert = Omit<
	ConditionBehaviorInsertRow,
	'scenario_id' | 'condition_id' | 'character_id' | 'created_by'
> & {
	scenario_id: ScenarioId;
	condition_id: ConditionId;
	character_id?: CharacterId | null;
	created_by?: UserRoleId | null;
};
type ConditionBehaviorUpdateRow = TablesUpdate<'condition_behaviors'>;
export type ConditionBehaviorUpdate = Omit<
	ConditionBehaviorUpdateRow,
	'id' | 'scenario_id' | 'condition_id' | 'character_id' | 'created_by'
> & {
	id?: ConditionBehaviorId;
	scenario_id?: ScenarioId;
	condition_id?: ConditionId;
	character_id?: CharacterId | null;
	created_by?: UserRoleId | null;
};

// Condition Behavior Action types
type ConditionBehaviorActionRow = Tables<'condition_behavior_actions'>;
export type ConditionBehaviorAction = Omit<
	ConditionBehaviorActionRow,
	| 'id'
	| 'scenario_id'
	| 'condition_id'
	| 'condition_behavior_id'
	| 'next_condition_behavior_action_id'
> & {
	id: ConditionBehaviorActionId;
	scenario_id: ScenarioId;
	condition_id: ConditionId;
	condition_behavior_id: ConditionBehaviorId;
	next_condition_behavior_action_id: ConditionBehaviorActionId | null;
};
type ConditionBehaviorActionInsertRow = TablesInsert<'condition_behavior_actions'>;
export type ConditionBehaviorActionInsert = Omit<
	ConditionBehaviorActionInsertRow,
	'scenario_id' | 'condition_id' | 'condition_behavior_id' | 'next_condition_behavior_action_id'
> & {
	scenario_id: ScenarioId;
	condition_id: ConditionId;
	condition_behavior_id: ConditionBehaviorId;
	next_condition_behavior_action_id?: ConditionBehaviorActionId | null;
};
type ConditionBehaviorActionUpdateRow = TablesUpdate<'condition_behavior_actions'>;
export type ConditionBehaviorActionUpdate = Omit<
	ConditionBehaviorActionUpdateRow,
	| 'id'
	| 'scenario_id'
	| 'condition_id'
	| 'condition_behavior_id'
	| 'next_condition_behavior_action_id'
> & {
	id?: ConditionBehaviorActionId;
	scenario_id?: ScenarioId;
	condition_id?: ConditionId;
	condition_behavior_id?: ConditionBehaviorId;
	next_condition_behavior_action_id?: ConditionBehaviorActionId | null;
};

// Condition Effect types
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

// Condition Fulfillment types
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
	'condition_id' | 'scenario_id' | 'character_id' | 'item_id' | 'created_by'
> & {
	condition_id: ConditionId;
	scenario_id: ScenarioId;
	character_id?: CharacterId | null;
	item_id?: ItemId | null;
	created_by?: UserRoleId | null;
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

// Building Condition types
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

// World Building Condition types
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
	user_id: UserId;
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
type NeedRow = Tables<'needs'>;
export type Need = Omit<NeedRow, 'id' | 'scenario_id' | 'created_by'> & {
	id: NeedId;
	scenario_id: ScenarioId;
	created_by: UserRoleId | null;
};
type NeedInsertRow = TablesInsert<'needs'>;
export type NeedInsert = Omit<NeedInsertRow, 'scenario_id' | 'created_by'> & {
	scenario_id: ScenarioId;
	created_by?: UserRoleId | null;
};
type NeedUpdateRow = TablesUpdate<'needs'>;
export type NeedUpdate = Omit<NeedUpdateRow, 'id' | 'scenario_id' | 'created_by'> & {
	id?: NeedId;
	scenario_id?: ScenarioId;
	created_by?: UserRoleId | null;
};

// Character Need types
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
	'scenario_id' | 'character_id' | 'need_id' | 'created_by'
> & {
	scenario_id: ScenarioId;
	character_id: CharacterId;
	need_id: NeedId;
	created_by?: UserRoleId | null;
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

// Need Fulfillment types
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
	'need_id' | 'scenario_id' | 'building_id' | 'item_id' | 'character_id' | 'created_by'
> & {
	need_id: NeedId;
	scenario_id: ScenarioId;
	building_id?: BuildingId | null;
	item_id?: ItemId | null;
	character_id?: CharacterId | null;
	created_by?: UserRoleId | null;
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

// Need Behavior types
type NeedBehaviorRow = Tables<'need_behaviors'>;
export type NeedBehavior = Omit<
	NeedBehaviorRow,
	'id' | 'scenario_id' | 'need_id' | 'created_by'
> & { id: NeedBehaviorId; scenario_id: ScenarioId; need_id: NeedId; created_by: UserRoleId | null };
type NeedBehaviorInsertRow = TablesInsert<'need_behaviors'>;
export type NeedBehaviorInsert = Omit<
	NeedBehaviorInsertRow,
	'scenario_id' | 'need_id' | 'created_by'
> & { scenario_id: ScenarioId; need_id: NeedId; created_by?: UserRoleId | null };
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

// Need Behavior Action types
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
	next_need_behavior_action_id: NeedBehaviorActionId | null;
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
	| 'next_need_behavior_action_id'
> & {
	scenario_id: ScenarioId;
	need_id: NeedId;
	behavior_id: NeedBehaviorId;
	building_id?: BuildingId | null;
	item_id?: ItemId | null;
	character_id?: CharacterId | null;
	next_need_behavior_action_id?: NeedBehaviorActionId | null;
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
	| 'next_need_behavior_action_id'
> & {
	id?: NeedBehaviorActionId;
	scenario_id?: ScenarioId;
	need_id?: NeedId;
	behavior_id?: NeedBehaviorId;
	building_id?: BuildingId | null;
	item_id?: ItemId | null;
	character_id?: CharacterId | null;
	next_need_behavior_action_id?: NeedBehaviorActionId | null;
};

// Item types
type ItemRow = Tables<'items'>;
export type Item = Omit<ItemRow, 'id' | 'scenario_id' | 'created_by'> & {
	id: ItemId;
	scenario_id: ScenarioId;
	created_by: UserRoleId | null;
};
type ItemInsertRow = TablesInsert<'items'>;
export type ItemInsert = Omit<ItemInsertRow, 'scenario_id' | 'created_by'> & {
	scenario_id: ScenarioId;
	created_by?: UserRoleId | null;
};
type ItemUpdateRow = TablesUpdate<'items'>;
export type ItemUpdate = Omit<ItemUpdateRow, 'id' | 'scenario_id' | 'created_by'> & {
	id?: ItemId;
	scenario_id?: ScenarioId;
	created_by?: UserRoleId | null;
};

// Building Interaction types
type BuildingInteractionRow = Tables<'building_interactions'>;
export type BuildingInteraction = Omit<
	BuildingInteractionRow,
	| 'id'
	| 'scenario_id'
	| 'building_id'
	| 'character_id'
	| 'next_building_interaction_id'
	| 'created_by'
> & {
	id: BuildingInteractionId;
	scenario_id: ScenarioId;
	building_id: BuildingId;
	character_id: CharacterId | null;
	next_building_interaction_id: BuildingInteractionId | null;
	created_by: UserRoleId | null;
};
type BuildingInteractionInsertRow = TablesInsert<'building_interactions'>;
export type BuildingInteractionInsert = Omit<
	BuildingInteractionInsertRow,
	'scenario_id' | 'building_id' | 'character_id' | 'next_building_interaction_id' | 'created_by'
> & {
	scenario_id: ScenarioId;
	building_id: BuildingId;
	character_id?: CharacterId | null;
	next_building_interaction_id?: BuildingInteractionId | null;
	created_by?: UserRoleId | null;
};
type BuildingInteractionUpdateRow = TablesUpdate<'building_interactions'>;
export type BuildingInteractionUpdate = Omit<
	BuildingInteractionUpdateRow,
	| 'id'
	| 'scenario_id'
	| 'building_id'
	| 'character_id'
	| 'next_building_interaction_id'
	| 'created_by'
> & {
	id?: BuildingInteractionId;
	scenario_id?: ScenarioId;
	building_id?: BuildingId;
	character_id?: CharacterId | null;
	next_building_interaction_id?: BuildingInteractionId | null;
	created_by?: UserRoleId | null;
};

// Building Interaction Action types
type BuildingInteractionActionRow = Tables<'building_interaction_actions'>;
export type BuildingInteractionAction = Omit<
	BuildingInteractionActionRow,
	| 'id'
	| 'scenario_id'
	| 'building_id'
	| 'building_interaction_id'
	| 'next_building_interaction_action_id'
	| 'created_by'
> & {
	id: BuildingInteractionActionId;
	scenario_id: ScenarioId;
	building_id: BuildingId;
	building_interaction_id: BuildingInteractionId;
	next_building_interaction_action_id: BuildingInteractionActionId | null;
	created_by: UserRoleId | null;
};
type BuildingInteractionActionInsertRow = TablesInsert<'building_interaction_actions'>;
export type BuildingInteractionActionInsert = Omit<
	BuildingInteractionActionInsertRow,
	| 'scenario_id'
	| 'building_id'
	| 'building_interaction_id'
	| 'next_building_interaction_action_id'
	| 'created_by'
> & {
	scenario_id: ScenarioId;
	building_id: BuildingId;
	building_interaction_id: BuildingInteractionId;
	next_building_interaction_action_id?: BuildingInteractionActionId | null;
	created_by?: UserRoleId | null;
};
type BuildingInteractionActionUpdateRow = TablesUpdate<'building_interaction_actions'>;
export type BuildingInteractionActionUpdate = Omit<
	BuildingInteractionActionUpdateRow,
	| 'id'
	| 'scenario_id'
	| 'building_id'
	| 'building_interaction_id'
	| 'next_building_interaction_action_id'
	| 'created_by'
> & {
	id?: BuildingInteractionActionId;
	scenario_id?: ScenarioId;
	building_id?: BuildingId;
	building_interaction_id?: BuildingInteractionId;
	next_building_interaction_action_id?: BuildingInteractionActionId | null;
	created_by?: UserRoleId | null;
};

// Item Interaction types
type ItemInteractionRow = Tables<'item_interactions'>;
export type ItemInteraction = Omit<
	ItemInteractionRow,
	'id' | 'scenario_id' | 'item_id' | 'character_id' | 'next_item_interaction_id' | 'created_by'
> & {
	id: ItemInteractionId;
	scenario_id: ScenarioId;
	item_id: ItemId;
	character_id: CharacterId | null;
	next_item_interaction_id: ItemInteractionId | null;
	created_by: UserRoleId | null;
};
type ItemInteractionInsertRow = TablesInsert<'item_interactions'>;
export type ItemInteractionInsert = Omit<
	ItemInteractionInsertRow,
	'scenario_id' | 'item_id' | 'character_id' | 'next_item_interaction_id' | 'created_by'
> & {
	scenario_id: ScenarioId;
	item_id: ItemId;
	character_id?: CharacterId | null;
	next_item_interaction_id?: ItemInteractionId | null;
	created_by?: UserRoleId | null;
};
type ItemInteractionUpdateRow = TablesUpdate<'item_interactions'>;
export type ItemInteractionUpdate = Omit<
	ItemInteractionUpdateRow,
	'id' | 'scenario_id' | 'item_id' | 'character_id' | 'next_item_interaction_id' | 'created_by'
> & {
	id?: ItemInteractionId;
	scenario_id?: ScenarioId;
	item_id?: ItemId;
	character_id?: CharacterId | null;
	next_item_interaction_id?: ItemInteractionId | null;
	created_by?: UserRoleId | null;
};

// Item Interaction Action types
type ItemInteractionActionRow = Tables<'item_interaction_actions'>;
export type ItemInteractionAction = Omit<
	ItemInteractionActionRow,
	| 'id'
	| 'scenario_id'
	| 'item_id'
	| 'item_interaction_id'
	| 'next_item_interaction_action_id'
	| 'created_by'
> & {
	id: ItemInteractionActionId;
	scenario_id: ScenarioId;
	item_id: ItemId;
	item_interaction_id: ItemInteractionId;
	next_item_interaction_action_id: ItemInteractionActionId | null;
	created_by: UserRoleId | null;
};
type ItemInteractionActionInsertRow = TablesInsert<'item_interaction_actions'>;
export type ItemInteractionActionInsert = Omit<
	ItemInteractionActionInsertRow,
	| 'scenario_id'
	| 'item_id'
	| 'item_interaction_id'
	| 'next_item_interaction_action_id'
	| 'created_by'
> & {
	scenario_id: ScenarioId;
	item_id: ItemId;
	item_interaction_id: ItemInteractionId;
	next_item_interaction_action_id?: ItemInteractionActionId | null;
	created_by?: UserRoleId | null;
};
type ItemInteractionActionUpdateRow = TablesUpdate<'item_interaction_actions'>;
export type ItemInteractionActionUpdate = Omit<
	ItemInteractionActionUpdateRow,
	| 'id'
	| 'scenario_id'
	| 'item_id'
	| 'item_interaction_id'
	| 'next_item_interaction_action_id'
	| 'created_by'
> & {
	id?: ItemInteractionActionId;
	scenario_id?: ScenarioId;
	item_id?: ItemId;
	item_interaction_id?: ItemInteractionId;
	next_item_interaction_action_id?: ItemInteractionActionId | null;
	created_by?: UserRoleId | null;
};

// Character Interaction types
type CharacterInteractionRow = Tables<'character_interactions'>;
export type CharacterInteraction = Omit<
	CharacterInteractionRow,
	'id' | 'scenario_id' | 'character_id' | 'target_character_id' | 'created_by'
> & {
	id: CharacterInteractionId;
	scenario_id: ScenarioId;
	character_id: CharacterId | null;
	target_character_id: CharacterId;
	created_by: UserRoleId | null;
};
type CharacterInteractionInsertRow = TablesInsert<'character_interactions'>;
export type CharacterInteractionInsert = Omit<
	CharacterInteractionInsertRow,
	'scenario_id' | 'character_id' | 'target_character_id' | 'created_by'
> & {
	scenario_id: ScenarioId;
	character_id?: CharacterId | null;
	target_character_id: CharacterId;
	created_by?: UserRoleId | null;
};
type CharacterInteractionUpdateRow = TablesUpdate<'character_interactions'>;
export type CharacterInteractionUpdate = Omit<
	CharacterInteractionUpdateRow,
	'id' | 'scenario_id' | 'character_id' | 'target_character_id' | 'created_by'
> & {
	id?: CharacterInteractionId;
	scenario_id?: ScenarioId;
	character_id?: CharacterId | null;
	target_character_id?: CharacterId;
	created_by?: UserRoleId | null;
};

// Character Interaction Action types
type CharacterInteractionActionRow = Tables<'character_interaction_actions'>;
export type CharacterInteractionAction = Omit<
	CharacterInteractionActionRow,
	| 'id'
	| 'scenario_id'
	| 'character_id'
	| 'target_character_id'
	| 'character_interaction_id'
	| 'next_character_interaction_action_id'
	| 'created_by'
> & {
	id: CharacterInteractionActionId;
	scenario_id: ScenarioId;
	character_id: CharacterId;
	target_character_id: CharacterId;
	character_interaction_id: CharacterInteractionId;
	next_character_interaction_action_id: CharacterInteractionActionId | null;
	created_by: UserRoleId | null;
};
type CharacterInteractionActionInsertRow = TablesInsert<'character_interaction_actions'>;
export type CharacterInteractionActionInsert = Omit<
	CharacterInteractionActionInsertRow,
	| 'scenario_id'
	| 'character_id'
	| 'target_character_id'
	| 'character_interaction_id'
	| 'next_character_interaction_action_id'
	| 'created_by'
> & {
	scenario_id: ScenarioId;
	character_id: CharacterId;
	target_character_id: CharacterId;
	character_interaction_id: CharacterInteractionId;
	next_character_interaction_action_id?: CharacterInteractionActionId | null;
	created_by?: UserRoleId | null;
};
type CharacterInteractionActionUpdateRow = TablesUpdate<'character_interaction_actions'>;
export type CharacterInteractionActionUpdate = Omit<
	CharacterInteractionActionUpdateRow,
	| 'id'
	| 'scenario_id'
	| 'character_id'
	| 'target_character_id'
	| 'character_interaction_id'
	| 'next_character_interaction_action_id'
	| 'created_by'
> & {
	id?: CharacterInteractionActionId;
	scenario_id?: ScenarioId;
	character_id?: CharacterId;
	target_character_id?: CharacterId;
	character_interaction_id?: CharacterInteractionId;
	next_character_interaction_action_id?: CharacterInteractionActionId | null;
	created_by?: UserRoleId | null;
};

// Behavior Priority types
type BehaviorPriorityRow = Tables<'behavior_priorities'>;
export type BehaviorPriority = Omit<
	BehaviorPriorityRow,
	'id' | 'scenario_id' | 'need_behavior_id' | 'condition_behavior_id' | 'created_by'
> & {
	id: BehaviorPriorityId;
	scenario_id: ScenarioId;
	need_behavior_id: NeedBehaviorId | null;
	condition_behavior_id: ConditionBehaviorId | null;
	created_by: UserRoleId | null;
};
type BehaviorPriorityInsertRow = TablesInsert<'behavior_priorities'>;
export type BehaviorPriorityInsert = Omit<BehaviorPriorityInsertRow, 'scenario_id'> & {
	scenario_id: ScenarioId;
};
type BehaviorPriorityUpdateRow = TablesUpdate<'behavior_priorities'>;
export type BehaviorPriorityUpdate = Omit<
	BehaviorPriorityUpdateRow,
	'id' | 'scenario_id' | 'need_behavior_id' | 'condition_behavior_id' | 'created_by'
> & {
	id?: BehaviorPriorityId;
	scenario_id?: ScenarioId;
	need_behavior_id?: NeedBehaviorId | null;
	condition_behavior_id?: ConditionBehaviorId | null;
};

// Item State types
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

// World Item types
type WorldItemRow = Tables<'world_items'>;
export type WorldItem = Omit<
	WorldItemRow,
	| 'id'
	| 'user_id'
	| 'world_id'
	| 'item_id'
	| 'player_id'
	| 'scenario_id'
	| 'world_building_id'
	| 'world_character_id'
> & {
	id: WorldItemId;
	user_id: UserId;
	world_id: WorldId;
	item_id: ItemId;
	player_id: PlayerId;
	scenario_id: ScenarioId;
	world_building_id: WorldBuildingId | null;
	world_character_id: WorldCharacterId | null;
};
type WorldItemInsertRow = TablesInsert<'world_items'>;
export type WorldItemInsert = Omit<
	WorldItemInsertRow,
	| 'user_id'
	| 'world_id'
	| 'item_id'
	| 'player_id'
	| 'scenario_id'
	| 'world_building_id'
	| 'world_character_id'
> & {
	user_id: UserId;
	world_id: WorldId;
	item_id: ItemId;
	player_id: PlayerId;
	scenario_id: ScenarioId;
	world_building_id?: WorldBuildingId | null;
	world_character_id?: WorldCharacterId | null;
};
type WorldItemUpdateRow = TablesUpdate<'world_items'>;
export type WorldItemUpdate = Omit<
	WorldItemUpdateRow,
	| 'id'
	| 'user_id'
	| 'world_id'
	| 'item_id'
	| 'player_id'
	| 'scenario_id'
	| 'world_building_id'
	| 'world_character_id'
> & {
	id?: WorldItemId;
	user_id?: UserId;
	world_id?: WorldId;
	item_id?: ItemId;
	player_id?: PlayerId;
	scenario_id?: ScenarioId;
	world_building_id?: WorldBuildingId | null;
	world_character_id?: WorldCharacterId | null;
};

// Tile types
type TileRow = Tables<'tiles'>;
export type Tile = Omit<TileRow, 'id' | 'scenario_id' | 'created_by'> & {
	id: TileId;
	scenario_id: ScenarioId;
	created_by: UserRoleId | null;
};
type TileInsertRow = TablesInsert<'tiles'>;
export type TileInsert = Omit<TileInsertRow, 'scenario_id' | 'created_by'> & {
	scenario_id: ScenarioId;
	created_by?: UserRoleId | null;
};
type TileUpdateRow = TablesUpdate<'tiles'>;
export type TileUpdate = Omit<TileUpdateRow, 'id' | 'scenario_id' | 'created_by'> & {
	id?: TileId;
	scenario_id?: ScenarioId;
	created_by?: UserRoleId | null;
};

// Tile State types
type TileStateRow = Tables<'tile_states'>;
export type TileState = Omit<TileStateRow, 'id' | 'scenario_id' | 'tile_id'> & {
	id: TileStateId;
	scenario_id: ScenarioId;
	tile_id: TileId;
};
type TileStateInsertRow = TablesInsert<'tile_states'>;
export type TileStateInsert = Omit<TileStateInsertRow, 'scenario_id' | 'tile_id'> & {
	scenario_id: ScenarioId;
	tile_id: TileId;
};
type TileStateUpdateRow = TablesUpdate<'tile_states'>;
export type TileStateUpdate = Omit<TileStateUpdateRow, 'id' | 'scenario_id' | 'tile_id'> & {
	id?: TileStateId;
	scenario_id?: ScenarioId;
	tile_id?: TileId;
};

// Terrain Tile types
type TerrainTileRow = Tables<'terrains_tiles'>;
export type TerrainTile = Omit<
	TerrainTileRow,
	'id' | 'scenario_id' | 'terrain_id' | 'tile_id' | 'created_by'
> & {
	id: TerrainTileId;
	scenario_id: ScenarioId;
	terrain_id: TerrainId;
	tile_id: TileId;
	created_by: UserRoleId | null;
};
type TerrainTileInsertRow = TablesInsert<'terrains_tiles'>;
export type TerrainTileInsert = Omit<
	TerrainTileInsertRow,
	'scenario_id' | 'terrain_id' | 'tile_id' | 'created_by'
> & {
	scenario_id: ScenarioId;
	terrain_id: TerrainId;
	tile_id: TileId;
	created_by?: UserRoleId | null;
};
type TerrainTileUpdateRow = TablesUpdate<'terrains_tiles'>;
export type TerrainTileUpdate = Omit<
	TerrainTileUpdateRow,
	'id' | 'scenario_id' | 'terrain_id' | 'tile_id' | 'created_by'
> & {
	id?: TerrainTileId;
	scenario_id?: ScenarioId;
	terrain_id?: TerrainId;
	tile_id?: TileId;
	created_by?: UserRoleId | null;
};

// World Tile Map types
type WorldTileMapRow = Tables<'world_tile_maps'>;
export type WorldTileMap = Omit<
	WorldTileMapRow,
	'scenario_id' | 'user_id' | 'player_id' | 'world_id' | 'terrain_id' | 'data'
> & {
	scenario_id: ScenarioId;
	user_id: UserId;
	player_id: PlayerId;
	world_id: WorldId;
	terrain_id: TerrainId;
	data: Record<TileCellKey, { tile_id: TileId; durability: number }>;
};
type WorldTileMapInsertRow = TablesInsert<'world_tile_maps'>;
export type WorldTileMapInsert = Omit<
	WorldTileMapInsertRow,
	'user_id' | 'player_id' | 'scenario_id' | 'world_id' | 'terrain_id' | 'data'
> & {
	user_id?: UserId;
	player_id: PlayerId;
	scenario_id: ScenarioId;
	world_id: WorldId;
	terrain_id: TerrainId;
	data: Record<TileCellKey, { tile_id: TileId; durability: number }>;
};
type WorldTileMapUpdateRow = TablesUpdate<'world_tile_maps'>;
export type WorldTileMapUpdate = Omit<
	WorldTileMapUpdateRow,
	'id' | 'user_id' | 'player_id' | 'scenario_id' | 'world_id' | 'terrain_id' | 'data'
> & {
	id?: WorldTileMapId;
	user_id?: UserId;
	player_id?: PlayerId;
	scenario_id?: ScenarioId;
	world_id?: WorldId;
	terrain_id?: TerrainId;
	data?: Record<TileCellKey, { tile_id: TileId; durability: number }>;
};

// World Character Need types
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
	| 'user_id'
	| 'world_id'
	| 'world_character_id'
	| 'character_id'
	| 'need_id'
	| 'player_id'
	| 'scenario_id'
> & {
	user_id: UserId;
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

// ============================================================
// ScenarioSnapshot
// ============================================================
type ScenarioSnapshotRow = Tables<'scenario_snapshots'>;
export type ScenarioSnapshot = Omit<ScenarioSnapshotRow, 'id' | 'scenario_id' | 'created_by'> & {
	id: ScenarioSnapshotId;
	scenario_id: ScenarioId;
	created_by: UserRoleId | null;
};
type ScenarioSnapshotInsertRow = TablesInsert<'scenario_snapshots'>;
export type ScenarioSnapshotInsert = Omit<
	ScenarioSnapshotInsertRow,
	'id' | 'scenario_id' | 'created_by'
> & {
	id?: ScenarioSnapshotId;
	scenario_id: ScenarioId;
	created_by?: UserRoleId | null;
};
type ScenarioSnapshotUpdateRow = TablesUpdate<'scenario_snapshots'>;
export type ScenarioSnapshotUpdate = Omit<
	ScenarioSnapshotUpdateRow,
	'id' | 'scenario_id' | 'created_by'
> & {
	id?: ScenarioSnapshotId;
	scenario_id?: ScenarioId;
	created_by?: UserRoleId | null;
};
