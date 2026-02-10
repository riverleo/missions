# PLAN: Remove character_face_state_type from need_behaviors

## 문제

현재 `need_behaviors` 테이블에 `character_face_state_type` 필드가 정의되어 있으나, 이는 설계상 적절하지 않음:

- **행동(Behavior)** 은 여러 액션(Actions)으로 구성되는 상위 개념
- **표정(Face State)** 은 개별 액션 실행 시점의 순간적인 상태
- 행동 전체에 하나의 표정을 지정하는 것은 의미가 없음
- 실제로 표정은 interaction actions (building/character/item) 레벨에서만 의미있음

## 현재 상태

### character_face_state_type이 있는 곳
- ✅ `building_interaction_action` - 유지 (액션 레벨, 적절함)
- ✅ `character_interaction_action` - 유지 (액션 레벨, 적절함)
- ✅ `item_interaction_action` - 유지 (액션 레벨, 적절함)
- ❌ `need_behaviors` - **제거 필요** (행동 레벨, 부적절함)

### condition_behaviors는?
- `condition_behaviors`는 `building_state_type`만 있고 `character_face_state_type` 없음 (올바른 설계)

## 변경 계획

### Phase 1: Database Migration
- [ ] 새 마이그레이션 파일 생성
- [ ] `need_behaviors` 테이블에서 `character_face_state_type` 컬럼 DROP
- [ ] 로컬 DB 적용 및 테스트

### Phase 2: TypeScript Types
- [ ] `pnpm supabase gen types` 실행하여 `supabase.generated.ts` 재생성
- [ ] `NeedBehavior` 타입에서 필드 제거 확인
- [ ] 관련 import 확인 (`src/lib/types/supabase.ts`)

### Phase 3: Admin UI - Create Dialog
**File:** `src/lib/components/admin/need-behavior/need-behavior-create-dialog.svelte`
- [ ] `characterFaceStateType` 상태 변수 제거
- [ ] 표정 선택 UI 제거 (Select component)
- [ ] `character_face_state_type` 필드를 insert 객체에서 제거
- [ ] 관련 import 제거 (`CharacterFaceStateType`, `getCharacterFaceStateString`)

### Phase 4: Admin UI - Update Dialog
**File:** `src/lib/components/admin/need-behavior/need-behavior-update-dialog.svelte`
- [ ] `characterFaceStateType` 상태 변수 제거
- [ ] 초기값 설정 로직에서 제거 (`currentBehavior.character_face_state_type`)
- [ ] 표정 선택 UI 제거
- [ ] `character_face_state_type` 필드를 update 객체에서 제거
- [ ] 관련 import 제거

### Phase 5: Admin UI - Panel/List (있다면)
**File:** `src/lib/components/admin/need-behavior/need-behavior-panel.svelte` (존재 확인 필요)
- [ ] 파일 존재 여부 확인
- [ ] 표정 표시 UI 제거 (있다면)
- [ ] 표정 변경 핸들러 제거 (있다면)

### Phase 6: Label Generation
**File:** `src/lib/utils/label.ts`
- [ ] NeedBehavior 관련 라벨 생성 함수 찾기
- [ ] `character_face_state_type` 참조 제거
- [ ] 표정 관련 문자열 생성 로직 제거

### Phase 7: Verification
- [ ] `pnpm check` - 타입 에러 없음
- [ ] `pnpm test:unit` - 유닛 테스트 통과
- [ ] Admin UI 수동 테스트:
  - [ ] Need Behavior 생성 정상 작동
  - [ ] Need Behavior 수정 정상 작동
  - [ ] Need Behavior 삭제 정상 작동
  - [ ] 기존 데이터 로드 정상 작동

## 영향 범위

### 변경 필요 (Confirmed)
1. Database schema (1 migration)
2. TypeScript types (auto-generated)
3. `need-behavior-create-dialog.svelte`
4. `need-behavior-update-dialog.svelte`
5. `label.ts` (need behavior 관련)

### 영향 없음 (Interaction Actions)
- Building/Character/Item interaction actions는 그대로 유지
- 이들은 액션 레벨에서 표정을 정의하므로 올바른 설계

## 참고사항

- 기존 시나리오 데이터에 저장된 `character_face_state_type` 값은 마이그레이션으로 자동 삭제됨
- Interaction actions의 표정 설정은 그대로 유지되므로 기능 손실 없음
- 오히려 개념이 명확해져서 향후 유지보수가 쉬워짐

## 체크리스트

### 시작 전
- [ ] 현재 브랜치 clean 상태 확인
- [ ] 로컬 DB 백업 (필요시)

### 구현 중
- [ ] 각 Phase별로 커밋
- [ ] 각 단계마다 `pnpm check` 확인

### 완료 후
- [ ] 전체 검증 완료
- [ ] 플랜 파일을 `plans/completed/`로 이동
