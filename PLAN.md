# Plan

## Refactoring

### Rename tickWorldCharacterNeeds to tickDecreaseNeedsOrConditions
- [ ] `src/lib/components/app/world/entities/world-character-entity/tick-world-character-needs.ts` 파일명 및 함수명 변경
- [ ] `src/lib/components/app/world/entities/world-character-entity/world-character-entity.svelte.ts`에서 import 및 호출 업데이트

### Refactor behavior tick flow - 액션 통합 및 플로우 단순화
**목표**: actions/completion/interaction-chain 디렉토리 제거하고 tick 메서드로 통합

#### 핵심 규칙
1. **tick.ts는 판단 로직 없음**: 모든 판단은 각 `tickXXX` 메서드 내부에서 수행
2. **반환값 규칙 통일**: 모든 `tickXXX` 메서드는 동일한 반환값 규칙 준수
   - `true`: 행동 실행 중단 (이후 tick 메서드 실행 안 함)
   - `false`: 행동 실행 계속 진행 (다음 tick 메서드로 진행)

#### 새로운 플로우
```typescript
if (this.tickInitialize(tick)) return;
if (this.tickIdle(tick)) return;
if (this.tickFindAndGo(tick)) return;
if (this.tickActionSystemPre(tick)) return;         // 시스템 행동 전처리 (아이템 줍기 등)
if (this.tickActionFulfillItemUse(tick)) return;    // 아이템 사용 인터렉션
if (this.tickActionFulfillBuildingUse(tick)) return; // 건물 사용 인터렉션
if (this.tickActionFulfillCharacterUse(tick)) return; // 캐릭터 사용 인터렉션
// ... 추가 인터렉션 타입
if (this.tickActionSystemPost(tick)) return;        // 시스템 행동 후처리 (아이템 놓기 등)
this.tickCompletion(tick);                          // 항상 실행 (완료 체크 및 전환)
```

- 각 tick 메서드는 자신의 인터렉션 타입이 아니면 `false` 반환하여 다음 메서드로 진행
- `tickCompletion`은 항상 실행되며 반환값 없음 (매 tick마다 완료 조건 체크)

#### 작업 목록
- [ ] `tick-idle.ts` 생성
  - idle 행동이면 `actions/execute-idle.ts` 로직 실행하고 `true` 반환
  - idle이 아니면 `false` 반환

- [ ] `tick-action-system-pre.ts` 생성
  - **아이템 줍기 인터렉션 진행**
  - 타겟 엔티티가 아이템이고 아직 들고 있지 않은 경우
  - 줍기 인터렉션 실행 → 완료 시:
    - 아이템 바디 removeFromWorld
    - 캐릭터 heldItems에 추가
  - 이미 들고 있으면 skip

- [ ] `tick-action-fulfill-item-use.ts` 생성
  - **아이템 사용 인터렉션 진행**
  - `fulfill_interaction_type === 'use_item'`인 경우만 처리
  - 들고 있는 아이템에 타겟 엔티티가 있을 경우 사용 인터렉션 실행
  - 사용 인터렉션 진행 중 need_fulfilments, condition_fulfillments 실행
  - 해당 타입이 아니면 `false` 반환

- [ ] `tick-action-fulfill-building-use.ts` 생성 (향후 구현)
  - `fulfill_interaction_type === 'use_building'`인 경우 처리

- [ ] `tick-action-fulfill-character-use.ts` 생성 (향후 구현)
  - `fulfill_interaction_type === 'use_character'`인 경우 처리

- [ ] `tick-action-system-post.ts` 생성
  - **아이템 제거**
  - 사용 인터렉션이 완료된 경우 heldItems에서 제거

- [ ] `tick-completion.ts` 생성
  - 반환값 없음 (void), 항상 실행됨
  - 매 tick마다 2단계 완료 체크:

    **1단계: 인터렉션 체인 완료 체크** (`interactionTargetId` 있는 경우)
    - `interactionTargetStartTick` 기준으로 완료 조건 확인
    - 완료 시 → 다음 인터렉션 액션으로 전환 (`interactionTargetId` 업데이트)
    - 인터렉션 체인 끝 → `interactionTargetId = undefined`

    **2단계: 행동 액션 완료 체크** (인터렉션 체인 없거나 끝난 경우)
    - `behaviorTargetStartTick` 기준으로 완료 조건 확인:
      - FULFILL: 욕구/컨디션 충족 여부
      - IDLE: idle_duration_ticks 경과
      - ONCE: (인터렉션 체인으로 이미 처리됨)
    - 완료 시 → 다음 행동 액션으로 전환 (`behaviorTargetId` 업데이트)
    - 행동 끝 → `behaviorTargetId = undefined`

  - `completion/check-completion.ts` 로직 통합
  - `completion/transition.ts` 로직 통합

- [ ] `tick-find-and-go.ts` 수정
  - idle 체크 제거 (line 25-26)

- [ ] `tick.ts` 수정
  - 새로운 플로우로 업데이트

- [ ] 파일 및 디렉토리 제거
  - `tick-behavior-action.ts` 삭제
  - `actions/` 디렉토리 전체 삭제
  - `completion/` 디렉토리 전체 삭제
  - `interaction-chain/` 디렉토리 전체 삭제

