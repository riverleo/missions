# Plan - Behavior State 재작성

## 🎯 목표

**핵심**: 명세 기반 개발로 behavior-state의 안정성 확보

### 발생한 문제
1. **사이드 이펙트**: 수정마다 예상치 못한 부작용 발생
2. **게임 로직 이해 부족**: 게임이 어떻게 동작하는지 명확히 이해하지 못한 채 코드 작성
3. **명세 부재**: 함수가 무엇을 해야 하는지 정의되지 않은 상태로 작업

### 근본 해결책
1. **테스트 코드 작성**: behavior-state 함수들의 명세를 테스트로 프리징
2. **명세 우선 작성**: 각 함수의 주석에 상세한 명세 작성
3. **기존 코드 백업**: 참고용으로 보관하고 명세부터 재작성

---

## 📋 현재 구조 분석

### behavior-state 디렉토리 구조
```
behavior-state/
├── index.ts
├── world-character-entity-behavior.svelte.ts  # 메인 클래스
├── tick.ts                                    # 메인 틱 함수 (6단계 플로우)
├── update.ts                                  # 업데이트 함수
├── update-move.ts                             # 이동 업데이트
├── update-direction.ts                        # 방향 업데이트
├── tick-find-behavior-target.ts               # 1. 행동 타겟 찾기
├── tick-wait-if-idle.ts                       # 2. idle 대기
├── tick-find-and-go.ts                        # 3. 엔티티 타겟 찾기 및 이동
├── tick-action-if-system-item-pick.ts         # 4. 시스템 아이템 줍기
├── tick-action-if-once-item-use.ts            # 5. once 타입 아이템 사용
├── tick-action-fulfill-item-use.ts            # (사용 안 됨?)
├── tick-action-system-post.ts                 # (사용 안 됨?)
└── tick-next-or-clear.ts                      # 6. 다음 행동 또는 종료
```

### WorldCharacterEntityBehavior 클래스 상태 필드
```typescript
class WorldCharacterEntityBehavior {
  // 기본 정보
  worldCharacterEntity: WorldCharacterEntity;

  // 이동 관련
  path: Vector[];                              // 목표 지점까지의 경로
  direction: WorldCharacterEntityDirection;    // 현재 바라보는 방향

  // 행동 타겟 (행동의 전체 목표)
  behaviorTargetId: BehaviorTargetId | undefined;      // 현재 실행 중인 행동 액션
  behaviorTargetStartTick: number | undefined;         // 행동 시작 틱

  // 엔티티 타겟 (이동 대상)
  targetEntityId: EntityId | undefined;        // 이동할 타겟 엔티티

  // 인터렉션 타겟 (인터렉션 체인)
  interactionTargetId: InteractionTargetId | undefined;  // 현재 실행 중인 인터렉션 액션
  interactionTargetStartTick: number | undefined;        // 인터렉션 시작 틱

  // 행동 목록
  behaviors: Behavior[];                       // 우선순위 정렬된 행동 목록
}
```

### 6단계 틱 플로우 (tick.ts)
```typescript
1. tickFindBehaviorTarget()    - 행동 타겟 찾기 (behaviorTargetId 할당)
2. tickWaitIfIdle()            - idle 타입인 경우 대기 처리
3. tickFindAndGo()             - 엔티티 타겟 찾기 및 이동 (targetEntityId 할당)
4. tickActionIfSystemItemPick() - 시스템 아이템 줍기인 경우 실행
5. tickActionIfOnceItemUse()   - once 타입 아이템 사용인 경우 실행
6. tickNextOrClear()           - 다음 행동 액션 전환 또는 행동 종료 (항상 실행)
```

각 함수는 `true`를 반환하면 플로우 중단, `false`를 반환하면 다음 함수로 진행.
단, `tickNextOrClear()`는 항상 실행됨 (void 반환).

---

## 🎮 게임 동작 명세

### 용어 정의

**1. Behavior (행동)**
- 캐릭터가 수행하는 전체 목표 (예: "배고픔 해결하기", "집 짓기")
- Need 또는 Condition에 의해 트리거됨
- 여러 BehaviorAction으로 구성됨

**2. BehaviorAction (행동 액션)**
- Behavior를 구성하는 개별 단계
- 타입: `once`, `fulfill`, `idle`
- 예: "아이템 찾아가기" → "아이템 줍기" → "아이템 사용하기"

**3. BehaviorTarget (행동 타겟)**
- 현재 실행 중인 BehaviorAction
- `behaviorTargetId`: BehaviorAction을 식별하는 ID
- 하나의 BehaviorAction이 완료되면 다음 BehaviorAction으로 전환

**4. EntityTarget (엔티티 타겟)**
- BehaviorAction 수행을 위해 이동해야 할 월드 엔티티
- `targetEntityId`: 타겟 엔티티의 ID
- 타겟에 도착하면 인터렉션 실행

