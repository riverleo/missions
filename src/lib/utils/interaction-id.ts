import type {
	InteractionTargetId,
	InteractionType,
	InteractionId,
	InteractionActionId,
	InteractionAction,
	BuildingInteractionId,
	ItemInteractionId,
	CharacterInteractionId,
	BuildingInteractionActionId,
	ItemInteractionActionId,
	CharacterInteractionActionId,
	BuildingInteractionAction,
	ItemInteractionAction,
	CharacterInteractionAction,
} from '$lib/types';

export const InteractionIdUtils = {
	/**
	 * InteractionTargetId 생성
	 * @example
	 * InteractionIdUtils.create('building', buildingInteractionId, buildingInteractionActionId)
	 * // "building_{buildingInteractionId}_{buildingInteractionActionId}"
	 */
	create(
		type: InteractionType,
		interactionId: BuildingInteractionId | ItemInteractionId | CharacterInteractionId,
		interactionActionId: BuildingInteractionActionId | ItemInteractionActionId | CharacterInteractionActionId
	): InteractionTargetId {
		return `${type}_${interactionId}_${interactionActionId}` as InteractionTargetId;
	},

	/**
	 * InteractionTargetId를 파싱하여 타입, interactionId, interactionActionId를 반환
	 * @example
	 * const { type, interactionId, interactionActionId } = InteractionIdUtils.parse(interactionTargetId);
	 */
	parse(interactionTargetId: InteractionTargetId): {
		type: InteractionType;
		interactionId: InteractionId;
		interactionActionId: InteractionActionId;
	} {
		const parts = interactionTargetId.split('_');
		const type = parts[0] as InteractionType;
		const parsedInteractionId = parts[1] as InteractionId;
		const interactionActionId = parts[2] as InteractionActionId;
		return { type, interactionId: parsedInteractionId, interactionActionId: interactionActionId };
	},

	/**
	 * InteractionTargetId에서 type만 추출
	 * @example
	 * const type = InteractionIdUtils.type(interactionTargetId);
	 */
	type(interactionTargetId: InteractionTargetId): InteractionType {
		const parts = interactionTargetId.split('_');
		return parts[0] as InteractionType;
	},

	/**
	 * InteractionTargetId에서 interactionId만 추출
	 * @example
	 * const interactionId = InteractionIdUtils.interactionId(interactionTargetId);
	 */
	interactionId(interactionTargetId: InteractionTargetId): InteractionId {
		const parts = interactionTargetId.split('_');
		return parts[1] as InteractionId;
	},

	/**
	 * InteractionTargetId에서 interactionActionId만 추출
	 * @example
	 * const interactionActionId = InteractionIdUtils.interactionActionId(interactionTargetId);
	 */
	interactionActionId(interactionTargetId: InteractionTargetId): InteractionActionId {
		const parts = interactionTargetId.split('_');
		return parts[2] as InteractionActionId;
	},

	/**
	 * InteractionTargetId가 특정 타입인지 확인
	 * @example
	 * InteractionIdUtils.is('building', interactionTargetId)
	 */
	is(type: InteractionType, interactionTargetId: InteractionTargetId | undefined): boolean {
		return interactionTargetId?.startsWith(`${type}_`) ?? false;
	},

	/**
	 * InteractionAction 데이터를 InteractionAction 타입으로 변환
	 * @example
	 * const interactionAction = InteractionIdUtils.to(buildingInteractionAction);
	 */
	to(data: BuildingInteractionAction | ItemInteractionAction | CharacterInteractionAction): InteractionAction {
		if ('building_interaction_id' in data) {
			return { interactionType: 'building', ...data } as InteractionAction;
		}
		if ('item_interaction_id' in data) {
			return { interactionType: 'item', ...data } as InteractionAction;
		}
		return { interactionType: 'character', ...data } as InteractionAction;
	},
};
