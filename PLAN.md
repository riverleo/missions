# Cleanup: Remove search_or_continue & Simplify behavior_action_type comments

## 목표
1. `target_selection_method` enum에서 `search_or_continue` 값 제거
2. `behavior_action_type` enum의 주석 단순화

## 현재 상태

### 1. Database Schema
- **파일**: `supabase/migrations/20251219100247_create_need_behaviors.sql:9-13`
- enum 정의:
  ```sql
  create type target_selection_method as enum (
    'explicit',          -- 지정된 대상
    'search',            -- 액션 시작 시 새로 탐색
    'search_or_continue' -- 액션 시작 시 기존 대상이 있으면 사용, 없으면 탐색
  );
  ```

### 2. TypeScript 코드
- **파일**: `tick-find-and-go.ts:80-87`
- `search`와 `search_or_continue`를 동일하게 처리:
  ```typescript
  } else if (
    behaviorAction.target_selection_method === 'search' ||
    behaviorAction.target_selection_method === 'search_or_continue'
  ) {
    candidateEntities = entities.filter(
      (e) => entitySourceIds.has(e.sourceId) && e.id !== this.worldCharacterEntity.id
    );
  }
  ```

### 3. Generated Types
- **파일**: `src/lib/types/supabase.generated.ts`
- 자동 생성된 타입에 포함됨

## 제거 단계

### Step 1: 기존 마이그레이션 파일 수정
`supabase/migrations/20251219100247_create_need_behaviors.sql` 파일에서 `search_or_continue` 제거:
```sql
-- Before:
create type target_selection_method as enum (
  'explicit',
  'search',
  'search_or_continue'
);

-- After:
create type target_selection_method as enum (
  'explicit',
  'search'
);
```

### Step 2: psql로 데이터베이스 직접 수정

#### 2-1. 기존 데이터 확인 및 마이그레이션
```bash
# search_or_continue 사용 중인 레코드 확인
psql postgresql://postgres:postgres@localhost:54322/postgres -c "
  SELECT COUNT(*) FROM behavior_actions WHERE target_selection_method = 'search_or_continue';
"

# 있다면 search로 변경
psql postgresql://postgres:postgres@localhost:54322/postgres -c "
  UPDATE behavior_actions
  SET target_selection_method = 'search'
  WHERE target_selection_method = 'search_or_continue';
"
```

#### 2-2. enum 타입 재생성
```bash
psql postgresql://postgres:postgres@localhost:54322/postgres -c "
  -- 1. 새 enum 생성
  CREATE TYPE target_selection_method_new AS ENUM ('explicit', 'search');

  -- 2. behavior_actions 테이블 컬럼 타입 변경
  ALTER TABLE behavior_actions
    ALTER COLUMN target_selection_method TYPE target_selection_method_new
    USING target_selection_method::text::target_selection_method_new;

  -- 3. 기존 enum 삭제 및 이름 변경
  DROP TYPE target_selection_method;
  ALTER TYPE target_selection_method_new RENAME TO target_selection_method;
"
```

### Step 3: TypeScript 코드 업데이트
`tick-find-and-go.ts`에서 `search_or_continue` 체크 제거:
```typescript
// Before:
} else if (
  behaviorAction.target_selection_method === 'search' ||
  behaviorAction.target_selection_method === 'search_or_continue'
) {

// After:
} else if (behaviorAction.target_selection_method === 'search') {
```

### Step 4: 타입 재생성
```bash
pnpm supabase gen types --lang=typescript --local > src/lib/types/supabase.generated.ts
```

## 검증
1. 타입스크립트 컴파일 오류 없음 (`pnpm check`)
2. 데이터베이스 마이그레이션 성공
3. 기존 behavior 동작 정상

---

## Task 2: behavior_action_type 주석 단순화

### 목표
enum 주석에서 불필요한 영문 표기 제거:
- `'once'` -- "건물/아이템/캐릭터와 상호작용 (once)" → "상호작용"
- `'fulfill'` -- "욕구/컨디션 충족 (repeat)" → "욕구충족"

### 현재 상태
`supabase/migrations/20251219100247_create_need_behaviors.sql`:
```sql
create type behavior_action_type as enum (
  'once',       -- 건물/아이템/캐릭터와 상호작용 (once)
  'fulfill',    -- 욕구/컨디션 충족 (repeat)
  'idle'        -- 아무것도 안 함 (대기)
);
```

### 수정
```sql
create type behavior_action_type as enum (
  'once',       -- 상호작용
  'fulfill',    -- 욕구충족
  'idle'        -- 대기
);
```

**참고**: enum 주석은 데이터베이스에 저장되지 않으므로 마이그레이션 파일만 수정하면 됨

---

## Task 3: searchEntitySources 리팩토링 및 버그 수정

