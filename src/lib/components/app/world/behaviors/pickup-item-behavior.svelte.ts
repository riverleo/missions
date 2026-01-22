import { get } from 'svelte/store';
import { Behavior } from './behavior.svelte';
import { vectorUtils } from '$lib/utils/vector';
import { useWorld } from '$lib/hooks/use-world';
import type { BehaviorId, WorldCharacterId, WorldItemId } from '$lib/types';
import type { BeforeUpdateEvent } from '../context';
import type { WorldItemEntity } from '../entities/world-item-entity';

export class PickupItemBehavior extends Behavior {
	readonly type = 'pickup-item';

	private targetWorldItemId: WorldItemId | undefined;
	private worldHook = useWorld();

	constructor(worldCharacterId: WorldCharacterId) {
		const id = `pickup-item_${worldCharacterId}` as BehaviorId;
		super(id, worldCharacterId);
	}

	getPriority(): number {
		// 기본 우선도 50
		return 50;
	}

	update(event: BeforeUpdateEvent): void {
		// 타겟 아이템이 없으면 아무것도 하지 않음
		if (!this.targetWorldItemId) return;

		// 타겟 아이템 엔티티 찾기
		const { worldItemStore } = this.worldHook;
		const worldItem = get(worldItemStore).data[this.targetWorldItemId];
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
		const { worldItemStore } = this.worldHook;
		const items = Object.values(get(worldItemStore).data);

		if (items.length === 0) {
			this.targetWorldItemId = undefined;
			return;
		}

		// 첫 번째 아이템을 타겟으로 설정 (거리 계산은 추후 구현)
		this.targetWorldItemId = items[0]?.id;
	}

	onEnd(): void {
		// 행동 종료 시 타겟 클리어
		this.targetWorldItemId = undefined;
	}

	/**
	 * 아이템 픽업 실행
	 */
	async pickupItem(worldItemId: WorldItemId): Promise<void> {
		const { worldCharacterStore, worldItemStore } = this.worldHook;
		const worldCharacterStoreData = get(worldCharacterStore);
		const worldItemStoreData = get(worldItemStore);

		const worldCharacter = worldCharacterStoreData.data[this.worldCharacterId];
		const worldItem = worldItemStoreData.data[worldItemId];

		if (!worldCharacter || !worldItem) return;

		// 캐릭터의 held_world_item_id 업데이트
		worldCharacterStore.set({
			...worldCharacterStoreData,
			data: {
				...worldCharacterStoreData.data,
				[this.worldCharacterId]: {
					...worldCharacter,
					held_world_item_id: worldItemId,
				},
			},
		});

		// 아이템을 월드에서 제거 (soft delete)
		worldItemStore.set({
			...worldItemStoreData,
			data: {
				...worldItemStoreData.data,
				[worldItemId]: {
					...worldItem,
					deleted_at: new Date().toISOString(),
				},
			},
		});

		// 타겟 클리어
		this.targetWorldItemId = undefined;
	}
}
