# 프로젝트 컨벤션

## 버그 해결 원칙

**CRITICAL**: 버그 발견 시 다음 순서를 **반드시** 따를 것:

1. **부분적으로 원인 파악** - 문제의 정확한 원인을 먼저 이해
2. **작게 테스트** - 최소한의 변경으로 가설 검증
3. **동작 확인** - 부분 수정이 문제를 해결하는지 확인
4. **전체 반영** - 동작이 확인된 후에만 전체 코드에 적용

❌ **절대 금지**: 원인 파악 없이 무작정 코드 전체를 수정하는 것

예시:

- 마우스 드래그 버그 발생
- ❌ 나쁜 접근: createBody() 시그니처부터 전부 수정
- ✅ 좋은 접근: 로깅 추가 → 원인 파악 (bounds 계산 문제) → 한 엔티티에만 수정 → 테스트 → 전체 반영

## 코딩 스타일

1. **TypeScript 코드에서는 `undefined` 사용, `null` 사용 안 함** (Supabase DB는 `null` 사용)
2. **함수명은 prop/이벤트 이름과 일치시키기** (`handleSubmit` → `onsubmit`)
3. **Shorthand 문법 선호** (`onsubmit={onsubmit}` → `{onsubmit}`)
4. **도메인명은 명확하게** (`branch` 대신 `questBranch`처럼 생략하지 않기)
5. **Hook을 컴포넌트에서 직접 사용** (prop으로 전달하지 않고)
6. **Radash 유틸리티 라이브러리 우선 사용**
7. **이벤트 핸들러에서 리터럴 함수 자제하기**
   - ❌ `onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}`
   - ✅ `function onsubmit(e: SubmitEvent) { e.preventDefault(); ... }`
8. **로직은 컴포넌트 내부에, 콜백은 결과만 전달**
   - 복잡한 비즈니스 로직을 외부에서 prop으로 주입받지 말고 컴포넌트 내부에 구현
   - 콜백은 처리 결과 데이터만 전달받는 형태로 설계
   - ❌ `onrelayout={() => { /* 복잡한 정렬 로직 */ }}`
   - ✅ `onrelayout={(sortedNodes: Node[]) => { /* 결과만 받아서 처리 */ }}`
9. **여러 컴포넌트에서 사용되는 로직은 별도 파일로 분리**
   - 2개 이상의 컴포넌트에서 동일한 로직을 사용한다면 유틸리티 함수로 추출
   - `$lib/utils/` 또는 관련 도메인 디렉토리에 배치
   - 예: `applyElkLayout()` 함수를 여러 컴포넌트에서 사용하는 경우 별도 파일로 분리
10. **임포트는 명시적으로**

- `import * as` 형태 사용 금지
- ❌ `import * as FlowId from '$lib/utils/flow-id'`
- ✅ `import { createDiceRollNodeId, parseDiceRollNodeId } from '$lib/utils/flow-id'`

## Svelte 5 특화 규칙

1. **Deprecated된 API 사용 금지**
   - ❌ `import { page } from '$app/stores'` (Svelte 4 방식)
   - ✅ `import { page } from '$app/state'` (Svelte 5 runes)
   - stores 기반 API 대신 runes 기반 API 사용

2. **스토어는 단일 진실 공급원(Single Source of Truth)**
   - 모든 데이터는 스토어를 통해 관리되어야 함
   - 컴포넌트에서 prop으로 받은 객체를 직접 수정하지 말 것
   - DB 업데이트 후 두 가지 방식 중 선택:
     - **작은 데이터**: `shouldRefetch=true`로 전체 데이터 다시 불러오기
     - **큰 데이터**: `shouldRefetch=false` + 스토어 내부 데이터 직접 수정

3. **Hook 함수 명명 규칙**
   - 해당 훅의 도메인에 대한 함수는 짧은 이름 사용: `fetch`, `create`, `update`, `remove`
   - 하위 도메인에 대한 함수만 도메인명 포함: `createScenarioQuestBranch`
   - 예시:

     ```typescript
     // useScenarioQuest 훅 내부
     const { fetch, create, admin } = useScenarioQuest();

     // ✅ 좋은 예: 자신의 도메인
     fetch(scenarioId);  // scenarioQuest를 fetch
     admin.create({ ... });  // scenarioQuest를 create

     // ✅ 좋은 예: 하위 도메인
     admin.createScenarioQuestBranch({ ... });  // 하위 도메인이라 이름 포함
     ```

4. **외부 라이브러리 객체는 `$state.raw()` 사용**
   - Matter.js 엔진, DOM 요소 등 외부 라이브러리 객체는 `$state()`가 아닌 `$state.raw()` 사용
   - `$state()`는 값을 Proxy로 감싸서 reactivity를 추적하는데, 외부 라이브러리 객체는 Proxy와 호환되지 않음
   - 예시:

     ```typescript
     // ❌ 나쁜 예: Proxy로 감싸져서 Matter.js가 제대로 동작하지 않음
     engine: Matter.Engine | undefined = $state(undefined);
     container: HTMLDivElement | undefined = $state(undefined);

     // ✅ 좋은 예: Proxy 없이 원본 객체 저장
     engine: Matter.Engine | undefined = $state.raw(undefined);
     container: HTMLDivElement | undefined = $state.raw(undefined);
     ```

   - **증상**: `===` 비교 시 같은 객체인데 `false` 반환, `state_proxy_equality_mismatch` 경고

5. **Context는 컴포넌트 초기화 시점에만 접근 가능**
   - `createContext()`로 생성한 훅(예: `useWorld()`)은 컴포넌트 초기화 시점에만 호출 가능
   - 이벤트 핸들러나 클래스 메서드에서 직접 호출하면 context를 찾지 못함
   - 클래스에서 context가 필요하면 생성자로 전달:

     ```typescript
     // ❌ 나쁜 예: 메서드에서 context 호출 (이벤트 핸들러에서 실패)
     class Camera {
     	screenToWorld() {
     		const container = useWorld().container; // 에러!
     	}
     }

     // ✅ 좋은 예: 생성자로 context 전달
     class Camera {
     	private world: WorldContext;
     	constructor(world: WorldContext) {
     		this.world = world;
     	}
     	screenToWorld() {
     		const container = this.world.container; // OK
     	}
     }

     // 컴포넌트에서 초기화 시점에 context 획득 후 전달
     const world = useWorld();
     const camera = new Camera(world);
     ```

6. **스토어 업데이트는 Immer 사용**
   - Svelte의 reactivity는 참조 변경을 감지하므로 항상 새로운 객체/배열을 생성해야 함
   - **Immer의 `produce`를 사용하여 불변성을 유지하면서 mutable한 코드 작성 가능**
   - Immer는 structural sharing을 통해 성능을 최적화하고, 중첩된 업데이트를 간단하게 만듦
   - 예시:

     ```typescript
     import { produce } from 'immer';

     // ❌ 나쁜 예: Immer 없이 직접 수정 (reactivity 동작 안 함)
     store.update((state) => {
     	const item = state.data?.find((i) => i.id === id);
     	if (item) Object.assign(item, updates);
     	return state; // 같은 참조 반환
     });

     // ✅ 좋은 예: Immer의 produce 사용
     store.update((state) =>
     	produce(state, (draft) => {
     		const item = draft.data?.find((i) => i.id === id);
     		if (item) {
     			Object.assign(item, updates); // draft에서는 직접 수정 가능
     		}
     	})
     );

     // ✅ 좋은 예: 배열에 아이템 추가
     store.update((state) =>
     	produce(state, (draft) => {
     		if (draft.data) {
     			draft.data.push(newItem); // draft에서는 push 가능
     		} else {
     			draft.data = [newItem];
     		}
     	})
     );

     // ✅ 좋은 예: 중첩된 구조 업데이트
     store.update((state) =>
     	produce(state, (draft) => {
     		const narrative = draft.data?.find((n) => n.id === narrativeId);
     		if (narrative?.narrative_nodes) {
     			const node = narrative.narrative_nodes.find((n) => n.id === nodeId);
     			if (node) {
     				node.title = 'New Title'; // 중첩된 객체도 직접 수정 가능
     			}
     		}
     	})
     );
     ```

   - **장점**:
     - 네이티브 JS처럼 직관적인 코드 작성 가능
     - TypeScript 타입 추론이 자동으로 동작
     - Structural sharing으로 성능 최적화
     - 중첩된 업데이트가 간단함

