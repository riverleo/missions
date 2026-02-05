# Plan

## 완료된 작업 ✅

### Phase 1: Tick Flow 리팩토링 (완료)
- ✅ 7단계 tick 파이프라인 구조 완성
- ✅ actions/completion/interaction-chain 디렉토리 제거
- ✅ tickDecreaseNeeds 리네이밍 및 인스턴스 메서드화
- ✅ WorldCharacterEntityBehavior 메서드 바인딩 간소화

---

## 완료된 작업 ✅ (계속)

### Phase 2: 인터렉션 체이닝 구현 (완료)

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

**1. tickCompletion - 인터렉션 체이닝 로직 구현** ✅
- [x] `interactionTargetId`가 있을 때:
  - 현재 인터렉션 액션의 `duration_ticks` 확인
  - `interactionTargetStartTick` 기준으로 경과 시간 계산
  - 완료 시 `next_*_interaction_action_id`로 전환
  - 체인 끝나면 `interactionTargetId = undefined`
- [x] 인터렉션 액션 타입별 처리:
  - 타입별로 다른 next 필드 사용 (building/item/character)
- [x] 다음 인터렉션으로 전환 시 `interactionTargetStartTick` 업데이트

**2. tickActionFulfillItemUse - 아이템 사용 구현** ✅
- [x] 인터렉션 체인 시작:
  - 들고 있는 아이템 확인 (heldItems)
  - 아이템의 item_interaction_id로 interaction 가져오기
  - root action으로 `interactionTargetId` 설정
  - `interactionTargetStartTick = tick` 설정
- [x] need_fulfilments 실행:
  - 매 tick마다 욕구 증가
  - `increase_per_tick` 값 적용 (max 100)
- [ ] condition_fulfillments 실행 (향후):
  - 건물 컨디션 증가

**3. tickActionSystemPost - 아이템 제거** ✅
- [x] 인터렉션 체인 완료 체크:
  - `interactionTargetId === undefined` 확인
  - fulfill 타입 + item interaction 확인
- [x] 완료 시 아이템 제거:
  - heldItems에서 pop
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

### 인터렉션 타입 확장
- [ ] tickActionFulfillBuildingUse 구현
- [ ] tickActionFulfillCharacterUse 구현
- [ ] ONCE 타입 인터렉션 지원
- [ ] 에러 처리 및 예외 상황 대응

### State 조회 함수 리팩토링
**목표**: 컴포넌트의 복잡한 state 조회 로직을 훅으로 이동

- [ ] `useItem`에 `getItemState(worldItemId)` 추가
  - WorldItemId를 받아서 현재 조건에 맞는 ItemState 반환
  - 조건 판단 로직 포함 (idle, use 등)
  - world-character-entity-renderer의 heldItemState 로직 단순화

- [ ] `useCharacter`에 `getCharacterState(worldCharacterId)` 추가 (향후)
  - WorldCharacterId를 받아서 현재 조건에 맞는 CharacterState 반환

- [ ] `useBuilding`에 `getBuildingState(worldBuildingId)` 추가 (향후)
  - WorldBuildingId를 받아서 현재 조건에 맞는 BuildingState 반환

**이점:**
- 컴포넌트 코드 간소화
- State 조회 로직 재사용 가능
- 일관된 패턴 유지