**5. InteractionTarget (인터렉션 타겟)**
- 엔티티와 상호작용하는 애니메이션/효과 체인
- `interactionTargetId`: 현재 실행 중인 InteractionAction ID
- 인터렉션 체인이 완료되면 행동 액션 완료

**6. Target Selection Method (타겟 선택 방식)**
- `explicit`: 명시적으로 지정된 인터렉션 사용 (예: 특정 아이템만 사용)
- `search`: 조건에 맞는 엔티티 자동 탐색 (예: 모든 음식 아이템 중 가장 가까운 것)

**7. Interaction Types (인터렉션 타입)**
- `system_interaction_type: 'item_pick'`: 아이템 줍기 (시스템이 자동 실행)
- `once_interaction_type: 'item_*'`: 한 번 사용하고 제거 (예: 음식 먹기)
- `fulfill_interaction_type: 'item_*'`: 반복 사용 가능 (예: 침대에서 자기)

### 행동 실행 플로우 예시

#### 예시 1: "배고픔 해결" (음식 먹기)

1. **tickFindBehaviorTarget**: 우선순위가 가장 높은 행동 찾기
   - 캐릭터의 needs 중 `hunger`가 임계값 이하
   - `NeedBehavior`의 root `BehaviorAction` 선택: "음식 아이템 찾기"
   - `behaviorTargetId` 할당

2. **tickWaitIfIdle**: 현재 행동이 idle이 아니므로 skip

3. **tickFindAndGo**: 음식 아이템 찾아서 이동
   - `search` 방식으로 음식 아이템 엔티티 탐색
   - 가장 가까운 음식 선택 → `targetEntityId` 할당
   - 경로 탐색 (pathfinding) → `path` 할당
   - 도착할 때까지 매 틱마다 이동

4. **tickActionIfSystemItemPick**: 음식 아이템 줍기
   - `system_interaction_type: 'item_pick'` 인터렉션 실행
   - 줍기 인터렉션 체인 완료 후 `heldItemIds`에 추가
   - 월드에서 아이템 엔티티 제거

5. **tickActionIfOnceItemUse**: 음식 아이템 사용
   - `once_interaction_type: 'item_eat'` 인터렉션 실행
   - 매 틱마다 `need_fulfillments`에 따라 `hunger` 증가
   - 인터렉션 체인 완료 후 `heldItemIds`에서 제거
   - 스토어에서 아이템 완전히 삭제

6. **tickNextOrClear**: 다음 행동 액션으로 전환 또는 종료
   - 다음 BehaviorAction이 있으면 전환
   - 없으면 행동 완전히 종료 (모든 상태 초기화)

#### 예시 2: "idle 행동" (대기)

1. **tickFindBehaviorTarget**: idle 행동 선택
   - 다른 긴급한 행동이 없을 때
   - `behaviorTargetId` 할당

2. **tickWaitIfIdle**: idle 대기 시간 체크
   - `idle_duration_ticks`만큼 대기
   - 시간이 남았으면 `true` 반환 (플로우 중단)
   - 시간이 완료되면 `false` 반환 (다음 단계 진행)

3. **tickFindAndGo**: idle은 타겟이 없으므로 skip

4. **tickActionIfSystemItemPick**: skip

5. **tickActionIfOnceItemUse**: skip

6. **tickNextOrClear**: 다음 행동으로 전환

### 핵심 동작 규칙

**규칙 1: 행동 우선순위**
- 매 틱마다 `behaviorTargetId`가 없으면 우선순위 재계산
- Need/Condition의 긴급도에 따라 행동 전환

**규칙 2: 상태 초기화 타이밍**
- `clear()`: 모든 상태 초기화 (행동 완전히 종료)
- `clearTargetEntity()`: 타겟 엔티티만 초기화 (경로도 함께)
- `clearInteractionTarget()`: 인터렉션만 초기화

**규칙 3: 틱 함수 반환값**
- `true`: 행동 실행 중단 (이번 틱 종료)
- `false`: 다음 함수로 진행
- `void`: 항상 실행 (tickNextOrClear)

**규칙 4: 인터렉션 체인**
- InteractionAction은 여러 단계로 구성 (root → next → next → ...)
- 각 InteractionAction은 `duration_ticks` 동안 실행
- 완료 후 다음 InteractionAction으로 전환 또는 종료

**규칙 5: 아이템 관리**
- `heldItemIds`: 캐릭터가 들고 있는 아이템 엔티티 ID 목록
- 줍기: 월드 엔티티 제거 → heldItemIds 추가 → worldItem.world_character_id 업데이트
- 사용: heldItemIds 제거 → worldItem 스토어에서 삭제

---

## 🚨 기존 코드의 문제점

### 문제 1: tick-action-fulfill-item-use.ts
- **현재 상태**: tick.ts에서 호출되지 않음
- **문제**: fulfill 타입 처리가 누락됨
- **영향**: fulfill 타입 행동이 제대로 동작하지 않음

