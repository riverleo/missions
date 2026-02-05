import { useBehavior, useWorld, useInteraction, useCharacter } from '$lib/hooks';
import { InteractionIdUtils } from '$lib/utils/interaction-id';
import { EntityIdUtils } from '$lib/utils/entity-id';
import type { WorldCharacterEntityBehavior } from './world-character-entity-behavior.svelte';
import type { WorldItemId, ItemInteractionId, Interaction, ItemInteraction } from '$lib/types';

/**
 * 아이템 사용 인터렉션 (once)
 *
 * once_interaction_type 아이템 사용 인터렉션을 실행합니다.
 * 사용 인터렉션 진행 중 need_fulfilments를 적용하고, 완료 후 종료합니다.
 *
 * @returns true: 진행 중, false: 완료 (다음 행동으로 전환)
 */
export default function tickActionOnceItemUse(
	this: WorldCharacterEntityBehavior,
	tick: number
): boolean {
	const { getBehaviorAction } = useBehavior();
	const { getInteraction, getWorldItem } = useWorld();
	const { getItemInteractionActions, getItemInteraction, getNextInteractionActionId } =
		useInteraction();
	const { getAllNeedFulfillments } = useCharacter();

	const worldCharacterEntity = this.worldCharacterEntity;
	const behaviorAction = getBehaviorAction(this.behaviorTargetId);
	if (!behaviorAction) return false;

	// once 타입만 처리 (아이템 사용)
	if (behaviorAction.type !== 'once') return false;

	// 인터렉션 가져오기
	let interaction: Interaction | undefined;

	if (behaviorAction.target_selection_method === 'explicit') {
		// explicit: 명시적으로 지정된 interaction 사용
		interaction = getInteraction(behaviorAction);
	} else if (behaviorAction.target_selection_method === 'search') {
		// search: fulfillment를 통해 자동 탐색
		const { getAllNeedFulfillments } = useCharacter();
		const fulfillments = getAllNeedFulfillments().filter(
			(f) => 'need_id' in behaviorAction && f.need_id === behaviorAction.need_id
		);

		// once_interaction_type이 있고 item으로 시작하는 interaction 찾기
		for (const fulfillment of fulfillments) {
			if (fulfillment.item_interaction_id) {
				const foundInteraction = getItemInteraction(fulfillment.item_interaction_id);
				if (foundInteraction?.once_interaction_type?.startsWith('item')) {
					interaction = foundInteraction as Interaction;
					break;
				}
			}
		}
	}

	if (!interaction) {
		throw new Error(
			`[tickActionOnceItemUse] No interaction found for behaviorAction ${behaviorAction.id} (method: ${behaviorAction.target_selection_method})`
		);
	}

	// once_interaction_type 확인 (item만 처리)
	if (!interaction.once_interaction_type?.startsWith('item')) {
		return false;
	}

	// 들고 있는 아이템 확인
	if (worldCharacterEntity.heldItemIds.length === 0) {
		return false;
	}

	const lastHeldEntityId =
		worldCharacterEntity.heldItemIds[worldCharacterEntity.heldItemIds.length - 1];
	if (!lastHeldEntityId) {
		return false;
	}

	const { instanceId } = EntityIdUtils.parse(lastHeldEntityId);
	const worldItem = getWorldItem(instanceId as WorldItemId);
	if (!worldItem) {
		console.warn('[tickActionOnceItemUse] worldItem not found, removing from heldItems:', {
			lastHeldEntityId,
			instanceId,
		});
		worldCharacterEntity.heldItemIds.pop();
		return true;
	}

	// interaction이 이미 ItemInteraction임 (once_interaction_type이 'item'으로 시작하므로)
	const itemInteraction = interaction as ItemInteraction;

	// 1. 인터렉션 체인 시작 (아직 시작 안 했으면)
	if (!this.interactionTargetId) {
		const actions = getItemInteractionActions(itemInteraction.id);
		const rootAction = actions.find((a) => a.root);
		if (!rootAction) {
			console.warn('[tickActionOnceItemUse] no root action found, removing item:', {
				itemInteractionId: itemInteraction.id,
				lastHeldEntityId,
			});
			worldCharacterEntity.heldItemIds.pop();
			return true;
		}

		// 첫 번째 액션으로 체인 시작
		this.interactionTargetId = InteractionIdUtils.create('item', itemInteraction.id, rootAction.id);
		this.interactionTargetStartTick = tick;
	}

	// 2. 인터렉션 체인 진행 (진행 중이면)
	if (this.interactionTargetId) {
		// need_fulfilments 실행 (매 tick마다 욕구 증가)
		const needFulfillments = getAllNeedFulfillments().filter(
			(nf) => nf.item_interaction_id === itemInteraction.id
		);

		for (const needFulfillment of needFulfillments) {
			const need = worldCharacterEntity.needs[needFulfillment.need_id];
			if (!need) continue;

			// 욕구 증가
			need.value = Math.min(100, need.value + needFulfillment.increase_per_tick);
		}

		// duration_ticks 경과 확인
		const { interactionActionId } = InteractionIdUtils.parse(this.interactionTargetId);
		const interactionActions = getItemInteractionActions(itemInteraction.id);
		const currentInteractionAction = interactionActions.find((a) => a.id === interactionActionId);

		if (!currentInteractionAction) {
			throw new Error(
				`[tickActionOnceItemUse] Current interaction action not found: ${interactionActionId} in interaction ${itemInteraction.id}`
			);
		}

		const elapsed = tick - (this.interactionTargetStartTick ?? 0);

		if (elapsed < currentInteractionAction.duration_ticks) {
			return true; // 아직 실행 중
		}

		// 다음 인터렉션 액션으로 전환 또는 체인 종료
		const interactionAction = InteractionIdUtils.interactionAction.to(currentInteractionAction);
		const nextInteractionActionId = getNextInteractionActionId(interactionAction);

		if (nextInteractionActionId) {
			// 다음 인터렉션으로 전환
			this.interactionTargetId = InteractionIdUtils.create(
				'item',
				itemInteraction.id,
				nextInteractionActionId as any
			);
			this.interactionTargetStartTick = tick;
			return true; // 계속 진행
		} else {
			// 인터렉션 체인 종료
			this.interactionTargetId = undefined;
			this.interactionTargetStartTick = undefined;
		}
	}

	// 3. 인터렉션 끝났으면 완료 (once 타입은 한 번 실행 후 완료)
	return !this.interactionTargetId ? false : true;
}
