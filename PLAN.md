# Behavior와 Interaction 시스템 재설계

## 핵심 개념

### Behavior (행동)
- **정의**: 특정 조건(욕구, 컨디션)에 도달했을 때 발생하는 **논리적 흐름**
- **특징**: 애니메이션이 없음, "무엇을 할지" 정의
- **예시**: "배고프면 음식을 찾아서 먹는다"

### Interaction (상호작용)
- **정의**: 엔티티(아이템/건물/캐릭터)에 정의된 **시각적 연출**
- **특징**: 애니메이터로 작성, InteractionAction 체인으로 구성
- **예시**: "라면 먹기" (ItemInteraction)

### BehaviorAction이 Interaction을 참조
- **기존 방식**: item_id + behavior_interaction_type 조합 → 런타임에 Interaction 찾기
- **새로운 방식**: ItemInteraction을 **직접 참조** → 유효한 조합만 선택 가능

## BehaviorAction 타입별 처리

### 1. `go` (이동)
- **애니메이션**: 시스템 정의 (walk 상태)
- **완료 조건**: path가 비면 완료

### 2. `idle` (대기)
- **애니메이션**: 시스템 정의 (idle 상태)
- **완료 조건**: duration_ticks 경과하면 완료

### 3. `interact` (상호작용)
- **애니메이션**: Interaction에서 정의 (InteractionAction 체인)
- **완료 조건**: once_interaction_type - 체인 1회 실행 후 완료

### 4. `fulfill` (충족)
- **애니메이션**: Fulfillment의 Interaction에서 정의
- **완료 조건**: repeat_interaction_type - 충족될 때까지 체인 반복

## Interaction 타입 분리

### 개념
- **once_interaction_type**: 1회 실행용 상호작용 (interact 타입 전용)
- **repeat_interaction_type**: 반복 실행용 상호작용 (fulfill 타입 전용)

### 타입 시스템 레벨 제약
```sql
-- 1회 실행용 enum
CREATE TYPE once_interaction_type AS ENUM (
  'item_pick',          -- 아이템 줍기
  'item_use',           -- 일회성 소모품 사용
  'building_execute',   -- 1회 실행 건물
  'building_construct', -- 건물 건설 (캐릭터별 시간 다름)
  'building_demolish'   -- 건물 철거 (캐릭터별 시간 다름)
);

-- 반복 실행용 enum
CREATE TYPE repeat_interaction_type AS ENUM (
  'building_execute', -- 반복 사용 건물
  'building_repair',  -- 건물 수리 (내구도 충족까지)
  'building_clean',   -- 건물 청소 (청결도 충족까지)
  'character_hug'     -- 캐릭터 허그 (충족까지)
);
```

### Interaction 테이블 스키마
```sql
-- building_interactions
ALTER TABLE building_interactions
  ADD COLUMN once_interaction_type once_interaction_type,
  ADD COLUMN repeat_interaction_type repeat_interaction_type,
  ADD CONSTRAINT chk_interaction_type_exclusive
    CHECK ((once_interaction_type IS NOT NULL)::int + (repeat_interaction_type IS NOT NULL)::int = 1);

-- item_interactions, character_interactions도 동일
```

**제약 조건:**
- 각 Interaction은 once OR repeat 둘 중 하나만 가짐
- interact 타입 BehaviorAction: once_interaction_type만 선택 가능
- fulfill 타입 BehaviorAction: repeat_interaction_type만 선택 가능 (fulfillment를 통해)

**장점:**
1. **타입 안전성**: DB/컴파일 레벨에서 잘못된 조합 방지
2. **명확한 의도**: enum 이름만 봐도 사용처 명확
3. **중복 값 허용**: item_use, building_execute가 양쪽에 있어도 context 명확

**완료 조건:**
- **once_***: InteractionAction 체인 1회 실행 후 완료
  - 체인의 총 시간 = 각 action의 duration_ticks 합
  - 캐릭터별로 다른 Interaction (character_id) = 다른 체인 = 다른 시간
- **repeat_***: fulfillment 충족될 때까지 InteractionAction 체인 반복

## BehaviorAction에서 Interaction 직접 참조

### 문제점 (기존 방식)
```typescript
// BehaviorAction 작성 시
{
  type: 'interact',
  item_id: 'ramen',
  behavior_interact_type: 'building_repair'  // ❌ 라면은 수리 불가!
}

// 하지만 UI에서 선택 가능
// 실행 시점에 가서야 "Interaction 없음" 에러
```

**문제:**
- item_id와 behavior_interact_type을 독립적으로 선택
- 유효하지 않은 조합 가능
- Interaction이 파편화되어 있어 검증 어려움

