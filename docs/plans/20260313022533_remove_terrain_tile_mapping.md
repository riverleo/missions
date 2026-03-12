이슈: OOA-11
링크: https://linear.app/ooaah/issue/OOA-11/지형-타일을-제거

# 지형 타일 제거

## 목표

지형과 타일의 매핑을 담당하는 `terrains_tiles` 테이블과 이를 전제로 동작하는 타입, 훅, 식별자, 관리자 UI 경로를 저장소에서 완전히 제거한다.
남아 있는 참조를 정리해 지형과 타일이 독립적으로 동작하도록 만들고, 관련 회귀 테스트와 검증 절차를 함께 정리한다.

## 담당자

- 플래너
- 플랫폼 엔지니어
- 테스트 엔지니어

## 할 일

### 플래너

- [x] 이슈 OOA-11 기준 플랜 문서를 `docs/plans/20260313022533_remove_terrain_tile_mapping.md`에 작성한다.
- [x] `plans/20260313022533_remove_terrain_tile_mapping` 브랜치를 생성하고 원격에 푸시한 뒤 플랜 PR을 생성한다.
- [x] PR 제목/본문이 저장소 규칙과 템플릿에 일치하는지 검증하고 필요한 역할 호출 문구를 남긴다.

### 플랫폼 엔지니어

- [x] `terrains_tiles` 테이블 및 관련 foreign key/타입 생성 코드가 Supabase 스키마와 앱 타입 정의에서 제거된다.
- [x] `TerrainTile` 전용 타입, 식별자, 스토어, CRUD 로직, 관리자 라우트/사이드바/헤더 등 지형-타일 매핑 전용 코드가 제거된다.
- [x] 지형과 타일 기능이 매핑 제거 이후에도 필요한 범위에서 독립적으로 동작하도록 남은 참조와 데이터 흐름을 정리한다.

### 테스트 엔지니어

- [x] 지형-타일 매핑 제거와 관련된 테스트를 추가 또는 갱신해 제거된 타입/라우트/스토어 참조 회귀를 검증한다.
- [x] 플랜의 체크리스트 상태와 실제 변경 산출물을 대조하고 필요한 수동 검증 결과를 기록한다.

## 노트

### 2026-03-13

- 이슈 설명 기준 범위는 기존 지형-타일 매핑(`terrains_tiles`) 관련 코드와 테이블의 완전 제거다.
- 초기 코드 탐색에서 `src/lib/hooks/use-terrain.ts`, `src/lib/types/supabase.ts`, `src/lib/types/supabase.generated.ts`, `src/lib/utils/flow-id.ts`, 관리자 사이드바/헤더에 지형 타일 전용 참조가 남아 있음을 확인했다.
- 역할 호출 문구:
- `[플랫폼 엔지니어, 테스트 엔지니어]`
- `20260313022533_remove_terrain_tile_mapping 플랜 구현 시작`
- `supabase/migrations/20260313030000_drop_terrains_tiles.sql`를 추가해 `terrains_tiles` 테이블 제거를 마이그레이션에 반영했고, 앱 타입/스토어/관리자 UI 라우트/브레드크럼/사이드바 참조를 함께 삭제했다.
- `src/lib/hooks/use-terrain.spec.ts`, `src/lib/hooks/use-scenario.spec.ts`를 추가해 terrain tile 전용 API 제거와 snapshot payload에서 `terrainTiles` 부재를 검증했다.
- 수동 검증: `pnpm test:unit -- --run src/lib/hooks/use-terrain.spec.ts src/lib/hooks/use-scenario.spec.ts`, `pnpm check` 통과. `pnpm exec prettier --write ...`는 SQL 파일 parser 미지원으로 새 마이그레이션 파일만 제외하고 적용했다.
