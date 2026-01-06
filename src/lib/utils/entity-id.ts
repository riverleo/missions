import type {
	EntityId,
	EntityType,
	Building,
	Character,
	Item,
	Tile,
	BuildingId,
	CharacterId,
	ItemId,
	TileId,
} from '$lib/types';

type BrandedEntityId = BuildingId | CharacterId | ItemId | TileId;
type EntityObject = Building | Character | Item | Tile;

function createEntityId(type: EntityType, id: string): EntityId;
function createEntityId(entity: EntityObject): EntityId;
function createEntityId(typeOrEntity: EntityType | EntityObject, id?: string): EntityId {
	if (typeof typeOrEntity === 'string') {
		return `${typeOrEntity}-${id}` as EntityId;
	}

	// 객체로부터 타입 추론
	const entity = typeOrEntity;
	let type: EntityType;

	// 타입을 구별하기 위해 고유한 속성을 확인
	if ('tile_cols' in entity && 'tile_rows' in entity) {
		type = 'building';
	} else if ('character_body_id' in entity) {
		type = 'character';
	} else if ('rotation' in entity && !('tile_cols' in entity)) {
		type = 'item';
	} else if ('max_durability' in entity) {
		type = 'tile';
	} else {
		throw new Error('Unknown entity type');
	}

	return `${type}-${entity.id}` as EntityId;
}

export const EntityIdUtils = {
	/**
	 * EntityId를 파싱하여 타입과 값을 반환
	 * @example
	 * const { value } = EntityIdUtils.parse<BuildingId>(entityId); // value는 BuildingId 타입
	 * const { value } = EntityIdUtils.parse(entityId); // value는 string 타입
	 */
	parse<T extends BrandedEntityId | string = string>(
		entityId: EntityId
	): { type: EntityType; value: T } {
		const [type, ...rest] = entityId.split('-');
		return { type: type as EntityType, value: rest.join('-') as T };
	},

	/**
	 * EntityId가 특정 타입인지 확인
	 */
	is(type: EntityType, entityId: EntityId | undefined): boolean {
		return entityId?.startsWith(`${type}-`) ?? false;
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
	 * EntityIdUtils.create('building', buildingId) // "building-{buildingId}"
	 * EntityIdUtils.create(building) // "building-{building.id}"
	 */
	create: createEntityId,
};
