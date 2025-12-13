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

4. **스토어 업데이트는 Immer 사용**
   - Svelte의 reactivity는 참조 변경을 감지하므로 항상 새로운 객체/배열을 생성해야 함
   - **Immer의 `produce`를 사용하여 불변성을 유지하면서 mutable한 코드 작성 가능**
   - Immer는 structural sharing을 통해 성능을 최적화하고, 중첩된 업데이트를 간단하게 만듦
   - 예시:
     ```typescript
     import { produce } from 'immer';

     // ❌ 나쁜 예: Immer 없이 직접 수정 (reactivity 동작 안 함)
     store.update((state) => {
       const item = state.data?.find(i => i.id === id);
       if (item) Object.assign(item, updates);
       return state; // 같은 참조 반환
     });

     // ✅ 좋은 예: Immer의 produce 사용
     store.update((state) =>
       produce(state, (draft) => {
         const item = draft.data?.find(i => i.id === id);
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
   - admin이 관리하는 테이블(player_ 테이블 제외)에는 audit 컬럼 추가
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

5. **Constraint 및 Index 명명 규칙**
   - 모든 constraint와 index는 명시적으로 이름을 지정할 것
   - Unique: `uq_<table_name>_<column_name>` (복수 컬럼: `uq_<table_name>_<col1>_<col2>`)
   - Foreign Key: `fk_<table_name>_<column_name>`
   - Index: `idx_<table_name>_<column_name>`
   - Check: `chk_<table_name>_<column_name>`

6. **테이블 생성 스타일**
   - 가능하면 `create table` 문 안에서 모든 constraint를 한번에 정의
   - `alter table`로 나중에 추가하는 것보다 inline constraint 선호
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
     export type NarrativeNodeChoiceWithNarrativeDiceRoll = NarrativeNodeChoice & { narrative_dice_roll: NarrativeDiceRoll };

     // ✅ 좋은 예
     type NarrativeNodeChoiceRow = Tables<'narrative_node_choices'>;
     export type NarrativeNodeChoice = NarrativeNodeChoiceRow & { narrative_dice_roll: NarrativeDiceRoll };
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
  - Root 컴포넌트는 컴포넌트 이름 그대로 import
  - 예시:
    ```typescript
    // ❌ 나쁜 예
    import * as Select from '$lib/components/ui/select';
    import { Root as SelectRoot } from '$lib/components/ui/select';

    // ✅ 좋은 예
    import { Select, Trigger as SelectTrigger, Content as SelectContent, Item as SelectItem } from '$lib/components/ui/select';
    import { InputGroup, Input as InputGroupInput, Text as InputGroupText } from '$lib/components/ui/input-group';
    ```

- **아이콘 라이브러리**
  - `@tabler/icons-svelte` 사용 (lucide-svelte 사용 금지)
  - Icon 접두사를 붙여서 import
  - 예: `import { IconTrash, IconPlus } from '@tabler/icons-svelte';`

- **Label 사용 금지**
  - `<Label>` 컴포넌트 대신 `InputGroupText` 또는 `ButtonGroupText` 사용
  - `InputGroupText`, `InputGroupButton`은 반드시 `InputGroupAddon`으로 감싸서 사용
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

    <!-- ✅ 좋은 예: ButtonGroup + Select -->
    <ButtonGroup>
      <ButtonGroupText>타입</ButtonGroupText>
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

## 패키지 매니저

- **pnpm 사용** (npm, yarn 사용 금지)
- 명령어 예시:
  - `pnpm install` - 패키지 설치
  - `pnpm check` - svelte-check (타입 체크 + unused variables)
  - `pnpm lint` - prettier (코드 포맷팅)
  - `pnpm dev` - 개발 서버 실행
- ESLint는 사용하지 않음 (svelte-check가 대체)
