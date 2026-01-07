# 프로젝트 컨벤션

## 버그 해결 원칙

**CRITICAL**: 버그 발견 시 순서: (1) 원인 파악 → (2) 작게 테스트 → (3) 동작 확인 → (4) 전체 반영

## 코딩 스타일

1. **TypeScript에서는 `undefined` 사용, `null` 사용 안 함** (DB는 `null`)
2. **함수명은 prop/이벤트 이름과 일치** (`handleSubmit` → `onsubmit`)
3. **Shorthand 문법 선호** (`onsubmit={onsubmit}` → `{onsubmit}`)
4. **도메인명은 명확하게** (`branch` → `questBranch`)
5. **Hook을 컴포넌트에서 직접 사용** (prop 전달 X)
6. **Radash 유틸리티 우선 사용**
7. **이벤트 핸들러에서 리터럴 함수 자제**
8. **로직은 컴포넌트 내부, 콜백은 결과만 전달**
9. **여러 컴포넌트에서 사용되는 로직은 별도 파일로 분리**
10. **임포트는 명시적으로** (`import * as` 금지)

## Svelte 5 특화 규칙

1. **Deprecated API 금지** (`$app/stores` → `$app/state`)
2. **스토어는 단일 진실 공급원**
3. **Hook 함수 명명**: 자신의 도메인은 짧게(`fetch`, `create`), 하위 도메인만 접두사(`createScenarioQuestBranch`)
4. **외부 라이브러리 객체는 `$state.raw()` 사용** (Matter.js, DOM 등)
5. **Context는 컴포넌트 초기화 시점에만 접근 가능** (클래스에는 생성자로 전달)
6. **스토어 업데이트는 Immer의 `produce` 사용**
7. **컴포넌트 독립성 유지 - 스토어를 통한 상태 공유**
8. **관련 로직은 별도 파일로 분리** (localStorage 등)
9. **상수는 constants.ts에 중앙화**

## 데이터베이스 규칙

1. **데이터 무결성은 DB에서 보장** (constraint/index 강제, 애플리케이션에서 우회 금지)
2. **RLS 정책 네이밍**: 소문자 시작, 주체는 복수형 (`"anyone can view tiles"`)
3. **DB default 값 우선 사용** (애플리케이션에서 명시적으로 값 넣지 말 것)
4. **user_roles**: 0개 또는 1개 (`.maybeSingle()` 사용)
5. **Audit 컬럼**: `created_by`, `deleted_by` (admin 테이블에 추가)
6. **Constraint/Index 명명**: `uq_`, `fk_`, `idx_`, `chk_` 접두사
7. **테이블 생성**: inline constraint 선호, 조인용 ID 중복 저장
8. **Migration 구조**: `[table][rls][table][rls]` 패턴, index는 나중에
9. **테이블명은 복수형**, **관계 데이터는 단수형**
10. **타입 re-export**: WithXXX suffix 금지, 원래 이름 사용

### 헬퍼 함수

- `is_admin()`, `is_me()`, `is_own_player()`, `is_world_owner()`: RLS 권한 체크
- `current_user_role_id()`: Audit 컬럼 기본값
- `update_updated_at()`: UPDATE 트리거
- `create_player_rolled_dice_value()`: 주사위 INSERT 트리거

## Types

### 브랜드 ID 타입

```typescript
type Brand<T, B extends string> = T & { readonly __brand: B };
export type BuildingId = Brand<string, 'BuildingId'>;  // buildings.id (템플릿)
export type WorldBuildingId = Brand<string, 'WorldBuildingId'>;  // world_buildings.id (인스턴스)

// Row 타입
type BuildingRow = Tables<'buildings'>;

// 메인 타입: ID 필드들을 브랜드 타입으로 교체
export type Building = Omit<BuildingRow, 'id' | 'scenario_id'> & {
  id: BuildingId;
  scenario_id: ScenarioId;
};

// Insert/Update 타입도 브랜드 타입 사용
```

**Supabase 쿼리**: `.single<Type>()` 사용, `as Type` 캐스팅 금지

**타입 캐스팅 패턴**:
- Record 인덱싱: `$store.data[id as BuildingId]`
- Route params: `page.params.id as BuildingId`
- crypto.randomUUID(): `crypto.randomUUID() as WorldId`

**금지 사항**: `as any` 절대 금지

## UI 컴포넌트

- **shadcn-svelte 우선**, `import * as` 금지
- **아이콘**: `@tabler/icons-svelte`, `Icon` 접두사, **class 속성 금지**
- **Label 사용 금지**: `InputGroupText` 또는 `ButtonGroupText` 사용
- **ButtonGroup/InputGroup 내부 요소 스타일 금지**
- **InputGroup + Select 금지**: `ButtonGroup` + `Select` 조합 사용

## 패키지 매니저

**pnpm 사용** (npm, yarn 금지)
- `pnpm check`: svelte-check (타입 체크)
- `pnpm lint`: prettier

## 유틸리티

### EntityIdUtils (`$lib/utils/entity-id.ts`)

