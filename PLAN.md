# 작업 계획

## 1. Action Completion Mode 시스템 (우선순위: 높음)

### 목표
각 행동 액션이 얼마동안 실행될지 정의하는 시스템 추가

### 네이밍 변경
- `character_behavior_type` → `behavior_interact_type`
- `behavior_target_method` → `behavior_target_selection_method`
- `target_method` → `target_selection_method` (컬럼명)

### behavior_interact_type 재설계 (구 character_behavior_type)
**현재 문제**: demolish, pick 등의 타입이 대상이 명확하지 않음
**해결**: 엔티티 타입을 접두사로 추가

**변경 사항**:
- `use` → `building_execute` (건물 동작 실행)
- `demolish` → `building_demolish` (건물 철거)
- `repair` → `building_repair` (건물 수리)
- `clean` → `building_clean` (건물 청소)
- 새로 추가: `item_pick` (아이템 줍기)
- 새로 추가: `item_use` (아이템 사용)

### behavior_completion_type enum 추가
```sql
create type behavior_completion_type as enum (
  'fixed',       -- 지정된 시간만큼 실행 (기본값)
  'completion',  -- 목표 달성까지 실행 (청소/수리/철거)
  'immediate'    -- 즉시 완료 (줍기/사용)
);
```

**각 모드 설명**:
- `fixed`: 액션의 duration_ticks만큼 실행 (현재 방식)
- `completion`: fulfillment가 목표에 도달할 때까지 반복 실행 (청소가 100% 될 때까지)
- `immediate`: 1틱만에 즉시 완료 (아이템 줍기, 건물 동작 실행)

### 구현 계획

#### 1단계: 마이그레이션
**기존 마이그레이션 파일 수정**:
- `supabase/migrations/[timestamp]_create_behaviors.sql`

**변경 내용**:
1. `behavior_interact_type` enum 재정의
2. `behavior_completion_type` enum 추가
3. `need_behavior_actions` 테이블에 컬럼 추가:
   - `behavior_completion_type behavior_completion_type not null default 'fixed'`
4. `condition_behavior_actions` 테이블에 컬럼 추가:
   - `behavior_completion_type behavior_completion_type not null default 'fixed'`

#### 2단계: ALTER.sql 생성
프로젝트 루트에 ALTER.sql 파일 생성:
- `character_behavior_type` enum을 `behavior_interact_type`으로 리네임
- `behavior_target_method` enum을 `behavior_target_selection_method`로 리네임
- behavior_interact_type enum 값 변경 (기존 use → building_execute 등)
- 새로운 behavior_completion_type enum 추가
- `need_behavior_actions` 테이블:
  - `character_behavior_type` 컬럼 → `behavior_interact_type` 컬럼으로 리네임
  - `target_method` 컬럼 → `target_selection_method` 컬럼으로 리네임
  - `behavior_completion_type` 컬럼 추가
- `condition_behavior_actions` 테이블:
  - `character_behavior_type` 컬럼 → `behavior_interact_type` 컬럼으로 리네임
  - `target_method` 컬럼 → `target_selection_method` 컬럼으로 리네임
  - `behavior_completion_type` 컬럼 추가
- `fulfillments` 테이블:
  - `character_behavior_type` 컬럼 → `behavior_interact_type` 컬럼으로 리네임

#### 3단계: TypeScript 타입 재생성
- CharacterBehaviorType → BehaviorInteractType으로 리네임 및 enum 값 업데이트
- BehaviorTargetMethod → BehaviorTargetSelectionMethod로 리네임
- BehaviorCompletionType 타입 추가 (fixed, completion, immediate)
- NeedBehaviorAction, ConditionBehaviorAction 타입:
  - character_behavior_type → behavior_interact_type 필드명 변경
  - target_method → target_selection_method 필드명 변경
  - behavior_completion_type 필드 추가

#### 4단계: UI 수정
**Admin 페이지 (Behavior Action 편집)**:
- character_behavior_type → behavior_interact_type 필드명 및 레이블 변경
- target_method → target_selection_method 필드명 변경
- behavior_completion_type 선택 드롭다운 추가
- interact/idle 액션에만 표시
- go 액션에는 표시하지 않음 (이동은 항상 목적지 도달까지)

#### 5단계: 런타임 로직 수정
**World Context에서**:
- fixed: 기존 로직 유지 (duration_ticks 체크)
- completion: fulfillment 목표 달성 여부 체크
- immediate: 즉시 완료 처리 (1틱)

#### 6단계: 대상 찾기 로직 업데이트
**behavior_interact_type에 따른 엔티티 타입 필터링**:
- `building_*` (execute/demolish/repair/clean) → 건물만 검색
- `item_*` (pick/use) → 아이템만 검색

