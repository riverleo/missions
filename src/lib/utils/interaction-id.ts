import type {
	InteractionTargetId,
	EntitySourceType,
	InteractionId,
	InteractionActionId,
	Interaction,
	InteractionAction,
	BuildingInteractionId,
	ItemInteractionId,
	CharacterInteractionId,
	BuildingInteractionActionId,
	ItemInteractionActionId,
	CharacterInteractionActionId,
	BuildingInteraction,
	ItemInteraction,
	CharacterInteraction,
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
	 *
	 * InteractionIdUtils.create(interactionAction)
	 * // InteractionAction 객체로부터 생성
	 */
	create(
		typeOrAction: EntitySourceType | InteractionAction,
		interactionId?: BuildingInteractionId | ItemInteractionId | CharacterInteractionId,
		interactionActionId?:
			| BuildingInteractionActionId
			| ItemInteractionActionId
			| CharacterInteractionActionId
	): InteractionTargetId {
		// InteractionAction 객체로 호출된 경우
		if (typeof typeOrAction === 'object') {
			const action = typeOrAction;
			const type = action.entitySourceType;
			const actionId = action.id;

			if (action.entitySourceType === 'building') {
				return `${type}_${action.building_interaction_id}_${actionId}` as InteractionTargetId;
			} else if (action.entitySourceType === 'item') {
				return `${type}_${action.item_interaction_id}_${actionId}` as InteractionTargetId;
			} else {
				return `${type}_${action.character_interaction_id}_${actionId}` as InteractionTargetId;
			}
		}

		// 기존 방식: 개별 파라미터로 호출된 경우
		return `${typeOrAction}_${interactionId}_${interactionActionId}` as InteractionTargetId;
	},

	/**
	 * InteractionTargetId를 파싱하여 타입, interactionId, interactionActionId를 반환
	 * @example
	 * const { type, interactionId, interactionActionId } = InteractionIdUtils.parse(interactionTargetId);
	 */
	parse(interactionTargetId: InteractionTargetId): {
		type: EntitySourceType;
		interactionId: InteractionId;
		interactionActionId: InteractionActionId;
	} {
		const parts = interactionTargetId.split('_');
		const type = parts[0] as EntitySourceType;
		const parsedInteractionId = parts[1] as InteractionId;
		const interactionActionId = parts[2] as InteractionActionId;
		return { type, interactionId: parsedInteractionId, interactionActionId: interactionActionId };
	},

	/**
	 * InteractionTargetId에서 type만 추출
	 * @example
	 * const type = InteractionIdUtils.type(interactionTargetId);
	 */
	type(interactionTargetId: InteractionTargetId): EntitySourceType {
		const parts = interactionTargetId.split('_');
		return parts[0] as EntitySourceType;
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
	is(type: EntitySourceType, interactionTargetId: InteractionTargetId | undefined): boolean {
		return interactionTargetId?.startsWith(`${type}_`) ?? false;
	},

	/**
	 * Interaction 관련 유틸리티
	 */
	interaction: {
		/**
		 * Interaction 데이터를 Interaction discriminated union 타입으로 변환
		 * @example
		 * const interaction = InteractionIdUtils.interaction.to(buildingInteraction);
		 */
		to(data: BuildingInteraction | ItemInteraction | CharacterInteraction): Interaction {
			if ('building_id' in data) {
				return { entitySourceType: 'building', ...data } as Interaction;
			}
			if ('item_id' in data) {
				return { entitySourceType: 'item', ...data } as Interaction;
			}
			return { entitySourceType: 'character', ...data } as Interaction;
		},
	},

	/**
	 * InteractionAction 관련 유틸리티
	 */
	interactionAction: {
		/**
		 * InteractionAction 데이터를 InteractionAction discriminated union 타입으로 변환
		 * @example
		 * const interactionAction = InteractionIdUtils.interactionAction.to(buildingInteractionAction);
		 */
		to(
			data: BuildingInteractionAction | ItemInteractionAction | CharacterInteractionAction
		): InteractionAction {
			if ('building_interaction_id' in data) {
				return { entitySourceType: 'building', ...data } as InteractionAction;
			}
			if ('item_interaction_id' in data) {
				return { entitySourceType: 'item', ...data } as InteractionAction;
			}
			return { entitySourceType: 'character', ...data } as InteractionAction;
		},
	},
};
