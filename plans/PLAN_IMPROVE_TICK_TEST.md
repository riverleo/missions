# PLAN_IMPROVE_TICK_TEST

## 배경

- 현재 `world-character-entity/behavior/*.spec.ts` 테스트는 fixture 함수 호출/고정 fixture 데이터 비교 중심의 얕은 검증 비중이 높다.
- 함수 내부 의존성을 과도하게 고정(freeze)해서, 로직이 바뀌면 테스트 정합성이 빠르게 깨진다.
- 개별 tick 함수의 명세를 모두 만족해도 실제 `tick.ts` 실행 순서/상태 전이가 in-game 수준으로 보장되지 않는다.

## 목표

- `world-character-entity/behavior/*.spec.ts` 범위에서 in-game 수준에 가까운 테스트 구조를 마련한다.
- 스토어 기반 시나리오 데이터로 테스트를 구성해 fixture 의존도를 줄인다.
- `tick.ts` 단위에서 호출 순서/전이 상태를 검증해 개별 tick 테스트의 공백을 보완한다.

## 비목표

- behavior 외 도메인(렌더러/UI/DB)까지 테스트 체계를 확장하지 않는다.
- E2E 테스트 도입/대체는 이번 플랜 범위에 포함하지 않는다.
- `World` 컴포넌트/렌더 루프(Matter.js, canvas) 수준 테스트는 이번 플랜 범위에서 제외한다.

## 작업 체크리스트

### 1) 테스트 구조 리디자인

- [ ] 기존 `behavior/*.spec.ts`를 함수 내부 fixture 호출 검증 중심에서 상태 전이/결과 검증 중심으로 전환한다.
- [ ] 테스트 fixture를 스토어 데이터 기준으로 구성하고, 로직 단위 fixture는 최소화한다.
- [ ] 테스트에서 사용 중인 하드코딩/중복 fixture 데이터 빌더를 공용 팩토리로 정리한다.

### 2) Hook Fixture 인프라 추가

- [ ] `src/lib/hooks/fixture/index.ts`를 추가한다.
- [ ] `beforeEach`/`afterEach`에서 스토어 초기화 유틸을 제공한다.
- [ ] tick 시나리오별 fixture 모듈을 분리한다.
- [ ] 예시: `src/lib/hooks/fixture/world-character-entity/create-for-tick-action-system-item-pick.ts`.
- [ ] 호출 패턴은 `Fixture.worldCharacterEntity.createForTickActionSystemItemPick()` 형태로 통일한다.
- [ ] 공통 정리 API(`Fixture.reset()`)를 제공하고 `afterEach`에서 호출한다.
- [ ] 기본 사용 패턴을 문서화한다.
  - `beforeEach`: `worldCharacterEntity = Fixture.createForTickActionSystemItemPick();`
  - `afterEach`: `Fixture.reset();`

### 3) tick.ts 중심 통합 단위 테스트

- [ ] 기존 함수 호출 테스트를 `lib/components/app/world/entities/world-character-entity/behavior/tick.ts` 수준 호출 테스트로 개선한다.
- [ ] tick 파이프라인 순서(행동 선정 -> 타깃 탐색 -> 큐 enqueue/dequeue -> 시스템 액션 -> next/clear)를 테스트로 고정한다.
- [ ] 큐 상태(`enqueuing/ready/action-ready/action-running/action-completed/completed`) 전이 충돌이 없는지 tick.ts 기준으로 검증한다.

### 4) 기존 spec 회귀 강화

- [ ] `tick-enqueue-interaction-queue.spec.ts` 회귀 케이스를 정리/보강한다.
- [ ] `tick-dequeue-interaction.spec.ts` 회귀 케이스를 정리/보강한다.
- [ ] `tick-action-system-item-pick.spec.ts`에서 시작 조건/완료 조건/부작용 경계를 명확히 고정한다.

### 5) 명세-테스트 정합성 정리

- [ ] 각 tick 파일 상단 명세 체크리스트와 spec `it` 이름을 1:1로 맞춘다.
- [ ] 명세 계층과 describe 계층을 동일하게 정리한다.
- [ ] 변경된 명세는 해당 테스트가 먼저 추가된 후 구현하도록 절차를 고정한다.

## 완료 기준

- [ ] `world-character-entity/behavior/*.spec.ts`가 결과/상태 전이 중심으로 재구성된다.
- [ ] `tick.ts` 수준의 파이프라인 테스트가 추가되어 주요 흐름이 보장된다.
- [ ] hooks fixture 인프라(`hooks/fixture/index.ts` + 시나리오 파일)가 동작한다.
- [ ] `pnpm test:unit` 통과
- [ ] `pnpm check` 통과

## 참고

- Vitest timer mocking: https://vitest.dev/guide/mocking/timers.html
