import type {
	EntityId,
	EntitySourceTargetId,
	EntityType,
	EntityInstanceId,
	EntitySourceId,
	EntityInstance,
	EntitySource,
	WorldId,
	WorldBuildingId,
	WorldCharacterId,
	WorldItemId,
	WorldTileMapId,
	WorldBuilding,
	WorldCharacter,
	WorldItem,
	Building,
	Character,
	Item,
	Tile,
	BuildingId,
	CharacterId,
	ItemId,
	TileId,
} from '$lib/types';

function createEntityId(
	type: EntityType,
	worldId: WorldId,
	sourceId: EntitySourceId,
	instanceId: EntityInstanceId
): EntityId;
function createEntityId(entityInstance: EntityInstance): EntityId;
function createEntityId(
	entityInstanceOrType: EntityType | EntityInstance,
	worldId?: WorldId,
	sourceId?: EntitySourceId,
	instanceId?: EntityInstanceId
): EntityId {
	if (typeof entityInstanceOrType === 'string') {
		if (!worldId || !sourceId || !instanceId) {
			throw new Error(
				'worldId, sourceId, and instanceId are required when creating EntityId from type'
			);
		}
		return `${entityInstanceOrType}_${worldId}_${sourceId}_${instanceId}` as EntityId;
	}

	// 객체로부터 EntityId 생성
	const entity = entityInstanceOrType;
	let type: EntityType;
	let entitySourceId: EntitySourceId;

	// 타입을 구별하기 위해 고유한 속성을 확인
	if ('building_id' in entity) {
		type = 'building';
		entitySourceId = entity.building_id;
	} else if ('character_id' in entity) {
		type = 'character';
		entitySourceId = entity.character_id;
	} else if ('item_id' in entity) {
		type = 'item';
		entitySourceId = entity.item_id;
	} else {
		throw new Error('Unknown entity type');
	}

	return `${type}_${entity.world_id}_${entitySourceId}_${entity.id}` as EntityId;
}

