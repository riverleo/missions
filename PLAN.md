# 캐릭터 이동 및 사용 행동 완성

## 목표
캐릭터가 **아이템 또는 건물로 이동하고 사용하는 것까지** 완성하는 것이 현재 목표입니다.

나머지 행동들(건설, 철거, 수리, 청소 등)은 이 기본 구조가 잡힌 후에 하나씩 추가해 나갈 예정입니다.

## 데이터베이스 변경 방침

**중요**: 모든 데이터베이스 스키마 변경은 다음 방식으로 진행합니다:

1. **기존 마이그레이션 수정**: 새 마이그레이션 파일을 만들지 않고 기존 파일을 직접 수정
2. **로컬 DB 리셋**: `pnpm supabase db reset`으로 마이그레이션 재적용
3. **타입 재생성**: `pnpm supabase gen types --lang=typescript --local > src/lib/types/supabase.generated.ts`

이는 개발 초기 단계이며 프로덕션 데이터가 없기 때문입니다. 마이그레이션 히스토리를 깔끔하게 유지할 수 있습니다.

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
CommandShortcut을 사용하여 ID를 오른쪽에 표시 (라벨은 깔끔하게 유지):

```svelte
import { CommandShortcut } from '$lib/components/ui/command';

{#each items as item (item.id)}
  {@const shortId = item.id.split('-')[0]}
  <CommandLinkItem href={...}>
    <IconCheck class={...} />
    <span class="flex-1 truncate">{label}</span>
    <CommandShortcut>{shortId}</CommandShortcut>
    <!-- 드롭다운 메뉴 등 -->
  </CommandLinkItem>
{/each}
```

**장점:**
- 라벨은 깔끔하게 유지 (괄호 없이)
- ID는 오른쪽에 작고 회색으로 표시 (ms-auto, text-muted-foreground)
- 각 아이템이 고유한 textContent를 가져 bits-ui가 올바르게 식별

**주의사항:**
- 불필요한 헬퍼 함수 생성 금지 (템플릿에서 직접 처리)
- `{@const}` 블록으로 필요한 값만 계산

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

---

## [향후 작업] tick-behavior.ts 리팩토링 - 디렉토리 구조로 분리

### 문제
`tick-behavior.ts`가 779줄로 너무 커서 검토하고 논의하기 어렵습니다.

### 목표
주요 함수들을 논리적으로 분리하여 디렉토리 구조로 재구성

### 제안 구조
```
tick-behavior/
├── index.ts                    # tickBehavior 메인 함수
├── search-target.ts           # searchTargetAndSetPath
├── actions/
│   ├── execute-go.ts          # executeGoAction
│   ├── execute-interact.ts    # executeInteractAction
│   ├── execute-fulfill.ts     # executeFulfillAction
│   └── execute-idle.ts        # executeIdleAction
├── completion/
│   ├── check-completion.ts    # checkActionCompletion
│   └── transition.ts          # transitionToNextAction
├── selection/
│   └── select-behavior.ts     # selectNewBehavior
└── interaction-chain/
    ├── start-chain.ts         # startInteractionChain
    └── tick-chain.ts          # tickInteractionAction
```

### 리팩토링 방향
```typescript
// 현재 (복잡)
function tickBehavior(entity, tick) {
  if (!entity.currentBehaviorActionId) {
    selectNewBehavior(entity, tick);
    return;
  }

  const action = getAction(...);

  if (needsTarget && !hasTarget) {
    searchTargetAndSetPath(entity, action);
    return;
  }

  if (action.type === 'go') executeGoAction(...);
  else if (action.type === 'interact') executeInteractAction(...);
  // ... 많은 로직
}

// 목표 (간결)
function tickBehavior(entity, tick) {
  if (!entity.currentBehaviorActionId) {
    selectBehavior(entity, tick);
    return;
  }

  const action = getCurrentAction(entity);
  const target = searchTarget(entity, action);

  if (!target) {
    handleNoTarget(entity, action);
    return;
  }

  executeAction(entity, action, target, tick);

  if (isActionCompleted(entity, action, tick)) {
    transitionToNext(entity, action, tick);
  }
}
```

### 장점
1. 각 함수의 책임이 명확해짐
2. 테스트 작성 용이
3. 코드 리뷰 및 논의 쉬워짐
4. 새로운 action 타입 추가 시 확장 용이