### 문제
현재 캐릭터가 욕구와 관계없는 아이템(김치 등)을 무작위로 줍고 있음. `searchEntitySources`의 로직에 문제가 있는 것으로 보임.

### 목표
1. 함수 시그니처 변경: `searchEntitySources(behaviorAction)` → `searchEntitySources(behavior, behaviorActionType)`
2. 현재 Behavior와 관련된 엔티티만 정확히 반환하도록 수정
3. 욕구 충족과 무관한 아이템을 캐릭터가 줍지 않도록 수정

### 조사 필요 사항
1. `searchEntitySources`가 어떤 로직으로 엔티티를 필터링하는지 확인
2. `tick-find-and-go.ts`에서 어떻게 사용되는지 확인
3. 왜 욕구와 무관한 아이템이 타겟으로 선택되는지 원인 파악

### 예상 수정 사항
**파일**: `src/lib/hooks/use-behavior/get-search-entity-sources.ts`
- 함수 시그니처 변경
- Behavior 컨텍스트를 활용한 정확한 필터링 로직 구현

**파일**: `tick-find-and-go.ts`
- 변경된 함수 시그니처에 맞게 호출 방식 수정

---

## Task 4: 훅 함수를 Store Derived로 리팩토링

### 목표
훅의 데이터 제공 함수들을 Store의 `derived`로 변경하여 자동 캐싱 및 성능 개선

### 현재 상태 분석

#### useBehavior (use-behavior.ts)
**간단한 변환 (Object.values)**:
- `getAllBehaviorPriorities()` → derived
- `getAllNeedBehaviors()` → derived
- `getAllNeedBehaviorActions()` → derived
- `getAllConditionBehaviors()` → derived
- `getAllConditionBehaviorActions()` → derived

**복잡한 로직 (변환/합치기)**:
- `getAllBehaviors()` → derived (needBehaviors + conditionBehaviors 합치고 변환)

**파라미터 있는 함수 (derived 불가)**:
- `getAllUsableBehaviors(worldCharacterEntityBehavior)` → 함수 유지

#### useBuilding (use-building.ts)
**간단한 변환**:
- `getAllBuildings()` → derived
- `getAllBuildingItems()` → derived
- ~~`getAllBuildingInteractions()`~~ → useInteraction으로 이동
- `getAllConditions()` → derived
- `getAllConditionFulfillments()` → derived
- `getAllBuildingConditions()` → derived
- `getAllConditionEffects()` → derived

**이미 Record 반환 (변환 불필요)**:
- `getAllBuildingStates()` → derived
- `getAllBuildingInteractionActions()` → derived

#### useCharacter (use-character.ts)
**간단한 변환**:
- `getAllCharacters()` → derived
- ~~`getAllCharacterInteractions()`~~ → useInteraction으로 이동
- `getAllCharacterBodies()` → derived
- `getAllNeeds()` → derived
- `getAllNeedFulfillments()` → derived
- `getAllCharacterNeeds()` → derived

**이미 Record 반환**:
- `getAllCharacterFaceStates()` → derived
- `getAllCharacterInteractionActions()` → derived
- `getAllCharacterBodyStates()` → derived

#### useItem (use-item.ts)
**간단한 변환**:
- `getAllItems()` → derived
- ~~`getAllItemInteractions()`~~ → useInteraction으로 이동

**이미 Record 반환**:
- `getAllItemStates()` → derived
- `getAllItemInteractionActions()` → derived

### 구현 방법

```typescript
// Before
function getAllBuildings(): Building[] {
  return Object.values(get(buildingStore).data);
}

// After
const allBuildingsStore = derived(buildingStore, ($store) =>
  Object.values($store.data)
);

function getAllBuildings(): Building[] {
  return get(allBuildingsStore);
}

// 또는 store 직접 반환
return {
  allBuildingsStore,
  // ...
};
```

### 복잡한 예시 (getAllBehaviors)

```typescript
const allBehaviorsStore = derived(
  [needBehaviorStore, conditionBehaviorStore],
  ([$need, $condition]) => {
    const needBehaviors = Object.values($need.data).map(BehaviorIdUtils.behavior.to);
    const conditionBehaviors = Object.values($condition.data).map(BehaviorIdUtils.behavior.to);
    return [...needBehaviors, ...conditionBehaviors];
  }
);
```

### 예상 효과
- 자동 캐싱으로 불필요한 재계산 방지
- 의존성 변경 시에만 재계산
- 메모리 사용량 약간 증가하지만 성능 향상
- 컴포넌트에서 구독 시 자동 업데이트

---

## Task 5: useInteraction 훅 생성 및 리팩토링

### 목표
interaction 관련 로직이 중복되어 있어 `useInteraction` 훅으로 통합하여 코드 중복을 제거하고 일관성을 개선합니다.

