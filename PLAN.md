# Plan

## 완료된 작업 ✅

### Phase 1: Tick Flow 리팩토링 (완료)
- ✅ 7단계 tick 파이프라인 구조 완성
- ✅ actions/completion/interaction-chain 디렉토리 제거
- ✅ tickDecreaseNeeds 리네이밍 및 인스턴스 메서드화
- ✅ WorldCharacterEntityBehavior 메서드 바인딩 간소화

---

## 진행 중인 작업 🚧

### Phase 2: 인터렉션 체이닝 구현

#### 현재 상태
```typescript
// 7단계 tick 파이프라인 (구현 완료)
if (this.tickInitialize(tick)) return;           // ✅ 구현 완료
if (this.tickIdle(tick)) return;                 // ✅ 구현 완료
if (this.tickFindAndGo(tick)) return;            // ✅ 구현 완료
if (this.tickActionSystemPre(tick)) return;      // ✅ 아이템 줍기 구현
if (this.tickActionFulfillItemUse(tick)) return; // ⏳ TODO
if (this.tickActionSystemPost(tick)) return;     // ⏳ TODO
this.tickCompletion(tick);                       // ⏳ 부분 구현 (인터렉션 체이닝 누락)
```

#### 작업 목록

**1. tickCompletion - 인터렉션 체이닝 로직 구현**
- [ ] `interactionTargetId`가 있을 때:
  - 현재 인터렉션 액션의 `duration_ticks` 확인
  - `interactionTargetStartTick` 기준으로 경과 시간 계산
  - 완료 시 `next_interaction_action_id`로 전환
  - 체인 끝나면 `interactionTargetId = undefined`
- [ ] 인터렉션 액션 타입별 처리:
  - `item_pick`: 즉시 완료 (duration 0)
  - `item_use`, `building_use` 등: duration_ticks 대기
- [ ] 다음 인터렉션으로 전환 시 `interactionTargetStartTick` 업데이트

**2. tickActionFulfillItemUse - 아이템 사용 구현**
- [ ] 인터렉션 체인 시작:
  - 들고 있는 아이템 확인 (heldItems)
  - 아이템의 interaction 가져오기
  - 첫 번째 interaction_action으로 `interactionTargetId` 설정
  - `interactionTargetStartTick = tick` 설정
- [ ] need_fulfilments 실행:
  - 매 tick마다 욕구 증가
  - `increase_per_tick` 값 적용
- [ ] condition_fulfillments 실행 (향후):
  - 건물 컨디션 증가

**3. tickActionSystemPost - 아이템 제거**
- [ ] 인터렉션 체인 완료 체크:
  - `interactionTargetId === undefined` 확인
  - 이전 tick에 인터렉션이 있었는지 추적
- [ ] 완료 시 아이템 제거:
  - heldItems에서 제거
  - worldItem의 world_character_id = null

---

## 구현 순서

### Step 1: tickCompletion 인터렉션 체이닝 (우선순위 높음)
인터렉션 체인이 동작해야 나머지 로직이 의미가 있음

### Step 2: tickActionFulfillItemUse 구현
아이템 사용 + need fulfillments

### Step 3: tickActionSystemPost 구현
아이템 제거 로직

### Step 4: 테스트 및 검증
실제 게임에서 동작 확인

---

## 참고: 인터렉션 체이닝 플로우

```
[tickActionFulfillItemUse]
  ↓ interactionTargetId 설정 (첫 번째 action)
  ↓ interactionTargetStartTick = tick

[tickCompletion - 매 tick]
  ↓ interactionTargetId 있음?
  ↓ duration_ticks 경과 확인
  ↓ 완료 시:
    - next_interaction_action_id로 전환
    - 또는 interactionTargetId = undefined (체인 끝)

[tickActionSystemPost]
  ↓ interactionTargetId === undefined?
  ↓ 이전에 인터렉션이 있었음?
  ↓ heldItems에서 아이템 제거
```

---

## 향후 작업 (Phase 3)

- [ ] tickActionFulfillBuildingUse 구현
- [ ] tickActionFulfillCharacterUse 구현
- [ ] ONCE 타입 인터렉션 지원
- [ ] 에러 처리 및 예외 상황 대응
