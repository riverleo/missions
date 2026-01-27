import type {
	BehaviorActionId,
	BehaviorType,
	NeedBehaviorId,
	ConditionBehaviorId,
	NeedBehaviorActionId,
	ConditionBehaviorActionId,
} from '$lib/types';

export const BehaviorActionIdUtils = {
	/**
	 * BehaviorActionId 생성
	 * @example
	 * BehaviorActionIdUtils.create('need', needBehaviorId, needBehaviorActionId)
	 * // "need_{needBehaviorId}_{needBehaviorActionId}"
	 */
	create(
		type: BehaviorType,
		behaviorId: NeedBehaviorId | ConditionBehaviorId,
		actionId: NeedBehaviorActionId | ConditionBehaviorActionId
	): BehaviorActionId {
		return `${type}_${behaviorId}_${actionId}` as BehaviorActionId;
	},

	/**
	 * BehaviorActionId를 파싱하여 타입, behaviorId, actionId를 반환
	 * @example
	 * const { type, behaviorId, actionId } = BehaviorActionIdUtils.parse(behaviorActionId);
	 */
	parse(behaviorActionId: BehaviorActionId): {
		type: BehaviorType;
		behaviorId: NeedBehaviorId | ConditionBehaviorId;
		actionId: NeedBehaviorActionId | ConditionBehaviorActionId;
	} {
		const parts = behaviorActionId.split('_');
		const type = parts[0] as BehaviorType;
		const behaviorId = parts[1] as NeedBehaviorId | ConditionBehaviorId;
		const actionId = parts[2] as NeedBehaviorActionId | ConditionBehaviorActionId;
		return { type, behaviorId, actionId };
	},

	/**
	 * BehaviorActionId에서 type만 추출
	 * @example
	 * const type = BehaviorActionIdUtils.type(behaviorActionId);
	 */
	type(behaviorActionId: BehaviorActionId): BehaviorType {
		const parts = behaviorActionId.split('_');
		return parts[0] as BehaviorType;
	},

	/**
	 * BehaviorActionId에서 behaviorId만 추출 (타입 캐스팅 지원)
	 * @example
	 * const behaviorId = BehaviorActionIdUtils.behaviorId(behaviorActionId);
	 * const needBehaviorId = BehaviorActionIdUtils.behaviorId<NeedBehaviorId>(behaviorActionId);
	 */
	behaviorId<T extends NeedBehaviorId | ConditionBehaviorId = NeedBehaviorId | ConditionBehaviorId>(
		behaviorActionId: BehaviorActionId
	): T {
		const parts = behaviorActionId.split('_');
		return parts[1] as T;
	},

	/**
	 * BehaviorActionId에서 actionId만 추출 (타입 캐스팅 지원)
	 * @example
	 * const actionId = BehaviorActionIdUtils.actionId(behaviorActionId);
	 * const needActionId = BehaviorActionIdUtils.actionId<NeedBehaviorActionId>(behaviorActionId);
	 */
	actionId<
		T extends
			| NeedBehaviorActionId
			| ConditionBehaviorActionId = NeedBehaviorActionId | ConditionBehaviorActionId,
	>(behaviorActionId: BehaviorActionId): T {
		const parts = behaviorActionId.split('_');
		return parts[2] as T;
	},

	/**
	 * BehaviorActionId가 특정 타입인지 확인
	 * @example
	 * BehaviorActionIdUtils.is('need', behaviorActionId)
	 */
	is(type: BehaviorType, behaviorActionId: BehaviorActionId | undefined): boolean {
		return behaviorActionId?.startsWith(`${type}_`) ?? false;
	},
};