### 기존 훅에서 이동될 함수
- `useBuilding.getAllBuildingInteractions()` → useInteraction으로 통합
- `useItem.getAllItemInteractions()` → useInteraction으로 통합
- `useCharacter.getAllCharacterInteractions()` → useInteraction으로 통합

### 현재 문제
- `useBuilding`, `useItem`, `useCharacter`에서 각각 interaction 관련 함수 제공
- `search-entity-sources.ts`에서 interaction 가져오는 로직이 반복됨
- 타입별로 분리되어 있어 전체 interaction을 다루기 어려움

### 해결 방안
새로운 `useInteraction` 훅 생성 (Store derived 사용):

```typescript
// src/lib/hooks/use-interaction/use-interaction.ts
import { derived } from 'svelte/store';

export function useInteraction() {
  // 기존 훅들의 interaction store 통합
  const { buildingInteractionStore } = useBuilding();
  const { itemInteractionStore } = useItem();
  const { characterInteractionStore } = useCharacter();

  // Store derived를 사용한 computed values
  const allInteractionsStore = derived(
    [buildingInteractionStore, itemInteractionStore, characterInteractionStore],
    ([$building, $item, $character]) => [
      ...Object.values($building.data).map(InteractionIdUtils.interaction.to),
      ...Object.values($item.data).map(InteractionIdUtils.interaction.to),
      ...Object.values($character.data).map(InteractionIdUtils.interaction.to),
    ]
  );

  const onceInteractionsStore = derived(
    allInteractionsStore,
    ($all) => $all.filter(i => i.once_interaction_type !== null)
  );

  const fulfillInteractionsStore = derived(
    allInteractionsStore,
    ($all) => $all.filter(i => i.repeat_interaction_type !== null)
  );

  return {
    allInteractionsStore,
    onceInteractionsStore,
    fulfillInteractionsStore,
    getAllInteractions: () => get(allInteractionsStore),
    getOnceInteractions: () => get(onceInteractionsStore),
    getFulfillInteractions: () => get(fulfillInteractionsStore),
  };
}
```

### search-entity-sources.ts 개선 포인트

**현재 중복 코드**:
```typescript
// Lines 34-36, 71-73: 3개 훅에서 interaction getter 반복 import
const { getBuildingInteraction } = useBuilding();
const { getItemInteraction } = useItem();
const { getCharacterInteraction } = useCharacter();

// Lines 41-52: 타입별로 나눠서 interaction 가져오기
if (behaviorAction.building_interaction_id) {
  const interaction = getBuildingInteraction(...);
} else if (behaviorAction.item_interaction_id) {
  const interaction = getItemInteraction(...);
} else if (behaviorAction.character_interaction_id) {
  const interaction = getCharacterInteraction(...);
}

// Lines 110-145: fulfillment의 interaction 가져올 때 3번 반복
if (fulfillment.building_interaction_id) { ... }
if (fulfillment.item_interaction_id) { ... }
if (fulfillment.character_interaction_id) { ... }
```

**useInteraction 사용 후**:
```typescript
// 단일 import
const { getInteraction } = useInteraction();

// 간결한 interaction 가져오기
const interactionId = behaviorAction.building_interaction_id ||
                     behaviorAction.item_interaction_id ||
                     behaviorAction.character_interaction_id;
if (interactionId) {
  const interaction = getInteraction(interactionId);
  if (interaction) interactions.push(interaction);
}

// fulfillment도 동일하게 간결해짐
for (const fulfillment of fulfillments) {
  const interactionId = fulfillment.building_interaction_id ||
                       fulfillment.item_interaction_id ||
                       fulfillment.character_interaction_id;
  if (interactionId) {
    const interaction = getInteraction(interactionId);
    if (interaction && hasCorrectType(interaction, actionType)) {
      interactions.push(interaction);
    }
  }
}
```

**코드 라인 수 감소**: ~150줄 → ~80줄 예상

### 수정 파일
1. **새로 생성**: `src/lib/hooks/use-interaction/use-interaction.ts`
2. **수정**: `src/lib/hooks/use-behavior/search-entity-sources.ts` - useInteraction 사용하도록 리팩토링
3. **수정**: Admin UI 컴포넌트들 - useInteraction 사용 (선택적)

### 기대 효과
- 코드 중복 제거
- interaction 관련 로직 통합 관리
- Store derived를 활용한 자동 캐싱
- 전체 interaction 목록 접근 용이

---

## 파일 목록
- `supabase/migrations/20251219100247_create_need_behaviors.sql` (수정)
- `src/lib/components/app/world/entities/world-character-entity/behavior-state/tick-find-and-go.ts` (수정)
- `src/lib/types/supabase.generated.ts` (재생성)
