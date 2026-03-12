# Linear 웹훅 로컬 서버 추가

## 목표
Linear 웹훅 이벤트를 로컬 개발 환경에서 수신할 수 있도록 Node.js 기반의 경량 서버를 추가한다.
서버는 `3000` 포트에서 실행되며, 요청 본문을 수신하고 기본 응답 및 로그를 제공해야 한다.

또한 개발자가 별도 명령 조합 없이 `pnpm webhook:linear` 한 번으로 로컬 서버와 Cloudflare Tunnel을 함께 실행할 수 있도록 `package.json`에 전용 실행 명령을 구성한다.
초기 범위는 웹훅 수신 기반, 터널 연결 자동화, Linear 서명 검증, 그리고 Linear 상태 기반 작업 흐름 문서화/자동화 준비까지로 한정한다.
상태 전이는 `Backlog -> Todo -> In Progress -> In Review -> Done`을 기준으로 하며, PR 제목 포맷과 플랜 메타데이터 규칙도 이 플랜에서 함께 정리한다.

## 담당자
- 플래너
- 게임 디자이너
- 플랫폼 엔지니어
- 테스트 엔지니어

## 할 일
### 플래너
- [x] Linear 웹훅 로컬 수신 범위를 `Node.js 서버 + 3000 포트 + package.json 실행 명령`으로 확정해 문서화한다.
- [x] `pnpm webhook:linear`에 Cloudflare Tunnel 동시 실행 요구사항을 현재 플랜 범위에 반영한다.
- [x] Linear `signing secret` 기반 서명 검증 요구사항을 현재 플랜 범위에 반영한다.
- [x] Codex 자동 실행은 후속 범위임을 `노트`에 명시한다.
- [x] Linear 상태 기반 운영 규칙(`Todo`에서 플래너 시작, `In Progress`/`In Review`/`Done` 전이, PR 제목 포맷, 플랜 최상단 메타데이터)을 `AGENTS.md`와 `docs/agents/planner/AGENTS.md`에 반영한다.
- [x] 현재 플랜 문서에 Linear 상태 기반 자동화 범위와 후속 구현 항목을 기록한다.

### 플랫폼 엔지니어
- [x] 저장소에 Linear 웹훅 `POST` 요청을 수신하는 Node.js 서버 파일을 추가하고 `3000` 포트에서 실행되도록 구성한다.
- [x] 서버가 JSON 본문을 파싱하고 요청 경로, 헤더 일부, 본문을 확인 가능한 수준으로 로그/응답을 제공하도록 구현한다.
- [x] Cloudflare Tunnel 실행에 필요한 로컬 설정 파일 또는 환경 변수 구조를 추가하고 `localhost:3000`으로 라우팅되도록 구성한다.
- [x] `pnpm webhook:linear` 실행 시 로컬 웹훅 서버와 Cloudflare Tunnel이 함께 기동되도록 스크립트를 재구성한다.
- [x] 터널 실행 전제 조건(예: `cloudflared` 설치, 토큰/설정 파일 위치)을 코드와 문서 기준으로 확인 가능하게 정리한다.
- [x] Linear `signing secret`을 환경 변수로 주입받고 raw body 기준 `Linear-Signature` 검증을 수행하도록 서버를 확장한다.
- [x] `webhookTimestamp`를 활용한 허용 시간 검증을 추가하고 검증 실패 시 `401` 또는 `403` 응답으로 거부하도록 처리한다.
- [x] 로컬 개발용 우회 동작이 필요하다면 조건과 기본값을 코드 및 환경 변수 기준으로 명확히 정리한다.
- [x] Linear `Issue`/`Comment` 웹훅 payload에서 상태 전이와 이슈 식별자를 파싱하는 자동화 엔트리 포인트를 설계하고 구현한다.
- [x] `Todo` 전환 시 플래너 플랜 작성, PR 생성, 상태를 `In Progress`로 갱신하는 자동 실행 흐름을 구현한다.
- [x] `Done` 전환 시 연결된 PR 머지를 수행하는 자동 실행 흐름을 구현한다.
- [x] 플래너 완료 후 구현 역할(`플랫폼 엔지니어`, `테스트 엔지니어`) 자동 실행과 `In Review` 상태 전환 흐름을 구현한다.
- [x] `Canceled` 전환 시 연결된 열린 PR을 닫는 자동 실행 흐름을 구현한다.

