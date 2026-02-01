import type {
	BehaviorId,
	BehaviorType,
	BehaviorTemplateId,
	BehaviorActionId,
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
		behaviorId: BehaviorTemplateId;
		behaviorActionId: BehaviorActionId;
	} {
		const parts = behaviorId.split('_');
		const type = parts[0] as BehaviorType;
		const parsedBehaviorId = parts[1] as BehaviorTemplateId;
		const behaviorActionId = parts[2] as BehaviorActionId;
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
	behaviorId(behaviorId: BehaviorId): BehaviorTemplateId {
		const parts = behaviorId.split('_');
		return parts[1] as BehaviorTemplateId;
	},

	/**
	 * BehaviorId에서 actionId만 추출
	 * @example
	 * const actionId = BehaviorIdUtils.actionId(behaviorId);
	 */
	actionId(behaviorId: BehaviorId): BehaviorActionId {
		const parts = behaviorId.split('_');
		return parts[2] as BehaviorActionId;
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
