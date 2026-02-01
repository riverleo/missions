import { get } from 'svelte/store';
import { Behavior } from './behavior.svelte';
import { useWorld } from '$lib/hooks/use-world';
import type {
	WorldCharacterId,
	WorldItemId,
	NeedBehaviorId,
	ConditionBehaviorId,
} from '$lib/types';
import type { BeforeUpdateEvent } from '../context';

export class PickupItemBehavior extends Behavior {
	readonly type = 'pickup-item';

	private targetWorldItemId: WorldItemId | undefined;
	private worldHook = useWorld();

	constructor(worldCharacterId: WorldCharacterId) {
		const id = `pickup-item_${worldCharacterId}` as NeedBehaviorId | ConditionBehaviorId;
		super(id, worldCharacterId);
	}

	getPriority(): number {
		// 기본 우선도 50
		return 50;
	}

	update(event: BeforeUpdateEvent): void {
		// 대상 아이템이 없으면 아무것도 하지 않음
		if (!this.targetWorldItemId) return;

		// 대상 아이템 엔티티 찾기
		const { getWorldItem } = this.worldHook;
		const worldItem = getWorldItem(this.targetWorldItemId);
		if (!worldItem) {
			this.targetWorldItemId = undefined;
			return;
		}

		// 캐릭터 엔티티 찾기 (월드 컨텍스트 접근 필요 - 추후 구현)
		// 지금은 기본 구조만 작성
	}

	tick(tick: number): void {
		// 틱마다 필요한 로직 (현재는 없음)
	}

	onStart(): void {
		// 가장 가까운 아이템 찾기
		const { getAllWorldItems } = this.worldHook;
		const items = getAllWorldItems();

		if (items.length === 0) {
			this.targetWorldItemId = undefined;
			return;
		}

		// 첫 번째 아이템을 대상으로 설정 (거리 계산은 추후 구현)
		this.targetWorldItemId = items[0]?.id;
	}

	onEnd(): void {
		// 행동 종료 시 대상 클리어
		this.targetWorldItemId = undefined;
	}

	/**
	 * 아이템 픽업 실행
	 */
	async pickupItem(worldItemId: WorldItemId): Promise<void> {
		const { worldItemStore } = this.worldHook;
		const worldItemStoreData = get(worldItemStore);

		const worldItem = worldItemStoreData.data[worldItemId];

		if (!worldItem) return;

		// 아이템의 world_character_id 업데이트 (캐릭터가 아이템을 소유)
		worldItemStore.set({
			...worldItemStoreData,
			data: {
				...worldItemStoreData.data,
				[worldItemId]: {
					...worldItem,
					world_character_id: this.worldCharacterId,
				},
			},
		});

		// 대상 클리어
		this.targetWorldItemId = undefined;
	}
}
