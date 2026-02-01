import type {
	Fulfillment,
	NeedFulfillment,
	ConditionFulfillment,
} from '$lib/types';

export const FulfillmentIdUtils = {
	/**
	 * NeedFulfillment 또는 ConditionFulfillment을 Fulfillment 타입으로 변환
	 * @example
	 * const fulfillment = FulfillmentIdUtils.to(needFulfillment);
	 */
	to(data: NeedFulfillment | ConditionFulfillment): Fulfillment {
		if ('need_id' in data) {
			return { fulfillmentType: 'need', ...data } as Fulfillment;
		}
		return { fulfillmentType: 'condition', ...data } as Fulfillment;
	},
};