7. **컴포넌트 독립성 유지 - 스토어를 통한 상태 공유**
   - 컴포넌트 간 의존도를 낮추기 위해 **props 대신 스토어 직접 사용**
   - 자식 컴포넌트가 부모로부터 콜백/상태를 props로 받지 않고, 직접 스토어에 접근하여 처리
   - 이렇게 하면 컴포넌트를 독립적으로 사용 가능 (`<Component />` 형태로 깔끔하게)
   - 예시:

     ```typescript
     // ❌ 나쁜 예: props로 콜백과 상태를 전달
     // 부모 컴포넌트
     const { store, setOpen, setPosition } = useWorldTest();
     function ondragstart(e: MouseEvent) { /* ... */ }
     function onclose() { setOpen(false); }

     // 자식 컴포넌트
     <Header ondragstart={ondragstart} onclose={onclose} />

     // ✅ 좋은 예: 자식 컴포넌트에서 스토어 직접 사용
     // 자식 컴포넌트
     const { store, setOpen, setPosition } = useWorldTest();
     function ondragstart(e: MouseEvent) { /* ... */ }
     function onclose() { setOpen(false); }

     // 부모 컴포넌트
     <Header />  // props 없이 깔끔하게 사용
     ```

   - **적용 사례**: `TestWorldPopoverHeader` 컴포넌트는 props 없이 독립적으로 동작

8. **관련 로직은 별도 파일로 분리**
   - localStorage, 파일 I/O 등 특정 책임을 가진 로직은 별도 파일로 분리
   - 훅 파일이 너무 커지는 것을 방지하고 관심사 분리
   - 예시: `use-world-test-storage.ts`에 localStorage 관련 로직 분리
     - `loadFromStorage()`, `saveToStorage()` 함수
     - `WorldTestStoreState`, `StoredState` 타입 정의

9. **상수는 constants.ts에 중앙화**
   - 리터럴 값을 여러 곳에서 사용하지 말고 상수로 정의
   - 도메인별로 `constants.ts` 파일 생성
   - 예시: `src/lib/components/app/world/constants.ts`
     ```typescript
     export const WORLD_WIDTH = 800;
     export const WORLD_HEIGHT = 400;
     export const TILE_SIZE = 6;
     ```

## 데이터베이스 규칙

1. **데이터 무결성은 데이터베이스에서 보장**
   - 데이터 제약사항은 DB constraint/index로 강제해야 함
   - 애플리케이션 코드에서 예외처리로 우회하지 말 것
   - 예: 중복 레코드가 있으면 `.limit(1)` 같은 방법으로 회피하지 말고, DB에서 unique constraint로 원천 차단
   - 이유: 데이터가 실제로 꼬였을 때 애플리케이션에서 에러가 발생해야 문제를 감지할 수 있음

1-0. **RLS 정책 네이밍 컨벤션**

- 정책 이름은 **소문자로 시작**
- 주체는 **복수형** 사용: `anyone`, `admins`, `players`, `owner or admin`
- 예시:

  ```sql
  create policy "anyone can view tiles"
    on tiles for select using (true);

  create policy "admins can insert tiles"
    on tiles for insert
    to authenticated
    with check (is_admin());

  create policy "owner or admin can insert world_buildings"
    on world_buildings for insert
    to authenticated
    with check (is_world_owner(world_id) or is_admin());
  ```

- **world\_ 테이블의 RLS 패턴**: `is_world_owner(world_id)` 함수 사용
  - `is_world_owner(wid uuid)`: 현재 유저가 해당 월드의 소유자인지 확인
  - 정의 위치: `supabase/migrations/20251216100000_create_world_characters.sql`

1-1. **DB default 값 우선 사용**

- 테이블 컬럼에 default 값이 정의되어 있으면 애플리케이션에서 명시적으로 값을 넣지 말 것
- INSERT 시 필수가 아닌 필드는 생략하여 DB의 default 값을 사용하도록 함
- 예: `difficulty_class`에 `default 0`이 설정되어 있다면 insert 시 생략
- 이유: DB의 default 값이 단일 진실 공급원(single source of truth)이 되어야 일관성 유지 가능

2. **user_roles 테이블**
   - 각 유저는 0개 또는 1개의 역할을 가질 수 있음 (unique index로 보장)
   - 역할 없음 = 일반 유저, 역할 1개 = 특정 권한 보유
   - 쿼리 시 `.maybeSingle()` 사용 (0개=정상, 1개=정상, 2개 이상=에러)

3. **Audit 컬럼 (`created_by`, `deleted_by`)**
   - admin이 관리하는 테이블(player\_ 테이블 제외)에는 audit 컬럼 추가
   - `created_by`: `user_roles(id)` 참조, `default current_user_role_id()`
   - `deleted_by`: `user_roles(id)` 참조, soft delete 시 수동 설정
   - `current_user_role_id()`: 현재 로그인 유저의 user_role.id 반환 함수
   - 예시:
     ```sql
     created_at timestamptz not null default now(),
     created_by uuid default current_user_role_id() references user_roles(id) on delete set null,
     deleted_at timestamptz,
     deleted_by uuid references user_roles(id) on delete set null
     ```

4. **Supabase 타입 생성**
   - `src/lib/types/supabase.ts`는 Supabase에서 자동 생성되는 파일 (기존 파일)
   - 타입 생성 명령어: `pnpm supabase gen types typescript --local > src/lib/types/supabase.ts`
   - 이 파일을 직접 수정하지 말고, 필요한 타입 확장은 `src/lib/types/index.ts`에서 할 것

4-1. **DB 리셋 전 확인 필수**

- `supabase db reset` 명령 실행 전에 **반드시 사용자에게 확인**
- 로컬 DB도 리셋하면 기존 데이터가 모두 삭제되므로 주의
- `supabase db reset --linked` (원격 DB)는 Claude가 절대 실행하지 말 것

4-2. **데이터베이스 헬퍼 함수**

Migration 파일에서 정의된 헬퍼 함수들은 RLS 정책과 애플리케이션 로직에서 사용됩니다.

**권한 확인 함수**:

- `is_admin()`: 현재 유저가 관리자인지 확인
  - 반환: `boolean`
  - 용도: RLS 정책에서 admin 권한 체크
  - 예시: `with check (is_admin())`
  - 정의 위치: `20251201084039_create_user_roles.sql`

- `is_me(target_user_id uuid)`: 특정 user_id가 현재 로그인한 유저인지 확인
  - 반환: `boolean`
  - 용도: 본인 데이터 확인
  - 예시: `using (is_me(user_id))`
  - 정의 위치: `20251201000000_create_helper_functions.sql`

- `is_own_player(target_user_id uuid, target_player_id uuid)`: 특정 플레이어가 본인 플레이어인지 확인
  - 반환: `boolean`
  - 용도: 플레이어 데이터 권한 체크 (user_id와 player_id 모두 검증)
  - 예시: `with check (is_own_player(user_id, player_id))`
  - 정의 위치: `20251202181500_add_is_own_player_function.sql`

- `is_world_owner(wid uuid)`: 현재 유저가 특정 월드의 소유자인지 확인
  - 반환: `boolean`
  - 용도: world\_\* 테이블 RLS 정책
  - 예시: `with check (is_world_owner(world_id) or is_admin())`
  - 정의 위치: `20251216100000_create_world_characters.sql`

**유틸리티 함수**:

- `current_user_role_id()`: 현재 유저의 user_role id 반환
  - 반환: `uuid | null`
  - 용도: Audit 컬럼 `created_by` 기본값
  - 예시: `created_by uuid default current_user_role_id()`
  - 정의 위치: `20251201084039_create_user_roles.sql`

**트리거 함수**:

- `update_updated_at()`: updated_at 컬럼을 현재 시각으로 자동 업데이트
  - 반환: `trigger`
  - 용도: UPDATE 트리거에서 사용
  - 예시:
    ```sql
    create trigger update_users_updated_at
      before update on users
      for each row
      execute function update_updated_at();
    ```
  - 정의 위치: `20251201000000_create_helper_functions.sql`