### 해결 방법 (Interaction 직접 참조)

**스키마 변경:**
```sql
-- need_behavior_actions 테이블
ALTER TABLE need_behavior_actions
  DROP COLUMN building_id,
  DROP COLUMN item_id,
  DROP COLUMN character_id,
  DROP COLUMN behavior_interact_type,
  ADD COLUMN building_interaction_id uuid REFERENCES building_interactions(id),
  ADD COLUMN item_interaction_id uuid REFERENCES item_interactions(id),
  ADD COLUMN character_interaction_id uuid REFERENCES character_interactions(id);

-- condition_behavior_actions도 동일하게 변경
```

**UI 흐름 (interact 타입):**
```typescript
// 1. action type 선택: "interact"
// 2. 엔티티 타입 선택: "아이템"
// 3. item_interactions에서 once_interaction_type만 필터링:
[
  { id: 'ramen_use', item_id: 'ramen', once_interaction_type: 'item_use', label: '라면 사용' },
  { id: 'ramen_pick', item_id: 'ramen', once_interaction_type: 'item_pick', label: '라면 줍기' },
  ...
]

// 4. BehaviorAction 저장:
{
  type: 'interact',
  item_interaction_id: 'ramen_use'
}
```

**UI 흐름 (fulfill 타입):**
```typescript
// 1. action type 선택: "fulfill"
// 2. need_fulfillment 선택 (또는 자동 탐색)
// 3. fulfillment의 interaction은 자동으로 repeat_interaction_type
```

**장점:**
- 이미 정의된 Interaction만 선택 가능
- 대상 + 상호작용 조합이 유효함 보장
- interact는 once만, fulfill은 repeat만 타입 시스템 레벨에서 강제

### target_selection_method 처리

#### explicit (명시적 대상)
```typescript
{
  target_selection_method: 'explicit',
  item_interaction_id: 'ramen_eat'
}

// 실행:
// 1. ItemInteraction 조회 → item_id: 'ramen' 획득
// 2. 월드에서 item_id가 'ramen'인 WorldItem 찾기
// 3. 경로 설정
```

#### search (탐색)
```typescript
{
  target_selection_method: 'search',
  item_interaction_id: null  // null이면 타입별 모든 Interaction
}

// 실행:
// 1. item_interactions에서 fulfillment가 있는 것들 필터링
// 2. 각 interaction의 item_id로 월드에서 WorldItem 찾기
// 3. 가장 가까운 것 선택
```

#### search_or_continue
- search와 동일하지만 기존 타겟 유지

## Fulfillment 테이블도 Interaction 직접 참조

### 스키마 변경
```sql
-- need_fulfillments 테이블
ALTER TABLE need_fulfillments
  DROP COLUMN building_id,
  DROP COLUMN item_id,
  DROP COLUMN character_id,
  DROP COLUMN behavior_interact_type,
  ADD COLUMN building_interaction_id uuid REFERENCES building_interactions(id),
  ADD COLUMN item_interaction_id uuid REFERENCES item_interactions(id),
  ADD COLUMN character_interaction_id uuid REFERENCES character_interactions(id);

-- condition_fulfillments 테이블
ALTER TABLE condition_fulfillments
  DROP COLUMN item_id,
  DROP COLUMN character_id,
  DROP COLUMN behavior_interact_type,
  ADD COLUMN building_interaction_id uuid REFERENCES building_interactions(id),
  ADD COLUMN item_interaction_id uuid REFERENCES item_interactions(id),
  ADD COLUMN character_interaction_id uuid REFERENCES character_interactions(id);
```

**이유:**
- BehaviorAction과 동일한 구조
- Interaction을 직접 참조 → 유효한 조합만 가능
- Fulfillment는 항상 repeat_interaction_type만 참조

## BehaviorAction에 fulfill 타입 추가

### fulfill vs interact

**fulfill 타입:**
- 욕구/컨디션 충족이 목적
- fulfillment_id 지정 (또는 자동 탐색)
- fulfillment → interaction 자동 연결
- 예: 배고픔 채우기, 건강 회복

**interact 타입:**
- 충족과 무관한 순수 상호작용
- interaction_id 직접 지정
- 예: 청소, 수리, 건설, 철거

### 스키마 변경
```sql
-- need_behavior_actions 테이블
ALTER TABLE need_behavior_actions
  ADD COLUMN need_fulfillment_id uuid REFERENCES need_fulfillments(id);

-- condition_behavior_actions 테이블
ALTER TABLE condition_behavior_actions
  ADD COLUMN condition_fulfillment_id uuid REFERENCES condition_fulfillments(id);
```