### 문제 2: tick-action-system-post.ts
- **현재 상태**: tick.ts에서 호출되지 않음
- **문제**: once 타입 아이템 제거가 tick-action-if-once-item-use.ts에서 중복 처리됨
- **영향**: 코드 중복 및 혼란

### 문제 3: tick-find-and-go.ts
- **문제**: 너무 많은 책임 (타겟 찾기 + 경로 설정 + 도착 체크)
- **영향**: 로직이 복잡하고 디버깅 어려움

### 문제 4: tick-action-if-once-item-use.ts
- **문제**: 인터렉션 체인 진행과 아이템 제거가 하나의 함수에 섞임
- **영향**: 사이드 이펙트 추적 어려움

### 문제 5: 명세 부재
- **문제**: 각 함수가 언제 호출되고, 무엇을 해야 하는지 불명확
- **영향**: 수정 시 의도치 않은 부작용 발생

---

## ✅ 작업 계획

### Phase 1: 게임 동작 명세 작성 ✅
- [x] 용어 정의 (Behavior, BehaviorAction, Target 등)
- [x] 행동 실행 플로우 예시 작성
- [x] 핵심 동작 규칙 정리
- [x] 기존 코드 문제점 분석

### Phase 2: 함수별 명세 작성 (주석)
각 tick-* 함수에 대해 다음을 작성:
1. **목적**: 이 함수가 해결하는 문제
2. **사전 조건**: 호출되기 전 상태
3. **처리 로직**: 단계별 동작
4. **사후 조건**: 호출 후 상태
5. **반환값**: true/false/void의 의미
6. **부작용**: 어떤 상태를 변경하는지

**작업 순서**:
- [ ] tick-find-behavior-target.ts
- [ ] tick-wait-if-idle.ts
- [ ] tick-find-and-go.ts
- [ ] tick-action-if-system-item-pick.ts
- [ ] tick-action-if-once-item-use.ts
- [ ] tick-next-or-clear.ts
- [ ] tick-action-fulfill-item-use.ts (재활성화 검토)
- [ ] tick-action-system-post.ts (재활성화 검토)

### Phase 3: 테스트 코드 작성
각 함수에 대한 단위 테스트 작성:
- [ ] 테스트 환경 설정 (Vitest)
- [ ] Mock 객체 생성 (WorldCharacterEntity, stores 등)
- [ ] tick-find-behavior-target.test.ts
- [ ] tick-wait-if-idle.test.ts
- [ ] tick-find-and-go.test.ts
- [ ] tick-action-if-system-item-pick.test.ts
- [ ] tick-action-if-once-item-use.test.ts
- [ ] tick-next-or-clear.test.ts

**테스트 시나리오 예시**:
```typescript
describe('tickFindBehaviorTarget', () => {
  test('behaviorTargetId가 없으면 우선순위가 가장 높은 행동 선택', () => {
    // Given: behaviorTargetId가 undefined
    // When: tickFindBehaviorTarget 호출
    // Then: behaviorTargetId가 할당됨, behaviorTargetStartTick이 현재 틱으로 설정됨
  });

  test('behaviorTargetId가 있으면 아무것도 하지 않음', () => {
    // Given: behaviorTargetId가 이미 할당됨
    // When: tickFindBehaviorTarget 호출
    // Then: 상태 변경 없음, false 반환
  });

  test('행동이 없으면 true 반환 (플로우 중단)', () => {
    // Given: 가능한 행동이 하나도 없음
    // When: tickFindBehaviorTarget 호출
    // Then: clear() 호출됨, true 반환
  });
});
```

### Phase 4: 구현 재작성
명세와 테스트를 기반으로 함수 재작성:
- [ ] 기존 코드 백업 (behavior-state-backup/ 디렉토리)
- [ ] 명세에 맞춰 함수 재작성
- [ ] 테스트 통과 확인
- [ ] 통합 테스트 (실제 게임에서 동작 확인)

### Phase 5: 리팩토링 (선택)
테스트가 통과한 후 구조 개선:
- [ ] tick-find-and-go 분리 검토 (find-target / update-pathfinding)
- [ ] 중복 코드 제거
- [ ] 성능 최적화

---

## 📝 작업 원칙

1. **명세 우선**: 코드 작성 전에 명세를 먼저 작성하고 합의
2. **테스트 기반**: 테스트 작성 후 구현
3. **점진적 개선**: 한 번에 하나의 함수만 수정
4. **커밋 단위**: 함수별로 커밋 (명세 → 테스트 → 구현)
5. **사이드 이펙트 최소화**: 상태 변경을 명시적으로 관리

---

## 🔄 다음 단계

Phase 2부터 시작:
1. 첫 번째 함수 `tick-find-behavior-target.ts`의 상세 명세 작성
2. 명세 검토 및 합의
3. 테스트 코드 작성
4. 구현 재작성

**중요**: 각 단계마다 사용자와 명세를 확인하고 합의한 후 다음 단계로 진행합니다.
