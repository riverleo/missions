# Spec 작성: tick-find-and-go

**목표**: 타겟 엔티티 탐색 및 경로 설정을 처리하는 `tick-find-and-go` 함수를 Spec-Driven Development 방식으로 구현

**위치**: `src/lib/components/app/world/entities/world-character-entity/behavior-state/tick-find-and-go.ts`

**기능**: 현재 행동에 필요한 타겟 엔티티를 찾고, 해당 타겟까지의 경로를 설정합니다.

**반환 타입**: `boolean` (true = 중단, false = 계속 진행)

---

## 작업 순서

### 1. tick-find-and-go.ts 명세 작성
- [ ] 함수 주석에 체크리스트 형태 명세 추가
  - [ ] 인터렉션이 진행 중이면 계속 진행한다
  - [ ] 현재 행동 타깃이 없으면 계속 진행한다
  - [ ] 행동 타입이 idle이면 계속 진행한다
  - [ ] 타겟 엔티티가 있는 경우
    - [ ] 타겟 엔티티를 찾을 수 없으면 중단한다
    - [ ] 도착 범위 내이면 경로를 초기화하고 계속 진행한다
    - [ ] 도착 범위 밖이면 경로를 최신화하고 중단한다
  - [ ] 타겟 엔티티가 없는 경우
    - [ ] 들고 있는 아이템 중 사용 가능한 것이 있으면 타겟으로 설정하고 계속 진행한다
    - [ ] target_selection_method가 explicit인 경우 entity source로 후보를 필터링한다
    - [ ] target_selection_method가 search인 경우 entity sources로 후보를 필터링한다
    - [ ] 후보가 있으면 가장 가까운 엔티티를 타겟으로 설정하고 중단한다
    - [ ] 후보가 없으면 초기화하고 중단한다

### 2. 테스트 작성
- [ ] `tick-find-and-go.spec.ts` 파일 생성
- [ ] 명세에 맞춰 테스트 작성 (describe 구조와 it 이름이 명세와 정확히 일치)
- [ ] 필요한 mock 설정 (useBehavior, useWorld, useInteraction, pathfinder 등)
- [ ] `pnpm test:unit tick-find-and-go` 검증

### 3. 구현
- [ ] backup 파일 참조하여 함수 구현
- [ ] 명세의 모든 항목 구현
- [ ] 각 명세 항목 체크박스 `[x]` 처리
- [ ] `pnpm test:unit` 전체 검증
- [ ] `pnpm check` 검증

### 4. WorldCharacterEntityBehavior에 통합
- [ ] world-character-entity-behavior.svelte.ts에 함수 import
- [ ] 클래스에 메서드로 추가
- [ ] tick.ts에서 호출 추가
- [ ] index.ts에서 export 추가 (필요시)

---

## 완료 조건
- [ ] 함수에 체크리스트 형태 명세 추가됨
- [ ] 모든 명세 항목에 대응하는 테스트 작성됨
- [ ] `pnpm test:unit` 전체 통과
- [ ] `pnpm check` 에러 없음
- [ ] WorldCharacterEntityBehavior 클래스에 통합됨
- [ ] tick 함수에서 호출됨

---

## 참고사항
- 명세 항목 텍스트 = it 이름 (정확히 일치 필수)
- `describe('tickFindAndGo(this: WorldCharacterEntityBehavior, tick: number)', ...)` 형식
- 명세 계층 = describe 계층
- 반환 타입: `boolean` (true = 중단, false = 계속 진행)
- backup 파일 참조: `src/lib/components/app/world/entities/world-character-entity/behavior-state-backup/tick-find-and-go.ts`

## 핵심 동작
1. **Skip 조건**: 인터렉션 진행 중, 행동 타깃 없음, idle 타입 → 계속 진행 (false)
2. **타겟 있음**: 도착 확인 → 도착하면 경로 초기화 후 계속, 아니면 경로 최신화 후 중단
3. **타겟 없음**:
   - 들고 있는 아이템 중 사용 가능한 것 우선 선택
   - target_selection_method에 따라 후보 필터링 (explicit/search)
   - 가장 가까운 후보를 타겟으로 설정
   - 후보 없으면 행동 종료 (clear)

## 주요 상수
- `TARGET_ARRIVAL_DISTANCE`: 도착 판정 거리 (constants.ts)

## 의존성
- `useBehavior`: getBehaviorAction, searchEntitySources
- `useWorld`: getEntitySourceId, getWorldItem
- `useInteraction`: getInteractionByBehaviorAction
- `worldContext.pathfinder`: findPath
- `worldContext.entities`: 엔티티 목록
- `EntityIdUtils`: instanceId
- `vectorUtils`: getDistance, sortByDistance