### fulfill 타입 실행 로직
```typescript
// fulfill 타입 BehaviorAction 실행 시
if (action.type === 'fulfill') {
  // 1. fulfillment 가져오기
  let fulfillment;
  if (action.need_fulfillment_id) {
    fulfillment = needFulfillmentStore[action.need_fulfillment_id];
  } else {
    // 자동 탐색: behavior의 need_id로 찾기
    fulfillment = needFulfillmentStore.find(f =>
      f.need_id === behavior.need_id
    );
  }

  // 2. fulfillment의 interaction 가져오기 (repeat_interaction_type만 가능)
  let interaction;
  if (fulfillment.item_interaction_id) {
    interaction = itemInteractionStore[fulfillment.item_interaction_id];
  } else if (fulfillment.building_interaction_id) {
    interaction = buildingInteractionStore[fulfillment.building_interaction_id];
  } else if (fulfillment.character_interaction_id) {
    interaction = characterInteractionStore[fulfillment.character_interaction_id];
  }

  // 3. interaction의 엔티티로 타겟 설정
  const targetTemplateId = interaction.item_id || interaction.building_id || interaction.target_character_id;

  // 4. 매 틱마다 욕구 증가
  characterNeed.value += fulfillment.increase_per_tick;

  // 5. 완료 조건 (repeat_interaction_type이므로 충족까지 반복)
  if (characterNeed.value >= characterNeed.max_value) {
    transitionToNextAction();
  } else if (interactionAction 체인 끝) {
    // 체인 반복 (root action으로)
    currentInteractionActionId = rootInteractionActionId;
  }
}
```

### interact 타입 실행 로직
```typescript
// interact 타입 BehaviorAction 실행 시
if (action.type === 'interact') {
  // 1. interaction 직접 가져오기 (once_interaction_type만 가능)
  let interaction;
  if (action.item_interaction_id) {
    interaction = itemInteractionStore[action.item_interaction_id];
  } else if (action.building_interaction_id) {
    interaction = buildingInteractionStore[action.building_interaction_id];
  } else if (action.character_interaction_id) {
    interaction = characterInteractionStore[action.character_interaction_id];
  }

  // 2. interaction의 엔티티로 타겟 설정
  const targetTemplateId = interaction.item_id || interaction.building_id || interaction.target_character_id;

  // 3. 완료 조건 (once_interaction_type이므로 체인 1회 실행 후 완료)
  if (interactionAction 체인 끝) {
    transitionToNextAction();
  }
}
```

## 타겟 필터링 로직 개선

### getInteractableEntityTemplates 수정

```typescript
function getInteractableEntityTemplates(action: BehaviorAction) {
  let interactions = [];

  // 1. Interaction 목록 가져오기
  if (action.type === 'interact') {
    // interact 타입: once_interaction_type만 필터링
    if (action.item_interaction_id) {
      // explicit: 특정 Interaction
      interactions = [itemInteractionStore[action.item_interaction_id]];
    } else {
      // search: once_interaction_type이 있는 Interaction만
      interactions = Object.values(itemInteractionStore).filter(i => i.once_interaction_type);
    }
  } else if (action.type === 'fulfill') {
    // fulfill 타입: fulfillment를 통해 repeat_interaction_type 참조
    const fulfillments = action.need_fulfillment_id
      ? [needFulfillmentStore[action.need_fulfillment_id]]
      : Object.values(needFulfillmentStore).filter(f => f.need_id === behavior.need_id);

    interactions = fulfillments
      .map(f => {
        if (f.item_interaction_id) return itemInteractionStore[f.item_interaction_id];
        if (f.building_interaction_id) return buildingInteractionStore[f.building_interaction_id];
        if (f.character_interaction_id) return characterInteractionStore[f.character_interaction_id];
      })
      .filter(Boolean);
  }

  // 2. item_id를 템플릿으로 변환
  return interactions.map(i => ({
    id: i.item_id || i.building_id || i.target_character_id,
    type: i.item_id ? 'item' : i.building_id ? 'building' : 'character',
    interactionId: i.id
  }));
}
```

## 제거할 것

### behavior_completion_type 제거
```sql
ALTER TABLE need_behavior_actions DROP COLUMN behavior_completion_type;
ALTER TABLE condition_behavior_actions DROP COLUMN behavior_completion_type;
DROP TYPE behavior_completion_type;
```

**이유:**
- `go`, `idle`은 완료 조건이 시스템 정의됨
- `interact`는 once_interaction_type (체인 1회)
- `fulfill`은 repeat_interaction_type (충족까지 반복)
- 중복된 정보

