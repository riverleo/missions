# System Interaction Type 확장

## 완료된 작업
- ✅ repeat_interaction_type → fulfill_interaction_type 리네이밍
- ✅ item_pick을 once_interaction_type에서 분리하여 system_interaction_type으로 이동
- ✅ useInteraction 훅 초기화 및 데이터 페칭 수정

---

## 진행 상태
- ⏳ Task 1: system_interaction_type을 character_interactions, building_interactions에 추가
- ⏳ Task 2: Admin UI에서 system_interaction_type 처리

---

## Task 1: system_interaction_type을 character_interactions, building_interactions에 추가

### 현재 상태

**item_interactions 테이블만 system_interaction_type 지원:**
```sql
create table item_interactions (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references scenarios(id) on delete cascade,
  item_id uuid not null references items(id) on delete cascade,
  once_interaction_type once_interaction_type,
  fulfill_interaction_type fulfill_interaction_type,
  system_interaction_type system_interaction_type,  -- ✅ 있음
  character_id uuid references characters(id) on delete set null,

  constraint chk_item_interaction_type_exclusive check (
    (once_interaction_type IS NOT NULL)::int +
    (fulfill_interaction_type IS NOT NULL)::int +
    (system_interaction_type IS NOT NULL)::int = 1
  ),
  -- ...
);
```

**character_interactions와 building_interactions는 2-way만 지원:**
```sql
create table character_interactions (
  -- ...
  once_interaction_type once_interaction_type,
  fulfill_interaction_type fulfill_interaction_type,
  -- system_interaction_type 없음 ❌

  constraint chk_character_interaction_type_exclusive check (
    (once_interaction_type IS NOT NULL)::int +
    (fulfill_interaction_type IS NOT NULL)::int = 1  -- 2-way만 체크
  ),
  -- ...
);
```

### 목표

세 가지 interaction 테이블 모두 동일한 구조로 통일:
- once_interaction_type (유저가 선택 가능, 한 번 실행)
- fulfill_interaction_type (유저가 선택 가능, 반복 실행하여 욕구/컨디션 충족)
- system_interaction_type (Admin UI에서 생성 가능, 욕구/컨디션 행동에서는 선택 불가)

### 구현 단계

#### Step 1: Database Schema 수정

**기존 마이그레이션 파일 수정:**
- `supabase/migrations/20251225000000_create_interactions.sql`

**변경 내용:**

1. character_interactions에 system_interaction_type 컬럼 추가:
```sql
create table character_interactions (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references scenarios(id) on delete cascade,
  character_id uuid not null references characters(id) on delete cascade,
  once_interaction_type once_interaction_type,
  fulfill_interaction_type fulfill_interaction_type,
  system_interaction_type system_interaction_type,  -- 추가

  constraint uq_character_interactions_scenario_character_once unique (scenario_id, character_id, once_interaction_type),
  constraint uq_character_interactions_scenario_character_fulfill unique (scenario_id, character_id, fulfill_interaction_type),
  constraint uq_character_interactions_scenario_character_system unique (scenario_id, character_id, system_interaction_type),  -- 추가
  constraint chk_character_interaction_type_exclusive check (
    (once_interaction_type IS NOT NULL)::int +
    (fulfill_interaction_type IS NOT NULL)::int +
    (system_interaction_type IS NOT NULL)::int = 1  -- 3-way 체크로 변경
  )
);
```

2. building_interactions에 system_interaction_type 컬럼 추가:
```sql
create table building_interactions (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references scenarios(id) on delete cascade,
  building_id uuid not null references buildings(id) on delete cascade,
  once_interaction_type once_interaction_type,
  fulfill_interaction_type fulfill_interaction_type,
  system_interaction_type system_interaction_type,  -- 추가
  character_id uuid references characters(id) on delete set null,

  constraint uq_building_interactions_scenario_building_once unique (scenario_id, building_id, once_interaction_type),
  constraint uq_building_interactions_scenario_building_fulfill unique (scenario_id, building_id, fulfill_interaction_type),
  constraint uq_building_interactions_scenario_building_system unique (scenario_id, building_id, system_interaction_type),  -- 추가
  constraint chk_building_interaction_type_exclusive check (
    (once_interaction_type IS NOT NULL)::int +
    (fulfill_interaction_type IS NOT NULL)::int +
    (system_interaction_type IS NOT NULL)::int = 1  -- 3-way 체크로 변경
  )
);
```

#### Step 2: psql로 로컬 데이터베이스 직접 수정

```bash
psql postgresql://postgres:postgres@localhost:54322/postgres
```

