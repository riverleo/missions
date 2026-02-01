import type {
	BehaviorId,
	BehaviorType,
	NeedBehaviorId,
	ConditionBehaviorId,
	NeedBehaviorActionId,
	ConditionBehaviorActionId,
} from '$lib/types';

export const BehaviorIdUtils = {
	/**
	 * BehaviorId 생성
	 * @example
	 * BehaviorIdUtils.create('need', needBehaviorId, needBehaviorActionId)
	 * // "need_{needBehaviorId}_{needBehaviorActionId}"
	 */
	create(
		type: BehaviorType,
		behaviorId: NeedBehaviorId | ConditionBehaviorId,
		behaviorActionId: NeedBehaviorActionId | ConditionBehaviorActionId
	): BehaviorId {
		return `${type}_${behaviorId}_${behaviorActionId}` as BehaviorId;
	},

	/**
	 * BehaviorId를 파싱하여 타입, behaviorId, actionId를 반환
	 * @example
	 * const { type, behaviorId, actionId } = BehaviorIdUtils.parse(behaviorId);
	 */
	parse(behaviorId: BehaviorId): {
		type: BehaviorType;
		behaviorId: NeedBehaviorId | ConditionBehaviorId;
		behaviorActionId: NeedBehaviorActionId | ConditionBehaviorActionId;
	} {
		const parts = behaviorId.split('_');
		const type = parts[0] as BehaviorType;
		const parsedBehaviorId = parts[1] as NeedBehaviorId | ConditionBehaviorId;
		const behaviorActionId = parts[2] as NeedBehaviorActionId | ConditionBehaviorActionId;
		return { type, behaviorId: parsedBehaviorId, behaviorActionId: behaviorActionId };
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
	 * BehaviorId에서 behaviorId만 추출
	 * @example
	 * const behaviorId = BehaviorIdUtils.behaviorId(behaviorId);
	 */
	behaviorId(behaviorId: BehaviorId): NeedBehaviorId | ConditionBehaviorId {
		const parts = behaviorId.split('_');
		return parts[1] as NeedBehaviorId | ConditionBehaviorId;
	},

	/**
	 * BehaviorId에서 actionId만 추출
	 * @example
	 * const actionId = BehaviorIdUtils.actionId(behaviorId);
	 */
	actionId(behaviorId: BehaviorId): NeedBehaviorActionId | ConditionBehaviorActionId {
		const parts = behaviorId.split('_');
		return parts[2] as NeedBehaviorActionId | ConditionBehaviorActionId;
	},

	/**
	 * BehaviorId가 특정 타입인지 확인
	 * @example
	 * BehaviorIdUtils.is('need', behaviorId)
	 */
	is(type: BehaviorType, behaviorId: BehaviorId | undefined): boolean {
		return behaviorId?.startsWith(`${type}_`) ?? false;
	},
};