## 완료 조건 정리

### go 타입
```typescript
path.length === 0  // 완료
```

### idle 타입
```typescript
currentTick - actionStartTick >= duration_ticks  // 완료
```

### interact 타입 (once_interaction_type)
```typescript
// InteractionAction 체인 1회 실행 후 완료
if (interactionAction 체인 끝) {
  transitionToNextAction();
}
```

### fulfill 타입 (repeat_interaction_type)
```typescript
// 매 틱마다 fulfillment 적용
characterNeed.value += fulfillment.increase_per_tick;

// 충족 조건 체크
if (characterNeed.value >= characterNeed.max_value) {
  transitionToNextAction();
} else if (interactionAction 체인 끝) {
  // 체인 반복 (root action으로)
  currentInteractionActionId = rootInteractionActionId;
}
```

## 기존 버그 수정

### BehaviorAction 라벨 표시 오류
**문제:**
- "타입: 아이템, 대상: 라면"인 경우
- 노드에 "라면 건물 사용"으로 잘못 표시됨

**원인:**
- item_id가 설정되어 있는데 building으로 인식

**수정 방법 (새로운 구조):**
```typescript
// Interaction을 직접 참조하므로:
const interaction = itemInteractionStore[action.item_interaction_id];
const item = itemStore[interaction.item_id];
const interactionType = interaction.once_interaction_type || interaction.repeat_interaction_type;
const label = `${item.name} ${getInteractionLabel(interactionType)}`;
// 예: "라면 사용" (once), "라면 먹기" (repeat)
```

## 구현 계획

### Phase 1: DB 스키마 변경
1. once_interaction_type, repeat_interaction_type enum 생성
2. Interaction 테이블 변경:
   - building_interactions, item_interactions, character_interactions
   - once_interaction_type, repeat_interaction_type 컬럼 추가
   - 둘 중 하나만 not null 제약 추가
   - character_behavior_type 컬럼 제거
3. need_behavior_actions 변경:
   - building_id, item_id, character_id 제거
   - behavior_interact_type 제거
   - building_interaction_id, item_interaction_id, character_interaction_id 추가
   - need_fulfillment_id 추가
   - type enum에 'fulfill' 추가
4. condition_behavior_actions도 동일하게 변경
5. need_fulfillments, condition_fulfillments 변경:
   - building_id, item_id, character_id 제거
   - behavior_interact_type 제거
   - building_interaction_id, item_interaction_id, character_interaction_id 추가
6. behavior_completion_type 제거
7. TypeScript 타입 재생성

### Phase 2: getInteractableEntityTemplates 수정
1. Interaction 기반 필터링으로 전환
2. fulfillment 필터링 (repeat_* 타입만)
3. 템플릿 반환 시 interactionId 포함

### Phase 3: tick-behavior.ts 수정
1. fulfill 타입 로직 추가:
   - fulfillment 조회 (지정 or 자동 탐색)
   - fulfillment의 interaction 조회
   - 매 틱마다 increase_per_tick 적용
   - repeat_interaction_type 체인 반복
2. interact 타입 로직 수정:
   - interaction_id로 직접 조회
   - once_interaction_type 체인 1회 실행
3. checkActionCompletion() 수정:
   - behavior_completion_type 로직 제거
   - interact: once_interaction_type (체인 1회)
   - fulfill: repeat_interaction_type (충족까지 반복)
4. InteractionAction 체인 반복 로직

### Phase 4: Admin UI 업데이트
1. Interaction 패널:
   - once_interaction_type OR repeat_interaction_type 선택
   - 둘 중 하나만 입력 가능하도록 UI 구성
2. BehaviorAction 패널:
   - action type 선택: go/idle/interact/fulfill
   - interact: interaction_id select (once_interaction_type만 필터링)
   - fulfill: need_fulfillment_id select (선택적)
   - building_id, item_id, character_id 제거
   - behavior_interact_type 제거
   - behavior_completion_type 제거
3. Fulfillment 패널:
   - interaction_id select (repeat_interaction_type만 필터링)
   - building_id, item_id, character_id 제거
   - behavior_interact_type 제거
4. 라벨 표시 로직 수정:
   - Interaction 기반으로 라벨 생성
   - 기존 버그 해결

