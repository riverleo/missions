# 캐릭터 이동 및 사용 행동 완성

## 목표
캐릭터가 **아이템 또는 건물로 이동하고 사용하는 것까지** 완성하는 것이 현재 목표입니다.

나머지 행동들(건설, 철거, 수리, 청소 등)은 이 기본 구조가 잡힌 후에 하나씩 추가해 나갈 예정입니다.

## 핵심 설계: Once/Repeat 상호작용의 욕구 충족 통합

### 문제점
- **repeat 상호작용 (fulfill 타입)**: 매 틱마다 increase_per_tick 적용 → ✅ 정상 작동
- **once 상호작용 (interact 타입)**: fulfillment를 참조하지 않음 → ❌ 욕구 충족 불가

하지만 once 상호작용도 욕구를 채워야 하는 경우가 있습니다:
- 예: "라면 사용" (item_use, once) - 먹으면서 배고픔을 채움
- 예: "간이 식당 사용" (building_execute, once) - 식사로 배고픔 충족

### 해결 방안: InteractionAction 체인 실행 중 매 틱마다 적용

**핵심 아이디어:**
- InteractionAction 체인의 duration_ticks 합계 = 작업 지속 시간
- 예: "라면 먹기" 체인 = 뚜껑 열기(10틱) + 먹기(30틱) + 마무리(5틱) = 총 45틱
- 이 45틱 동안 매 틱마다 increase_per_tick 적용

**구현:**
```typescript
// executeInteractAction 수정:
if (entity.currentInteractionActionId) {
  // 체인 실행 중
  tickInteractionAction(entity, interaction, currentTick);

  // 매 틱마다 fulfillment 적용 (once도 동일)
  if (action.need_fulfillment_id) {
    const fulfillment = needFulfillmentStore[action.need_fulfillment_id];
    need.value += fulfillment.increase_per_tick;
  }
}
```

**장점:**
- 추가 필드 불필요
- once/repeat 모두 increase_per_tick 사용 (일관성)
- 애니메이션 시간 = 욕구 충족 시간 (자연스러움)

**필요한 변경:**
- interact 타입 BehaviorAction에 need_fulfillment_id 필드 추가
- 또는 Interaction이 직접 fulfillment 참조하도록 수정

## 구현 계획

### Phase 1: Interaction-Fulfillment 연결 방식 결정

**옵션 A: BehaviorAction에 need_fulfillment_id 추가**
```sql
-- need_behavior_actions에 이미 need_fulfillment_id 있음 ✅
-- interact 타입에서도 사용 가능
```
- 장점: 이미 필드 존재, 추가 작업 불필요
- 단점: BehaviorAction 레벨에서 관리

**옵션 B: Interaction이 Fulfillment 직접 참조**
```sql
ALTER TABLE building_interactions
  ADD COLUMN need_fulfillment_id uuid REFERENCES need_fulfillments(id);
-- item_interactions, character_interactions도 동일
```
- 장점: Interaction 레벨에서 관리, 재사용성
- 단점: DB 스키마 변경 필요

### Phase 2: executeInteractAction 수정
1. 현재 위치: `tick-behavior.ts:217`
2. 수정 내용:
   ```typescript
   // InteractionAction 체인 실행 중
   if (entity.currentInteractionActionId) {
     tickInteractionAction(entity, interaction, currentTick);

     // 매 틱마다 fulfillment 적용 (옵션 A 또는 B에 따라)
     const fulfillment = getFulfillment(action or interaction);
     if (fulfillment) {
       const needId = fulfillment.need_id;
       const currentNeed = entity.worldCharacterNeeds[needId];
       if (currentNeed && fulfillment.increase_per_tick) {
         const newValue = Math.min(100, currentNeed.value + fulfillment.increase_per_tick);
         entity.worldCharacterNeeds = {
           ...entity.worldCharacterNeeds,
           [needId]: { ...currentNeed, value: newValue }
         };
       }
     }
   }
   ```