export const EntityIdUtils = {
	/**
	 * EntityId를 파싱하여 타입, worldId, sourceId, instanceId를 반환
	 * @example
	 * const { type, worldId, sourceId, instanceId } = EntityIdUtils.parse(entityId);
	 * if (type === 'building') {
	 *   // sourceId는 BuildingId, instanceId는 WorldBuildingId 타입으로 좁혀짐
	 * }
	 */
	parse(
		entityId: EntityId
	):
		| { type: 'building'; worldId: WorldId; sourceId: BuildingId; instanceId: WorldBuildingId }
		| { type: 'character'; worldId: WorldId; sourceId: CharacterId; instanceId: WorldCharacterId }
		| { type: 'item'; worldId: WorldId; sourceId: ItemId; instanceId: WorldItemId }
		| { type: 'tile'; worldId: WorldId; sourceId: TileId; instanceId: WorldTileMapId } {
		const parts = entityId.split('_');
		const type = parts[0] as EntityType;
		const worldId = parts[1] as WorldId;
		const sourceId = parts[2] as EntitySourceId;
		const instanceId = parts.slice(3).join('_');
		return { type, worldId, sourceId, instanceId } as any;
	},

	/**
	 * EntityId에서 type만 추출
	 * @example
	 * const type = EntityIdUtils.type(entityId);
	 */
	type(entityId: EntityId): EntityType {
		const parts = entityId.split('_');
		return parts[0] as EntityType;
	},

	/**
	 * EntityId에서 worldId만 추출
	 * @example
	 * const worldId = EntityIdUtils.worldId(entityId);
	 */
	worldId(entityId: EntityId): WorldId {
		const parts = entityId.split('_');
		return parts[1] as WorldId;
	},

	/**
	 * EntityId에서 sourceId만 추출
	 * @example
	 * const sourceId = EntityIdUtils.sourceId<BuildingId>(entityId);
	 */
	sourceId<T extends EntitySourceId | string = string>(entityId: EntityId): T {
		const parts = entityId.split('_');
		return parts[2] as T;
	},

	/**
	 * EntityId에서 instanceId만 추출
	 * @example
	 * const instanceId = EntityIdUtils.instanceId<WorldCharacterId>(entityId);
	 */
	instanceId<T extends EntityInstanceId | string = string>(entityId: EntityId): T {
		const parts = entityId.split('_');
		return parts.slice(3).join('_') as T;
	},

	/**
	 * EntityId가 특정 타입인지 확인
	 */
	is(type: EntityType, entityId: EntityId | undefined): boolean {
		return entityId?.startsWith(`${type}_`) ?? false;
	},

	/**
	 * EntityId가 특정 타입이 아닌지 확인
	 */
	not(type: EntityType, entityId: EntityId | undefined): boolean {
		return !this.is(type, entityId);
	},

	/**
	 * EntityId가 여러 타입 중 하나인지 확인
	 */
	or(types: EntityType[], entityId: EntityId | undefined): boolean {
		return types.some((type) => this.is(type, entityId));
	},

	/**
	 * EntityId 생성
	 * @example
	 * EntityIdUtils.create('building', worldId, buildingId) // "building_{worldId}_{buildingId}"
	 * EntityIdUtils.create(building) // "building_{building.world_id}_{building.id}"
	 */
	createId: createEntityId,

	/**
	 * EntityInstance 데이터를 EntityInstance 타입으로 변환
	 * @example
	 * const entityInstance = EntityIdUtils.to(worldCharacter);
	 */
	to(data: WorldBuilding | WorldCharacter | WorldItem): EntityInstance {
		if ('building_id' in data) {
			return { entityType: 'building', ...data } as EntityInstance;
		}
		if ('character_id' in data) {
			return { entityType: 'character', ...data } as EntityInstance;
		}
		return { entityType: 'item', ...data } as EntityInstance;
	},

	/**
	 * EntitySourceTargetId 유틸리티
	 */
	source: {
		/**
		 * EntitySourceTargetId 생성
		 * @example
		 * EntityIdUtils.template.create('building', buildingId) // "building_{buildingId}"
		 */
		create(type: EntityType, id: EntitySourceId): EntitySourceTargetId {
			return `${type}_${id}` as EntitySourceTargetId;
		},

		/**
		 * EntitySourceTargetId를 파싱하여 타입, 값을 반환
		 * @example
		 * const { type, value } = EntityIdUtils.template.parse(templateId);
		 */
		parse<T extends EntitySourceId | string = string>(
			templateId: EntitySourceTargetId
		): { type: EntityType; value: T } {
			const parts = templateId.split('_');
			const type = parts[0] as EntityType;
			const value = parts.slice(1).join('_') as T;
			return { type, value };
		},

		/**
		 * EntitySourceTargetId를 파싱하여 타입, 값을 반환
		 * @example
		 * const { type, value } = EntityIdUtils.template.parse(templateId);
		 */
		id<T extends EntitySourceId | string = string>(entitySourceTargetId: EntitySourceTargetId): T {
			const parts = entitySourceTargetId.split('_');
			return parts.slice(1).join('_') as T;
		},

		/**
		 * EntitySourceTargetId가 특정 타입인지 확인
		 */
		is(type: EntityType, templateId: EntitySourceTargetId | undefined): boolean {
			return templateId?.startsWith(`${type}_`) ?? false;
		},

		/**
		 * EntitySourceTargetId가 여러 타입 중 하나인지 확인
		 */
		or(types: EntityType[], templateId: EntitySourceTargetId | undefined): boolean {
			return types.some((type) => this.is(type, templateId));
		},

		/**
		 * EntitySource 데이터를 EntitySource 타입으로 변환
		 * @example
		 * const entitySource = EntityIdUtils.template.to(building);
		 */
		to(data: Building | Character | Item | Tile): EntitySource {
			if ('building_type' in data) {
				return { entityType: 'building', ...data } as EntitySource;
			}
			if ('character_type' in data) {
				return { entityType: 'character', ...data } as EntitySource;
			}
			if ('item_type' in data) {
				return { entityType: 'item', ...data } as EntitySource;
			}
			return { entityType: 'tile', ...data } as EntitySource;
		},
	},
};