- `create_player_rolled_dice_value()`: 주사위 굴림 시 자동으로 dice_id와 value 설정
  - 반환: `trigger`
  - 용도: INSERT 트리거에서 사용 (player_rolled_dices 테이블)
  - 동작:
    - `dice_id`가 null이면 기본 주사위로 설정
    - `value`가 null이면 1 ~ faces 범위의 랜덤 값 생성
  - 정의 위치: `20251204075000_create_dice_roll.sql`

5. **Constraint 및 Index 명명 규칙**
   - 모든 constraint와 index는 명시적으로 이름을 지정할 것
   - Unique: `uq_<table_name>_<column_name>` (복수 컬럼: `uq_<table_name>_<col1>_<col2>`)
   - Foreign Key: `fk_<table_name>_<column_name>`
   - Index: `idx_<table_name>_<column_name>`
   - Check: `chk_<table_name>_<column_name>`

6. **테이블 생성 스타일**
   - 가능하면 `create table` 문 안에서 모든 constraint를 한번에 정의
   - `alter table`로 나중에 추가하는 것보다 inline constraint 선호
   - **쿼리 편의를 위해 조인용 ID 컬럼 추가**: 하위 테이블에서 상위 테이블을 직접 조인할 수 있도록 중간 테이블의 ID도 함께 저장
     - 예: `need_behavior_actions`에서 `behavior_id`뿐만 아니라 `scenario_id`, `need_id`도 추가
     - 이렇게 하면 중간 조인 없이 바로 쿼리 가능
   - 예:

     ```sql
     create table users (
       id uuid primary key default gen_random_uuid(),
       email text not null,
       name text not null,

       constraint uq_users_email_name unique (email, name)
     );
     ```

6-1. **Migration 파일 구조**

- **테이블과 RLS를 번갈아 배치**: `[table] [rls] [table] [rls]` 패턴
  - 테이블 정의 직후 해당 테이블의 RLS 정책을 바로 작성
  - 이렇게 하면 가독성이 좋고, 관련 코드가 함께 모여있음
- **Index는 나중에 추가**:
  - 초기 migration에서는 index 생성을 생략
  - 성능 테스트 후 필요한 index만 별도 migration으로 추가
  - 이유: 조기 최적화를 피하고, 실제 성능 병목을 측정한 후 대응
- 예시:

  ```sql
  -- 테이블 1
  create table tiles (
    id uuid primary key default gen_random_uuid(),
    scenario_id uuid not null references scenarios(id) on delete cascade,
    name text not null default '',

    constraint uq_tiles_scenario_name unique (scenario_id, name)
  );

  -- 테이블 1의 RLS
  alter table tiles enable row level security;

  create policy "anyone can view tiles"
    on tiles for select using (true);

  create policy "admins can insert tiles"
    on tiles for insert
    to authenticated
    with check (is_admin());

  -- 테이블 2
  create table tile_states (
    id uuid primary key default gen_random_uuid(),
    tile_id uuid not null references tiles(id) on delete cascade,
    type tile_state_type not null default 'idle',

    constraint uq_tile_states_tile_type unique (tile_id, type)
  );

  -- 테이블 2의 RLS
  alter table tile_states enable row level security;

  create policy "anyone can view tile_states"
    on tile_states for select using (true);

  create policy "admins can insert tile_states"
    on tile_states for insert
    to authenticated
    with check (is_admin());
  ```

7. **테이블명과 관계 데이터 명명**
   - 테이블명은 복수형 사용 (예: `dices`, `narrative_dice_rolls`, `narratives`)
   - 단일 관계 데이터를 참조할 때는 단수형 사용 (예: `narrativeNode.narrative_dice_roll`)
   - Supabase 쿼리에서 alias로 단수형 지정:
     ```typescript
     .select(`
       *,
       narrative_dice_roll:narrative_dice_rolls!narrative_nodes_narrative_dice_roll_id_fkey (*)
     `)
     ```
   - 이유: 테이블은 여러 레코드의 집합이므로 복수형, 개별 관계는 단일 객체이므로 단수형

8. **타입 re-export 규칙**
   - `src/lib/types/index.ts`에서 확장된 타입을 re-export할 때는 원래 이름 사용
   - `WithXXX` 같은 suffix를 붙이지 말고, 확장된 타입이 기본 타입이 되도록 함
   - 예:

     ```typescript
     // ❌ 나쁜 예
     export type NarrativeNodeChoiceWithNarrativeDiceRoll = NarrativeNodeChoice & {
     	narrative_dice_roll: NarrativeDiceRoll;
     };

     // ✅ 좋은 예
     type NarrativeNodeChoiceRow = Tables<'narrative_node_choices'>;
     export type NarrativeNodeChoice = NarrativeNodeChoiceRow & {
     	narrative_dice_roll: NarrativeDiceRoll;
     };
     ```

## Types

- 타입 재정의 시 WithXXX 같은 suffix 붙이지 않기. 타입 재정의 시 원본 타입을 덮어쓰는 형태로 export
- 테이블 이름은 복수형으로 작성 (예: `quests`, `narratives`, `dices`)
- 하지만 관계 데이터는 단수형으로 작성 (예: `quest.quest_branches`가 아니라 `quest.quest_branch`)
  - 왜냐하면 Supabase 쿼리에서 `quest_branch:quest_branches!fk_name (*)` 형태로 alias를 사용하기 때문
- `any` 타입은 최후의 수단이 아닌 이상 절대 사용하지 않기. 항상 명시적인 타입을 정의하거나 추론하도록 작성

### 브랜드 ID 타입 (Branded ID Types)

**목적**: 컴파일 타임에 서로 다른 엔티티의 ID가 섞이는 것을 방지

**브랜드 타입 정의**:

```typescript
type Brand<T, B extends string> = T & { readonly __brand: B };

export type BuildingId = Brand<string, 'BuildingId'>;
export type CharacterId = Brand<string, 'CharacterId'>;
export type ScenarioId = Brand<string, 'ScenarioId'>;
// ... 모든 엔티티 ID
```

**도메인 타입에 적용**:

```typescript
// Row 타입 (Supabase에서 가져온 원본)
type BuildingRow = Tables<'buildings'>;

// 메인 타입: ID 필드들을 브랜드 타입으로 교체
export type Building = Omit<BuildingRow, 'id' | 'scenario_id' | 'created_by'> & {
	id: BuildingId;
	scenario_id: ScenarioId;
	created_by: UserRoleId | null;
};

// Insert 타입: 외래 키 ID들을 브랜드 타입으로 교체 (id 제외)
type BuildingInsertRow = TablesInsert<'buildings'>;
export type BuildingInsert = Omit<BuildingInsertRow, 'scenario_id' | 'created_by'> & {
	scenario_id: ScenarioId;
	created_by?: UserRoleId | null;
};

// Update 타입: 모든 ID 필드를 옵셔널 브랜드 타입으로 교체
type BuildingUpdateRow = TablesUpdate<'buildings'>;
export type BuildingUpdate = Omit<BuildingUpdateRow, 'id' | 'scenario_id' | 'created_by'> & {
	id?: BuildingId;
	scenario_id?: ScenarioId;
	created_by?: UserRoleId | null;
};
```

**Supabase 쿼리에서 제네릭 타입 사용**:

```typescript
// ❌ 나쁜 예: 타입 캐스팅
const { data, error } = await supabase
	.from('buildings')
	.insert({ ...building, scenario_id: currentScenarioId })
	.select()
	.single();

store.update((state) =>
	produce(state, (draft) => {
		draft.data[data.id as BuildingId] = data as Building; // 강제 캐스팅
	})
);

// ✅ 좋은 예: 제네릭 타입 명시
const { data, error } = await supabase
	.from('buildings')
	.insert({ ...building, scenario_id: currentScenarioId })
	.select()
	.single<Building>(); // 제네릭으로 타입 지정

store.update((state) =>
	produce(state, (draft) => {
		draft.data[data.id as BuildingId] = data; // data는 이미 Building 타입
	})
);
```

**타입 캐스팅 패턴**:

```typescript
// Record 인덱싱 시
const building = $buildingStore.data[buildingId as BuildingId];

// Route params 사용 시
const buildingId = page.params.buildingId as BuildingId;

// 함수 호출 시
await admin.update(id as BuildingId, changes);

// crypto.randomUUID() 사용 시
const newId = crypto.randomUUID() as WorldId;
```

**금지 사항**:

