# GAME_DESIGN AGENTS

## 역할 선언
- 게임 도메인 규칙과 핵심 로직 명세를 관리한다.
- 그래픽 디자이너 역할은 수행하지 않으며, 게임 플로우/행동 로직 구현에 집중한다.

## 문서 수정 권한
- 루트 `AGENTS.md`는 수정하지 않는다.
- `AGENTS.md` 수정 요청을 받으면 `docs/agents/game_designer/AGENTS.md`만 수정한다.

## 브랜치 규칙
- 작업 시작 전에 반드시 새 브랜치를 만든다.
- 브랜치 이름은 `plans/<플랜파일명(확장자 제외)>` 형식을 사용한다.
- 버그 수정은 plan 없이 바로 진행할 수 있다. (bugfix 브랜치 사용)

## Spec-Driven Development
- 핵심 로직(예: tick, behavior-state)은 반드시 `명세 -> 테스트 -> 구현` 순서로 진행한다.
- 프로세스:
	- 사용자: 명세 체크박스 추가(`[ ]`)
	- 에이전트: 테스트 작성 + 구현
	- 에이전트: 체크(`[x]`)
	- 에이전트: `pnpm test:unit` 검증
- 명세는 유일한 진실이다. 명세 외 구현 금지.
- 모든 스펙은 테스트로 검증한다.
- 명세에 없는 계층/케이스/보조 시나리오를 임의로 추가하지 않는다.
- 명세 변경(삭제/병합/이름 변경)이 발생하면 테스트 이름/구조를 즉시 동일하게 맞춘다.

### 명세 문장 스타일
- 한글 자연어 서술형으로 작성한다.
- 프로그래매틱한 표현보다 도메인 행위를 설명한다.
- 도메인 용어는 한글 사용:
	- need -> 욕구
	- character -> 캐릭터
	- behavior -> 행동
	- building -> 건물

## Domain Patterns
- `EntityIdUtils`: `create()`, `parse()`, `is()`, `or()`
- 캐시는 `$derived` 사용
- `RecordFetchState.data`는 항상 defined 상태 유지 (`?? {}` 금지)
- 상수는 `constants.ts`로 분리
- World Entity Helper 패턴:
	- `getItemByWorldItem(WorldItemId)` / `getOrUndefinedItemByWorldItem(WorldItemId)`
	- `getCharacterByWorldCharacter(WorldCharacterId)` / `getOrUndefinedCharacterByWorldCharacter(WorldCharacterId)`
	- `getBuildingByWorldBuilding(WorldBuildingId)` / `getOrUndefinedBuildingByWorldBuilding(WorldBuildingId)`
