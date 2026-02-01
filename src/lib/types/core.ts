import type { SupabaseClient, User } from '@supabase/supabase-js';
import type Matter from 'matter-js';
import type { Database } from './supabase.generated';
import type {
	ConditionBehaviorId,
	ConditionBehaviorActionId,
	NeedBehaviorId,
	NeedBehaviorActionId,
	WorldId,
	WorldBuildingId,
	WorldCharacterId,
	WorldItemId,
	BuildingId,
	CharacterId,
	ItemId,
	TileId,
	WorldBuilding,
	WorldCharacter,
	WorldItem,
	Tile,
	Item,
	Character,
	Building,
	NeedBehaviorAction,
	ConditionBehaviorAction,
} from './supabase';
import type { Vector, Cell, TileCell, TileCellKey, VectorKey } from './vector';

export type Brand<T, B extends string> = T & { readonly __brand: B };

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

export interface BulkChanges<T> {
	origin: T[];
	current: T[];
	created: Omit<T, 'id'>[];
	updated: T[];
	deleted: string[];
}

export type Supabase = SupabaseClient<Database>;

export interface AppPayload {
	supabase: Supabase;
	user?: User;
}

export type BehaviorType = 'need' | 'condition';

// Union types for behavior IDs
export type BehaviorTemplateId = NeedBehaviorId | ConditionBehaviorId;
export type BehaviorActionId = NeedBehaviorActionId | ConditionBehaviorActionId;
export type BehaviorAction = NeedBehaviorAction | ConditionBehaviorAction;

// Runtime-only behavior ID: "{behaviorType}_{behaviorId}_{behaviorActionId}"
export type BehaviorId =
	| `need_${NeedBehaviorId}_${NeedBehaviorActionId}`
	| `condition_${ConditionBehaviorId}_${ConditionBehaviorActionId}`;

// ============================================================
// Entity Types
// ============================================================
// Entity ID with type information (branded string type)
// Format: type_worldId_worldEntityId
export type EntityId =
	| `character_${WorldId}_${WorldCharacterId}`
	| `building_${WorldId}_${WorldBuildingId}`
	| `item_${WorldId}_${WorldItemId}`
	| `tile_${WorldId}_${VectorKey}`;
export type EntityType = 'character' | 'building' | 'item' | 'tile';

// Entity Template ID (템플릿 선택용, worldId 없음)
// Format: type_templateId
export type EntityTemplateId =
	| `character_${CharacterId}`
	| `building_${BuildingId}`
	| `item_${ItemId}`
	| `tile_${TileId}`;

// Instance types for EntityId and EntityTemplateId
export type EntityTemplate = Building | Character | Item | Tile;
export type EntityTemplateCandidateId = BuildingId | CharacterId | ItemId | TileId;
export type EntityInstance = WorldBuilding | WorldCharacter | WorldItem;
export type EntityInstanceId = WorldBuildingId | WorldCharacterId | WorldItemId | TileCellKey;

// ============================================================
// World entity types
// ============================================================
export type WorldCharacterEntityDirection = 'left' | 'right';

export interface BeforeUpdateEvent {
	timestamp: number;
	delta: number;
	source: Matter.Engine;
	name: string;
}

export interface WorldBlueprintCursor {
	entityTemplateId: EntityTemplateId;
	current: Vector;
	start?: Vector;
	type: 'tile' | 'cell';
	tileCellKeys: Set<TileCellKey>;
	overlappingCells: Cell[];
	tileBounds?: { start: TileCell; end: TileCell };
}

export interface Boundaries {
	top: Matter.Body;
	bottom: Matter.Body;
	left: Matter.Body;
	right: Matter.Body;
}
