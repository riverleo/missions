이슈: OOA-12
링크: https://linear.app/ooaah/issue/OOA-12/첫-페이지에-아이디-비밀번호-로그인-기능-추가

# 첫 페이지에 아이디 / 비밀번호 로그인 기능 추가

## 목표

첫 페이지에서 익명 유저 생성만 제공하는 현재 진입점을, 어드민 접근을 위한 임시 아이디 / 비밀번호 로그인 흐름까지 포함하도록 확장한다.
Supabase 인증과 기존 `/admin` 권한 체크를 그대로 활용하면서, 로그인 성공 시 관리자 사용자가 첫 페이지에서 인증 상태를 확인하고 `/admin`으로 진입할 수 있어야 한다.

## 담당자

- 플래너
- 플랫폼 엔지니어
- 테스트 엔지니어

## 할 일

### 플래너

- [x] 이슈 OOA-12 기준 플랜 문서를 `docs/plans/20260313034712_front_page_id_password_login.md`에 작성한다.
- [x] `plans/20260313034712_front_page_id_password_login` 브랜치를 생성하고 원격에 푸시한다.
- [x] 플랜 PR을 생성하고 제목/본문이 저장소 규칙 및 템플릿과 일치하는지 검증한다.
- [x] 구현 역할 호출 문구를 플랜 노트에 기록하고 Linear 이슈 상태를 `In Progress`로 확인한다.

### 플랫폼 엔지니어

- [x] `src/routes/(app)/+page.svelte` 또는 관련 로드/액션 경로에 아이디 / 비밀번호 입력, 제출 상태, 실패 메시지를 포함한 관리자 로그인 UI와 처리 로직을 추가한다.
- [x] 로그인 성공 시 현재 세션과 역할 정보가 새로고침 없이 반영되거나 안전한 리다이렉트로 갱신되어, 관리자 사용자가 첫 페이지에서 `/admin` 진입 가능 상태를 확인할 수 있게 한다.
- [x] 기존 익명 유저 생성 흐름이 필요한 범위에서 유지되도록 로그인 UI와 충돌하지 않게 정리한다.
- [x] 관리자 로그인에 필요한 환경 변수, 임시 계정 전제, 보안상 제약이 있으면 문서 또는 노트에 명시한다.

### 테스트 엔지니어

- [x] 첫 페이지 로그인 UI와 인증 분기 변경을 검증하는 단위 테스트 또는 명세 기반 회귀 테스트를 추가하거나 갱신한다.
- [x] 로그인 실패, 관리자 권한 없음, 기존 익명 유저 생성 흐름이 각각 기대한 메시지/리다이렉트 동작을 유지하는지 검증한다.
- [x] 실행한 테스트 명령과 수동 검증 결과를 PR과 플랜에 기록하고 체크리스트 상태를 실제 산출물과 일치시킨다.

## 노트

### 2026-03-13

- 현재 첫 페이지 `src/routes/(app)/+page.svelte`는 `supabase.auth.signInAnonymously()`만 제공하며, 인증되지 않은 사용자를 빠르게 생성하는 테스트 UI 상태다.
- `/admin` 진입은 `src/routes/admin/+layout.server.ts`에서 로그인된 사용자이면서 `user_roles.type = admin`인 경우만 허용한다.
- 서버 훅 `src/hooks.server.ts`와 `src/routes/+layout.ts`에 Supabase 세션 주입 경로가 이미 있으므로, 플랜 범위는 첫 페이지 로그인 경험과 세션 반영 정리에 집중한다.
- 브랜치 `plans/20260313034712_front_page_id_password_login`를 생성해 원격에 푸시했고, PR은 `https://github.com/riverleo/missions/pull/34`로 생성했다.
- `gh pr view plans/20260313034712_front_page_id_password_login --json url,title,body`로 PR 제목 `[OOA-12] 첫 페이지에 아이디 / 비밀번호 로그인 기능 추가`와 본문 템플릿 일치를 검증했다.
- `LINEAR_API_KEY`가 존재하는 환경에서 Linear 이슈 OOA-12를 조회한 결과 상태가 이미 `In Progress`였고, PR 첨부도 연결돼 있었다.
- 역할 호출 문구:
- `[플랫폼 엔지니어, 테스트 엔지니어]`
- `20260313034712_front_page_id_password_login 플랜 구현 시작`
- 첫 페이지에 관리자 로그인 카드와 세션 상태 요약을 추가했고, `src/lib/hooks/use-current.ts`에 `refreshUser()`를 열어 `invalidate('supabase:auth')` 이후 새로고침 없이 현재 세션/역할을 다시 반영하도록 정리했다.
- 로그인/익명 생성 흐름은 `src/routes/(app)/front-page-auth.ts`로 분리해 성공/실패 메시지와 관리자 권한 분기를 공통 명세로 관리한다.
- 관리자 로그인은 기존 공개 Supabase 환경 변수(`PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_PUBLISHABLE_KEY`)만 사용하며, 별도 환경 변수 추가는 없었다. 다만 로그인 대상은 Supabase Auth의 이메일/비밀번호 계정이어야 하고 `/admin` 진입을 위해 `user_roles.type = admin` 레코드가 필요하다.
- 테스트:
- `pnpm test:unit src/routes/'(app)'/front-page-auth.spec.ts src/routes/admin/layout.server.spec.ts`
- 수동 확인: 코드 기준으로 첫 페이지에서 로그인 성공 시 `/admin` 이동 버튼이 보이고, 로그인 실패/권한 없음/익명 생성 메시지가 각각 분기되도록 구현을 점검했다.
- `pnpm check`는 저장소 기존 이슈(`scripts/linear-webhook-workflow.js`의 암시적 any 다수, Paraglide 생성 파일 누락) 때문에 전체 성공하지 않았지만, 이번 변경 파일 경로(`src/routes/(app)/+page.svelte`, `src/lib/hooks/use-current.ts`, `src/routes/(app)/front-page-auth.ts`)에 대한 신규 오류 출력은 없음을 확인했다.
