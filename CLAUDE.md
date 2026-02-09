# Agent Guidelines

SvelteKit 5 + TypeScript gamified task management app with Matter.js physics.

## Critical Rules

### Workflow
**PLAN.md만 작업**: 문서화된 태스크만 진행. 사용자 언급사항은 PLAN.md에 정리만 (명시적 진행 요청 시에만 구현). 체크리스트 형태 운영.

### Spec-Driven Development (명세 기반 개발)
**틱 함수 개발 워크플로우**: behavior-state 등 핵심 로직 개발 시 명세 → 테스트 → 구현 순서 엄수.

**프로세스**:
1. **사용자**: 함수 주석의 `[상세 스펙]`에 새 항목 추가 (`[ ]` unchecked)
2. **Claude**:
   - 명세 분석 및 이해 확인
   - 테스트 코드 작성 (Red: 실패하도록)
   - 로직 구현 (Green: 테스트 통과)
   - 스펙 체크 표시 (`[x]`) 및 확인
3. **검증**: `pnpm test:unit` 자동 실행으로 즉시 확인

**명세 작성 형식**:
```typescript
/**
 * 함수 설명
 *
 * [상세 스펙]
 * - [ ] 새로운 요구사항 (unchecked = 미구현)
 * - [x] 기존 요구사항 (checked = 구현 완료)
 * - [x] 엣지 케이스 처리
 */
```

**테스트 작성 형식**:
```typescript
// 최상위 describe는 함수 시그니처 포함
describe('functionName(param1: Type1, param2: Type2)', () => {
  // 계층 구조 명세는 describe로 그룹화
  describe('조건 컨텍스트', () => {
    it('명세 항목과 정확히 일치하는 테스트 이름', () => {
  });

  // 플랫한 명세는 it만 사용
  it('명세 항목과 정확히 일치하는 테스트 이름', () => {
});
```

**원칙**:
- 명세에 없는 기능은 구현하지 않음 (사이드 이펙트 방지)
- 스펙이 단일 진실 공급원(Single Source of Truth)
- 모든 스펙은 테스트로 검증 가능해야 함
- 체크박스로 진행 상황 명확히 추적

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
