# Interaction System Refactoring

## 진행 상태
- ⏳ Task 1: fulfill_interaction_type → fulfill_interaction_type 리네이밍
- ⏳ Task 2: item_pick을 once_interaction_type에서 분리

---

## Task 1: fulfill_interaction_type → fulfill_interaction_type 리네이밍

### 목표
`fulfill_interaction_type`을 `fulfill_interaction_type`으로 이름을 변경하여 의미를 명확하게 합니다.
- "repeat"은 반복한다는 행위에 초점
- "fulfill"은 욕구/컨디션을 충족시킨다는 목적에 초점

현재 코드에서 이미 `fulfillInteractionsStore`라는 이름을 사용하고 있어, 컬럼명도 일치시키는 것이 일관성 측면에서 좋습니다.

### 현재 상태

**Database Schema:**
- `building_interactions.fulfill_interaction_type`
- `item_interactions.fulfill_interaction_type`
- `character_interactions.fulfill_interaction_type`

**TypeScript 코드:**
```typescript
// src/lib/hooks/use-interaction.ts
const fulfillInteractionsStore = derived(allInteractionsStore, ($all) =>
  $all.filter((i) => i.fulfill_interaction_type !== null)
);
```

### 수정 단계

#### Step 1: Database Migration 생성

새로운 마이그레이션 파일 생성:
```bash
cd supabase
pnpm supabase migration new rename_repeat_to_fulfill_interaction_type
```

마이그레이션 내용:
```sql
-- Rename columns in building_interactions
ALTER TABLE building_interactions
  RENAME COLUMN fulfill_interaction_type TO fulfill_interaction_type;

-- Rename columns in item_interactions
ALTER TABLE item_interactions
  RENAME COLUMN fulfill_interaction_type TO fulfill_interaction_type;

-- Rename columns in character_interactions
ALTER TABLE character_interactions
  RENAME COLUMN fulfill_interaction_type TO fulfill_interaction_type;
```

#### Step 2: 로컬 데이터베이스에 마이그레이션 적용

```bash
pnpm supabase db reset
```

#### Step 3: TypeScript 타입 재생성

```bash
pnpm supabase gen types --lang=typescript --local > src/lib/types/supabase.generated.ts
```

#### Step 4: 코드베이스 업데이트

**파일별 수정:**

1. **src/lib/hooks/use-interaction.ts**
```typescript
// Before
const fulfillInteractionsStore = derived(allInteractionsStore, ($all) =>
  $all.filter((i) => i.fulfill_interaction_type !== null)
);

// After
const fulfillInteractionsStore = derived(allInteractionsStore, ($all) =>
  $all.filter((i) => i.fulfill_interaction_type !== null)
);
```

2. **모든 admin 컴포넌트** (interaction create/update dialogs)
   - `fulfill_interaction_type` 필드명을 `fulfill_interaction_type`으로 변경
   - 라벨/주석 업데이트

3. **src/lib/hooks/use-behavior/search-entity-sources.ts**
```typescript
// Before
const hasCorrectType =
  actionType === 'once'
    ? interaction.once_interaction_type !== null
    : interaction.fulfill_interaction_type !== null;

// After
const hasCorrectType =
  actionType === 'once'
    ? interaction.once_interaction_type !== null
    : interaction.fulfill_interaction_type !== null;
```

#### Step 5: 검증

```bash
# TypeScript 체크
pnpm check

# 애플리케이션 실행 확인
pnpm dev
```

---

## Task 2: item_pick을 once_interaction_type에서 분리

### 배경

현재 `item_pick`은 숨겨진 interaction으로, `item_use` 실행 시 내부적으로 사용됩니다. 하지만 `once_interaction_type` enum에 포함되어 있어, 일반 once interaction과 혼재되어 있습니다.

### 문제점

