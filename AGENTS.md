# Agent Guidelines

SvelteKit 5 + TypeScript 기반의 gamified task management 앱. (Matter.js 물리 월드)

## 1) Workflow (최우선)

- Plan 기반으로만 작업한다. 구현은 `plans/*.md`에 문서화된 항목만 진행한다.
- 사용자가 말한 새 요구사항은 해당 plan에 기록만 한다. 구현은 명시적 진행 요청이 있을 때만 한다.
- Plan 상태 디렉토리:
	- 진행 중: `plans/*.md`
	- 완료: `plans/completed/*.md`
	- 실패: `plans/failed/*.md`
- Plan 완료 이동(`completed/`)은 사용자 명시 지시가 있을 때만 한다.

### 체크리스트 규칙

- 완료한 작업은 반드시 체크(`[x]`)한다.
- 미체크 항목을 진행하기 전에 코드 기준으로 실제 미완료인지 검증한다.
- 체크박스가 하나라도 비어 있으면 완료 처리하지 않는다.

### 플랜 문서 편집 원칙

- 새 내용 추가 전 기존 내용과 충돌/일관성을 검증한다.
- 앞뒤 맥락이 다르면 즉시 질문한다.
- 중복/모순이 보이면 즉시 피드백한다.

### 브랜치/동시 작업 규칙

- 작업 시작 전에 반드시 새 브랜치를 만든다.
- 브랜치 이름은 대응 plan 파일명(확장자 제외)과 동일하게 한다.
	- 예: `plans/42.md` -> 브랜치 `42`
- 여러 스레드 동시 작업 시 브랜치와 작업 디렉토리를 분리한다.
- 동시 작업은 `git worktree`를 사용해 스레드별 독립 worktree로 운영한다.
- 기본 템플릿:
	- 생성: `git worktree add ../missions-<plan> -b <plan>`
	- 확인: `git worktree list`
	- 정리: `git worktree remove ../missions-<plan>`

## 2) Spec-Driven Development

- 핵심 로직(예: tick, behavior-state)은 반드시 `명세 -> 테스트 -> 구현` 순서로 진행한다.
- 프로세스:
	- 사용자: 명세 체크박스 추가(`[ ]`)
	- 에이전트: 테스트 작성 + 구현
	- 에이전트: 체크(`[x]`)
	- 에이전트: `pnpm test:unit` 검증
- 명세는 유일한 진실이다. 명세 외 구현 금지.
- 모든 스펙은 테스트로 검증한다.

### 테스트 작성 규칙

- `describe('함수명(파라미터: 타입)', ...)` 형식 사용
- 명세 계층과 describe 계층을 일치시킨다.
- 명세 항목 텍스트와 `it` 이름은 정확히 일치시킨다.

### 명세 문장 스타일

- 한글 자연어 서술형으로 작성한다.
- 프로그래매틱한 표현보다 도메인 행위를 설명한다.
- 도메인 용어는 한글 사용:
	- need -> 욕구
	- character -> 캐릭터
	- behavior -> 행동
	- building -> 건물

## 3) Commands

- Dev: `pnpm dev`, `pnpm build`, `pnpm preview`
- Check: `pnpm check`, `pnpm format`, `pnpm lint`
- Unit test: `pnpm test:unit`
- Supabase types:
	- `pnpm supabase gen types --lang=typescript --local > src/lib/types/supabase.generated.ts`
- 패키지 매니저는 pnpm만 사용한다. (npm/yarn 금지)

## 4) Code Style & Naming

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

### World Entity Helper 패턴

- `getItemByWorldItem(WorldItemId)` / `getOrUndefinedItemByWorldItem(WorldItemId)`
- `getCharacterByWorldCharacter(WorldCharacterId)` / `getOrUndefinedCharacterByWorldCharacter(WorldCharacterId)`
- `getBuildingByWorldBuilding(WorldBuildingId)` / `getOrUndefinedBuildingByWorldBuilding(WorldBuildingId)`

## 5) Svelte 5 Rules

- Runes 사용: `$state`, `$derived`, `$effect`
- `$app/stores` 대신 `$app/state` 사용
- 외부 객체는 `$state.raw()` 사용
- store 갱신은 Immer `produce()` 사용
- context는 초기화 시에만 접근, 클래스에는 constructor 주입

## 6) Database Rules

- RLS policy 이름: lowercase plural
- constraint prefix: `uq_`, `fk_`, `idx_`, `chk_`
- 무결성은 DB 레벨에서 강제한다.
- inline constraints, DB defaults 우선
- 타입 캐스팅 쿼리 금지
- 디버깅 우선순위: psql -> console.log

## 7) UI Rules

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

## 8) Patterns

- 버그 수정: Root cause -> Small test -> Verify -> Full deployment
- `EntityIdUtils`: `create()`, `parse()`, `is()`, `or()`
- 캐시는 `$derived` 사용
- `RecordFetchState.data`는 항상 defined 상태 유지 (`?? {}` 금지)
- 상수는 `constants.ts`로 분리

## 9) Tech Stack

SvelteKit 2.48+, Svelte 5, TypeScript 5.9+, Tailwind 4.1+, shadcn-svelte, Supabase, Matter.js 0.20, Immer, Radash 12.1+
