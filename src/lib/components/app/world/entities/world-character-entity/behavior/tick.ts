import type { WorldCharacterEntityBehavior } from './world-character-entity-behavior.svelte';

/**
 * 캐릭터의 행동을 tick마다 처리합니다.
 *
 * 플로우:
 * 1. tickFindBehaviorTarget: 행동 선정
 * 2. tickFindTargetEntityAndGo: 타겟 엔티티 찾기 & 이동
 * 3. tickEnqueueInteractionQueue: 인터렉션 큐 구성
 * 4. tickDequeueInteraction: 실행할 인터렉션 액션 선택
 * 5. tickActionOnce*: once 액션 실행/완료 판정
 * 6. tickActionSystem*: system 액션 실행/완료 판정
 * 7. tickActionFulfill*: fulfill 액션 실행/완료 판정
 * 8. tickNextOrClear: 다음 행동으로 전환 또는 종료
 */
export default function tick(this: WorldCharacterEntityBehavior, tick: number): void {
	if (this.tickFindBehaviorTarget(tick)) return; // 1. 행동 선정
	if (this.tickFindTargetEntityAndGo(tick)) return; // 2. 타겟 엔티티 찾기 & 이동
	if (this.tickEnqueueInteractionQueue(tick)) return; // 3. 인터렉션 큐 구성
	if (this.tickDequeueInteraction(tick)) return; // 4. 인터렉션 액션 선택
	if (this.tickActionOnceItemUse(tick)) return; // 5. once:item_use 액션 실행
	if (this.tickActionOnceBuildingUse(tick)) return; // 5. once:building_use 액션 실행
	if (this.tickActionOnceBuildingConstruct(tick)) return; // 5. once:building_construct 액션 실행
	if (this.tickActionOnceBuildingDemolish(tick)) return; // 5. once:building_demolish 액션 실행
	if (this.tickActionSystemItemPick(tick)) return; // 6. system:item_pick 액션 실행
	if (this.tickActionFulfillBuildingRepair(tick)) return; // 7. fulfill:building_repair 액션 실행
	if (this.tickActionFulfillBuildingClean(tick)) return; // 7. fulfill:building_clean 액션 실행
	if (this.tickActionFulfillBuildingUse(tick)) return; // 7. fulfill:building_use 액션 실행
	if (this.tickActionFulfillCharacterHug(tick)) return; // 7. fulfill:character_hug 액션 실행
	this.tickNextOrClear(tick); // 8. 다음 행동 전환/종료
}