- ❌ `as any` 사용 절대 금지 - 타입 안전성을 완전히 무시함
- ❌ Insert/Update에서 일반 TablesInsert/TablesUpdate 직접 사용 금지
- ❌ `.single()` 호출 후 `as Type` 캐스팅 금지 - 대신 `.single<Type>()` 사용

**장점**:

- 컴파일 타임에 잘못된 ID 사용 감지
- IDE 자동완성으로 올바른 타입만 제안
- 리팩토링 시 타입 에러로 놓친 부분 발견 가능

## UI 컴포넌트

- **shadcn-svelte 컴포넌트 우선 사용**
  - 네이티브 HTML 요소보다 shadcn-svelte 컴포넌트를 우선적으로 사용
  - 문서: https://www.shadcn-svelte.com/docs/components
  - 사용법이 불확실한 경우 문서 참조

- **shadcn-svelte import 규칙**
  - `import * as` 형태 사용 금지
  - shadcn-svelte 컴포넌트는 이미 접두사가 붙은 이름으로 export됨 (alias 불필요)
  - 예시:

    ```typescript
    // ❌ 나쁜 예
    import * as Select from '$lib/components/ui/select';
    import { Root as SelectRoot } from '$lib/components/ui/select';
    import { Input as InputGroupInput } from '$lib/components/ui/input-group';

    // ✅ 좋은 예
    import { Select, SelectTrigger, SelectContent, SelectItem } from '$lib/components/ui/select';
    import {
    	InputGroup,
    	InputGroupInput,
    	InputGroupText,
    	InputGroupButton,
    } from '$lib/components/ui/input-group';
    import { ButtonGroup, ButtonGroupText } from '$lib/components/ui/button-group';
    ```

- **아이콘 라이브러리**
  - `@tabler/icons-svelte` 사용 (lucide-svelte 사용 금지)
  - Icon 접두사를 붙여서 import
  - 예: `import { IconTrash, IconPlus } from '@tabler/icons-svelte';`
  - **아이콘에 class 속성 넣지 말기** - `class="size-4"` 같은 스타일 속성 사용 금지
    - ❌ `<IconX class="size-4" />`
    - ✅ `<IconX />`

- **Label 사용 금지**
  - `<Label>` 컴포넌트 대신 `InputGroupText` 또는 `ButtonGroupText` 사용
  - `InputGroupText`, `InputGroupButton`은 반드시 `InputGroupAddon`으로 감싸서 사용
  - `InputGroupAddon` 안에 아이콘이나 텍스트를 넣을 때는 반드시 `InputGroupText`로 감싸기
  - `ButtonGroup` 안에 아이콘이나 텍스트를 넣을 때는 반드시 `ButtonGroupText`로 감싸기
  - `InputGroup`은 `Select`와 궁합이 안 맞으므로 `ButtonGroup` + `Select` 조합 사용
  - 예시:

    ```svelte
    <!-- ❌ 나쁜 예: Label 사용 -->
    <Label>타입</Label>
    <Select>...</Select>

    <!-- ❌ 나쁜 예: InputGroup + Select -->
    <InputGroup>
    	<InputGroupAddon><InputGroupText>타입</InputGroupText></InputGroupAddon>
    	<Select>...</Select>
    </InputGroup>

    <!-- ❌ 나쁜 예: ButtonGroup에 아이콘 직접 넣기 -->
    <ButtonGroup>
    	<IconCategory class="size-4" />
    	<Select>...</Select>
    </ButtonGroup>

    <!-- ✅ 좋은 예: ButtonGroup + ButtonGroupText + Select -->
    <ButtonGroup>
    	<ButtonGroupText>
    		<IconCategory class="size-4" />
    	</ButtonGroupText>
    	<Select>...</Select>
    </ButtonGroup>

    <!-- ✅ 좋은 예: InputGroup + Input -->
    <InputGroup>
    	<InputGroupAddon>
    		<InputGroupText>순서</InputGroupText>
    	</InputGroupAddon>
    	<InputGroupInput type="number" />
    </InputGroup>
    ```

- **ButtonGroup/InputGroup 내부 요소 스타일 금지**
  - ButtonGroup이나 InputGroup 안에 Button, Toggle, Select 등을 넣을 때 스타일을 커스텀하지 말 것
  - 이 컴포넌트들은 이미 그룹 내에서 적절한 스타일이 적용되도록 설계됨
  - 예시:

    ```svelte
    <!-- ❌ 나쁜 예: 스타일 커스텀 -->
    <ButtonGroup>
    	<Button variant="ghost" size="icon-sm" class="px-2">...</Button>
    	<SelectTrigger class="h-8 w-auto gap-1 border-0 px-2">...</SelectTrigger>
    </ButtonGroup>

    <!-- ✅ 좋은 예: 기본 스타일 사용 -->
    <ButtonGroup>
    	<Button>...</Button>
    	<SelectTrigger>...</SelectTrigger>
    </ButtonGroup>
    ```

- **InputGroup 내 DropdownMenu 사용 패턴**
  - `InputGroup` 내에서 `DropdownMenu`를 사용할 때는 `InputGroupButton`을 트리거로 사용
  - `DropdownMenuTrigger`의 `child` snippet을 사용하여 props 전달
  - 예시:

    ```svelte
    <InputGroup>
    	<InputGroupInput placeholder="제목" bind:value={title} />
    	<InputGroupAddon align="inline-end">
    		<DropdownMenu>
    			<DropdownMenuTrigger>
    				{#snippet child({ props })}
    					<InputGroupButton {...props} variant="ghost">
    						{selectedLabel}
    					</InputGroupButton>
    				{/snippet}
    			</DropdownMenuTrigger>
    			<DropdownMenuContent align="end">
    				<DropdownMenuRadioGroup bind:value={selectedValue}>
    					<DropdownMenuRadioItem value="">없음</DropdownMenuRadioItem>
    					{#each items as item (item.id)}
    						<DropdownMenuRadioItem value={item.id}>{item.name}</DropdownMenuRadioItem>
    					{/each}
    				</DropdownMenuRadioGroup>
    			</DropdownMenuContent>
    		</DropdownMenu>
    	</InputGroupAddon>
    </InputGroup>
    ```

## 패키지 매니저

- **pnpm 사용** (npm, yarn 사용 금지)
- 명령어 예시:
  - `pnpm install` - 패키지 설치
  - `pnpm check` - svelte-check (타입 체크 + unused variables)
  - `pnpm lint` - prettier (코드 포맷팅)
  - `pnpm dev` - 개발 서버 실행
- ESLint는 사용하지 않음 (svelte-check가 대체)

## Shortcut Stack 시스템

- **스택 기반 단축키 관리**: `$lib/shortcut/store.ts`
  - 단일 레이어가 아닌 스택 기반으로 중첩 지원
  - `StackId`: `'narrative' | 'dice-roll' | 'quest'`
  - `activateStack(id)`: 스택 활성화 (같은 id가 이미 있으면 맨 위로 이동)
  - `deactivateStack(id)`: 스택 비활성화
  - `bindStackEvent({ id, onkeydown, onkeyup })`: 이벤트 바인딩, **cleanup 함수 반환**

- **컴포넌트에서 사용 패턴**:

  ```typescript
  // $effect로 cleanup 함수 자동 호출
  $effect(() =>
    bindStackEvent({
      id: stackId,
      onkeydown: (event) => { ... },
      onkeyup: (event) => { ... },
    })
  );

  // 스택 활성화/비활성화도 $effect로 관리
  $effect(() => {
    if (isActive) {
      activateStack(stackId);
    } else {
      deactivateStack(stackId);
    }
  });
  ```

## Flow ID 유틸리티

- **위치**: `$lib/utils/flow-id.ts`
- **목적**: SvelteFlow에서 사용하는 노드/엣지 ID의 생성 및 파싱을 중앙화
- **규칙**: 모든 SvelteFlow 노드/엣지 ID 생성 로직은 이 파일에 정의
- **함수 패턴**:
  - `create{Type}NodeId(entity)`: 노드 ID 생성 (예: `createNeedNodeId(need)` → `"need-{id}"`)
  - `parse{Type}NodeId(nodeId)`: 노드 ID에서 entity ID 추출
  - `is{Type}NodeId(nodeId)`: 노드 ID 타입 체크
  - `create{Type}EdgeId(...)`: 엣지 ID 생성
  - `is{Type}EdgeId(edgeId)`: 엣지 ID 타입 체크
