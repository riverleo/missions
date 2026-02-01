import type {
	BehaviorTargetId,
	BehaviorType,
	BehaviorId,
	BehaviorActionId,
	NeedBehaviorId,
	ConditionBehaviorId,
	NeedBehaviorActionId,
	ConditionBehaviorActionId,
} from '$lib/types';

export const BehaviorIdUtils = {
	/**
	 * BehaviorTargetId 생성
	 * @example
	 * BehaviorIdUtils.create('need', needBehaviorId, needBehaviorActionId)
	 * // "need_{needBehaviorId}_{needBehaviorActionId}"
	 */
	create(
		type: BehaviorType,
		behaviorId: NeedBehaviorId | ConditionBehaviorId,
		behaviorActionId: NeedBehaviorActionId | ConditionBehaviorActionId
	): BehaviorTargetId {
		return `${type}_${behaviorId}_${behaviorActionId}` as BehaviorTargetId;
	},

	/**
	 * BehaviorTargetId를 파싱하여 타입, behaviorId, behaviorActionId를 반환
	 * @example
	 * const { type, behaviorId, behaviorActionId } = BehaviorIdUtils.parse(behaviorTargetId);
	 */
	parse(behaviorTargetId: BehaviorTargetId): {
		type: BehaviorType;
		behaviorId: BehaviorId;
		behaviorActionId: BehaviorActionId;
	} {
		const parts = behaviorTargetId.split('_');
		const type = parts[0] as BehaviorType;
		const parsedBehaviorId = parts[1] as BehaviorId;
		const behaviorActionId = parts[2] as BehaviorActionId;
		return { type, behaviorId: parsedBehaviorId, behaviorActionId: behaviorActionId };
	},

	/**
	 * BehaviorTargetId에서 type만 추출
	 * @example
	 * const type = BehaviorIdUtils.type(behaviorTargetId);
	 */
	type(behaviorTargetId: BehaviorTargetId): BehaviorType {
		const parts = behaviorTargetId.split('_');
		return parts[0] as BehaviorType;
	},

	/**
	 * BehaviorTargetId에서 behaviorId만 추출
	 * @example
	 * const behaviorId = BehaviorIdUtils.behaviorId(behaviorTargetId);
	 */
	behaviorId(behaviorTargetId: BehaviorTargetId): BehaviorId {
		const parts = behaviorTargetId.split('_');
		return parts[1] as BehaviorId;
	},

	/**
	 * BehaviorTargetId에서 behaviorActionId만 추출
	 * @example
	 * const behaviorActionId = BehaviorIdUtils.behaviorActionId(behaviorTargetId);
	 */
	behaviorActionId(behaviorTargetId: BehaviorTargetId): BehaviorActionId {
		const parts = behaviorTargetId.split('_');
		return parts[2] as BehaviorActionId;
	},

	/**
	 * BehaviorTargetId가 특정 타입인지 확인
	 * @example
	 * BehaviorIdUtils.is('need', behaviorTargetId)
	 */
	is(type: BehaviorType, behaviorTargetId: BehaviorTargetId | undefined): boolean {
		return behaviorTargetId?.startsWith(`${type}_`) ?? false;
	},
};
