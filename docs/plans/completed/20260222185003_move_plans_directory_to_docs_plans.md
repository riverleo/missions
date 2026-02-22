# plans 디렉토리를 docs/plans로 이전

## 목표
플랜 문서의 기본 저장 경로를 `plans/`에서 `docs/plans/`로 이전한다.
기존 플랜 작성/구현/자동 동기화 흐름이 동일하게 동작하도록 경로 참조 지점(역할 문서, 템플릿, 자동화 스크립트/워크플로우)을 함께 정리한다.

## 담당자
- 플래너
- 게임 디자이너
- 플랫폼 엔지니어
- 테스트 엔지니어

## 할 일
### 플래너
- [ ] 루트 `AGENTS.md`와 `docs/agents/planner/AGENTS.md`의 플랜 경로 인덱스를 `docs/plans/` 기준으로 정리한다.
- [ ] 구현 역할 호출 문구에서 플랜 파일 위치 안내를 `docs/plans/` 기준으로 정리한다.

### 플랫폼 엔지니어
- [x] 저장소 내 플랜 경로 하드코딩 참조(스크립트, 워크플로우, 설정)를 `docs/plans/`로 일괄 갱신한다.
- [x] 기존 `plans/`의 진행/완료/실패 문서를 `docs/plans/`, `docs/plans/completed/`, `docs/plans/failed/`로 이전하고 상대 참조가 깨지지 않음을 확인한다.

### 테스트 엔지니어
- [x] 플랜 경로를 사용하는 자동화/검증(예: GitHub Actions 라벨 동기화)이 `docs/plans/*`에서 동일하게 동작하는지 회귀 검증한다.
- [x] 플랜 신규 생성 시 `docs/plans/*.md`에 생성되는 워크플로우를 점검하고 결과를 기록한다.

## 노트
### 2026-02-22
- 사용자 신규 요구사항: `plans`를 `docs/plans`로 이전.
- 플래너 역할 규칙에 따라 본 요청은 플랜에 먼저 기록했고 구현은 명시적 시작 요청 전 보류한다.
- `plans/` 디렉터리 전체를 `docs/plans/`로 이동하고 `completed`, `failed` 하위 디렉터리를 함께 이전했다.
- `.github/workflows/move-plan-to-completed.yml` 경로 참조를 `docs/plans/*` 기준으로 갱신했다.
- `.github/pull_request_template.md`의 플랜 경로 안내를 `docs/plans/<plan-file>.md`로 갱신했다.
- 검증: 워크플로우 스크립트의 경로 해석 로직 점검 및 브랜치명(`plans/*`, `codex/plans/*`) 호환 확인.
