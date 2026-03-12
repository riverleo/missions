이슈: OOA-11
링크: https://linear.app/ooaah/issue/OOA-11/지형-타일을-제거

# 지형 타일 제거

## 목표

지형과 타일의 매핑을 담당하는 `terrains_tiles` 테이블과 이를 전제로 동작하는 타입, 훅, 식별자, 관리자 UI 경로를 저장소에서 완전히 제거한다.
남아 있는 참조를 정리해 지형과 타일이 독립적으로 동작하도록 만들되, `terrains_tiles` 제거는 새 마이그레이션 파일을 추가하지 않고 기존 마이그레이션 파일을 수정하는 방식으로 반영한다.
사용자가 데이터베이스를 수동으로 리셋할 예정이므로, 기존 브랜치와 PR에서 마이그레이션 전략을 바로잡고 관련 회귀 테스트와 검증 절차를 함께 정리한다.

## 담당자

- 플래너
- 플랫폼 엔지니어
- 테스트 엔지니어

## 할 일

### 플래너

- [x] 이슈 OOA-11 기준 플랜 문서를 `docs/plans/20260313022533_remove_terrain_tile_mapping.md`에 작성한다.
- [x] `plans/20260313022533_remove_terrain_tile_mapping` 브랜치를 생성하고 원격에 푸시한 뒤 플랜 PR을 생성한다.
- [x] PR 제목/본문이 저장소 규칙과 템플릿에 일치하는지 검증하고 필요한 역할 호출 문구를 남긴다.
- [x] 사용자 코멘트 "새로운 마이그레이션 파일을 만들었던데 제거하고 기존 마이그레이션 파일을 수정해"를 반영해 플랜 목표, 할 일, 노트를 갱신하고 기존 브랜치와 PR #31에 푸시한다.

### 플랫폼 엔지니어

- [ ] `supabase/migrations/20260313020624_remote_schema.sql`에서 `terrains_tiles` 테이블 및 관련 foreign key 정의를 직접 제거하고, 이를 대체하는 새 마이그레이션 파일은 저장소에서 삭제한다.
- [ ] `terrains_tiles` 제거 결과가 `src/lib/types/supabase.ts`와 `src/lib/types/supabase.generated.ts`에 반영되도록 타입 생성 산출물을 기존 마이그레이션 기준으로 다시 정리한다.
- [x] `TerrainTile` 전용 타입, 식별자, 스토어, CRUD 로직, 관리자 라우트/사이드바/헤더 등 지형-타일 매핑 전용 코드가 제거된다.
- [x] 지형과 타일 기능이 매핑 제거 이후에도 필요한 범위에서 독립적으로 동작하도록 남은 참조와 데이터 흐름을 정리한다.
- [ ] PR #31 기준으로 지형-타일 제거 작업이 실제로 모두 완료됐는지 코드 기준으로 재검증하고, 누락이 있으면 같은 브랜치에서 보완한다.

### 테스트 엔지니어

- [x] 지형-타일 매핑 제거와 관련된 테스트를 추가 또는 갱신해 제거된 타입/라우트/스토어 참조 회귀를 검증한다.
- [ ] 새 `terrains_tiles` 삭제용 마이그레이션 파일이 남아 있지 않고, 기존 마이그레이션 수정 기준으로 검증이 수행됐는지 확인한다.
- [x] 플랜의 체크리스트 상태와 실제 변경 산출물을 대조하고 필요한 수동 검증 결과를 기록한다.
- [ ] 기존 마이그레이션 수정 반영 후 테스트/검증 범위를 다시 실행하고, 남은 이슈 또는 완료 판단 근거를 PR과 플랜에 기록한다.

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
- 사용자 코멘트 "작업 다 완료됐어?"가 추가되어, 기존 구현이 실제 완료 상태인지 재검증하고 남은 수정이 있으면 같은 PR #31에서 이어서 반영하도록 플랜을 갱신했다.
- 사용자 코멘트 "새로운 마이그레이션 파일을 만들었던데 제거하고 기존 마이그레이션 파일을 수정해. 어차피 데이터베이스는 내가 수동으로 리셋할거야."를 반영해, 새 drop 마이그레이션 파일 추가 방식은 폐기하고 기존 마이그레이션 직접 수정으로 재지시한다.
- 기존 브랜치 `plans/20260313022533_remove_terrain_tile_mapping`와 PR #31을 유지한 채 후속 구현을 진행한다.
- 재지시 역할 호출 문구:
- `[플랫폼 엔지니어, 테스트 엔지니어]`
- `20260313022533_remove_terrain_tile_mapping 플랜 구현 시작`
