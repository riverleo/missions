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
} from '$lib/types';

function createEntityId(type: EntityType, worldId: WorldId, id: EntityInstanceId): EntityId;
function createEntityId(entityInstance: EntityInstance): EntityId;
function createEntityId(
	entityInstanceOrType: EntityType | EntityInstance,
	worldId?: WorldId,
	id?: EntityInstanceId
): EntityId {
	if (typeof entityInstanceOrType === 'string') {
		if (!worldId || !id) {
			throw new Error('worldId and id are required when creating EntityId from type');
		}
		return `${entityInstanceOrType}_${worldId}_${id}` as EntityId;
	}

	// 객체로부터 EntityId 생성
	const entity = entityInstanceOrType;
	let type: EntityType;

	// 타입을 구별하기 위해 고유한 속성을 확인
	if ('building_id' in entity) {
		type = 'building';
	} else if ('character_id' in entity) {
		type = 'character';
	} else if ('item_id' in entity) {
		type = 'item';
	} else {
		throw new Error('Unknown entity type');
	}

	return `${type}_${entity.world_id}_${entity.id}` as EntityId;
}

export const EntityIdUtils = {
	/**
	 * EntityId를 파싱하여 타입, worldId, instanceId를 반환
	 * @example
	 * const { type, worldId, instanceId } = EntityIdUtils.parse(entityId);
	 * if (type === 'building') {
	 *   // instanceId는 자동으로 WorldBuildingId 타입으로 좁혀짐
	 * }
	 */
	parse(
		entityId: EntityId
	):
		| { type: 'building'; worldId: WorldId; instanceId: WorldBuildingId }
		| { type: 'character'; worldId: WorldId; instanceId: WorldCharacterId }
		| { type: 'item'; worldId: WorldId; instanceId: WorldItemId }
		| { type: 'tile'; worldId: WorldId; instanceId: WorldTileMapId } {
		const parts = entityId.split('_');
		const type = parts[0] as EntityType;
		const worldId = parts[1] as WorldId;
		const instanceId = parts.slice(2).join('_');
		return { type, worldId, instanceId } as any;
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
	 * EntityId에서 instanceId만 추출
	 * @example
	 * const instanceId = EntityIdUtils.instanceId<WorldCharacterId>(entityId);
	 */
	instanceId<T extends EntityInstanceId | string = string>(entityId: EntityId): T {
		const parts = entityId.split('_');
		return parts.slice(2).join('_') as T;
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