### Phase 3: Admin UI 업데이트
- Interaction 생성/수정 시 Fulfillment 선택 UI 추가 (옵션 B의 경우)
- 또는 BehaviorAction 생성 시 fulfillment 선택 (옵션 A의 경우)

### Phase 4: 테스트
1. **item_use 테스트**:
   - "라면 사용" 상호작용 설정
   - Fulfillment: 배고픔 increase_per_tick=2
   - InteractionAction 체인: 총 30틱
   - 예상 결과: 배고픔 +60 증가

2. **building_execute 테스트**:
   - "간이 식당 사용" 상호작용 설정
   - Fulfillment: 배고픔 increase_per_tick=3
   - InteractionAction 체인: 총 20틱
   - 예상 결과: 배고픔 +60 증가

## 향후 추가할 행동들

이 기본 구조가 완성된 후 하나씩 추가할 항목들:

### 건물 관련
1. **building_construct**: 건물 건설
2. **building_demolish**: 건물 철거

### 컨디션 관련
1. **building_repair**: 건물 수리 (Condition Behavior)
2. **building_clean**: 건물 청소 (Condition Behavior)
3. **Condition Behavior 선택 로직**: 건물 상태에 따라 수리/청소 행동 발동

### 캐릭터 상호작용
1. **character_hug**: 캐릭터 포옹 (repeat)

## 현재 상태

### 완료된 것
- ✅ Behavior-Interaction 시스템 재설계
- ✅ once/repeat 타입 분리 (DB 스키마 완료)
- ✅ InteractionAction 체인 시스템 구현
- ✅ go, idle 타입 완료
- ✅ interact 타입: item_pick 완료
- ✅ fulfill 타입: Need용 반복 로직 완료

### 진행 중 (이번 목표)
- 🚧 Interaction-Fulfillment 연결 방식 결정 (옵션 A vs B)
- 🚧 executeInteractAction에 욕구 충족 로직 추가
- 🚧 item_use 완성
- 🚧 building_execute 완성

### 미구현 (향후 추가)
- ❌ building_construct (건물 건설)
- ❌ building_demolish (건물 철거)
- ❌ Condition Behavior 시스템 전체
  - Condition 체크 로직
  - building_repair (수리)
  - building_clean (청소)
- ❌ character_hug (캐릭터 포옹)

## 주요 파일

### 수정 필요 파일
1. **tick-behavior.ts**
   - `executeInteractAction()`: 욕구 충족 로직 추가
   - 위치: `src/lib/components/app/world/entities/world-character-entity/tick-behavior.ts:217`

2. **DB 스키마** (옵션 B 선택 시)
   - `building_interactions`, `item_interactions`, `character_interactions`
   - need_fulfillment_id 컬럼 추가

3. **Admin UI** (옵션에 따라)
   - BehaviorAction 패널: fulfillment 선택 UI
   - 또는 Interaction 패널: fulfillment 선택 UI

### 참고 파일
- `executeFulfillAction()`: 이미 구현된 repeat 로직 참고
- 위치: `tick-behavior.ts:354`

---

## [향후 작업] SvelteFlow 패널 저장 후 유지

### 문제
현재 모든 커스텀 SvelteFlow 패널에서 저장을 누르면 패널이 화면에서 사라짐.
계속 사용하기 불편하므로, 저장 후에도 패널이 화면에 계속 보이도록 수정 필요.

### 수정 대상 패널 목록

#### Behavior 관련 (5개)
- [ ] `behavior-priority/behavior-priority-panel.svelte`
- [ ] `need-behavior/need-behavior-action-node-panel.svelte`
- [ ] `need-behavior/need-behavior-action-panel.svelte`
- [ ] `condition-behavior/condition-behavior-action-node-panel.svelte`
- [ ] `condition-behavior/condition-behavior-action-panel.svelte`