```sql
-- 1. character_interactions에 system_interaction_type 추가
ALTER TABLE character_interactions
  ADD COLUMN system_interaction_type system_interaction_type;

-- 2. character_interactions unique constraint 추가
ALTER TABLE character_interactions
  ADD CONSTRAINT uq_character_interactions_scenario_character_system
  UNIQUE (scenario_id, character_id, system_interaction_type);

-- 3. character_interactions constraint 업데이트
ALTER TABLE character_interactions
  DROP CONSTRAINT chk_character_interaction_type_exclusive;

ALTER TABLE character_interactions
  ADD CONSTRAINT chk_character_interaction_type_exclusive
  CHECK (
    (once_interaction_type IS NOT NULL)::int +
    (fulfill_interaction_type IS NOT NULL)::int +
    (system_interaction_type IS NOT NULL)::int = 1
  );

-- 4. building_interactions에 system_interaction_type 추가
ALTER TABLE building_interactions
  ADD COLUMN system_interaction_type system_interaction_type;

-- 5. building_interactions unique constraint 추가
ALTER TABLE building_interactions
  ADD CONSTRAINT uq_building_interactions_scenario_building_system
  UNIQUE (scenario_id, building_id, system_interaction_type);

-- 6. building_interactions constraint 업데이트
ALTER TABLE building_interactions
  DROP CONSTRAINT chk_building_interaction_type_exclusive;

ALTER TABLE building_interactions
  ADD CONSTRAINT chk_building_interaction_type_exclusive
  CHECK (
    (once_interaction_type IS NOT NULL)::int +
    (fulfill_interaction_type IS NOT NULL)::int +
    (system_interaction_type IS NOT NULL)::int = 1
  );
```

#### Step 3: TypeScript 타입 재생성

```bash
pnpm supabase gen types --lang=typescript --local > src/lib/types/supabase.generated.ts
```

#### Step 4: 검증

```bash
# TypeScript 체크
pnpm check

# psql로 스키마 확인
psql postgresql://postgres:postgres@localhost:54322/postgres -c "\d character_interactions"
psql postgresql://postgres:postgres@localhost:54322/postgres -c "\d building_interactions"
```

---

## Task 2: Admin UI에서 system_interaction_type 처리

### 현재 상태

Admin UI의 interaction create/update dialogs는 once와 fulfill만 지원:
```typescript
// 예시: item-interactions/create-dialog.svelte
let interactionType: 'once' | 'fulfill' = $state('once');
```

### 목표

1. **Admin UI에서 system_interaction_type 생성/수정 지원**
   - interaction create/update dialog에 'system' 옵션 추가
   - 'once' | 'fulfill' | 'system' 세 가지 중 하나 선택 가능

2. **욕구/컨디션 행동에서는 system interaction 제외**
   - behavior action에서 interaction 선택 시 system interaction 필터링
   - once와 fulfill interaction만 선택 가능

### 구현 단계

#### Step 1: 영향받는 컴포넌트 파악

**Admin interaction dialog (생성/수정):**
1. `src/lib/components/admin/scenarios/[scenarioId]/building-interactions/create-dialog.svelte`
2. `src/lib/components/admin/scenarios/[scenarioId]/item-interactions/create-dialog.svelte`
3. `src/lib/components/admin/scenarios/[scenarioId]/character-interactions/create-dialog.svelte`

**Behavior action dialog (interaction 선택):**
1. `src/lib/components/admin/scenarios/[scenarioId]/need-behavior-actions/create-dialog.svelte`
2. `src/lib/components/admin/scenarios/[scenarioId]/condition-behavior-actions/create-dialog.svelte`

#### Step 2: Interaction create dialog 수정

**변경 전:**
```typescript
let interactionType: 'once' | 'fulfill' = $state('once');
```

**변경 후:**
```typescript
let interactionType: 'once' | 'fulfill' | 'system' = $state('once');
```

**수정 파일:**
- `building-interactions/create-dialog.svelte`
- `item-interactions/create-dialog.svelte`
- `character-interactions/create-dialog.svelte`

**UI 변경:**
```svelte
<!-- Select 또는 RadioGroup에 'system' 옵션 추가 -->
<!-- 라벨 변경: "상호작용 (1회)" → "한번 실행", "욕구 충족 (반복)" → "반복 실행" -->
<Select.Item value="once">한번 실행</Select.Item>
<Select.Item value="fulfill">반복 실행</Select.Item>
<Select.Item value="system">시스템</Select.Item>
```

**라벨 네이밍 변경:**
- `once`: "상호작용 (1회)" → "한번 실행"
- `fulfill`: "욕구 충족 (반복)" → "반복 실행"
- `system`: "시스템" (새로 추가)

