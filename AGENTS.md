# Agent Guidelines

SvelteKit 5 + TypeScript gamified task management app with Matter.js physics.

## Critical Rules

### Workflow
**Plan 기반 작업**: `plans/` 디렉토리의 문서화된 플랜만 진행. 사용자 언급사항은 해당 플랜에 정리만 (명시적 진행 요청 시에만 구현). 체크리스트 형태 운영.
- **진행 중**: `plans/*.md` - 현재 작업 중인 플랜
- **완료됨**: `plans/completed/*.md` - 완료된 플랜 (히스토리 보관)
- **실패함**: `plans/failed/*.md` - 실패한 플랜 (안티패턴 보관)
- **플랜 완료 처리**: 사용자가 명시적으로 지시할 때만 `completed/`로 이동. Claude가 임의로 이동 금지.
- **체크리스트 관리**:
  - 플랜 작업을 완료하면 체크리스트에 반드시 체크(`[x]`)한다.
  - 체크되지 않은 작업을 진행하기 전에 코드를 확인하여 실제로 미완료인지 검증한다.
  - 모든 체크박스가 체크되지 않은 플랜은 완료 처리하지 않는다.
- **플랜 작성 원칙** (받아적기 금지):
  - 새 내용 추가 전 기존 내용과 일관성 검증. 충돌 시 즉시 질문
  - 앞뒤 맥락이 맞지 않으면 "이 부분은 앞에서 X와 다른데 괜찮나요?" 질문 필수
  - 전체 구조 주기적 검토. 중복/모순 발견 시 "Y와 Z가 중복되는데요" 피드백

### Spec-Driven Development
- **틱 함수 개발**: behavior-state 등 핵심 로직 개발 시 명세(함수 주석 체크리스트) → 테스트 → 구현 순서. 명세 체크박스로 진행 추적.
- **프로세스**: 사용자가 명세 추가(`[ ]`) → Claude가 테스트 작성 및 구현 → 체크(`[x]`) → `pnpm test:unit` 검증
- **테스트**: `describe('함수명(파라미터: 타입)', ...)`, 명세 계층 = describe 계층, **명세 항목 텍스트 = it 이름 (정확히 일치 필수)**
- **명세 작성 스타일**: 한글로 자연어 서술형 작성. 프로그래매틱하지 않고 플루럴하게 (예: "값을 감소시킨다", "목록을 갱신한다", "상태를 초기화한다"). 도메인 용어는 한글 사용 (need→욕구, character→캐릭터, behavior→행동, building→건물)
- **원칙**: 명세만이 진실, 명세 외 구현 금지, 모든 스펙은 테스트로 검증

### Commands
- **Dev**: `pnpm dev`, `pnpm build`, `pnpm preview`
- **Check**: `pnpm check`, `pnpm format`, `pnpm lint`
- **Supabase**: `pnpm supabase gen types --lang=typescript --local > src/lib/types/supabase.generated.ts`
- **Package**: pnpm ONLY (no npm/yarn)

### Code Style
- **Imports**: 명시적 named imports (no `import * as`), shadcn-svelte 개별 import, `@tabler/icons-svelte` Icon 접두사
- **Format**: Tabs, single quotes, 100 chars, ES5 trailing commas
- **Types**: `undefined` (no null except DB), no `as any`, branded IDs, `.single<Type>()` for Supabase
- **Naming**: Functions match props/events (`onsubmit` not `handleSubmit`), explicit domain names
- **Components**: Hooks 직접 사용 (no prop drilling), Radash 선호, 공유 로직은 별도 파일

### Svelte 5
- **Runes**: `$state`, `$derived`, `$effect` (no `$app/stores`, use `$app/state`)
- **External objects**: `$state.raw()` for non-Svelte objects
- **Updates**: Immer `produce()` for stores
- **Context**: 초기화 시만 접근, 클래스에는 constructor로 전달

### Database
- **Naming**: RLS policies lowercase plural, constraints `uq_/fk_/idx_/chk_` prefix
- **Rules**: DB level integrity, inline constraints, DB defaults
- **Queries**: `.single<Type>()`, `.maybeSingle<Type>()`, no type casting
- **Debug**: psql first, console.log second

### UI
- **shadcn-svelte**: Explicit imports, no `<Label>` (use `<InputGroupText>`), no Icon `class`
- **Groups**: ButtonGroup + Select (no InputGroup + Select)
- **Admin**: `/admin/scenarios/[scenarioId]/{domain}/[{domain}Id]/` pattern
- **Components**: aside, command, create-dialog, delete-dialog, panel

### Patterns
- **Bug fix**: Root cause → Small test → Verify → Full deployment
- **EntityIdUtils**: `create()`, `parse()`, `is()`, `or()`, cache with `$derived`
- **RecordFetchState**: `data` always defined (no `?? {}`)
- **Utils**: Radash, `$derived` cache, constants.ts
- **Naming Convention**:
  - `get*()`: 값이 없으면 throw Error
  - `getOrUndefined*()`: 값이 없으면 undefined 반환
  - get 함수 만들 때 getOrUndefined도 무조건 함께 구현
- **World Entity Helpers**: World entity에서 source entity 가져오는 헬퍼 함수 패턴
  - `getItemByWorldItem(WorldItemId)` / `getOrUndefinedItemByWorldItem(WorldItemId)`
  - `getCharacterByWorldCharacter(WorldCharacterId)` / `getOrUndefinedCharacterByWorldCharacter(WorldCharacterId)`
  - `getBuildingByWorldBuilding(WorldBuildingId)` / `getOrUndefinedBuildingByWorldBuilding(WorldBuildingId)`

### Tech Stack
SvelteKit 2.48+, Svelte 5, TS 5.9+, Tailwind 4.1+, shadcn-svelte, Supabase, Matter.js 0.20, Immer, Radash 12.1+

### App Concept
Gamified task management: 미션 완료 → 코인 획득 → 건물 건설 → 2D physics world. 캐릭터는 욕구 보유, 건물은 컨디션 보유, Utility AI 행동 시스템.