- **예시**:

  ```typescript
  // ❌ 나쁜 예: 컴포넌트에서 직접 ID 생성
  const nodeId = `need-${need.id}`;
  const entityId = nodeId.replace('need-', '');

  // ✅ 좋은 예: 유틸리티 함수 사용
  import { createNeedNodeId, parseNeedNodeId } from '$lib/utils/flow-id';
  const nodeId = createNeedNodeId(need);
  const entityId = parseNeedNodeId(nodeId);
  ```

- **이점**:
  - ID 형식 변경 시 한 곳만 수정
  - 타입 안전성 보장
  - 일관된 ID 형식 유지

## EntityIdUtils 유틸리티

- **위치**: `$lib/utils/entity-id.ts`
- **목적**: EntityId의 생성, 파싱, 타입 체크를 중앙화
- **함수**:
  - `parse(entityId)`: EntityId를 파싱하여 `{ type, value }` 반환
  - `is(type, entityId)`: EntityId가 특정 타입인지 확인
  - `create(type, id)`: EntityId 생성
- **EntityType**: `'character' | 'building' | 'item'` (타입은 `$lib/types/index.ts`에 정의)
- **예시**:

  ```typescript
  import { EntityIdUtils } from '$lib/utils/entity-id';

  // ✅ 파싱 및 타입 추출
  const { type, value: id } = EntityIdUtils.parse(entityId);

  // ✅ 타입 체크
  if (EntityIdUtils.is('character', entityId)) {
    // entityId는 character 타입
  }

  // ✅ EntityId 생성
  const newEntityId = EntityIdUtils.create('building', buildingId);

  // ❌ 나쁜 예: 직접 문자열 조작
  if (entityId.startsWith('character-')) { ... }
  const id = entityId.replace('character-', '');
  ```

- **패턴**: 파싱 결과를 `$derived`로 캐싱하여 재사용

  ```typescript
  const selectedEntityType = $derived.by(() => {
    if (!$store.selectedEntityId) return undefined;
    const { type } = EntityIdUtils.parse($store.selectedEntityId);
    return type;
  });

  // type을 여러 곳에서 재사용
  if (selectedEntityType === 'building') { ... }
  ```

## RecordFetchState 타입

- `data` 필드는 **항상 정의됨** (non-optional)
- 초기값: `{ status: 'idle', data: {} }`
- `Object.values($store.data)`로 바로 사용 가능 (`?? {}` 불필요)
- 예시:

  ```typescript
  // ✅ 좋은 예
  const items = $derived(Object.values($store.data));

  // ❌ 나쁜 예 (불필요한 fallback)
  const items = $derived(Object.values($store.data ?? {}));
  ```

## Narrative Play 컴포넌트 구조

- **위치**: `$lib/components/app/narrative-node-play/`
- **컴포넌트 구성**:
  - `narrative-node-play.svelte`: 메인 컨테이너, 스택 활성화 관리
  - `narrative-node-play-text.svelte`: text 타입 노드 표시
  - `narrative-node-play-choice.svelte`: choice 타입 노드 표시, 키보드 네비게이션
  - `narrative-node-play-dice-roll.svelte`: 주사위 굴리기 UI
- **keyboard navigation** (choice):
  - `focusedIndex`를 `$state`로 관리
  - ArrowUp/ArrowDown으로 포커스 이동
  - Enter/Space로 선택

## 게임 컨셉

### 앱 개요

- **기본**: 할일 관리 앱
- **게임 요소**: 할일 완료에 동기부여를 주는 게임화(gamification) 요소
- **핵심 구조**: Mission → Foundation → Task
  - **Mission**: 최상위 목표 (예: "건강한 생활")
  - **Foundation**: 미션을 달성하기 위한 기반, 각각 고유한 World를 가짐
  - **Task**: 실제 수행할 할일 항목

### 게임 루프

1. 유저가 할일(Task)을 완료함
2. 코인(자원)을 획득
3. 코인으로 World에 건물을 짓고 캐릭터 욕구 충족
4. 캐릭터들이 살아남음 (또는 굶어 죽음)
5. **할일 완료 → 캐릭터들의 신앙(Faith) 상승**

### 핵심 메카닉: 기도(Prayer)

- 캐릭터들은 플레이어를 "신"처럼 여김
- 캐릭터들이 플레이어에게 할일 완료를 "기도"함
- 플레이어가 할일을 완료하면 캐릭터들의 신앙이 높아짐
- **동기부여**: "내 캐릭터들이 나를 믿고 기다리고 있다" → 할일 완료 동기

### 캐릭터 욕구 시스템 (Utility AI)

캐릭터들은 여러 욕구(Needs)를 가지며, 각 욕구의 충족도에 따라 행동을 결정함

| 욕구             | 설명                 | 충족 방법              |
| ---------------- | -------------------- | ---------------------- |
| Hunger (배고픔)  | 음식이 필요함        | 음식 건물에서 식사     |
| Fatigue (피로)   | 휴식이 필요함        | 집에서 수면            |
| Faith (신앙)     | 플레이어에 대한 믿음 | **할일 완료 시 상승**  |
| Happiness (행복) | 전반적인 만족도      | 다른 욕구 충족 시 상승 |

- **Faith가 핵심**: 다른 욕구는 게임 내에서 충족 가능하지만, Faith는 플레이어의 할일 완료에만 의존
- Faith가 낮으면 캐릭터들이 절망하거나 떠날 수 있음

### 욕구 시스템 DB 설계

```
needs (욕구 정의)
├── need_fulfillments (충족 방법)
├── character_needs (캐릭터 타입별 스켈레톤)
└── world_character_needs (런타임 값)
```

**needs 테이블**:

- `scenario_id`: not null, 시나리오별 욕구 정의
- `decay_per_tick`: tick당 감소량 (게임 루프에서 고정 간격으로 처리)
- `max_value`, `initial_value`: 욕구 값 범위

**need_fulfillments 테이블**:

- 하나의 욕구에 여러 충족 방법 가능
- `fulfillment_type`: enum (`'building'`, `'task'`, `'item'`, `'idle'`)
- `building_id`: type이 `'building'`일 때 설정
- `amount`: 충족 시 증가량

**character_needs 테이블** (어드민 설정):

- 캐릭터 타입이 어떤 욕구를 가지는지 정의
- `decay_multiplier`: 캐릭터별 감소 속도 배율 (예: 농부는 1.5배 빨리 배고파짐)

**world_character_needs 테이블** (런타임):

- 월드에 배치된 캐릭터의 실제 욕구 값
- `scenario_id`, `user_id`, `player_id`, `world_id`, `character_id`, `world_character_id`, `need_id`
- `value`: 현재 충족도 (0 ~ max_value)

### 행동 시스템 (Behavior Systems)

게임에는 세 가지 행동 시스템이 있으며, 각각 다른 트리거와 목적을 가짐:

#### 1. 욕구 행동 (Need Behaviors)

- **트리거**: 캐릭터의 특정 욕구 < 임계점
- **액션**: 건물/아이템/캐릭터 사용하여 욕구 충족
- **예시**: "배고픔 50 이하인 경우 식당에서 식사"
- **DB 구조**:
  - `need_behaviors`: 행동 정의 (need_id, need_threshold)
  - `need_behavior_actions`: 행동 액션 체인 (캐릭터 애니메이션, 지속 시간 등)

#### 2. 컨디션 행동 (Condition Behaviors)

- **트리거**: 건물의 특정 컨디션 < 임계점
- **대상**: 특정 캐릭터 또는 모든 캐릭터 (character_id null이면 모두)
- **액션**: 건물에 대한 행동 (철거, 수리, 사용 등)
- **예시**: "청결도 50 이하인 경우 건물 철거"
- **DB 구조**:
  - `condition_behaviors`: 행동 정의 (condition_id, condition_threshold, character_id, character_behavior_type)
  - `condition_behavior_actions`: 행동 액션 체인 (캐릭터 애니메이션, offset, scale, rotation 등)

#### 3. 아이템 행동 (Item Behaviors)

