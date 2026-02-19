import type { SupabaseClient, User } from '@supabase/supabase-js';
import type Matter from 'matter-js';
import type { Database } from './supabase.generated';
import type {
	ConditionBehaviorId,
	ConditionBehaviorActionId,
	NeedBehaviorId,
	NeedBehaviorActionId,
	NeedFulfillmentId,
	ConditionFulfillmentId,
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
	NeedBehavior,
	ConditionBehavior,
	NeedBehaviorAction,
	ConditionBehaviorAction,
	NeedFulfillment,
	ConditionFulfillment,
	BuildingInteractionId,
	BuildingInteractionActionId,
	ItemInteractionId,
	ItemInteractionActionId,
	CharacterInteractionId,
	CharacterInteractionActionId,
	BuildingInteraction,
	ItemInteraction,
	CharacterInteraction,
	BuildingInteractionAction,
	ItemInteractionAction,
	CharacterInteractionAction,
	OnceInteractionType,
	FulfillInteractionType,
	SystemInteractionType,
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
export type FulfillmentType = 'need' | 'condition';

// Union types for behaviors
export type BehaviorId = NeedBehaviorId | ConditionBehaviorId;
export type BehaviorActionId = NeedBehaviorActionId | ConditionBehaviorActionId;
export type FulfillmentId = NeedFulfillmentId | ConditionFulfillmentId;

// Discriminated union for behaviors
export type Behavior =
	| ({ behaviorType: 'need' } & NeedBehavior)
	| ({ behaviorType: 'condition' } & ConditionBehavior);

// Discriminated union for behavior actions
export type BehaviorAction =
	| ({ behaviorType: 'need' } & NeedBehaviorAction)
	| ({ behaviorType: 'condition' } & ConditionBehaviorAction);

// Discriminated union for fulfillments
export type Fulfillment =
	| ({ fulfillmentType: 'need' } & NeedFulfillment)
	| ({ fulfillmentType: 'condition' } & ConditionFulfillment);

// Runtime-only behavior target ID: "{behaviorType}_{behaviorId}_{behaviorActionId}"
export type BehaviorTargetId =
	| `need_${NeedBehaviorId}_${NeedBehaviorActionId}`
	| `condition_${ConditionBehaviorId}_${ConditionBehaviorActionId}`;

// Entity source types (building, item, character)
export type EntitySourceType = 'building' | 'item' | 'character';

// Interaction types (once, fulfill, system)
export type InteractionType = 'once' | 'fulfill' | 'system';

// Union types for interactions
export type InteractionId = BuildingInteractionId | ItemInteractionId | CharacterInteractionId;
export type InteractionActionId =
	| BuildingInteractionActionId
	| ItemInteractionActionId
	| CharacterInteractionActionId;

// Discriminated union for interactions
export type Interaction =
	| ({ entitySourceType: 'building' } & BuildingInteraction)
	| ({ entitySourceType: 'item' } & ItemInteraction)
	| ({ entitySourceType: 'character' } & CharacterInteraction);

// Discriminated union for interaction actions
export type InteractionAction =
	| ({ entitySourceType: 'building' } & BuildingInteractionAction)
	| ({ entitySourceType: 'item' } & ItemInteractionAction)
	| ({ entitySourceType: 'character' } & CharacterInteractionAction);

// Runtime-only interaction target ID: "{entitySourceType}_{interactionId}_{interactionActionId}"
export type InteractionTargetId =
	| `building_${BuildingInteractionId}_${BuildingInteractionActionId}`
	| `item_${ItemInteractionId}_${ItemInteractionActionId}`
	| `character_${CharacterInteractionId}_${CharacterInteractionActionId}`;

// Interaction Queue for sequential interaction execution
export type InteractionQueueStatus =
	// 큐 구성 중. interactionTargetIds를 아직 완성하지 않은 상태
	| 'enqueuing'
	// 큐 구성 완료. dequeue에서 currentInteractionTargetId를 할당할 수 있는 상태
	| 'ready'
	// 실행할 현재 액션은 선택됐지만, 시작 조건을 아직 확인하지 않은 상태
	| 'action-ready'
	// 현재 액션 실행 중. 실제 실행/완료 판정은 tick-action-*에서 담당
	| 'action-running'
	// 현재 액션 실행 완료 플래그. dequeue에서 다음 액션/완료 상태로 전이
	| 'action-completed'
	// 큐의 모든 액션이 종료된 상태
	| 'completed';

export interface InteractionQueue {
	status: InteractionQueueStatus;
	interactionTargetIds: InteractionTargetId[];
	coreInteractionTargetId?: InteractionTargetId;
	// 현재 실행 중(또는 방금 완료된) 상호작용 타깃 ID
	currentInteractionTargetId?: InteractionTargetId;
	// 현재 상호작용의 실제 실행 시작 시각(틱). 시작 전에는 undefined
	currentInteractionTargetRunningAtTick?: number;
}

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
export type EntitySourceTargetId =
	| `character_${CharacterId}`
	| `building_${BuildingId}`
	| `item_${ItemId}`
	| `tile_${TileId}`;

// Instance types for EntityId and EntitySourceTargetId
export type EntitySourceId = BuildingId | CharacterId | ItemId | TileId;
export type EntityInstanceId = WorldBuildingId | WorldCharacterId | WorldItemId | TileCellKey;

// Discriminated unions for entity templates and instances
export type EntitySource =
	| ({ entityType: 'building' } & Building)
	| ({ entityType: 'character' } & Character)
	| ({ entityType: 'item' } & Item)
	| ({ entityType: 'tile' } & Tile);

export type EntityInstance =
	| ({ entityType: 'building' } & WorldBuilding)
	| ({ entityType: 'character' } & WorldCharacter)
	| ({ entityType: 'item' } & WorldItem)
	| ({ entityType: 'tile' } & Tile);

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
	entitySourceTargetId: EntitySourceTargetId;
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

// ============================================================
// UI & Label Types
// ============================================================

// 라벨 타입 (셀렉트 옵션 등에 사용)
export type Label<T = string> = {
	value: T;
	label: string;
};

// Behavior 인터랙션 타입 통합
export type BehaviorInteractionType =
	| OnceInteractionType
	| FulfillInteractionType
	| SystemInteractionType;
