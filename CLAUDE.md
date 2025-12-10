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

## Svelte 5 특화 규칙

1. **Deprecated된 API 사용 금지**
   - ❌ `import { page } from '$app/stores'` (Svelte 4 방식)
   - ✅ `import { page } from '$app/state'` (Svelte 5 runes)
   - stores 기반 API 대신 runes 기반 API 사용

## 데이터베이스 규칙

1. **데이터 무결성은 데이터베이스에서 보장**
   - 데이터 제약사항은 DB constraint/index로 강제해야 함
   - 애플리케이션 코드에서 예외처리로 우회하지 말 것
   - 예: 중복 레코드가 있으면 `.limit(1)` 같은 방법으로 회피하지 말고, DB에서 unique constraint로 원천 차단
   - 이유: 데이터가 실제로 꼬였을 때 애플리케이션에서 에러가 발생해야 문제를 감지할 수 있음

2. **user_roles 테이블**
   - 각 유저는 0개 또는 1개의 역할을 가질 수 있음 (unique index로 보장)
   - 역할 없음 = 일반 유저, 역할 1개 = 특정 권한 보유
   - 쿼리 시 `.maybeSingle()` 사용 (0개=정상, 1개=정상, 2개 이상=에러)

3. **Supabase 타입 생성**
   - `src/lib/types/supabase.ts`는 Supabase에서 자동 생성되는 파일 (기존 파일)
   - 타입 생성 명령어: `pnpm supabase gen types typescript --local > src/lib/types/supabase.ts`
   - 이 파일을 직접 수정하지 말고, 필요한 타입 확장은 `src/lib/types/index.ts`에서 할 것

4. **Constraint 및 Index 명명 규칙**
   - 모든 constraint와 index는 명시적으로 이름을 지정할 것
   - Unique: `uq_<table_name>_<column_name>` (복수 컬럼: `uq_<table_name>_<col1>_<col2>`)
   - Foreign Key: `fk_<table_name>_<column_name>`
   - Index: `idx_<table_name>_<column_name>`
   - Check: `chk_<table_name>_<column_name>`

5. **테이블 생성 스타일**
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

6. **테이블명과 관계 데이터 명명**
   - 테이블명은 복수형 사용 (예: `dices`, `dice_rolls`, `narratives`)
   - 단일 관계 데이터를 참조할 때는 단수형 사용 (예: `narrativeNode.dice_roll`)
   - Supabase 쿼리에서 alias로 단수형 지정:
     ```typescript
     .select(`
       *,
       dice_roll:dice_rolls!narrative_nodes_dice_roll_id_fkey (*)
     `)
     ```
   - 이유: 테이블은 여러 레코드의 집합이므로 복수형, 개별 관계는 단일 객체이므로 단수형

7. **타입 re-export 규칙**
   - `src/lib/types/index.ts`에서 확장된 타입을 re-export할 때는 원래 이름 사용
   - `WithXXX` 같은 suffix를 붙이지 말고, 확장된 타입이 기본 타입이 되도록 함
   - 예:
     ```typescript
     // ❌ 나쁜 예
     export type NarrativeNodeChoiceWithDiceRoll = NarrativeNodeChoice & { dice_roll: DiceRoll };

     // ✅ 좋은 예
     type NarrativeNodeChoiceRow = Tables<'narrative_node_choices'>;
     export type NarrativeNodeChoice = NarrativeNodeChoiceRow & { dice_roll: DiceRoll };
     ```

## 린팅

- `pnpm check` - svelte-check (타입 체크 + unused variables)
- `pnpm lint` - prettier (코드 포맷팅)
- ESLint는 사용하지 않음 (svelte-check가 대체)