#### Interaction 관련 (9개)
- [ ] `building-interaction/building-interaction-action-node-panel.svelte`
- [ ] `building-interaction/building-interaction-action-panel.svelte`
- [ ] `building-interaction/building-interaction-panel.svelte`
- [ ] `item-interaction/item-interaction-action-node-panel.svelte`
- [ ] `item-interaction/item-interaction-action-panel.svelte`
- [ ] `item-interaction/item-interaction-panel.svelte`
- [ ] `character-interaction/character-interaction-action-node-panel.svelte`
- [ ] `character-interaction/character-interaction-action-panel.svelte`
- [ ] `character-interaction/character-interaction-panel.svelte`

#### Need/Condition 관련 (8개)
- [ ] `need/need-action-panel.svelte`
- [ ] `need/need-character-edge-panel.svelte`
- [ ] `need/need-fulfillment-node-panel.svelte`
- [ ] `need/need-node-panel.svelte`
- [ ] `condition/condition-action-panel.svelte`
- [ ] `condition/condition-building-edge-panel.svelte`
- [ ] `condition/condition-effect-node-panel.svelte`
- [ ] `condition/condition-fulfillment-node-panel.svelte`
- [ ] `condition/condition-node-panel.svelte`

#### Entity 관련 (5개)
- [ ] `building/building-action-panel.svelte`
- [ ] `item/item-action-panel.svelte`
- [ ] `character/character-action-panel.svelte`
- [ ] `character-body/character-body-action-panel.svelte`
- [ ] `terrain/terrain-action-panel.svelte`

#### Quest/Narrative 관련 (5개)
- [ ] `chapter/chapter-action-panel.svelte`
- [ ] `chapter/chapter-node-panel.svelte`
- [ ] `quest/quest-action-panel.svelte`
- [ ] `quest/quest-branch-node-panel.svelte`
- [ ] `narrative/narrative-action-panel.svelte`
- [ ] `narrative/narrative-dice-roll-node-panel.svelte`
- [ ] `narrative/narrative-node-panel.svelte`

#### 기타 (3개)
- [ ] `terrains-tiles/terrain-tile-edge-panel.svelte`
- [ ] `test-world/test-world-command-panel.svelte`
- [ ] `test-world/test-world-inspector-panel/test-world-inspector-panel.svelte`

**총 35개 패널**

---

## [향후 작업] Command 컴포넌트 중복 라벨 문제 수정

### 문제
CommandLinkItem/CommandItem은 `value` prop으로 아이템을 식별하는데, 같은 라벨을 가진 아이템들이 모두 선택된 것처럼 보이는 문제가 있습니다.

### 해결 방법
라벨에 ID의 첫 부분을 추가하여 고유하게 만들기:
```typescript
const shortId = item.id.split('-')[0];
return `${label} (${shortId})`;
```

### 수정 대상 Command 목록 (16개)

#### Behavior 관련 (3개)
- [ ] `behavior-priority/behavior-priority-command.svelte`
- [ ] `need-behavior/need-behavior-command.svelte`
- [ ] `condition-behavior/condition-behavior-command.svelte`

#### Interaction 관련 (3개)
- [x] `building-interaction/building-interaction-command.svelte` ✅ 완료
- [ ] `item-interaction/item-interaction-command.svelte`
- [ ] `character-interaction/character-interaction-command.svelte`

#### Need/Condition 관련 (2개)
- [ ] `need/need-command.svelte`
- [ ] `condition/condition-command.svelte`

#### Entity 관련 (6개)
- [ ] `building/building-command.svelte`
- [ ] `item/item-command.svelte`
- [ ] `character/character-command.svelte`
- [ ] `character-body/character-body-command.svelte`
- [ ] `terrain/terrain-command.svelte`
- [ ] `tile/tile-command.svelte`

#### Quest/Narrative 관련 (2개)
- [ ] `quest/quest-command.svelte`
- [ ] `narrative/narrative-command.svelte`

**총 16개 command (1개 완료, 15개 남음)**