**유연한 대상 찾기**:
- Need Behavior: need 발동 조건과 무관하게 모든 엔티티 타입 액션 허용
- Condition Behavior: condition 엔티티 타입과 behavior_type 엔티티 타입이 달라도 허용
- 예: building의 cleanliness condition이 발동 조건이지만, item_pick 액션도 실행 가능
- 예: 캐릭터의 hunger need가 발동 조건이지만, building_clean 액션도 실행 가능

**fulfillments를 활용한 스마트 검색**:
- fulfillments 테이블이 behavior_interact_type과 need/condition의 연결을 정의
- 대상 검색 전략:
  1. 액션의 behavior_interact_type으로 fulfillments 조회
  2. fulfillments의 condition_id를 가진 엔티티들을 우선 검색
  3. fulfillment가 없거나 매칭 엔티티가 없으면 **가장 가까운 대상**으로 폴백
     - behavior_interact_type의 엔티티 타입(building/item)에서 캐릭터와 가장 가까운 것 선택
     - 점진적 개선: 추후 더 스마트한 선택 로직 추가 (예: 사용 빈도, 우선순위 등)
- 예: `building_clean`의 fulfillment가 `cleanliness` condition을 증가 → cleanliness를 가진 건물들 중에서 검색

**구현 위치**:
- 대상 검색 유틸리티 함수
- UI에서 target_selection_method가 'search' 또는 'search_or_continue'일 때 적용

#### 7단계: 액션 패널에 검색 대상 미리보기 추가
**목적**:
- target_selection_method가 'search'일 때 어떤 대상들이 검색될지 예측 불가능한 문제 해결
- 사용자가 설정한 조건으로 실제로 어떤 엔티티들이 검색되는지 미리 확인

**구현 내용**:
- Need/Condition Behavior Action Panel에 "검색 가능한 대상" 섹션 추가
- target_selection_method가 'search'일 때만 표시
- behavior_interact_type에 따라 검색되는 엔티티 목록 표시
  - `building_*`: 건물 목록
  - `item_*`: 아이템 목록
- 추가 필터 조건이 있다면 반영된 결과 표시
- 테스트 월드 기준으로 미리보기 제공

**UI 예시**:
```
타깃 결정: 새로운 대상

검색 가능한 대상 (3개):
- 🏠 집
- 🏭 공장
- ⛪ 교회
```

---

## 2. Building States에 Condition 기반 활성화 추가

### 목표
building_states에 condition 기반 활성화 조건을 추가하여, 특정 condition 값 범위에 따라 건물 상태가 변경되도록 함. (아이템 상태의 내구도 기반 활성화와 동일한 방식)

## 현재 상태

**item_states (참고):**
- `min_durability`, `max_durability`: 내구도 범위로 상태 활성화 조건 지정
- 예: idle 상태는 durability 80~100, broken 상태는 0~20

**building_states (현재):**
- 애니메이션 정보만 있음 (atlas_name, frame_from, frame_to, fps, loop)
- 활성화 조건 없음

## 구현 계획

### 1. DB 마이그레이션

**기존 마이그레이션 파일 수정:**
`supabase/migrations/20251216200000_create_buildings.sql`

**building_states 테이블에 컬럼 추가:**
```sql
-- 상태 활성화 조건 (컨디션 기반)
condition_id uuid references conditions(id) on delete cascade,
condition_min_value float not null default 0,
condition_max_value float not null default 100
```

**제약 조건:**
- condition_id는 nullable (null이면 항상 활성화)
- condition_id가 NOT NULL이면 해당 condition 값이 min~max 범위에 있을 때만 활성화

### 2. ALTER.sql 생성
프로젝트 루트에 ALTER.sql 파일 생성:
- building_states 테이블에 3개 컬럼 추가
- 기존 데이터는 condition_id = null로 유지 (항상 활성화)

### 3. TypeScript 타입 재생성
- `BuildingState` 타입에 필드 추가
- `BuildingStateInsert`, `BuildingStateUpdate` 타입 업데이트

### 4. UI 수정

**Admin 페이지 (Building State 편집):**
- 아이템 상태 편집 UI와 동일한 방식으로 구현
- Condition 선택 드롭다운
- Min/Max Value 입력 필드
- "항상 활성화" 옵션 (condition_id = null)

**참고 파일:**
- `src/lib/components/admin/item/item-state-panel.svelte` (또는 유사한 파일)
- 동일한 패턴으로 `building-state-panel.svelte` 수정

### 5. 런타임 로직 수정

**World Context에서:**
- 건물의 현재 condition 값 체크
- condition_min_value ≤ 현재값 ≤ condition_max_value 범위에 맞는 state 활성화
- condition_id가 null인 state는 항상 활성화

## 작업 순서
- [ ] 기존 마이그레이션 파일 수정
- [ ] ALTER.sql 생성
- [ ] 수동 적용
- [ ] TypeScript 타입 재생성
- [ ] UI 컴포넌트 수정
- [ ] 런타임 로직 구현
- [ ] 테스트

---

_작업 시작: 2026-01-23_
