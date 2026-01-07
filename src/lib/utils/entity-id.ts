import type {
	EntityId,
	EntityType,
	WorldBuilding,
	WorldCharacter,
	WorldItem,
	WorldBuildingId,
	WorldCharacterId,
	WorldItemId,
	WorldId,
} from '$lib/types';

type BrandedEntityId = WorldBuildingId | WorldCharacterId | WorldItemId;
type WorldEntity = WorldBuilding | WorldCharacter | WorldItem;

function createEntityId(type: EntityType, worldId: WorldId, id: BrandedEntityId): EntityId;
function createEntityId(worldEntity: WorldEntity): EntityId;
function createEntityId(
	typeOrWorldEntity: EntityType | WorldEntity,
	worldId?: WorldId,
	id?: BrandedEntityId
): EntityId {
	if (typeof typeOrWorldEntity === 'string') {
		if (!worldId || !id) {
			throw new Error('worldId and id are required when creating EntityId from type');
		}
		return `${typeOrWorldEntity}_${worldId}_${id}` as EntityId;
	}

	// 객체로부터 EntityId 생성
	const entity = typeOrWorldEntity;
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
	 * EntityId를 파싱하여 타입, worldId, 값을 반환
	 * @example
	 * const { worldId, value } = EntityIdUtils.parse<BuildingId>(entityId);
	 * const { type, worldId, value } = EntityIdUtils.parse(entityId);
	 */
	parse<T extends BrandedEntityId | string = string>(
		entityId: EntityId
	): { type: EntityType; worldId: WorldId; value: T } {
		const parts = entityId.split('_');
		const type = parts[0] as EntityType;
		const worldId = parts[1] as WorldId;
		const value = parts.slice(2).join('_') as T;
		return { type, worldId, value };
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
	create: createEntityId,
};