- **트리거**: 아이템 사용
- **액션**: 아이템 사용 효과 (애니메이션, 상태 변화 등)
- **예시**: "도끼 사용 시 휘두르기 애니메이션"
- **DB 구조**:
  - `item_behaviors`: 행동 정의 (item_id, character_behavior_type)
  - `item_behavior_actions`: 행동 액션 체인 (캐릭터 + 아이템 애니메이션, offset, scale, rotation 등)

#### Behavior Actions 공통 필드

모든 behavior_actions 테이블은 다음 공통 패턴을 따름:

- `duration_ticks`: 액션 지속 시간 (틱 단위)
- `character_body_state_type`: 캐릭터 바디 상태 (idle, walk, run, jump)
- `character_face_state_type`: 캐릭터 표정 상태 (idle, happy, sad, angry)
- `root`: 시작 액션 여부 (각 behavior당 하나만 root=true)
- `success_*_action_id`: 성공 시 다음 액션
- `failure_*_action_id`: 실패 시 다음 액션

**행동별 차이점**:

- `need_behavior_actions`: 캐릭터만 제어 (건물/아이템 없음)
- `condition_behavior_actions`: 캐릭터를 건물 위에 배치 (character_offset_x/y, character_scale, character_rotation)
- `item_behavior_actions`: 캐릭터가 아이템을 손에 들고 사용 (item_offset_x/y, item_scale, item_rotation)

### 시나리오 시스템

- **시나리오** = 게임 월드의 위기 상황
- 첫 번째 시나리오: **"도람푸의 역습"**
  - 배경: 미국에 딸기/감자 팔아서 먹고 살던 나라
  - 사건: 관세 10000% 맞고 수출 끊김
  - 결과: 나라 사람들이 굶어가는 상황
  - 해결: 유저가 할일을 완료해서 주민들을 살려야 함

### 나라 뷰 (Country View)

- **시각화**: 선 하나 위에 주민들이 살고 있는 모습
- **주민**: 배고픔 상태, 행동 상태 등을 가짐
- **건물**: 집 등 (돈으로 건설)

### State 시스템 (공통 패턴)

모든 엔티티(Building, Item, Tile)는 **상태(state) 시스템**을 가지며, 각 상태는 애니메이션과 활성화 조건을 정의합니다.

**공통 구조**:

- `*_states` 테이블: 상태별 애니메이션 + 활성화 조건
- 런타임에 조건을 확인하여 현재 어떤 상태를 보여줄지 결정

**엔티티별 조건 타입**:

| 엔티티           | 조건 기준                        | states 테이블 필드                                   |
| ---------------- | -------------------------------- | ---------------------------------------------------- |
| Building         | condition 값 (청결도, 안정성 등) | `condition_id`, `min_value`, `max_value`, `priority` |
| Character (Face) | need 값 (배고픔, 행복 등)        | `need_id`, `min_value`, `max_value`, `priority`      |
| Item             | durability                       | `min_durability`, `max_durability`                   |
| Tile             | durability                       | `min_durability`, `max_durability`                   |

**Building State 결정 로직**:

```sql
-- priority 높은 순으로 정렬하여 첫 번째 매칭되는 state 사용
SELECT * FROM building_states
WHERE building_id = '...'
  AND condition_id = '...'
  AND min_value <= current_value
  AND max_value >= current_value
ORDER BY priority DESC
LIMIT 1;

-- condition_id가 null이면 조건 없는 fallback state (보통 'idle')
SELECT * FROM building_states
WHERE building_id = '...'
  AND condition_id IS NULL;
```

**Item/Tile State 결정 로직**:

```sql
-- 현재 durability에 맞는 state 찾기
SELECT * FROM item_states
WHERE item_id = '...'
  AND min_durability <= current_durability
  AND max_durability >= current_durability
LIMIT 1;

-- 매칭되는 state 없으면 'idle' 사용
```

**예시 - Building States**:

```sql
INSERT INTO building_states VALUES
  (building_id, 'damaged', 'atlas1', condition_id: '안정성', min: 0, max: 50, priority: 1),
  (building_id, 'dirty', 'atlas2', condition_id: '청결도', min: 0, max: 30, priority: 2),
  (building_id, 'idle', 'atlas3', condition_id: NULL, min: 0, max: 100, priority: 0);

-- 안정성 40, 청결도 20인 건물:
-- 1. 안정성 체크 (40 in [0,50]) → 'damaged' (priority 1)
```

**예시 - Character Face States**:

```sql
INSERT INTO character_face_states VALUES
  (character_id, 'sad', 'face-sad', need_id: '배고픔', min: 0, max: 30, priority: 1),     -- 굶주림
  (character_id, 'angry', 'face-angry', need_id: '행복', min: 0, max: 20, priority: 2),  -- 불행
  (character_id, 'happy', 'face-happy', need_id: '행복', min: 80, max: 100, priority: 3),
  (character_id, 'idle', 'face-idle', need_id: NULL, min: 0, max: 100, priority: 0);

-- 배고픔 20, 행복 50인 캐릭터:
-- 1. 배고픔 체크 (20 in [0,30]) → 'sad' (priority 1)
```

**예시 - Item States**:

```sql
INSERT INTO item_states VALUES
  (item_id, 'idle', 'axe-normal', min: 50, max: 100),
  (item_id, 'damaged', 'axe-chipped', min: 20, max: 49),
  (item_id, 'broken', 'axe-broken', min: 0, max: 19);

-- durability 35인 아이템:
-- 35 in [20,49] → 'damaged'
```

**world_items.state 제거**:

- 이전: `world_items.state` 컬럼에 상태 저장
- 현재: `durability_ticks` 값으로 런타임에 `item_states` 조건 체크하여 계산
- 이유: 단일 진실 공급원 (조건 정의가 DB에 있으므로)

**State 조건 관리 UI 패턴**:

어드민 UI에서 각 state의 활성화 조건을 편집할 수 있는 패턴을 따릅니다.

**Hook 추가 사항**:

```typescript
// use-{entity}.ts
type {Entity}StateDialogState =
  | { type: 'update'; {entity}StateId: {Entity}StateId }
  | undefined;

const stateDialogStore = writable<{Entity}StateDialogState>(undefined);

function openStateDialog(state: NonNullable<{Entity}StateDialogState>) {
  stateDialogStore.set(state);
}

function closeStateDialog() {
  stateDialogStore.set(undefined);
}

return {
  // ...
  stateDialogStore: stateDialogStore as Readable<{Entity}StateDialogState>,
  openStateDialog,
  closeStateDialog,
  // ...
};
```

**컴포넌트 구조**:

- `{entity}-state-update-dialog.svelte`: 조건 편집 다이얼로그
  - Building: condition 선택, min/max value, priority 입력
  - Character Face: need 선택, min/max value, priority 입력
  - Item/Tile: min/max durability 입력 (내구도 기반, priority 없음)
- `{entity}-state-item.svelte`: action snippet에 조건 preview 버튼 추가
  - Building: `${condition.name} (${min}~${max})` + priority badge
  - Character Face: `${need.name} (${min}~${max})` + priority badge
  - Item: `내구도 (${min}~${max} 틱)`

**공통 패턴**:

```typescript
// Preview 버튼 스타일
<Button
  variant={hasCondition ? 'ghost' : 'outline'}  // 조건 있으면 ghost, 없으면 outline
  size="sm"
  disabled={!state || type === 'idle'}
  onclick={onConditionClick}
>
  {#if hasCondition}
    <Badge variant="secondary">{state.priority}</Badge>  // priority가 있는 경우만
  {/if}
  {preview}
</Button>
```

**다이얼로그 입력 필드**:

