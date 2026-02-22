# tick-action-once-item-use 구현

## 목표
`tick-action-once-item-use.ts`의 현재 골격 구현을 실제 동작으로 완성한다. 아이템 사용 단발 액션의 실행 조건, 성공/실패 처리, 큐 상태 전이를 명확히 정의하고 테스트로 회귀를 방지한다.

## 담당자
- 플래너
- 게임 디자이너
- 플랫폼 엔지니어
- 테스트 엔지니어

## 할 일
### 플래너
- [ ] `tick-action-once-item-use.ts` 구현 범위와 완료 기준을 본 플랜 노트에 고정한다.
- [ ] 구현 역할 호출 템플릿으로 게임 디자이너와 테스트 엔지니어에게 본 플랜 구현 시작을 요청한다.

### 게임 디자이너
- [ ] `src/lib/components/app/world/entities/world-character-entity/behavior/tick-action-system-item-pick.ts`를 기준으로 `tick-action-once-item-use.ts` 상단에 함수 역할/명세 주석을 먼저 작성한다.
- [ ] `tick-action-once-item-use.ts` 함수 본문에 단계별 대략 플로우를 주석으로 나열해 검토 가능 상태를 만든다.
- [ ] `src/lib/components/app/world/entities/world-character-entity/behavior/tick-action-once-item-use.ts`에서 `item_use` 대상의 실행 조건(큐 상태, 타겟 타입, 실행 가능 여부)을 판정하고 조건 불충족 시 상태 변경 없이 `false`를 반환하도록 구현한다.
- [ ] 실행 조건 충족 시 아이템 사용 단발 액션의 처리(필요한 도메인 함수 호출, 큐 상태 전이, 반환값)를 구현하고 기존 tick-action 패턴과 일관성을 맞춘다.
- [ ] `world-character-entity-behavior.svelte.ts` 및 관련 타입/호출부와의 계약을 점검해 타입 오류 없이 연결되도록 정리한다.

### 플랫폼 엔지니어
- [ ] 이번 플랜에서 플랫폼 변경 대상 파일이 없는지 확인하고, 변경 필요 발견 시 파일 경로와 사유를 플랜 노트에 기록한다.

### 테스트 엔지니어
- [ ] `src/lib/components/app/world/entities/world-character-entity/behavior/tick-action-once-item-use.spec.ts`에 성공 케이스와 실패 케이스(비대상 타입, 실행 불가 상태, 처리 실패)를 추가해 상태 전이와 반환값을 검증한다.
- [ ] `src/lib/hooks/fixture/world-character-entity/create-for-tick-action-once-item-use.ts`를 테스트 시나리오를 완결형으로 지원하도록 보강한다.
- [ ] `tick-action-once-item-use` 관련 테스트를 실행해 통과를 확인하고, 실패 시 원인을 플랜 노트에 기록한다.

## 노트
### 2026-02-22
- 사용자 신규 요구사항: `tick-action-once-item-use.ts` 구현을 위한 새 플랜 수립.
- 사용자 추가 요구사항: 구현 전 `tick-action-system-item-pick.ts`를 참고해 `tick-action-once-item-use.ts`에 함수 역할/명세 주석과 함수 내부 대략 플로우 주석을 먼저 작성한다.
- 기준 파일: `src/lib/components/app/world/entities/world-character-entity/behavior/tick-action-once-item-use.ts`, `src/lib/components/app/world/entities/world-character-entity/behavior/tick-action-once-item-use.spec.ts`, `src/lib/hooks/fixture/world-character-entity/create-for-tick-action-once-item-use.ts`.
- 구현 세부 동작은 기존 `tick-action-*` 파일 패턴과 명세를 우선 준수한다.