### Phase 5: 기존 데이터 마이그레이션
1. 기존 Interaction에 once/repeat 타입 설정:
   ```sql
   -- item_interactions
   UPDATE item_interactions
   SET once_interaction_type =
     CASE character_behavior_type
       WHEN 'item_pick' THEN 'item_pick'
       WHEN 'item_use' THEN 'item_use'
     END
   WHERE character_behavior_type IN ('item_pick', 'item_use');

   -- building_interactions
   UPDATE building_interactions
   SET once_interaction_type =
     CASE character_behavior_type
       WHEN 'building_execute' THEN 'building_execute'
       WHEN 'building_construct' THEN 'building_construct'
       WHEN 'building_demolish' THEN 'building_demolish'
     END
   WHERE character_behavior_type IN ('building_execute', 'building_construct', 'building_demolish');

   UPDATE building_interactions
   SET repeat_interaction_type =
     CASE character_behavior_type
       WHEN 'building_execute' THEN 'building_execute'
       WHEN 'building_repair' THEN 'building_repair'
       WHEN 'building_clean' THEN 'building_clean'
     END
   WHERE character_behavior_type IN ('building_repair', 'building_clean');

   -- character_interactions
   UPDATE character_interactions
   SET repeat_interaction_type = 'character_hug'
   WHERE character_behavior_type = 'character_hug';
   ```

2. 기존 BehaviorAction의 조합으로 Interaction 찾기:
   ```sql
   -- item_id + behavior_interact_type → item_interaction_id
   UPDATE need_behavior_actions
   SET item_interaction_id = (
     SELECT id FROM item_interactions
     WHERE item_id = need_behavior_actions.item_id
       AND (
         once_interaction_type = need_behavior_actions.behavior_interact_type::text
         OR repeat_interaction_type = need_behavior_actions.behavior_interact_type::text
       )
       AND (character_id IS NULL OR character_id = need_behavior_actions.character_id)
     LIMIT 1
   )
   WHERE item_id IS NOT NULL;
   ```

3. Fulfillment 데이터 마이그레이션:
   ```sql
   UPDATE need_fulfillments
   SET item_interaction_id = (
     SELECT id FROM item_interactions
     WHERE item_id = need_fulfillments.item_id
       AND repeat_interaction_type IS NOT NULL
     LIMIT 1
   )
   WHERE item_id IS NOT NULL;
   ```

4. Interaction이 없는 경우:
   - 자동 생성 또는
   - 수동 확인 필요

## 검증 방법

### 1. UI 검증
- Interaction 생성: once OR repeat 중 하나만 입력 가능
- interact 타입: once_interaction_type만 필터링
- fulfill 타입: repeat_interaction_type만 필터링 (fulfillment 통해)
- 유효하지 않은 조합 선택 불가

### 2. once_item_pick 테스트 (interact 타입)
- 아이템 줍기 행동 실행
- InteractionAction 체인 1회 실행 확인
- 즉시 다음 BehaviorAction으로 전환 확인

### 3. once_item_use 테스트 (interact 타입)
- 아이템 사용 행동 실행
- InteractionAction 체인 1회 실행 확인
- 즉시 다음 BehaviorAction으로 전환 확인

### 4. repeat_building_execute 테스트 (fulfill 타입)
- 건물 사용 행동 실행 (fulfillment를 통해)
- InteractionAction 체인 반복 확인
- 매 틱마다 욕구 증가 확인
- 욕구 max_value 도달 시 완료 확인

### 5. 라벨 표시 확인
- "라면 사용", "빵 줍기" 등 올바른 라벨 표시
- "라면 건물 사용" 같은 잘못된 라벨 없음

## 주요 파일

### 수정 파일
1. `supabase/migrations/` - 새 migration (once/repeat 타입 분리)
2. `src/lib/types/supabase.generated.ts` - 재생성
3. `src/lib/hooks/use-behavior/get-interactable-entity-templates.ts` - 필터링 로직 (once/repeat 분리)
4. `src/lib/components/app/world/entities/world-character-entity/tick-behavior.ts` - 핵심 로직 (fulfill 타입 추가)
5. `src/lib/components/admin/building-interaction/*` - Admin UI (once/repeat 선택)
6. `src/lib/components/admin/item-interaction/*` - Admin UI (once/repeat 선택)
7. `src/lib/components/admin/character-interaction/*` - Admin UI (once/repeat 선택)
8. `src/lib/components/admin/need-behavior-action/*` - Admin UI (fulfill 타입, interaction 선택)
9. `src/lib/components/admin/condition-behavior-action/*` - Admin UI
10. `src/lib/components/admin/need-fulfillment/*` - Admin UI (interaction 선택)
11. `src/lib/components/admin/condition-fulfillment/*` - Admin UI (interaction 선택)
12. `src/lib/utils/state-label.ts` - 라벨 생성 로직