### 테스트 엔지니어
- [x] 로컬에서 웹훅 서버 실행 후 `POST` 요청으로 `200` 응답이 반환되는지 검증한다.
- [x] JSON 본문 수신이 정상 동작하는지 재현 절차와 함께 검증 결과를 기록한다.
- [x] `pnpm webhook:linear` 실행 시 로컬 서버와 Cloudflare Tunnel 프로세스가 함께 기동되는지 검증한다.
- [x] 터널이 발급한 공개 주소를 통해 웹훅 엔드포인트 접근이 가능한지 검증 결과를 기록한다.
- [x] 유효한 서명이 포함된 요청은 `200` 응답이 유지되는지 검증한다.
- [x] 서명 불일치 또는 허용 시간 초과 요청이 거부되는지 재현 절차와 함께 검증 결과를 기록한다.
- [ ] `Todo`/`In Progress`/`In Review`/`Done` 상태 전이에 따라 예상 자동화가 한 번씩만 실행되는지 검증한다.
- [ ] PR 제목이 `[이슈코드] 제목` 형식으로 생성되고 플랜 파일 최상단 메타데이터가 포함되는지 검증 결과를 기록한다.

## 노트
### 2026-03-12
- 사용자 신규 요구사항: Linear 웹훅을 수신하는 Node.js 로컬 서버를 추가하고 `package.json`에 실행 명령을 등록.
- 서버 포트는 `3000`으로 고정.
- 현재 요청은 플래너 역할의 플랜 작성이며 구현은 아직 시작하지 않음.
- 후속 범위로 예상되는 Cloudflare Tunnel 연결, Linear 서명 검증, 티켓 기반 Codex 자동 실행은 본 플랜에 포함하지 않음.
- 구현 브랜치 `plans/20260312232000_linear_webhook_local_server`를 생성하고 원격 푸시 후 PR #24를 생성.
- 구현 산출물 범위: `scripts/linear-webhook-server.js`와 `package.json`의 `webhook:linear` 실행 명령.
- 검증: `pnpm webhook:linear` 실행 후 `curl -i -X POST http://localhost:3000/linear/webhook`로 `200 OK` 응답과 JSON 본문 로그를 확인.
- 검증: `curl -i http://localhost:3000/health`로 헬스 체크 응답 `{"ok":true,"port":3000}`를 확인.
- 사용자 신규 요구사항: `pnpm webhook:linear` 실행 시 Cloudflare와 연동된 터널링까지 함께 완료되도록 현재 플랜 범위 확장.
- Cloudflare Tunnel 연동은 현재 플랜에 편입하되, Linear 서명 검증과 티켓 기반 Codex 자동 실행은 여전히 후속 범위로 유지.
- 구현 산출물 범위 확장: `scripts/linear-webhook-dev.js`로 로컬 서버와 `cloudflared`를 단일 명령에서 함께 관리.
- 환경 변수 구조: `.env.example`에 `CLOUDFLARED_TUNNEL_TOKEN`, `CLOUDFLARED_CONFIG_PATH`, `CLOUDFLARED_TUNNEL_NAME`, `CLOUDFLARED_PUBLIC_HOSTNAME` 추가.
- 검증: `pnpm webhook:linear` 실행 시 Quick Tunnel이 생성되고 공개 URL을 통해 `POST /linear/webhook` 요청이 `200 OK`로 프록시됨을 확인.
- 사용자 신규 요구사항: 현재 Node 서버에 Linear `signing secret` 기반 서명 검증을 추가.
- Linear 서명 검증은 현재 플랜에 편입하고, 티켓 기반 Codex 자동 실행만 후속 범위로 유지.
- 환경 변수 구조 확장: `.env.example`에 `LINEAR_WEBHOOK_SECRET`, `LINEAR_WEBHOOK_MAX_AGE_MS` 추가.
- 구현: `scripts/linear-webhook-server.js`에서 raw body 기준 HMAC-SHA256 서명 검증과 `webhookTimestamp` 허용 시간 검증을 추가.
- 로컬 개발 기본값: `LINEAR_WEBHOOK_SECRET`이 비어 있으면 경고 로그를 남기고 서명 검증을 건너뜀.
- 검증: `LINEAR_WEBHOOK_SECRET=test_linear_secret node scripts/linear-webhook-server.js` 실행 후 유효 서명 요청은 `200`, 위조 서명과 만료 타임스탬프 요청은 `401` 응답을 확인.
- 사용자 신규 요구사항: Linear를 작업 제어 도구로 사용하고, 이슈 상태를 기준으로 플래너 시작, 역할 진행, 리뷰, 머지까지 이어지는 워크플로우를 정의.
- 워크플로우 초안:
- `Backlog`: 초안 상태로 간주하고 자동 동작 없음.
- `Todo`: 플래너가 플랜 작성 후 브랜치/커밋/PR 생성, 역할 지시, 이슈 상태를 `In Progress`로 갱신.
- `In Progress`: 구현 역할 작업 진행 상태.
- `In Review`: 각 역할 작업 완료 후 검토 대기 상태.
- `Done`: 사용자가 승인 후 에이전트가 PR 머지 수행.
- 사용자 요구사항: PR 제목은 `[이슈코드] 제목` 형식을 사용.
- 사용자 요구사항: 플랜 파일 최상단에 이슈 코드와 링크를 명시.
- 구현: `scripts/linear-webhook-workflow.js`를 추가해 `Todo` 상태 전환 시 전용 worktree와 `codex exec` 플래너 세션을 자동 기동.
- 구현: 자동 플래너 세션 로그와 마지막 응답을 `.codex/linear-runs/<issue-code>/`에 기록.
- 구현: `Done` 상태 전환 시 `[이슈코드]` 형식의 열린 PR을 찾아 `gh pr merge`로 머지하도록 연결.
- 환경 변수 구조 확장: `.env.example`에 `LINEAR_API_KEY`, `GITHUB_PR_MERGE_METHOD` 추가.
- 실행 스크립트: `pnpm webhook:linear`가 Node `--env-file-if-exists=.env` 옵션으로 루트 `.env`를 자동 로드하도록 구성.
- 버그 수정: 외부 터미널의 `PATH`에 `codex`가 없어도 `CODEX_BIN` 또는 기본 앱 번들 경로(`/Applications/Codex.app/Contents/Resources/codex`)로 플래너 세션을 실행하도록 보정.
- 구현 확장: 플래너 세션 성공 시 같은 이슈 worktree에서 `[플랫폼 엔지니어, 테스트 엔지니어]` 구현 세션을 자동 시작하고 완료 후 Linear 상태를 `In Review`로 갱신.
- 구현 확장: `Canceled` 상태 전환 시 `[이슈코드]` 형식의 열린 PR을 `gh pr close --delete-branch`로 종료.
- 구현 확장: `Issue remove` 이벤트 수신 시에도 `[이슈코드]` 형식의 열린 PR을 `gh pr close --delete-branch`로 종료.
- 구현 확장: 같은 이슈 코드의 열린 PR이 이미 있으면 플래너 단계에서 중단하지 않고, 기존 worktree의 플랜 파일을 찾아 구현 자동화를 이어서 시작.
- 구현 보강: 구현 자동화 프롬프트에 커밋/푸시 완료를 명시하고, 종료 후 worktree가 clean이며 원격과 동기화되었는지 검증한 뒤에만 성공 처리와 `In Review` 전환을 수행.
- 구현 보강: Linear 코멘트는 긴 경로/PR/PID 대신 단계별 한 줄 상태 메시지 중심으로 축약.

### 2026-03-13
- 사용자 신규 요구사항: 자동화가 작성하는 Linear 이슈 코멘트 형식을 `[역할] 진행사항`으로 통일. 예: `[테스트 엔지니어] 테스트 작성을 시작했습니다.`
- 사용자 신규 요구사항: 사용자가 Linear 이슈에 코멘트로 수정 요청을 남기면 플래너가 해당 코멘트를 읽어 기존 플랜을 갱신하고, 갱신된 플랜 기준으로 구현 역할을 다시 지시하는 흐름을 추가.
- 위 두 요구사항은 기존 웹훅 자동화의 후속 확장 범위로 기록만 수행하고, 현재 시점에는 구현하지 않음.
