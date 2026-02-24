# needs 변경값 일괄 반영 구조로 tick 리팩터링

## 목표

`WorldCharacterEntityBehavior`의 틱 처리에서 `needs` 값을 직접 증감하는 지점을 분산 처리하지 않고, 액션 단계에서 변경값(delta)을 수집한 뒤 틱 말미에 한 번에 반영하는 구조로 정리한다.
이를 통해 어떤 액션이 `needs`를 증가/감소시키는지 추적 가능성을 높이고, 최대/최소값 보정과 충돌 처리 규칙을 단일 지점에서 일관되게 적용한다.

## 담당자

- 플래너
- 게임 디자이너
- 플랫폼 엔지니어
- 테스트 엔지니어

## 할 일

### 플래너

- [x] 사용자 요구사항(액션별 `needs` 변경값 수집 후 일괄 반영)을 본 플랜에 기록하고 구현 범위를 확정한다.

### 게임 디자이너

- [x] `src/lib/components/app/world/entities/world-character-entity/behavior/tick.ts`에 틱 단위 `needs` 변경값 수집 객체 `WorldCharacterNeedDelta` 생성 및 최종 반영 호출 지점을 추가한다.
- [x] `tick-action-once-item-use.ts`를 포함한 `needs` 변경 액션 함수 시그니처를 `WorldCharacterNeedDelta`를 인자로 받도록 정리하고, 액션 단계에서는 delta 기록만 수행하며 직접 `need.value`를 수정하지 않도록 변경한다.
- [x] `src/lib/components/app/world/entities/world-character-entity/behavior/tick-apply-workd-character-need-delta.ts`에서 `need`별 누적 합산/최종 계산 규칙(동일 틱 내 다중 액션 반영 순서/충돌 처리)을 명시하고 코드로 고정한다.

### 플랫폼 엔지니어

- [x] 수집 객체 타입 `WorldCharacterNeedDelta`와 최종 반영 모듈 `src/lib/components/app/world/entities/world-character-entity/behavior/tick-apply-workd-character-need-delta.ts`를 정의하고 기존 행동 모듈 타입과 충돌 없이 통합한다.
- [x] 일괄 반영 함수에 조건부 무시 규칙(예: 특정 액션 진행 중 `tick-decrease-needs` 입력 무시)을 확장 가능한 형태로 설계하고 적용 범위를 정리한다.
- [x] 일괄 반영 시 `min/max` 경계값 보정 책임을 단일 함수로 모으고, 기존 분산 보정 로직 제거 범위를 정리한다.
- [x] `tick-decrease-needs` 감소 delta는 같은 틱 동일 `need`의 상승 delta가 존재하면 무시되도록 최종 반영 규칙을 보강한다.

### 테스트 엔지니어

- [x] `tick-action-once-item-use.spec.ts`에 직접 변경 대신 수집 객체 반영 경로로도 동일 결과가 나오는 회귀 테스트를 추가한다.
- [x] `tick.ts` 또는 관련 통합 테스트에 “같은 틱에서 여러 액션이 같은 need를 변경할 때 누적 후 1회 반영” 케이스를 추가한다.
- [x] 특정 액션 진행 중 `tick-decrease-needs` 입력이 `tick-apply-workd-character-need-delta.ts`에서 무시되는 조건부 규칙을 테스트로 고정한다.
- [x] `need` 상한/하한 경계값 보정이 일괄 반영 경로에서 유지되는지 테스트로 검증한다.
- [x] 같은 틱에서 동일 `need`에 상승 delta와 `tick-decrease-needs` 감소 delta가 함께 있을 때 감소 delta가 무시되는지 테스트를 추가한다.

## 노트

### 2026-02-22

- 사용자 신규 요구사항: `tick` 플로우에서 액션별로 직접 `needs`를 수정하지 않고, 변경값을 먼저 수집한 뒤 마지막에 한 번에 반영하는 구조로 전환.
- 사용자 명명 규칙: 수집 객체 이름은 `WorldCharacterNeedDelta`로 고정한다.
- 사용자 명명 규칙: 최종 반영 로직은 `src/lib/components/app/world/entities/world-character-entity/behavior/tick-apply-workd-character-need-delta.ts`로 분리한다.
- 사용자 구조 요구사항: 각 틱 액션은 `WorldCharacterNeedDelta`에 delta를 기록만 하고, 최종 저장/계산은 `tick-apply-workd-character-need-delta.ts`에서 일괄 처리한다.
- 사용자 확장 요구사항: 조건부 규칙(예: 아이템 사용 중 `tick-decrease-needs` 입력 무시)은 액션 함수가 아니라 `tick-apply-workd-character-need-delta.ts`에서 판단한다.
- 사용자 추가 요구사항: `tick-decrease-needs`에서 생성된 감소 delta는 같은 틱 동일 `need`의 상승 delta가 존재하면 무시한다.
- 현재 확인된 직접 반영 지점: `src/lib/components/app/world/entities/world-character-entity/behavior/tick-action-once-item-use.ts`의 `applyNeedFulfillmentPerTick`.
- 구현 전 원칙: 본 플랜에 정의된 범위를 기준으로 역할 호출 후 구현을 시작한다.
- 진행 메모: `WorldCharacterNeedDelta` 타입/헬퍼(`world-character-need-delta.ts`)를 추가하고 `tick-decrease-needs.ts`와 `tick-action-once-item-use.ts`를 delta 기록 방식으로 전환했다.
- 진행 메모: `tick.ts`는 `WorldCharacterNeedDelta`를 인자로 받아 액션 흐름을 수행하고 `finally`에서 `tick-apply-workd-character-need-delta.ts`를 호출하도록 변경했다.
- 진행 메모: `tick-apply-workd-character-need-delta.ts`에서 item_use 실행 중 `tick-decrease-needs` 입력 무시와 min/max clamp를 일괄 처리한다.
- 테스트 메모: `pnpm test:unit`(대상 3개 spec) 및 `pnpm check` 통과.
- 진행 메모(추가 구현): 같은 틱 동일 need에 상승 delta가 존재하면 `tick-decrease-needs` 감소 delta를 무시하도록 `tick-apply-workd-character-need-delta.ts` 계산 규칙을 확장했다.
- 테스트 메모(추가 구현): `tick-apply-workd-character-need-delta.spec.ts`에 상승 delta 존재 시 감소 delta 무시 케이스를 추가했다.
