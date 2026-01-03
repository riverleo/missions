import type { EntityId, EntityType } from '$lib/types';

export const EntityIdUtils = {
	/**
	 * EntityId를 파싱하여 타입과 값을 반환
	 */
	parse(entityId: EntityId): { type: EntityType; value: string } {
		const [type, ...rest] = entityId.split('-');
		return { type: type as EntityType, value: rest.join('-') };
	},

	/**
	 * EntityId가 특정 타입인지 확인
	 */
	is(type: EntityType, entityId: EntityId | undefined): boolean {
		return entityId?.startsWith(`${type}-`) ?? false;
	},

	/**
	 * EntityId 생성
	 */
	create(type: EntityType, id: string): EntityId {
		return `${type}-${id}` as EntityId;
	},
};
