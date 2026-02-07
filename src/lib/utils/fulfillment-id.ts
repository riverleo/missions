import type { Fulfillment, NeedFulfillment, ConditionFulfillment } from '$lib/types';

export const FulfillmentIdUtils = {
	/**
	 * NeedFulfillment 또는 ConditionFulfillment을 Fulfillment 타입으로 변환
	 * @example
	 * const fulfillment = FulfillmentIdUtils.to(needFulfillment);
	 */
	to(fulfillment: NeedFulfillment | ConditionFulfillment): Fulfillment {
		if ('need_id' in fulfillment) {
			return { fulfillmentType: 'need', ...fulfillment } as Fulfillment;
		}
		return { fulfillmentType: 'condition', ...fulfillment } as Fulfillment;
	},
};
