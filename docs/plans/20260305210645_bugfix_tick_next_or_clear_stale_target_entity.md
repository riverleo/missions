# tickNextOrClear 버그 수정 및 workd 오타 수정

## 목표

1. `tickNextOrClear`에서 `targetEntityId`가 가리키는 엔티티가 월드(`worldContext.entities`)와 소지 아이템(`heldItemIds`) 양쪽 모두에 존재하지 않는 상태임에도 행동 상태가 초기화되지 않는 버그를 수정한다.
2. `tickApplyWorkdCharacterNeedDelta` 함수명과 파일명의 `workd` 오타를 `world`로 수정한다.

### 버그 시나리오

1. 캐릭터에 `targetEntityId`가 설정된 상태에서 해당 엔티티가 월드에서 제거된다(예: 다른 캐릭터가 줍거나 철거됨).
2. `tickFindTargetEntityAndGo`(step 2)에서 `worldContext.entities[targetEntityId]`가 `undefined`이면 `return false`만 하고 `targetEntityId`를 초기화하지 않는다.
3. 이후 단계(step 3~7)가 유효하지 않은 `targetEntityId`를 기반으로 실행되며, 상호작용 큐가 정상 완료(`completed`)에 도달하지 못할 수 있다.
4. `tickNextOrClear`(step 8)는 `interactionQueue.status !== 'completed'` 가드에 의해 조기 반환하여 행동 상태를 영원히 초기화하지 못한다.

### 수정 방향

`tickNextOrClear`에서 `interactionQueue.status` 가드 이전에 타겟 엔티티 유효성 검사를 추가한다. `targetEntityId`가 설정되어 있으나 월드 엔티티와 소지 아이템 어디에도 존재하지 않으면 `this.clear()`를 호출하여 행동을 종료한다.

## 담당자

- 플래너
- 게임 디자이너
- 테스트 엔지니어

## 할 일

### 플래너

- [x] 버그 시나리오, 수정 범위, 완료 기준을 플랜에 기록한다.
- [ ] 구현 역할 호출 템플릿으로 게임 디자이너와 테스트 엔지니어에게 플랜 구현 시작을 요청한다.

### 게임 디자이너

- [ ] `tick-next-or-clear.ts`에서 `interactionQueue.status` 가드(현재 step 0) 이전에 타겟 엔티티 유효성 검사 로직을 추가한다. `targetEntityId`가 설정되어 있으나 `worldContext.entities`와 `heldItemIds` 모두에 존재하지 않으면 `this.clear()`를 호출하고 종료한다.
- [ ] `tick-next-or-clear.ts`의 함수 JSDoc 명세에 새 규칙(타겟 엔티티가 월드와 소지 아이템에 존재하지 않으면 초기화한다)을 추가한다.
- [ ] `tick-apply-workd-character-need-delta.ts`를 `tick-apply-world-character-need-delta.ts`로 파일명을 변경한다.
- [ ] `tick-apply-workd-character-need-delta.spec.ts`를 `tick-apply-world-character-need-delta.spec.ts`로 파일명을 변경한다.
- [ ] 함수명 `tickApplyWorkdCharacterNeedDelta`를 `tickApplyWorldCharacterNeedDelta`로 변경한다.
- [ ] 파일명/함수명 변경에 따른 모든 import 및 참조를 수정한다.

### 테스트 엔지니어

- [ ] `tick-next-or-clear.spec.ts`에 테스트 케이스를 추가한다: `targetEntityId`가 설정되어 있으나 `worldContext.entities`와 `heldItemIds` 모두에 존재하지 않으면 `clear()`가 호출된다.
- [ ] 오타 수정 후 기존 테스트가 회귀 없이 통과하는지 확인한다.

## 노트

### 2026-03-05

- 관련 파일:
  - 구현: `src/lib/components/app/world/entities/world-character-entity/behavior/tick-next-or-clear.ts`
  - 테스트: `src/lib/components/app/world/entities/world-character-entity/behavior/tick-next-or-clear.spec.ts`
  - 행동 클래스: `src/lib/components/app/world/entities/world-character-entity/behavior/world-character-entity-behavior.svelte.ts`
  - 타겟 탐색: `src/lib/components/app/world/entities/world-character-entity/behavior/tick-find-target-entity-and-go.ts`
- `tickFindTargetEntityAndGo`(line 58)에서도 엔티티가 없을 때 `targetEntityId`를 초기화하지 않는 동일 패턴이 존재하나, 이 플랜의 범위는 `tickNextOrClear`의 안전망 역할 강화로 한정한다.
- `worldContext.entities`는 `WorldCharacterEntity.worldContext.entities` (월드 내 전체 엔티티 맵), `heldItemIds`는 `WorldCharacterEntity.heldItemIds` (캐릭터가 들고 있는 아이템 ID 배열)이다.
- `workd` → `world` 오타 수정 대상 파일:
  - 파일명 변경: `tick-apply-workd-character-need-delta.ts` → `tick-apply-world-character-need-delta.ts`
  - 파일명 변경: `tick-apply-workd-character-need-delta.spec.ts` → `tick-apply-world-character-need-delta.spec.ts`
  - 참조 수정: `world-character-entity-behavior.svelte.ts` (import + 프로퍼티)
  - 참조 수정: `tick.ts` (메서드 호출)
  - 참조 수정: `tick-action-once-item-use.spec.ts` (메서드 호출)
  - 참조 수정: `tick-apply-world-character-need-delta.spec.ts` (describe + 메서드 호출)
  - 완료된 플랜 문서(`docs/plans/completed/`)는 이력이므로 수정하지 않는다.