### 주의사항
- 기존 로직 동작 유지 (버그 방지)
- 함수 간 의존성 최소화
- 타입 정의 명확히

---

## [향후 작업] 리스트 페이지 자동 리다이렉트

### 문제
`/admin/scenarios/[scenarioId]/items`와 같은 리스트 페이지에 접근하면 빈 화면이 표시됩니다. 자동으로 첫 번째 아이템으로 리다이렉트되어야 UX가 개선됩니다.

### 구현 방향
각 도메인의 `+page.svelte`에서 첫 번째 아이템으로 리다이렉트:

```typescript
// +page.svelte
import { goto } from '$app/navigation';
import { page } from '$app/state';

const { itemStore } = useItem();
const scenarioId = $derived(page.params.scenarioId as ScenarioId);

$effect(() => {
  const items = Object.values($itemStore.data);
  if (items.length > 0) {
    const firstItem = items[0];
    goto(`/admin/scenarios/${scenarioId}/items/${firstItem.id}`);
  }
});
```

### 수정 대상 리스트 페이지 (15개)

#### Behavior 관련 (2개)
- [ ] `need-behaviors/+page.svelte`
- [ ] `condition-behaviors/+page.svelte`
- ~~`behavior-priorities/+page.svelte`~~ - 제외 (상세 페이지 자체가 없음, bulk 관리 인터페이스)

#### Interaction 관련 (3개)
- [ ] `building-interactions/+page.svelte`
- [ ] `item-interactions/+page.svelte`
- [ ] `character-interactions/+page.svelte`

#### Need/Condition 관련 (2개)
- [ ] `needs/+page.svelte`
- [ ] `conditions/+page.svelte`

#### Entity 관련 (5개)
- [ ] `buildings/+page.svelte`
- [ ] `items/+page.svelte`
- [ ] `characters/+page.svelte`
- [ ] `character-bodies/+page.svelte`
- [ ] `terrains/+page.svelte`
- [ ] `tiles/+page.svelte`

#### Quest/Narrative 관련 (2개)
- [ ] `quests/+page.svelte`
- [ ] `narratives/+page.svelte`

#### 예외 (리다이렉트 불필요)
- `chapters` - detail 페이지 없음
- `terrains-tiles` - detail 페이지 없음

**총 16개 리스트 페이지**

### 주의사항
- store가 로드되기 전에 리다이렉트하지 않도록 주의
- 아이템이 없는 경우 처리 (빈 상태 표시)
- 무한 리다이렉트 방지

---

## [향후 작업] behavior-priorities 불필요한 상세 페이지 제거

### 문제
`behavior-priorities`는 Panel이 중복되어 있습니다:
- `+page.svelte` - BehaviorPriorityPanel
- `[priorityId]/+page.svelte` - BehaviorPriorityPanel (동일한 내용)

**더 근본적인 문제**: 상세 페이지로 진입하는 방법이 없고, 필요하지도 않습니다.

### 이유
behavior-priorities는 다른 도메인(items, buildings 등)과 달리:
- **Command에 navigation이 없음**: `behavior-priority-command.svelte`는 `CommandLinkItem`이 아닌 `onclick` 핸들러로 직접 우선순위에 추가만 함
- **Panel이 priorityId를 사용하지 않음**: 전체 우선순위 리스트를 drag-and-drop으로 관리하고 bulk save하는 인터페이스
- **개별 상세 페이지가 불필요**: 우선순위 관리는 전체 리스트 컨텍스트에서만 의미가 있음

### 수정 방향
`[priorityId]` 라우트를 완전히 제거:

**현재 구조:**
```
behavior-priorities/
  +layout.svelte      - BehaviorPriorityAside
  +page.svelte        - BehaviorPriorityPanel
  [priorityId]/
    +page.svelte      - BehaviorPriorityPanel (중복)
```

**수정 후 구조:**
```
behavior-priorities/
  +layout.svelte      - BehaviorPriorityAside
  +page.svelte        - BehaviorPriorityPanel
```

### 파일 작업
- [ ] `[priorityId]/` 디렉토리 전체 삭제
- [ ] 리스트 페이지 자동 리다이렉트 작업에서 behavior-priorities 제외 (이미 올바른 페이지에 있음)

---

## [향후 작업] Fulfillment Type Enum 정리

### 문제

