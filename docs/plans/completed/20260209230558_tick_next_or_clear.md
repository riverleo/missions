# Spec 작성: tick-next-or-clear

**목표**: 행동 액션 전환 또는 종료를 처리하는 `tick-next-or-clear` 함수를 Spec-Driven Development 방식으로 구현

**위치**: `src/lib/components/app/world/entities/world-character-entity/behavior-state/tick-next-or-clear.ts`

**기능**: 현재 행동 액션이 완료되었을 때 다음 행동 액션으로 전환하거나, 다음 액션이 없으면 행동을 종료합니다.

---

## 작업 순서

### 1. tick-next-or-clear.ts 명세 작성
- [ ] 함수 주석에 체크리스트 형태 명세 추가
  - [ ] 현재 행동 타깃이 없으면 아무것도 하지 않는다
  - [ ] 현재 행동 액션을 찾을 수 없으면 아무것도 하지 않는다
  - [ ] 경로를 초기화한다
  - [ ] 다음 행동 액션을 조회한다
  - [ ] 다음 행동 액션이 있으면 모든 상태를 초기화하고 다음 액션으로 전환한다
  - [ ] 다음 행동 액션이 없으면 모든 상태를 초기화하여 행동을 종료한다

### 2. 테스트 작성
- [ ] `tick-next-or-clear.spec.ts` 파일 생성
- [ ] 명세에 맞춰 테스트 작성 (describe 구조와 it 이름이 명세와 정확히 일치)
- [ ] 필요한 mock 설정 (useBehavior, BehaviorIdUtils 등)
- [ ] `pnpm test:unit tick-next-or-clear` 검증

### 3. 구현
- [ ] backup 파일 참조하여 함수 구현
- [ ] 명세의 모든 항목 구현
- [ ] 각 명세 항목 체크박스 `[x]` 처리
- [ ] `pnpm test:unit` 전체 검증
- [ ] `pnpm check` 검증

### 4. WorldCharacterEntityBehavior에 통합
- [ ] world-character-entity-behavior.svelte.ts에 함수 import
- [ ] 클래스에 메서드로 추가
- [ ] index.ts에서 export 추가 (필요시)

---

## 완료 조건
- [ ] 함수에 체크리스트 형태 명세 추가됨
- [ ] 모든 명세 항목에 대응하는 테스트 작성됨
- [ ] `pnpm test:unit` 전체 통과
- [ ] `pnpm check` 에러 없음
- [ ] WorldCharacterEntityBehavior 클래스에 통합됨

---

## 참고사항
- 명세 항목 텍스트 = it 이름 (정확히 일치 필수)
- `describe('tickNextOrClear(this: WorldCharacterEntityBehavior, tick: number)', ...)` 형식
- 명세 계층 = describe 계층
- 반환 타입: `void` (항상 실행, 플로우 중단 없음)
- backup 파일 참조: `src/lib/components/app/world/entities/world-character-entity/behavior-state-backup/tick-next-or-clear.ts`

## 핵심 동작
1. 현재 행동 액션 완료 여부와 무관하게 항상 실행됨
2. 경로 초기화 후 다음 액션 확인
3. 다음 액션 있음 → 상태 초기화 후 전환
4. 다음 액션 없음 → 모든 상태 초기화 (행동 종료)