1. **의미적 혼란**: `item_pick`은 유저가 직접 선택하는 interaction이 아닌, 시스템 내부 동작
2. **타입 안정성**: once interaction을 필터링할 때 `item_pick`을 제외해야 하는 로직이 필요
3. **관리 복잡도**: Admin UI에서 `item_pick`을 숨기거나 특별 처리해야 함

### 해결 방안

#### 옵션 A: 별도 컬럼 생성 (권장)

새로운 컬럼 `system_interaction_type`을 추가하고, `item_pick`을 여기로 이동:

**장점:**
- 명확한 의미 분리
- 확장 가능 (향후 다른 시스템 interaction 추가 가능)
- 기존 로직 영향 최소화

**단점:**
- 컬럼 추가로 인한 스키마 복잡도 증가

**구현:**

1. Database Migration:
```sql
-- Add new column
ALTER TABLE item_interactions
  ADD COLUMN system_interaction_type text CHECK (system_interaction_type IN ('item_pick'));

-- Migrate existing item_pick
UPDATE item_interactions
  SET system_interaction_type = 'item_pick',
      once_interaction_type = NULL
  WHERE once_interaction_type = 'item_pick';

-- Update constraint
ALTER TABLE item_interactions
  DROP CONSTRAINT IF EXISTS item_interactions_once_interaction_type_check;

ALTER TABLE item_interactions
  ADD CONSTRAINT item_interactions_once_interaction_type_check
  CHECK (once_interaction_type IN ('item_use', 'npc_talk', 'building_enter'));
```

2. TypeScript 타입:
```typescript
type SystemInteractionType = 'item_pick';

interface ItemInteraction {
  // ...
  once_interaction_type: OnceInteractionType | null;
  system_interaction_type: SystemInteractionType | null;
  fulfill_interaction_type: FulfillInteractionType | null;
}
```

3. 코드 수정:
```typescript
// Item을 주울 때 (내부 동작)
if (interaction.system_interaction_type === 'item_pick') {
  // item_pick 로직
}

// Once interaction 필터링 (유저 선택 가능)
const onceInteractions = allInteractions.filter(
  i => i.once_interaction_type !== null
);
```

#### 옵션 B: 플래그 추가

`is_system_interaction` boolean 컬럼 추가:

**장점:**
- 단순한 구조
- enum 변경 불필요

**단점:**
- 향후 다른 시스템 interaction 타입 추가 시 확장성 부족
- 여전히 once_interaction_type에 포함되어 의미적 혼란

#### 옵션 C: 별도 테이블 생성

`system_interactions` 테이블 생성:

**장점:**
- 완전한 분리
- 최고의 확장성

**단점:**
- 구조 복잡도 대폭 증가
- 조인 필요
- 과도한 엔지니어링 가능성

### 권장 사항

**옵션 A (별도 컬럼)**를 권장합니다:
- 명확한 의미 분리
- 적절한 확장성
- 구현 복잡도와 이점의 균형

### 구현 순서

1. Database migration으로 `system_interaction_type` 컬럼 추가
2. 기존 `item_pick` 데이터 마이그레이션
3. TypeScript 타입 재생성
4. 코드베이스에서 `item_pick` 참조 업데이트
5. Admin UI 업데이트 (system interaction은 숨김 처리)
6. 검증 및 테스트

---

## 전체 작업 순서

1. **Task 1 완료**: repeat → fulfill 리네이밍
2. **Task 2 완료**: item_pick 분리
3. **통합 테스트**: 두 변경사항 함께 테스트
4. **문서 업데이트**: CLAUDE.md, 주석 등

## 예상 영향 범위

### Task 1 (repeat → fulfill)
- Database: 3개 테이블 컬럼명 변경
- TypeScript: 생성된 타입 자동 업데이트
- Code: ~10-15개 파일 (interaction hooks, admin UI, behavior logic)

### Task 2 (item_pick 분리)
- Database: 1개 테이블 컬럼 추가 및 제약조건 수정
- TypeScript: ItemInteraction 타입 확장
- Code: ~5-10개 파일 (item interaction 관련 로직)
