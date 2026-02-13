# PLAN_INTERACTION_QUEUE_IMPROVEMENT

## 배경

- 현재 `InteractionQueue` 실행 흐름에서 큐 진행 책임과 도메인 부작용 책임이 섞이기 쉬운 구조였다.
- `tick-dequeue-interaction`에서 큐 진행 외 처리(아이템 소지 반영 등)를 수행하면 상호작용 타입별 확장이 어렵고 정합성 문제가 발생한다.
- 상호작용 타입별 실행 로직은 `tick-action-system-*.ts` 계열로 분리되어야 한다.

## 목표

- `tick-dequeue-interaction`는 큐 상태를 보고 다음 상호작용 액션을 꺼내는 역할만 담당한다.
- 상호작용 액션의 실제 진행/완료 판정은 각 틱 액션에서 담당한다.
- 시스템 상호작용 도메인 로직은 상호작용 타입별 액션 tick으로 분리한다.
- 아이템 소지/타게팅 정합성을 런타임 상태와 영속 상태로 분리해 일관성을 유지한다.
- `InteractionQueue`의 현재 실행 액션 식별자/시작 틱 필드를 명확히 분리한다.

## 비목표

- 새로운 상호작용 타입 전체를 한 번에 리팩터링하지 않는다.
- UI/인스펙터 전체 구조 개편은 포함하지 않는다.

## 작업 체크리스트

### 1) InteractionQueue 책임 정리

- [x] `tick-dequeue-interaction` 명세를 "큐에서 실행할 다음 상호작용 액션 pop 전용"으로 확정한다.
- [x] `tick-dequeue-interaction`에서 완료 판정/도메인 부작용 로직을 제거한다.
- [x] `tick-dequeue-interaction`에서 도메인 부작용이 다시 유입되지 않도록 테스트 가드를 강화한다.
- [x] `ready` 상태에서 첫 `InteractionTargetId`를 `currentInteractionTargetId`에 설정하고 상태를 `action-ready`로 전환한다.
- [x] `action-completed` 상태에서 `currentInteractionTargetId` 기준으로 다음 타깃을 우선 탐색한다.
- [x] 다음 타깃이 없으면 `interactionTargetIds`의 다음 아이템을 가져와 `currentInteractionTargetId`로 설정한다.
- [x] 위 두 경로 모두 다음 타깃이 없으면 상태를 `completed`로 전환한다.

### 2) 시스템 상호작용 실행 분리

- [x] `tick-action-system-item-pick.ts` 파일을 추가한다.
- [x] 아이템 줍기 완료 시점에만 `world_items.world_character_id`와 `heldItemIds`를 동기화한다.
- [x] 아이템 엔티티 월드 제거 시점을 `item_pick` 액션 실행 성공 시점으로 제한한다.
- [x] `item_pick`은 이동 도달 조건(가까움 또는 path 빈 배열) 충족 전까지 실행 시작하지 않는다.
- [x] 이동 도달 조건이 충족되는 틱에 `currentInteractionTargetRunningAtTick`를 기록한다.
- [x] `tick-action-system-item-pick` 단위 테스트를 추가한다.

### 3) 실행 파이프라인 연결

- [ ] 상호작용 액션 타입에 따라 시스템 액션 tick을 분기 호출하는 엔트리 포인트를 설계한다.
- [ ] 큐 상태(`ready/action-ready/action-running/action-completed/completed`)와 각 틱 액션 실행 상태가 충돌하지 않도록 순서를 명시한다.
- [ ] 기존 `tick-enqueue-interaction-queue`, `tick-dequeue-interaction` 테스트를 회귀 검증한다.
- [x] `tick-dequeue-interaction`의 상태 전이 규칙(`ready -> action-ready`, `action-completed -> action-ready|completed`)을 테스트로 고정한다.

### 4) InteractionQueue 타입 개선

- [x] `poppedAtTick`를 제거하고 `currentInteractionTargetRunningAtTick`로 대체한다.
- [x] `currentInteractionTargetId?: InteractionTargetId` 필드를 추가한다.
- [x] `currentInteractionTargetRunningAtTick?: number` 필드를 추가한다.
- [x] 상태 타입을 `enqueuing | ready | action-ready | action-running | action-completed | completed`로 세분화한다.
- [x] 상태/필드 전이 규칙을 타입 주석으로 문서화한다.

### 5) 데이터 정합성 검증

- [ ] 테스트 월드에서 `world_character_id`가 남아있는 케이스와 없는 케이스를 분리 검증한다.
- [ ] 새로고침 후 "소지 아이템" 표기와 월드 아이템 표시 조건이 일치하는지 검증한다.
- [ ] 경로 이동 도중 취소/중단 시 아이템 소지 상태가 잘못 확정되지 않는지 검증한다.

### 6) 완료 기준

- [ ] `pnpm test:unit` 통과
- [ ] `pnpm check` 통과
- [ ] 테스트 시나리오에서 "캐릭터 1이 밥을 대상으로 이동 후 줍기 완료" 흐름이 재현된다.