#### Step 3: Behavior action dialog 수정

behavior action에서 interaction을 선택할 때 **system interaction 제외:**

**수정 파일:**
- `need-behavior-actions/create-dialog.svelte`
- `condition-behavior-actions/create-dialog.svelte`

**변경 내용:**
```typescript
// Before
const buildingInteractions = $derived(
  Object.values($buildingInteractionStore.data).filter(...)
);

// After - system interaction 필터링
const buildingInteractions = $derived(
  Object.values($buildingInteractionStore.data)
    .filter(...)
    .filter(i => i.system_interaction_type === null)
);

// 동일하게 item_interaction, character_interaction에도 적용
const itemInteractions = $derived(
  Object.values($itemInteractionStore.data)
    .filter(...)
    .filter(i => i.system_interaction_type === null)
);

const characterInteractions = $derived(
  Object.values($characterInteractionStore.data)
    .filter(...)
    .filter(i => i.system_interaction_type === null)
);
```

#### Step 4: state-label.ts 유틸리티 확인

`src/lib/utils/state-label.ts`에 system_interaction_type 관련 라벨 함수 추가:

```typescript
export const systemInteractionTypeLabels: Record<SystemInteractionType, string> = {
  item_pick: '아이템 줍기',
};

export function getSystemInteractionTypeLabel(type: SystemInteractionType): string {
  return systemInteractionTypeLabels[type];
}

export function getSystemInteractionTypeOptions(): SelectOption<SystemInteractionType>[] {
  return Object.entries(systemInteractionTypeLabels).map(([value, label]) => ({
    value: value as SystemInteractionType,
    label,
  }));
}
```

#### Step 5: Interaction panel 수정 (선택사항)

Panel에서 system interaction을 구분하여 표시:

```typescript
// 예시: item-interactions/panel.svelte
const getInteractionTypeLabel = (interaction: ItemInteraction) => {
  if (interaction.system_interaction_type) return 'System';
  if (interaction.once_interaction_type) return 'Once';
  return 'Fulfill';
};

// 렌더링
<Badge variant={interaction.system_interaction_type ? 'secondary' : 'default'}>
  {getInteractionTypeLabel(interaction)}
</Badge>
```

#### Step 6: 검증

```bash
# TypeScript 체크
pnpm check

# Admin UI 동작 확인
pnpm dev
# 1. Interaction 생성 시 'system' 옵션 선택 가능 확인
# 2. Behavior action 생성 시 system interaction이 목록에서 제외되는지 확인
```

---

## 전체 작업 순서

1. **Task 1**: Database schema 수정 (psql + migration 파일)
2. **Task 1**: TypeScript 타입 재생성
3. **Task 2**: Interaction create dialog에 'system' 옵션 추가
4. **Task 2**: Behavior action dialog에서 system interaction 필터링
5. **Task 2**: state-label.ts에 system interaction 라벨 추가
6. **통합 테스트**: 모든 interaction type이 정상 동작하는지 확인

---

## 예상 영향 범위

### Task 1
- **Database**: 2개 테이블 (character_interactions, building_interactions) 스키마 변경
- **Migration**: 1개 파일 수정 (`20251225000000_create_interactions.sql`)
- **TypeScript**: 생성된 타입 자동 업데이트 (CharacterInteraction, BuildingInteraction)

### Task 2
- **Interaction dialogs**: 3개 파일 (building/item/character create-dialog)
- **Behavior action dialogs**: 2개 파일 (need/condition behavior-actions create-dialog)
- **Utils**: 1개 파일 (state-label.ts)
- **Panel** (선택사항): 3개 파일 (building/item/character panel)

---

## 참고: 세 가지 Interaction Type

### once_interaction_type
- **목적**: 한 번만 실행되는 유저 액션
- **예시**: item_use, building_use, building_construct, building_demolish
- **Admin UI**: 생성/수정 가능 ✅
- **Behavior Action**: 선택 가능 ✅

### fulfill_interaction_type
- **목적**: 욕구/컨디션을 충족시키기 위해 반복 실행
- **예시**: building_repair, building_clean, building_use, character_hug
- **Admin UI**: 생성/수정 가능 ✅
- **Behavior Action**: 선택 가능 ✅

### system_interaction_type
- **목적**: 시스템 내부 동작 (숨겨진 interaction)
- **예시**: item_pick (아이템 사용 전 자동으로 줍기)
- **Admin UI**: 생성/수정 가능 ✅
- **Behavior Action**: 선택 불가 ❌ (시스템 전용)
