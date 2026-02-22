# PLATFORM_TOOLS AGENTS

## 역할 선언
- 개발 구현 규칙, 플랫폼 연동, 빌드/도구 체인 규칙을 관리한다.
- 게임의 플랫폼/시스템 구현을 담당하며 그래픽 디자인 역할은 수행하지 않는다.

## 문서 수정 권한
- 루트 `AGENTS.md`는 수정하지 않는다.
- `AGENTS.md` 수정 요청을 받으면 `docs/agents/platform_engineer/AGENTS.md`만 수정한다.

## 브랜치 규칙
- 작업 시작 전에 반드시 새 브랜치를 만든다.
- 브랜치 이름은 `plans/<플랜파일명(확장자 제외)>` 형식을 사용한다.
- 버그 수정은 plan 없이 바로 진행할 수 있다. (bugfix 브랜치 사용)

## Commands
- Dev: `pnpm dev`, `pnpm build`, `pnpm preview`
- Check: `pnpm check`, `pnpm format`, `pnpm lint`
- Unit test: `pnpm test:unit`
- Supabase types:
	- `pnpm supabase gen types --lang=typescript --local > src/lib/types/supabase.generated.ts`
- 패키지 매니저는 pnpm만 사용한다. (npm/yarn 금지)

## 구현 진행 기본 플로우
- 구현 착수 전 대상 함수 상단에 역할/명세 주석을 먼저 작성한다.
- 함수 내부에 주요 플로우(대략 단계)를 주석으로 먼저 작성한다.
- 사용자 확인으로 의도 일치 여부를 검증한 뒤 구현을 시작한다.

## Code Style & Naming
- Imports:
	- named import만 사용 (`import * as` 금지)
	- shadcn-svelte는 필요한 컴포넌트를 개별 import
	- `@tabler/icons-svelte`는 `Icon` 접두사 사용
- Format:
	- Tabs, single quotes, line width 100, trailing comma(ES5)
- Types:
	- DB 외 `null` 금지, `undefined` 사용
	- `as any` 금지
	- branded ID 사용
	- Supabase는 `.single<Type>()`, `.maybeSingle<Type>()` 사용
- Naming:
	- 이벤트/props 이름과 함수명 일치 (`onsubmit`, `handleSubmit` 지양)
	- 도메인 의미를 드러내는 명시적 이름 사용
- Component:
	- hook 직접 사용 (prop drilling 지양)
	- 공유 로직은 별도 파일로 분리
	- 유틸은 Radash 우선

### 함수 네이밍 강제 규칙
- `get*()`: 값이 없으면 throw Error
- `getOrUndefined*()`: 값이 없으면 undefined 반환
- `get*()`를 만들면 대응 `getOrUndefined*()`도 함께 구현한다.

## Svelte 5 Rules
- Runes 사용: `$state`, `$derived`, `$effect`
- `$app/stores` 대신 `$app/state` 사용
- 외부 객체는 `$state.raw()` 사용
- store 갱신은 Immer `produce()` 사용
- context는 초기화 시에만 접근, 클래스에는 constructor 주입

## Database Rules
- RLS policy 이름: lowercase plural
- constraint prefix: `uq_`, `fk_`, `idx_`, `chk_`
- 무결성은 DB 레벨에서 강제한다.
- inline constraints, DB defaults 우선
- 타입 캐스팅 쿼리 금지
- 디버깅 우선순위: psql -> console.log

## UI Rules
- shadcn-svelte:
	- 명시적 import
	- `<Label>` 금지 (`<InputGroupText>` 사용)
	- Icon에 `class` 직접 지정 금지
- 조합 규칙:
	- `ButtonGroup + Select` 사용
	- `InputGroup + Select` 금지
- Admin 경로 패턴:
	- `/admin/scenarios/[scenarioId]/{domain}/[{domain}Id]/`
- 주요 컴포넌트 패턴:
	- aside, command, create-dialog, delete-dialog, panel

## Tech Stack
SvelteKit 2.48+, Svelte 5, TypeScript 5.9+, Tailwind 4.1+, shadcn-svelte, Supabase, Matter.js 0.20, Immer, Radash 12.1+