**condition_fulfillment_type:**
- Condition은 건물 속성 (이미 building_id 보유)
- 현재: `'building' | 'character' | 'item' | 'idle'`
- 문제:
  - `character`: 건물 컨디션을 캐릭터 상호작용으로 충족? 의미 불분명
  - `item`: 건물 컨디션을 아이템으로 충족? 의미 불분명
  - `idle`: 시간이 지나면 자동 회복? 명시적 행동이 아님

**need_fulfillment_type:**
- Need는 캐릭터 속성
- 현재: `'building' | 'character' | 'item' | 'task' | 'idle'`
- 문제:
  - `idle`: 가만히 있으면 회복? "휴식" 같은 명시적 행동이어야 함

### 수정 방향

**condition_fulfillment_type:**
```sql
-- Before
'building' | 'character' | 'item' | 'idle'

-- After
'building'  -- 건물 상호작용만 (수리, 청소 등)
```

**need_fulfillment_type:**
```sql
-- Before
'building' | 'character' | 'item' | 'task' | 'idle'

-- After
'building' | 'character' | 'item' | 'task'  -- idle 제거
```

### 구현 계획

#### Phase 1: 데이터 확인 및 마이그레이션 준비
```sql
-- 1. 현재 사용 중인 fulfillment_type 확인
SELECT fulfillment_type, COUNT(*)
FROM condition_fulfillments
GROUP BY fulfillment_type;

SELECT fulfillment_type, COUNT(*)
FROM need_fulfillments
GROUP BY fulfillment_type;

-- 2. 삭제될 타입 사용 중이면 마이그레이션 필요
```

#### Phase 2: DB 스키마 변경

**기존 마이그레이션 수정 + DB 리셋 방식:**

1. `supabase/migrations/20251224100000_create_conditions.sql` 수정:
   ```sql
   -- condition_fulfillment_type enum 수정
   CREATE TYPE condition_fulfillment_type AS ENUM ('building');
   ```

2. `supabase/migrations/20251223000000_create_needs.sql` (또는 해당 파일) 수정:
   ```sql
   -- need_fulfillment_type enum 수정 (idle 제거)
   CREATE TYPE need_fulfillment_type AS ENUM (
     'building',
     'character',
     'task',
     'item'
   );
   ```

3. 로컬 DB 리셋:
   ```bash
   pnpm supabase db reset
   ```

#### Phase 3: Admin UI 업데이트
- [ ] `condition-fulfillment-node-panel.svelte` - fulfillmentTypeOptions에서 character, item, idle 제거
- [ ] `need-fulfillment-node-panel.svelte` - fulfillmentTypeOptions에서 idle 제거

#### Phase 4: TypeScript 타입 재생성
```bash
pnpm supabase gen types --lang=typescript --local > src/lib/types/supabase.generated.ts
```

### 파일 작업
- [ ] 기존 마이그레이션 수정: condition_fulfillment_type enum ('building'만)
- [ ] 기존 마이그레이션 수정: need_fulfillment_type enum ('idle' 제거)
- [ ] `pnpm supabase db reset`
- [ ] Admin UI 컴포넌트 수정
- [ ] TypeScript 타입 재생성

---

## [향후 작업] 기본 인터렉션 (Default Interactions)

### 문제 상황

**Condition Fulfillment의 중복 생성 문제:**
- Condition은 건물 속성 (building_id 보유)
- "청소하면 청결도 회복", "수리하면 내구도 회복" 같은 공통 로직
- 현재: 각 건물마다 동일한 상호작용을 중복 생성해야 함
  - 레스토랑A: building_clean 상호작용 생성
  - 레스토랑B: building_clean 상호작용 생성 (동일 내용 중복)

**Need Fulfillment은 문제없음:**
- Need는 캐릭터 속성
- "배고픔"은 어느 레스토랑에서든 채울 수 있음
- → `building_interaction_id`로 특정 건물 선택 (중복 아님)

### 해결 방안: 기본 인터렉션 개념 도입

**핵심 아이디어:**
```sql
building_interactions:
  building_id: uuid NULL  -- NULL이면 기본 인터렉션 (모든 건물 공통)
  once_interaction_type / repeat_interaction_type
  character_id: uuid NULL -- NULL이면 모든 캐릭터
```

**사용 예시:**
1. 기본 인터렉션 생성:
   - `building_id: NULL, repeat_interaction_type: 'building_clean'` → "청소 (기본)"
   - 모든 건물의 청결도 Condition이 이 하나의 기본 인터렉션을 참조

