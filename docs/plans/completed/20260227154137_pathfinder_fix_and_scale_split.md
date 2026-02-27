# 패스파인더 버그 수정 및 캐릭터 스케일 구조 개편

## 목표

두 가지 이슈를 해결한다.

1. 큰 캐릭터가 패스파인더로 경로를 찾지 못하는 버그를 수정한다. 물리 바디 중심이 walkable 셀 외부에 위치할 때 `findPath`가 빈 경로를 반환하는 문제를 `findNearestWalkableCell`로 시작/끝 위치를 스냅하여 해결한다.
2. `Character.scale`을 제거하고 `CharacterBody.scale`(바디 스프라이트 렌더링)과 `Character.face_scale`(페이스 스프라이트 렌더링)로 분리하여 작업자가 바디와 페이스의 스케일을 각각 독립적으로 관리할 수 있게 한다. 바디 스케일은 물리 콜라이더에 영향을 주지 않는다.

## 담당자

- 플래너
- 게임 디자이너
- 플랫폼 엔지니어
- 테스트 엔지니어

진행 명령:
```text
[플랫폼 엔지니어, 게임 디자이너]
20260227154137_pathfinder_fix_and_scale_split 플랜 구현 시작
```

## 할 일

### 플래너

- [ ] 본 플랜 작성 및 PR 생성

### 플랫폼 엔지니어

- [ ] 기존 마이그레이션 파일(`supabase/migrations/20251216000000_create_characters.sql`)을 직접 수정한다: `character_bodies` 테이블에 `scale real NOT NULL DEFAULT 1.0` 컬럼을 추가하고, `characters` 테이블의 `scale` 컬럼을 `face_scale`로 이름을 변경한다. 로컬 DB는 psql로 직접 `ALTER TABLE`을 실행하여 반영한다.
- [ ] `supabase gen types`로 `supabase.generated.ts`를 재생성한다.
- [ ] `src/lib/types/supabase.ts`에서 `Character`와 `CharacterBody` 타입이 새 컬럼을 반영하는지 확인한다.

### 게임 디자이너

- [ ] `pathfinder.ts`의 `findPath` 메서드에서 시작/끝 위치가 walkable이 아닌 경우 `findNearestWalkableCell`로 가장 가까운 walkable 셀로 스냅한 후 A* 탐색을 실행하도록 수정한다.
- [ ] `character-sprite-animator.svelte`에서 기존 `character.scale` 대신 `characterBody.scale`을 컨테이너 스케일로 적용하고, 페이스 스프라이트에 `character.face_scale`을 추가 적용한다.
- [ ] `character-action-panel.svelte`에서 `scale` 입력 필드를 `face_scale`로 변경한다 (레이블: "페이스 스케일").
- [ ] `character-body-action-panel.svelte`에 `scale` 입력 필드를 추가한다 (레이블: "스케일").

### 테스트 엔지니어

- [ ] 패스파인더 수정 후 큰 캐릭터(바디 중심이 walkable 외부)의 경로 탐색이 정상 동작하는 테스트를 추가한다.
- [ ] 스케일 분리 후 기존 테스트가 통과하는지 확인한다.

## 노트

### 2026-02-27

- 버그 원인: `findPath`가 `body.position`(바디 중심)을 셀 인덱스로 변환하여 A* 탐색을 시작하는데, walkable 셀은 바닥면/타일 표면 위 2셀에만 설정되어 있어 큰 캐릭터의 바디 중심이 walkable 영역 밖에 위치한다.
- 수정 방법: `findPath` 메서드 내부에서 A* 실행 전 시작/끝 위치가 walkable인지 체크하고, 아니면 `findNearestWalkableCell`로 가장 가까운 walkable 셀 좌표를 얻어 사용한다.
- 스케일 구조 결정: `CharacterBody.scale`은 렌더링 전용(물리 콜라이더 미연동). `Character.face_scale`은 페이스 스프라이트 전용.
- 렌더링 구조: 컨테이너에 `bodyScale` 적용(body+face 전체), 페이스 스프라이트에 `faceScale` 추가 적용. 기존 좌표계와 호환 유지.
- DB 변경 방식: 새 마이그레이션 파일을 만들지 않고 기존 `supabase/migrations/20251216000000_create_characters.sql`을 직접 수정한다. 로컬 DB는 psql로 `ALTER TABLE character_bodies ADD COLUMN scale real NOT NULL DEFAULT 1.0`, `ALTER TABLE characters RENAME COLUMN scale TO face_scale`을 실행한다.
- 수정 대상 파일 목록:
  - `supabase/migrations/20251216000000_create_characters.sql` (기존 파일 수정)
  - `src/lib/components/app/world/pathfinder/pathfinder.ts`
  - `src/lib/components/app/sprite-animator/character-sprite-animator.svelte`
  - `src/lib/components/admin/character/character-action-panel.svelte`
  - `src/lib/components/admin/character-body/character-body-action-panel.svelte`
  - `src/lib/types/supabase.generated.ts` (재생성)
  - `src/lib/types/supabase.ts` (타입 확인)
