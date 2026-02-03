# 작업 계획

## 1. Behavior Action Type 이름 변경

**목적**: interaction_type (`once_interaction_type`, `repeat_interaction_type`)과 일관성 있는 명명으로 변경

### 변경 사항
- `behavior_action_type`의 `'interact'` → `'once'`
- `'fulfill'`, `'idle'`는 그대로 유지
- `once_interaction_type`, `repeat_interaction_type`은 그대로 유지

### 영향 범위
- [x] DB enum 값 변경
  - `behavior_action_type`의 `'interact'` → `'once'`
- [x] 기존 마이그레이션 파일 수정
  - `20251219100247_create_need_behaviors.sql`
- [x] TypeScript 코드 업데이트
  - 모든 `type === 'interact'` → `type === 'once'`
  - 모든 `type: 'interact'` → `type: 'once'`
  - executeInteractAction → executeOnceAction
- [x] TypeScript 타입 재생성 (`supabase.generated.ts`)

---

## 2. Interaction Type Enum 값 변경

**목적**: building_use를 once와 repeat 모두에서 사용 가능하도록

### 변경 사항
- `once_interaction_type`의 `'building_execute'` → `'building_use'`
- `repeat_interaction_type`에 `'building_use'` 추가

### 영향 범위
- [x] DB enum 값 변경
  - `once_interaction_type`: `'building_execute'` → `'building_use'`
  - `repeat_interaction_type`: `'building_use'` 추가
- [x] 기존 마이그레이션 파일 수정
  - `20251216000000_create_characters.sql`
- [x] TypeScript 코드 업데이트
  - 모든 `'building_execute'` → `'building_use'`
- [x] TypeScript 타입 재생성 (`supabase.generated.ts`)

---

## 3. Interaction Type Enum 값 추가

**목적**: 아이템을 창고에 보관하는 기능 추가

### 변경 사항
- `once_interaction_type`에 `'item_store'` 추가

### 영향 범위
- [ ] DB enum 값 추가
  - `once_interaction_type`: `'item_store'` 추가
- [ ] 기존 마이그레이션 파일 수정
  - `20251216000000_create_characters.sql`
- [ ] TypeScript 코드 업데이트
  - state-label.ts에 `item_store` 레이블 추가
  - execute-once.ts에 `item_store` 로직 구현 (필요시)
- [ ] TypeScript 타입 재생성 (`supabase.generated.ts`)

---

## 4. tick-find-and-go 도착 판정 로직 추가

**목적**: 타겟까지 도착했는지 명확히 판정하여 불필요한 이동 방지

### 변경 사항
- `vectorUtils`에 벡터 간 거리 계산 유틸리티 추가
  - `getDistance(a: Vector, b: Vector): number`
- `tick-find-and-go`에서 도착 판정 로직 추가
  - `targetEntityId`가 있고 `path`가 비어있을 때
  - 타겟과의 거리가 임계값(50) 미만이면 도착으로 판정
  - 임계값 이상이면 경로 재설정

### 영향 범위
- [x] vectorUtils에 거리 계산 함수 추가
- [x] tick-find-and-go.ts 도착 판정 로직 추가
- [x] 기존 거리 계산 코드를 유틸리티로 교체
  - check-completion.ts
  - execute-once.ts
  - execute-fulfill.ts

---

## 5. heldItemIds를 EntityId로 교체

**목적**: 일관성 있는 ID 타입 사용 (WorldItemId → EntityId)

### 변경 사항
- `WorldCharacterEntity.heldItemIds` 타입 변경: `WorldItemId[]` → `EntityId[]`
- 관련 코드 업데이트
  - EntityId 생성 시 `EntityIdUtils.createId()` 사용
  - EntityId 파싱 시 `EntityIdUtils.parse()` 사용

### 영향 범위
- [x] WorldCharacterEntity 타입 변경
- [x] heldItemIds 사용하는 모든 코드 업데이트
  - world-character-entity.svelte.ts
  - world-character-entity-renderer.svelte
  - tick-find-and-go.ts
  - execute-once.ts
  - execute-fulfill.ts
  - decrease-durability-ticks.ts

---

## 추가 작업 목록

(여기에 다른 작업들을 추가하세요)
