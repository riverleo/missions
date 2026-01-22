import type {
	BehaviorId,
	BehaviorType,
	NeedBehaviorId,
	ConditionBehaviorId,
} from '$lib/types';

export const BehaviorIdUtils = {
	/**
	 * BehaviorId 생성
	 * @example
	 * BehaviorIdUtils.createBehaviorId('need', needBehaviorId) // "need_{needBehaviorId}"
	 * BehaviorIdUtils.createBehaviorId('condition', conditionBehaviorId) // "condition_{conditionBehaviorId}"
	 */
	createBehaviorId(
		type: 'need',
		id: NeedBehaviorId
	): `need_${NeedBehaviorId}`;
	createBehaviorId(
		type: 'condition',
		id: ConditionBehaviorId
	): `condition_${ConditionBehaviorId}`;
	createBehaviorId(
		type: BehaviorType,
		id: NeedBehaviorId | ConditionBehaviorId
	): BehaviorId {
		return `${type}_${id}` as BehaviorId;
	},

	/**
	 * BehaviorId를 파싱하여 타입과 ID를 반환
	 * @example
	 * const { type, id } = BehaviorIdUtils.parse(behaviorId);
	 */
	parse(behaviorId: BehaviorId): {
		type: BehaviorType;
		id: NeedBehaviorId | ConditionBehaviorId;
	} {
		const parts = behaviorId.split('_');
		const type = parts[0] as BehaviorType;
		const id = parts.slice(1).join('_') as NeedBehaviorId | ConditionBehaviorId;
		return { type, id };
	},

	/**
	 * BehaviorId에서 type만 추출
	 * @example
	 * const type = BehaviorIdUtils.type(behaviorId);
	 */
	type(behaviorId: BehaviorId): BehaviorType {
		const parts = behaviorId.split('_');
		return parts[0] as BehaviorType;
	},

	/**
	 * BehaviorId에서 id만 추출
	 * @example
	 * const id = BehaviorIdUtils.id(behaviorId);
	 */
	id(behaviorId: BehaviorId): NeedBehaviorId | ConditionBehaviorId {
		const parts = behaviorId.split('_');
		return parts.slice(1).join('_') as NeedBehaviorId | ConditionBehaviorId;
	},

	/**
	 * BehaviorId가 특정 타입인지 확인
	 * @example
	 * BehaviorIdUtils.is('need', behaviorId)
	 */
	is(type: BehaviorType, behaviorId: BehaviorId | undefined): boolean {
		return behaviorId?.startsWith(`${type}_`) ?? false;
	},

	/**
	 * BehaviorId에서 instance id 추출 (타입 캐스팅 지원)
	 * @example
	 * BehaviorIdUtils.instanceId<NeedBehaviorId>(behaviorId)
	 */
	instanceId<T extends NeedBehaviorId | ConditionBehaviorId>(behaviorId: BehaviorId): T {
		const parts = behaviorId.split('_');
		return parts.slice(1).join('_') as T;
	},
};
