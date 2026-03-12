# Linear 웹훅 로컬 서버 추가

## 목표
Linear 웹훅 이벤트를 로컬 개발 환경에서 수신할 수 있도록 Node.js 기반의 경량 서버를 추가한다.
서버는 `3000` 포트에서 실행되며, 요청 본문을 수신하고 기본 응답 및 로그를 제공해야 한다.

또한 개발자가 별도 명령 조합 없이 `pnpm webhook:linear` 한 번으로 로컬 서버와 Cloudflare Tunnel을 함께 실행할 수 있도록 `package.json`에 전용 실행 명령을 구성한다.
초기 범위는 웹훅 수신 기반, 터널 연결 자동화, Linear 서명 검증까지로 한정하며, Codex 자동 실행 연동은 후속 플랜으로 분리한다.

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

### 플랫폼 엔지니어
- [x] 저장소에 Linear 웹훅 `POST` 요청을 수신하는 Node.js 서버 파일을 추가하고 `3000` 포트에서 실행되도록 구성한다.
- [x] 서버가 JSON 본문을 파싱하고 요청 경로, 헤더 일부, 본문을 확인 가능한 수준으로 로그/응답을 제공하도록 구현한다.
- [x] Cloudflare Tunnel 실행에 필요한 로컬 설정 파일 또는 환경 변수 구조를 추가하고 `localhost:3000`으로 라우팅되도록 구성한다.
- [x] `pnpm webhook:linear` 실행 시 로컬 웹훅 서버와 Cloudflare Tunnel이 함께 기동되도록 스크립트를 재구성한다.
- [x] 터널 실행 전제 조건(예: `cloudflared` 설치, 토큰/설정 파일 위치)을 코드와 문서 기준으로 확인 가능하게 정리한다.
- [x] Linear `signing secret`을 환경 변수로 주입받고 raw body 기준 `Linear-Signature` 검증을 수행하도록 서버를 확장한다.
- [x] `webhookTimestamp`를 활용한 허용 시간 검증을 추가하고 검증 실패 시 `401` 또는 `403` 응답으로 거부하도록 처리한다.
- [x] 로컬 개발용 우회 동작이 필요하다면 조건과 기본값을 코드 및 환경 변수 기준으로 명확히 정리한다.

### 테스트 엔지니어
- [x] 로컬에서 웹훅 서버 실행 후 `POST` 요청으로 `200` 응답이 반환되는지 검증한다.
- [x] JSON 본문 수신이 정상 동작하는지 재현 절차와 함께 검증 결과를 기록한다.
- [x] `pnpm webhook:linear` 실행 시 로컬 서버와 Cloudflare Tunnel 프로세스가 함께 기동되는지 검증한다.
- [x] 터널이 발급한 공개 주소를 통해 웹훅 엔드포인트 접근이 가능한지 검증 결과를 기록한다.
- [x] 유효한 서명이 포함된 요청은 `200` 응답이 유지되는지 검증한다.
- [x] 서명 불일치 또는 허용 시간 초과 요청이 거부되는지 재현 절차와 함께 검증 결과를 기록한다.

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
