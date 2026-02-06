import { useBehavior, useWorld, useInteraction, useCharacter } from '$lib/hooks';
import { produce } from 'immer';
import { InteractionIdUtils } from '$lib/utils/interaction-id';
import { EntityIdUtils } from '$lib/utils/entity-id';
import type { WorldCharacterEntityBehavior } from './world-character-entity-behavior.svelte';
import type { Interaction, ItemInteraction, WorldItemId } from '$lib/types';

/**
 * once 타입 아이템 사용인 경우 실행
 *
 * once_interaction_type 아이템 사용 인터렉션을 실행합니다.
 * 사용 인터렉션 진행 중 need_fulfilments를 적용하고, 완료 후 아이템을 제거합니다.
 *
 * @returns true: 진행 중, false: 완료 (다음 행동으로 전환)
 */
export default function tickActionIfOnceItemUse(
	this: WorldCharacterEntityBehavior,
	tick: number
): boolean {
	const { getBehaviorAction, searchEntitySources } = useBehavior();
	const { getInteraction, getWorldItem, worldItemStore } = useWorld();
	const { getItemInteractionActions, getNextInteractionAction, getAllItemInteractions } =
		useInteraction();
	const { getAllNeedFulfillments, getNeed } = useCharacter();

	const worldCharacterEntity = this.worldCharacterEntity;
	const behaviorAction = getBehaviorAction(this.behaviorTargetId);
	if (!behaviorAction) {
		throw new Error('[tickActionOnceItemUse] No behaviorAction found');
	}

	// once 타입만 처리 (아이템 사용)
	if (behaviorAction.type !== 'once') return false;

	// 인터렉션 가져오기
	let interaction: Interaction | undefined;

	if (behaviorAction.target_selection_method === 'explicit') {
		// explicit: 명시적으로 지정된 interaction 사용
		interaction = getInteraction(behaviorAction);
	} else if (behaviorAction.target_selection_method === 'search') {
		// search: searchEntitySources를 통해 자동 탐색
		const entitySources = searchEntitySources(behaviorAction);
		const entitySourceIds = new Set(entitySources.map((es) => es.id));

		// 엔티티 소스 ID와 매칭되는 아이템 인터렉션 찾기
		const allItemInteractions = getAllItemInteractions();
		interaction = allItemInteractions.find(
			(itemInteraction) =>
				entitySourceIds.has(itemInteraction.item_id) &&
				itemInteraction.once_interaction_type?.startsWith('item')
		) as Interaction | undefined;
	}

	if (!interaction) {
		throw new Error(
			`[tickActionOnceItemUse] No interaction found for behaviorAction ${behaviorAction.id} (method: ${behaviorAction.target_selection_method})`
		);
	}

	// once_interaction_type 확인 (item만 처리)
	if (!interaction.once_interaction_type?.startsWith('item')) {
		throw new Error(
			`[tickActionOnceItemUse] Interaction is not item type: ${interaction.id} (type: ${interaction.once_interaction_type})`
		);
	}

	// 들고 있는 아이템 확인
	if (worldCharacterEntity.heldItemIds.length === 0) {
		return true;
	}

	const lastHeldEntityId =
		worldCharacterEntity.heldItemIds[worldCharacterEntity.heldItemIds.length - 1];
	if (!lastHeldEntityId) {
		return true;
	}

	const { instanceId } = EntityIdUtils.parse<WorldItemId>(lastHeldEntityId);
	const worldItem = getWorldItem(instanceId);
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
		this.setInteractionTarget(
			InteractionIdUtils.create('item', itemInteraction.id, rootAction.id),
			tick
		);
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

			const needDefinition = getNeed(need.need_id);
			const maxValue = needDefinition.max_value ?? 100;

			// 욕구 증가
			need.value = Math.min(maxValue, need.value + needFulfillment.increase_per_tick);
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
		const nextInteractionAction = getNextInteractionAction(interactionAction);

		if (nextInteractionAction) {
			// 다음 인터렉션으로 전환
			this.setInteractionTarget(InteractionIdUtils.create(nextInteractionAction), tick);
			return true; // 계속 진행
		} else {
			// 인터렉션 체인 종료 및 아이템 제거
			this.clearInteractionTarget();

			// 사용한 아이템 제거
			const removedItemEntityId = worldCharacterEntity.heldItemIds.pop();
			if (removedItemEntityId) {
				const { instanceId: removedInstanceId } = EntityIdUtils.parse(removedItemEntityId);

				// 엔티티가 남아있으면 제거 (일반적으로 이미 제거됨)
				const itemEntity = worldCharacterEntity.worldContext.entities[removedItemEntityId];
				if (itemEntity) {
					itemEntity.removeFromWorld();
				}

				// worldItem을 스토어에서 완전히 제거
				worldItemStore.update((state) =>
					produce(state, (draft) => {
						delete draft.data[removedInstanceId as WorldItemId];
					})
				);
			}
		}
	}

	// 3. 인터렉션 끝났으면 완료 (once 타입은 한 번 실행 후 완료)
	return !this.interactionTargetId ? false : true;
}