2. 커스텀이 필요한 경우:
   - `building_id: 특수시설, repeat_interaction_type: 'building_clean'` → "특수 청소 프로세스"
   - 특정 건물만 별도 인터렉션 사용 가능

### 상호작용 타입 분석

#### Building Interactions

**Once 타입:**
- `building_execute`: 건물 사용
- `building_construct`: 건물 건설
- `building_demolish`: 건물 철거

**Repeat 타입:**
- `building_repair`: 건물 수리
- `building_clean`: 건물 청소

#### Item Interactions

**Once 타입:**
- `item_pick`: 아이템 줍기
- `item_use`: 아이템 사용

**Repeat 타입:**
- (없음)

#### Character Interactions

**Repeat 타입:**
- `character_hug`: 캐릭터 포옹

**참고**: 각 타입별로 기본 인터렉션을 만들지 커스텀 인터렉션을 만들지는 사용자 선택입니다.

### 구현 계획

#### Phase 1: DB 스키마 변경

**기존 마이그레이션 수정 + DB 리셋 방식:**

1. `supabase/migrations/20251225000000_create_interactions.sql` 수정:
   ```sql
   -- building_interactions 테이블 생성 시
   CREATE TABLE building_interactions (
     -- ...
     building_id uuid REFERENCES buildings(id) ON DELETE CASCADE,  -- NOT NULL 제거
     -- ...
   );

   -- item_interactions 테이블 생성 시
   CREATE TABLE item_interactions (
     -- ...
     item_id uuid REFERENCES items(id) ON DELETE CASCADE,  -- NOT NULL 제거
     -- ...
   );

   -- Unique constraints는 이미 NULLS NOT DISTINCT이므로 유지
   -- building_id가 NULL: 기본 인터렉션 (interaction_type당 1개)
   -- building_id가 있음: 특정 건물용 (기존과 동일)
   ```

2. 로컬 DB 리셋:
   ```bash
   pnpm supabase db reset
   ```

#### Phase 2: Admin UI 변경

**1. Interaction 생성 다이얼로그:**
- 건물/아이템 선택 드롭다운에 "기본 (모든 건물/아이템)" 옵션 추가
- 선택 시 `building_id`/`item_id`를 NULL로 설정

**2. Interaction 리스트:**
- 기본 인터렉션을 상단에 표시
- 라벨: "청소 (기본)" vs "청소 - 레스토랑A"

**3. Fulfillment 선택:**
- 기본 인터렉션도 선택 가능하게 표시
- Condition Fulfillment: 기본 인터렉션 우선 표시
- Need Fulfillment: 특정 건물 인터렉션 위주 (기존과 동일)

#### Phase 3: 런타임 로직 변경

**대상 검색 시 기본 인터렉션 처리:**
```typescript
// findTargetsForInteraction() 수정
// building_id가 NULL인 인터렉션은 모든 건물 대상
if (!interaction.building_id) {
  // 기본 인터렉션 → 모든 건물 검색
  targets = allBuildings.filter(b =>
    canInteract(character, b, interaction)
  );
} else {
  // 특정 건물 인터렉션
  targets = [buildings[interaction.building_id]];
}
```

### 파일 작업

**DB 마이그레이션:**
- [ ] 기존 마이그레이션 수정: `building_interactions.building_id` NULL 허용
- [ ] 기존 마이그레이션 수정: `item_interactions.item_id` NULL 허용
- [ ] `pnpm supabase db reset`
- [ ] TypeScript 타입 재생성

**Admin UI:**
- [ ] `building-interaction-create-dialog.svelte` - 기본 옵션 추가
- [ ] `building-interaction-update-dialog.svelte` - 기본 옵션 추가
- [ ] `building-interaction-command.svelte` - 기본 인터렉션 표시 개선
- [ ] `item-interaction-create-dialog.svelte` - 기본 옵션 추가
- [ ] `item-interaction-update-dialog.svelte` - 기본 옵션 추가
- [ ] `item-interaction-command.svelte` - 기본 인터렉션 표시 개선
- [ ] Fulfillment 패널들 - 기본 인터렉션 선택 UI

**런타임 로직:**
- [ ] `tick-behavior.ts` - 대상 검색 시 기본 인터렉션 처리
- [ ] 관련 유틸리티 함수들