```svelte
<!-- Building/Character Face: Dropdown으로 condition/need 선택 -->
<InputGroup>
	<InputGroupAddon align="inline-start">
		<Tooltip>
			<TooltipTrigger>
				{#snippet child({ props })}
					<InputGroupButton {...props}>조건</InputGroupButton>
				{/snippet}
			</TooltipTrigger>
			<TooltipContent>설명...</TooltipContent>
		</Tooltip>
	</InputGroupAddon>
	<InputGroupInput placeholder="최소" type="number" bind:value={minValue} />
	<InputGroupText>~</InputGroupText>
	<InputGroupInput placeholder="최대" type="number" bind:value={maxValue} />
	<InputGroupAddon align="inline-end">
		{#if selectedCondition}
			<InputGroupText>최대 {selectedCondition.max_value.toLocaleString()}</InputGroupText>
		{/if}
	</InputGroupAddon>
</InputGroup>

<!-- Item/Tile: 내구도 입력 (max_durability_ticks 표시) -->
<InputGroup>
	<InputGroupAddon align="inline-start">
		<Tooltip>
			<TooltipTrigger>
				{#snippet child({ props })}
					<InputGroupButton {...props}>내구도</InputGroupButton>
				{/snippet}
			</TooltipTrigger>
			<TooltipContent>이 상태가 활성화되는 내구도 범위를 설정합니다</TooltipContent>
		</Tooltip>
	</InputGroupAddon>
	<InputGroupInput
		type="number"
		bind:value={minDurability}
		disabled={!item?.max_durability_ticks}
	/>
	<InputGroupText>~</InputGroupText>
	<InputGroupInput
		type="number"
		bind:value={maxDurability}
		disabled={!item?.max_durability_ticks}
	/>
	<InputGroupAddon align="inline-end">
		{#if item?.max_durability_ticks}
			<InputGroupText>틱 (최대 {item.max_durability_ticks.toLocaleString()} 틱)</InputGroupText>
		{:else}
			<InputGroupText>최대 내구도 없음</InputGroupText>
		{/if}
	</InputGroupAddon>
</InputGroup>
```

**숫자 포맷팅**:

- 천단위 콤마: `number.toLocaleString()` 사용
- 예: `max_durability_ticks.toLocaleString()` → "1,000"

### 타일 시스템 (Tile System)

타일은 게임 월드의 지형을 구성하는 기본 단위입니다. 각 타일은 재사용 가능한 타입으로 정의되며, 여러 지형에서 공유될 수 있습니다.

**DB 구조**:

```
tiles (타일 타입 정의)
├── tile_states (타일 스프라이트 상태)
├── terrains_tiles (terrain과 N:N 매핑)
└── world_tile_maps (월드별 타일맵)
```

**tiles 테이블** (재사용 가능한 타일 타입):

- `scenario_id`: 시나리오별 타일 정의
- `name`: 타일 이름 (시나리오 내 유니크)

**tile_states 테이블** (타일 스프라이트 + 조건):

- `tile_id`: 타일 참조
- `type`: tile_state_type enum (현재는 'idle'만 존재)
- 스프라이트 정보: `atlas_name`, `frame_from`, `frame_to`, `fps`, `loop` (loop_mode 타입)
- 활성화 조건: `min_durability`, `max_durability` (기본값 0~100)

**terrains_tiles 테이블** (N:N 매핑):

- `terrain_id`, `tile_id`: 지형과 타일 연결
- `scenario_id`: 조인 편의를 위한 중복 컬럼
- 용도: 어드민 UI에서 플로우차트로 시각화

**world_tile_maps 테이블** (월드별 타일맵 - sparse storage):

- `world_id`, `terrain_id`: 월드와 지형 참조
- `data`: JSONB 타입, `{"x,y": {"tile_id": "...", "durability": 100}, ...}` 형식
  - 타일이 배치된 좌표만 저장 (sparse data)
  - 각 타일은 `tile_id`와 `durability` 정보 포함
  - 빈 공간은 key 없음 (용량 효율적)
- `scenario_id`, `user_id`, `player_id`: 조인 편의를 위한 중복 컬럼
- unique constraint: `(world_id, terrain_id)` - world당 terrain마다 하나의 타일맵

**JSONB 타일맵 사용 예시**:

```typescript
// 특정 좌표의 타일 정보 가져오기 - O(1)
SELECT data->'5,3' as tile_data FROM world_tile_maps WHERE world_id = '...';
// 결과: {"tile_id": "...", "durability": 100}

// 타일 배치
UPDATE world_tile_maps
SET data = jsonb_set(data, '{5,3}', '{"tile_id": "tile-uuid", "durability": 100}')
WHERE world_id = '...';

// 내구도만 변경
UPDATE world_tile_maps
SET data = jsonb_set(data, '{5,3,durability}', '80')
WHERE world_id = '...';

// 타일 제거
UPDATE world_tile_maps
SET data = data - '5,3'
WHERE world_id = '...';
```

**설계 패턴**:

- **재사용 가능한 타입 + 상태 패턴**: tiles는 타입 정의, tile_states는 애니메이션 상태
- **N:N 매핑 테이블**: terrains_tiles로 지형과 타일 관계 표현
- **Sparse Storage 패턴**: JSONB로 좌표→타일 매핑, 빈 공간은 저장 안 함
- **조인 편의 컬럼**: 하위 테이블에 상위 ID 중복 저장 (중간 조인 없이 직접 쿼리 가능)
- **동적 맵 크기**: terrain SVG 크기에 따라 맵 크기 동적 결정

### 기술 스택 (나라 뷰)

| 역할       | 라이브러리                                               |
| ---------- | -------------------------------------------------------- |
| 물리/위치  | Matter.js                                                |
| 애니메이션 | sprite-animator (`$lib/components/app/sprite-animator/`) |

### sprite-animator

- **위치**: `$lib/components/app/sprite-animator/`
- **구성**:
  - `sprite-animator.svelte.ts`: SpriteAnimator 클래스 (init, play, stop)
  - `sprite-animator-renderer.svelte`: CSS background-position으로 렌더링
  - `character-sprite-animator.svelte`: 캐릭터 + 얼굴 + 손에 든 아이템 렌더링
  - `building-sprite-animator.svelte`: 건물 + 건물 위 캐릭터 렌더링
- **루프 모드**: `loop`, `once`, `ping-pong`, `ping-pong-once`
- **스프라이트 시트**: `$lib/assets/atlas/generated/`에서 로드
- **Transform 적용 순서**:
  - CharacterSpriteAnimator (손에 든 아이템): `translate → scale → rotate`
  - BuildingSpriteAnimator (건물 위 캐릭터): `translate → scale → rotate`
  - 예시:

    ```typescript
    // CharacterSpriteAnimator의 handTransform
    `translate(${x}px, ${y}px) scale(${heldItemScale}) rotate(${heldItemRotation}deg)`
    // BuildingSpriteAnimator의 characterTransform
    `translate(${x}px, ${y}px) scale(${characterScale}) rotate(${characterRotation}deg)`;
    ```

### World 컴포넌트 (Matter.js 물리 월드)

- **위치**: `$lib/components/app/world/world.svelte`
- **스타일**: **횡스크롤 2D 사이드뷰** (산소미포함과 유사)
  - 중력 기반 이동
  - 바닥과 사다리를 통한 이동
  - 점프 불가능 (y축 자유 이동 제한)
- **주요 기능**:
  - SVG 지형 로딩 및 물리 바디 생성
  - 고정 크기 캔버스 (width/height props로 제어)
  - 디버그 모드로 물리 충돌 영역 시각화
- **Props**:
  - `width: number` - 월드 너비 (기본값: 800)
  - `height: number` - 월드 높이 (기본값: 400)
  - `worldId: WorldId` - 월드 ID
  - `debug?: boolean` - 디버그 모드 (물리 바디 표시)
  - `oncamerachange?: (camera: Camera) => void` - 카메라 변경 콜백
- **WorldContext 클래스**:
  - `load({ element, width?, height? })`: 월드 초기화
    - element: HTMLDivElement (Matter.js 렌더러가 붙을 DOM)
    - width, height: 기본값 각각 800, 400
  - `reload()`: 지형 및 엔티티 재로드 (terrain 변경 시)
  - `blueprint`: WorldContextBlueprint 인스턴스 (건물 배치 미리보기)
- **SVG → 물리 바디 변환 로직**:
  - `fill && stroke` 둘 다 있으면: fill은 다각형, stroke는 선
  - `fill`만 또는 `stroke`만 있으면: 선으로 처리 (벡터 브러쉬 대응)
  - 선은 얇은 사각형(rectangle)으로 생성
- **pathseg 폴리필**: Matter.js의 `Svg.pathToVertices` 사용을 위해 필요

### Pathfinder (경로 탐색)

- **위치**: `$lib/components/app/world/pathfinder.ts`
- **라이브러리**: PathFinding.js (A\* 알고리즘)
- **설정**:
  - `PATHFINDING_TILE_SIZE = 4` (경로 탐색용 타일 크기)
  - `allowDiagonal: false` (횡스크롤이므로 대각선 이동 없음)
