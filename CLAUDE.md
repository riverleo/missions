# 프로젝트 컨벤션

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

## 데이터베이스 규칙

1. **데이터 무결성은 데이터베이스에서 보장**
   - 데이터 제약사항은 DB constraint/index로 강제해야 함
   - 애플리케이션 코드에서 예외처리로 우회하지 말 것
   - 예: 중복 레코드가 있으면 `.limit(1)` 같은 방법으로 회피하지 말고, DB에서 unique constraint로 원천 차단
   - 이유: 데이터가 실제로 꼬였을 때 애플리케이션에서 에러가 발생해야 문제를 감지할 수 있음

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
    import { InputGroup, InputGroupInput, InputGroupText, InputGroupButton } from '$lib/components/ui/input-group';
    import { ButtonGroup, ButtonGroupText } from '$lib/components/ui/button-group';
    ```

- **아이콘 라이브러리**
  - `@tabler/icons-svelte` 사용 (lucide-svelte 사용 금지)
  - Icon 접두사를 붙여서 import
  - 예: `import { IconTrash, IconPlus } from '@tabler/icons-svelte';`

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

| 욕구 | 설명 | 충족 방법 |
|------|------|----------|
| Hunger (배고픔) | 음식이 필요함 | 음식 건물에서 식사 |
| Fatigue (피로) | 휴식이 필요함 | 집에서 수면 |
| Faith (신앙) | 플레이어에 대한 믿음 | **할일 완료 시 상승** |
| Happiness (행복) | 전반적인 만족도 | 다른 욕구 충족 시 상승 |

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

### 기술 스택 (나라 뷰)

| 역할 | 라이브러리 |
|------|-----------|
| 물리/위치 | Matter.js |
| 상태 머신 | XState |
| 애니메이션 | sprite-animator (`$lib/components/app/sprite-animator/`) |

### sprite-animator

- **위치**: `$lib/components/app/sprite-animator/`
- **구성**:
  - `sprite-animator.svelte.ts`: SpriteAnimator 클래스 (init, play, stop)
  - `sprite-animator-renderer.svelte`: CSS background-position으로 렌더링
- **루프 모드**: `loop`, `once`, `ping-pong`, `ping-pong-once`
- **스프라이트 시트**: `$lib/assets/atlas/generated/`에서 로드

### World 컴포넌트 (Matter.js 물리 월드)

- **위치**: `$lib/components/app/world/world.svelte`
- **스타일**: **횡스크롤 2D 사이드뷰** (산소미포함과 유사)
  - 중력 기반 이동
  - 바닥과 사다리를 통한 이동
  - 점프 불가능 (y축 자유 이동 제한)
- **주요 기능**:
  - SVG 지형 로딩 및 물리 바디 생성
  - 반응형 캔버스 (ResizeObserver로 컨테이너 크기 감지)
  - 디버그 모드로 물리 충돌 영역 시각화
- **Props**:
  - `terrain?: Terrain` - 지형 데이터 (game_asset 포함)
  - `debug?: boolean` - 디버그 모드 (물리 바디 표시)
- **SVG → 물리 바디 변환 로직**:
  - `fill && stroke` 둘 다 있으면: fill은 다각형, stroke는 선
  - `fill`만 또는 `stroke`만 있으면: 선으로 처리 (벡터 브러쉬 대응)
  - 선은 얇은 사각형(rectangle)으로 생성
- **pathseg 폴리필**: Matter.js의 `Svg.pathToVertices` 사용을 위해 필요

### Pathfinder (경로 탐색)

- **위치**: `$lib/components/app/world/pathfinder.ts`
- **라이브러리**: PathFinding.js (A* 알고리즘)
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
  $effect(() => { /* SVG 재로딩 */ });

  // 가벼운 작업: debug 변경 시 기존 바디 스타일만 업데이트
  $effect(() => {
    const bodies = Composite.allBodies(engine.world);
    for (const body of bodies) {
      body.render.visible = debug;
    }
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