```typescript
EntityIdUtils.create(type, worldId, id)  // EntityId 생성
EntityIdUtils.parse(entityId)  // { type, value } 반환
EntityIdUtils.is(type, entityId)  // 타입 체크
EntityIdUtils.or([types], entityId)  // 다중 타입 체크
```

**패턴**: 파싱 결과를 `$derived`로 캐싱하여 재사용

### RecordFetchState

- `data` 필드는 **항상 정의됨** (non-optional)
- `Object.values($store.data)` 바로 사용 (`?? {}` 불필요)

## 게임 컨셉

### 앱 개요
- **기본**: 할일 관리 앱 + 게임화
- **구조**: Mission → Foundation → Task
- **게임 루프**: 할일 완료 → 코인 획득 → 건물 건설 → 캐릭터 욕구 충족

### 핵심 메카닉
- **기도(Prayer)**: 캐릭터들이 플레이어를 "신"처럼 여김
- **Faith**: 플레이어의 할일 완료로만 상승 (다른 욕구는 게임 내에서 충족 가능)

### 욕구 시스템 (Utility AI)

| 욕구     | 충족 방법              |
| -------- | ---------------------- |
| Hunger   | 음식 건물에서 식사     |
| Fatigue  | 집에서 수면            |
| Faith    | **할일 완료 시 상승**  |
| Happiness| 다른 욕구 충족 시 상승 |

**DB 구조**:
```
needs (욕구 정의: scenario_id, decay_per_tick, max_value)
├── need_fulfillments (충족 방법: fulfillment_type enum)
├── character_needs (캐릭터 타입별 decay_multiplier)
└── world_character_needs (런타임 값)
```

### 행동 시스템

#### 1. 욕구 행동 (Need Behaviors)
- 트리거: 욕구 < 임계점
- 액션: 건물/아이템 사용

#### 2. 컨디션 행동 (Condition Behaviors)
- 트리거: 건물 컨디션 < 임계점
- 액션: 건물 철거/수리

#### 3. 아이템 행동 (Item Behaviors)
- 트리거: 아이템 사용
- 액션: 애니메이션/효과

**공통 필드**: `duration_ticks`, `character_body_state_type`, `character_face_state_type`, `root`, `success_*_action_id`, `failure_*_action_id`

### State 시스템

**엔티티별 조건**:
- **Building**: condition 값 (priority 있음)
- **Character Face**: need 값 (priority 있음)
- **Item/Tile**: durability (priority 없음)

**결정 로직**: priority 높은 순 → 조건 매칭 → fallback (condition_id null)

### 타일 시스템

**DB 구조**:
```
tiles (타일 타입)
├── tile_states (스프라이트 + 조건)
├── terrains_tiles (N:N 매핑)
└── world_tile_maps (JSONB sparse storage)
```

**world_tile_maps.data**: `{"x,y": {"tile_id": "...", "durability": 100}}`

## 기술 스택

### sprite-animator
- **위치**: `$lib/components/app/sprite-animator/`
- **루프 모드**: `loop`, `once`, `ping-pong`, `ping-pong-once`
- **Transform 순서**: `translate → scale → rotate`

### World 컴포넌트 (Matter.js)
- **스타일**: 횡스크롤 2D 사이드뷰 (중력 기반)
- **Props**: `width`, `height`, `worldId`, `debug`
- **WorldContext**: `load()`, `reload()`, `blueprint`
- **SVG → 물리 바디**: fill+stroke 둘 다 있으면 fill은 다각형, stroke는 선

### Pathfinder
- **라이브러리**: PathFinding.js (A*)
- `PATHFINDING_TILE_SIZE = 4`
- `allowDiagonal: false`

### WorldBlueprint
- **목적**: 건물 배치 미리보기
- `cursor`: 마우스 커서 따라다니는 건물
- `getOverlappingCells()`: 겹침 체크
- `canPlace`: 배치 가능 여부 (겹침 없음)

## Storage & Atlas

### Storage 유틸리티
- `getGameAssetUrl(supabase, type, target)`
- `uploadGameAsset(supabase, type, target, file)`
- **GameAssetType**: `'terrain' | 'item'`

### Atlas 빌드
- **소스**: `src/lib/assets/atlas/sources/`
- **출력**: `src/lib/assets/atlas/generated/`
- **동작**: 폴더별 스프라이트 시트 생성 (ImageMagick montage)

## $effect 패턴

**prop 변경 감지**:
```typescript
let prevValue = prop?.value;
$effect(() => {
  const current = prop?.value;
  if (current !== prevValue) {
    prevValue = current;
    // 변경 로직
  }
});
```

**주의**: `$effect` 내 모든 reactive 값은 자동 의존성 추가
- 자주 변경되는 값(마우스 좌표)은 `$derived`로 분리하여 throttle

## 어드민 페이지

**라우트**: `[scenarioId]/{domain}/[{domain}Id]/`
**컴포넌트**: `aside`, `command`, `create-dialog`, `delete-dialog`, `panel`
**Hook**: `store`, `dialogStore`, `fetch`, `openDialog/closeDialog`, `admin.create/update/remove`