- **좌표 변환**:
  - `pixelToTileIndex(pixel)`: 픽셀 → 타일 인덱스
  - `tileIndexToPixel(tile)`: 타일 인덱스 → 타일 중심 픽셀
- **주요 메서드**:
  - `findPath(fromX, fromY, toX, toY)`: 픽셀 좌표로 경로 탐색, PathPoint[] 반환
  - `smoothPath(path)`: 불필요한 중간점 제거
  - `setWalkable(tileX, tileY, walkable)`: 타일 이동 가능 여부 설정
  - `blockRect(tileX, tileY, tileCols, tileRows)`: 사각형 영역 이동 불가 설정
- **TODO**: 사다리 시스템 구현 시 walkable 그리드 로직 추가 필요

### WorldBlueprint 시스템 (건물 배치 미리보기)

- **위치**: `$lib/components/app/world/context/world-context-blueprint.svelte.ts`
- **목적**: 건물을 배치하기 전에 타일 그리드와 미리보기를 표시
- **WorldContextBlueprint 클래스**:
  - `cursor: WorldBlueprintCursor | undefined` - 현재 마우스 커서를 따라다니는 건물 미리보기
    - `building`: 배치할 건물 데이터
    - `tileX`, `tileY`: 좌상단 타일 좌표
  - `getOverlappingCells()`: 현재 커서와 기존 건물이 겹치는 셀 계산
  - `canPlace`: 겹치는 셀이 없는지 여부 (getter)
- **WorldBlueprintCursor 타입**:
  - `$lib/components/app/world/context/index.ts`에 정의
  - 인터페이스: `{ building: Building; tileX: number; tileY: number }`
- **컴포넌트 구조**:
  - `world-blueprint.svelte`: 타일 그리드 렌더링 + WorldBlueprintCursor 포함
  - `world-blueprint-cursor.svelte`: 건물 미리보기 + 셀 하이라이트 (겹침 표시)
- **사용 패턴**:
  - `cursor`가 있으면 자동으로 그리드와 미리보기 표시
  - `cursor`를 `undefined`로 설정하면 비활성화
  - 예시:

    ```typescript
    // 건물 배치 시작
    world.blueprint.cursor = {
    	building: selectedBuilding,
    	tileX: mouseToTileX,
    	tileY: mouseToTileY,
    };

    // 배치 가능 여부 확인
    if (world.blueprint.canPlace) {
    	// 건물 배치 로직
    }

    // 배치 종료
    world.blueprint.cursor = undefined;
    ```

## Storage 유틸리티

- **위치**: `$lib/utils/storage.ts`
- **함수**:
  - `getAvatarUrl(supabase, player)` - 플레이어 아바타 URL
  - `uploadAvatar(supabase, player, file)` - 아바타 업로드
  - `getGameAssetUrl(supabase, type, target)` - 게임 에셋 URL
  - `uploadGameAsset(supabase, type, target, file)` - 게임 에셋 업로드
- **GameAssetType**: `'terrain' | 'item'`
- **target 패턴**: `{ id: string; game_asset: string | null }`
- **반환값**: 실패 시 빈 문자열 `''` 반환, 에러는 console.error로 출력

## $effect로 prop 변경 감지 패턴

- prop 변경 시 특정 로직을 실행해야 할 때 사용
- 이전 값과 비교하여 변경 여부 판단
- 예시:
  ```typescript
  let prevGameAsset: string | null | undefined = terrain?.game_asset;
  $effect(() => {
  	const currentGameAsset = terrain?.game_asset;
  	if (currentGameAsset !== prevGameAsset && engine) {
  		prevGameAsset = currentGameAsset;
  		// 변경 시 실행할 로직
  	}
  });
  ```
- **성능 고려**: 무거운 작업(SVG 파싱 등)과 가벼운 작업(스타일 변경 등)은 별도 $effect로 분리

  ```typescript
  // 무거운 작업: terrain 변경 시에만 실행
  $effect(() => {
  	/* SVG 재로딩 */
  });

  // 가벼운 작업: debug 변경 시 기존 바디 스타일만 업데이트
  $effect(() => {
  	const bodies = Composite.allBodies(engine.world);
  	for (const body of bodies) {
  		body.render.visible = debug;
  	}
  });
  ```

- **반응성 추적 주의사항**: `$effect` 내에서 사용하는 모든 reactive 값은 자동으로 의존성에 추가됨
  - 마우스 좌표 등 자주 변경되는 값을 추적하면 과도한 재실행 발생
  - **잘못된 예**: `untrack()`으로 감싸면 변경 시 업데이트되지 않음
    ```typescript
    // ❌ 나쁜 예: mouseX, mouseY 변경 시 cursor가 업데이트되지 않음
    $effect(() => {
    	const pos = untrack(() => {
    		return { x: mouseX, y: mouseY };
    	});
    	world.blueprint.cursor = { ...pos };
    });
    ```
  - **올바른 예**: 필요한 값은 직접 추적
    ```typescript
    // ✅ 좋은 예: mouseX, mouseY 변경 시 cursor가 업데이트됨
    $effect(() => {
    	const pos = { x: mouseX, y: mouseY };
    	world.blueprint.cursor = { ...pos };
    });
    ```
  - **성능 최적화가 필요한 경우**: `$derived`로 분리하여 선택적으로 추적

    ```typescript
    const throttledPos = $derived.by(() => {
    	// 필요한 경우 throttle 로직 추가
    	return { x: mouseX, y: mouseY };
    });

    $effect(() => {
    	world.blueprint.cursor = { ...throttledPos };
    });
    ```

## Supabase Storage 버킷

- **avatars**: 플레이어 아바타 이미지
  - 경로: `{player.id}/{filename}`
- **game-assets**: 게임 에셋 (지형, 아이템 등)
  - 경로: `{type}/{target.id}/{filename}`
  - 파일 크기 제한: 10MB
  - public bucket (누구나 조회 가능)
  - 업로드/삭제는 admin만 가능

## Atlas 빌드 시스템

- **위치**: `vite/vite-plugin-atlas.ts`
- **소스**: `src/lib/assets/atlas/sources/` 하위 폴더
- **출력**: `src/lib/assets/atlas/generated/`
- **동작**:
  - sources 폴더 내 각 하위 폴더를 스프라이트 시트로 생성
  - 이미지 파일들을 번호순으로 정렬하여 grid 형태로 배치
  - ImageMagick `montage` 명령으로 PNG 생성
  - 메타데이터 JSON 파일 동시 생성
- **메타데이터 형식**:
  ```json
  {
  	"type": "sprite",
  	"frameWidth": 1080,
  	"frameHeight": 1080,
  	"columns": 3,
  	"rows": 2,
  	"frameCount": 5
  }
  ```
- **개발 모드**: 파일 변경 시 자동 재생성 + HMR
- **캐릭터 애니메이션**: 스토리지 없이 atlas에서 직접 로드

## 어드민 페이지 구조

- **패턴**: 각 도메인별로 동일한 구조 사용
- **라우트 구조**:
  ```
  src/routes/admin/scenarios/[scenarioId]/{domain}/
  ├── +layout.svelte      # {Domain}Aside 포함
  ├── +page.svelte        # 선택 안내 메시지
  └── [{domain}Id]/
      └── +page.svelte    # 상세 페이지 + {Domain}Panel
  ```
- **컴포넌트 구조** (`src/lib/components/admin/{domain}/`):
  - `{domain}-aside.svelte`: 사이드바 (목록 토글, 추가/삭제 버튼)
  - `{domain}-command.svelte`: 검색 가능한 목록
  - `{domain}-create-dialog.svelte`: 생성 다이얼로그
  - `{domain}-delete-dialog.svelte`: 삭제 확인 다이얼로그
  - `{domain}-panel.svelte`: 하단 패널 (편집 UI)
- **Hook 구조** (`src/lib/hooks/use-{domain}.ts`):
  - `store`: 데이터 스토어 (RecordFetchState)
  - `dialogStore`: 다이얼로그 상태
  - `fetch(scenarioId)`: 시나리오별 데이터 로드
  - `openDialog/closeDialog`: 다이얼로그 제어
  - `admin.create/update/remove`: CRUD 함수
- **초기화**: `useScenario().init(scenarioId)`에서 모든 도메인 fetch 호출
- supabase db reset은 진행 전 꼭 물어보고 진행하기.
