# Agent Guidelines

SvelteKit 5 + TypeScript gamified task management app with Matter.js physics.

## Critical Rules

### Workflow
**PLAN.md만 작업**: 문서화된 태스크만 진행. 사용자 언급사항은 PLAN.md에 정리만 (명시적 진행 요청 시에만 구현). 체크리스트 형태 운영.

### Spec-Driven Development
- **틱 함수 개발**: behavior-state 등 핵심 로직 개발 시 명세(함수 주석 체크리스트) → 테스트 → 구현 순서. 명세 체크박스로 진행 추적.
- **프로세스**: 사용자가 명세 추가(`[ ]`) → Claude가 테스트 작성 및 구현 → 체크(`[x]`) → `pnpm test:unit` 검증
- **테스트**: `describe('함수명(파라미터: 타입)', ...)`, 명세 계층 = describe 계층, **명세 항목 텍스트 = it 이름 (정확히 일치 필수)**
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

### Tech Stack
SvelteKit 2.48+, Svelte 5, TS 5.9+, Tailwind 4.1+, shadcn-svelte, Supabase, Matter.js 0.20, Immer, Radash 12.1+

### App Concept
Gamified task management: 미션 완료 → 코인 획득 → 건물 건설 → 2D physics world. 캐릭터는 욕구 보유, 건물은 컨디션 보유, Utility AI 행동 시스템.
