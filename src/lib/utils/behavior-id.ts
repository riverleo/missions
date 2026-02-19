import type {
	BehaviorTargetId,
	BehaviorType,
	BehaviorId,
	BehaviorActionId,
	Behavior,
	BehaviorAction,
	NeedBehaviorId,
	ConditionBehaviorId,
	NeedBehaviorActionId,
	ConditionBehaviorActionId,
	NeedBehavior,
	ConditionBehavior,
	NeedBehaviorAction,
	ConditionBehaviorAction,
} from '$lib/types';

export const BehaviorIdUtils = {
	/**
	 * BehaviorTargetId 생성
	 * @example
	 * BehaviorIdUtils.create(behaviorAction)
	 * // behaviorAction 객체에서 모든 정보를 추출하여 생성
	 *
	 * @example
	 * BehaviorIdUtils.create('need', needBehaviorId, needBehaviorActionId)
	 * // "need_{needBehaviorId}_{needBehaviorActionId}"
	 *
	 * @example
	 * BehaviorIdUtils.create(behavior, behaviorActionId)
	 * // behavior 객체에서 behaviorType과 id를 추출하여 생성
	 *
	 * @example
	 * BehaviorIdUtils.create(behavior, behaviorAction)
	 * // behavior와 behaviorAction 객체에서 필요한 정보를 추출하여 생성
	 */
	create(
		typeOrBehaviorOrAction:
			| BehaviorType
			| Behavior
			| BehaviorAction
			| NeedBehaviorAction
			| ConditionBehaviorAction,
		behaviorIdOrActionIdOrAction?:
			| NeedBehaviorId
			| ConditionBehaviorId
			| NeedBehaviorActionId
			| ConditionBehaviorActionId
			| BehaviorAction
			| NeedBehaviorAction
			| ConditionBehaviorAction,
		behaviorActionId?: NeedBehaviorActionId | ConditionBehaviorActionId
	): BehaviorTargetId {
		// NeedBehaviorAction 객체만 전달된 경우
		if (
			typeof typeOrBehaviorOrAction === 'object' &&
			'need_behavior_id' in typeOrBehaviorOrAction &&
			'id' in typeOrBehaviorOrAction &&
			behaviorIdOrActionIdOrAction === undefined
		) {
			const needBehaviorAction = typeOrBehaviorOrAction as NeedBehaviorAction;
			return `need_${needBehaviorAction.need_behavior_id}_${needBehaviorAction.id}` as BehaviorTargetId;
		}

		// ConditionBehaviorAction 객체만 전달된 경우
		if (
			typeof typeOrBehaviorOrAction === 'object' &&
			'condition_behavior_id' in typeOrBehaviorOrAction &&
			'id' in typeOrBehaviorOrAction &&
			behaviorIdOrActionIdOrAction === undefined
		) {
			const conditionBehaviorAction = typeOrBehaviorOrAction as ConditionBehaviorAction;
			return `condition_${conditionBehaviorAction.condition_behavior_id}_${conditionBehaviorAction.id}` as BehaviorTargetId;
		}

		// BehaviorAction 객체만 전달된 경우 (가장 간단한 케이스)
		if (
			typeof typeOrBehaviorOrAction === 'object' &&
			'behaviorType' in typeOrBehaviorOrAction &&
			'id' in typeOrBehaviorOrAction &&
			behaviorIdOrActionIdOrAction === undefined
		) {
			const behaviorAction = typeOrBehaviorOrAction as BehaviorAction;
			const behaviorId =
				behaviorAction.behaviorType === 'need'
					? (behaviorAction as NeedBehaviorAction).need_behavior_id
					: (behaviorAction as ConditionBehaviorAction).condition_behavior_id;
			return `${behaviorAction.behaviorType}_${behaviorId}_${behaviorAction.id}` as BehaviorTargetId;
		}

		// Behavior 객체가 전달된 경우
		if (typeof typeOrBehaviorOrAction === 'object' && 'id' in typeOrBehaviorOrAction) {
			const behavior = typeOrBehaviorOrAction as Behavior;

			// 두 번째 파라미터가 BehaviorAction 객체인 경우
			if (
				typeof behaviorIdOrActionIdOrAction === 'object' &&
				'id' in behaviorIdOrActionIdOrAction
			) {
				const behaviorAction = behaviorIdOrActionIdOrAction;
				return `${behavior.behaviorType}_${behavior.id}_${behaviorAction.id}` as BehaviorTargetId;
			}

			// 두 번째 파라미터가 actionId인 경우
			const actionId = behaviorIdOrActionIdOrAction as
				| NeedBehaviorActionId
				| ConditionBehaviorActionId;
			return `${behavior.behaviorType}_${behavior.id}_${actionId}` as BehaviorTargetId;
		}

		// 개별 파라미터가 전달된 경우
		const type = typeOrBehaviorOrAction as BehaviorType;
		const behaviorId = behaviorIdOrActionIdOrAction as NeedBehaviorId | ConditionBehaviorId;
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

	/**
	 * NeedBehaviorAction 또는 ConditionBehaviorAction을 BehaviorAction 타입으로 변환
	 * @example
	 * const behaviorAction = BehaviorIdUtils.to(needBehaviorAction);
	 */
	to(data: NeedBehaviorAction | ConditionBehaviorAction): BehaviorAction {
		if ('need_id' in data) {
			return { behaviorType: 'need', ...data } as BehaviorAction;
		}
		return { behaviorType: 'condition', ...data } as BehaviorAction;
	},

	/**
	 * Behavior 관련 유틸리티
	 */
	behavior: {
		/**
		 * NeedBehavior 또는 ConditionBehavior를 Behavior 타입으로 변환
		 * @example
		 * const behavior = BehaviorIdUtils.behavior.to(needBehavior);
		 */
		to(data: NeedBehavior | ConditionBehavior): Behavior {
			if ('need_id' in data) {
				return { behaviorType: 'need', ...data } as Behavior;
			}
			return { behaviorType: 'condition', ...data } as Behavior;
		},
	},
};
