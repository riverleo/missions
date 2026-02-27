# character_body_states 정리 및 face_state 오프셋 다이얼로그 구현

## 목표

1. `character_body_states` 테이블의 `in_front`, `character_face_state` 컬럼을 제거하고 관련 코드를 정리한다.
2. 캐릭터 관리 메뉴에서 `character_face_state` 항목의 오프셋 수정 다이얼로그가 동작하지 않는 문제를 수정한다.

## 1. 컬럼 제거

### DB 컬럼 (character_body_states)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `in_front` | `boolean` (기본 false) | true면 바디가 페이스 앞에 렌더링 |
| `character_face_state` | `character_face_state_type` (nullable) | 해당 바디 상태일 때 강제할 표정 (null이면 현재 감정 따름) |

### 코드 사용처

1. **`character-sprite-animator.svelte`**: `isBodyInFront = bodyState?.in_front ?? false` → 바디/페이스 렌더링 순서 분기
2. **`character-body-state-item.svelte`**: `in_front` 토글 버튼 + `character_face_state` 드롭다운 UI
3. **`supabase.generated.ts`**: 자동 생성 타입 (마이그레이션 후 재생성)

## 2. face_state 오프셋 다이얼로그 미구현

### 현상

캐릭터 관리 메뉴에서 `character_face_state` 항목의 "오프셋 수정" 버튼 클릭 시 다이얼로그가 열리지 않음.

### 원인

- `character-face-state-item.svelte`에서 `openCharacterFaceStateDialog()` 호출 버튼은 존재
- `use-character.ts`에서 `characterFaceStateDialogStore`, `openCharacterFaceStateDialog()`, `closeCharacterFaceStateDialog()` 훅도 존재
- **실제 다이얼로그 컴포넌트(`character-face-state-dialog.svelte`)가 생성되지 않음**
- `character-aside.svelte`에서 다이얼로그 컴포넌트를 렌더링하지 않음

## 담당자

- 플래너
- 플랫폼 엔지니어
- 게임 디자이너

## 할 일

### 플래너

- [x] 본 플랜 작성 및 PR 생성

### 플랫폼 엔지니어

#### 컬럼 제거

- [ ] 마이그레이션 파일 생성: `character_body_states`에서 `in_front`, `character_face_state` 컬럼 DROP
- [ ] `supabase.generated.ts` 타입 재생성

#### face_state 오프셋 다이얼로그 구현

- [ ] `character-face-state-dialog.svelte` 생성: `characterFaceStateDialogStore` 구독, `offset_x`/`offset_y` 입력 필드, `admin.updateCharacterFaceState()` 호출
- [ ] `character-aside.svelte`에서 `CharacterFaceStateDialog` 임포트 및 렌더링 추가

### 게임 디자이너

- [ ] `character-sprite-animator.svelte`에서 `isBodyInFront` 관련 로직 제거, 항상 바디 먼저 → 페이스 뒤에 렌더링 (기본 순서 고정)
- [ ] `character-body-state-item.svelte`에서 `in_front` 토글 버튼 UI 제거
- [ ] `character-body-state-item.svelte`에서 `character_face_state` 드롭다운 UI 제거
- [ ] `use-character.ts`에서 관련 업데이트 로직이 있다면 정리
- [ ] 빌드(`svelte-check`) 에러 없는지 확인

## 노트

### 2026-02-27

- `character_face_state_type` 열거형과 `character_face_states` 테이블은 제거 대상이 아님 (상호작용 액션 등에서 계속 사용)
- `in_front` 제거 후 렌더링 순서는 항상 바디 → 페이스 (기본값 `false`와 동일)
- `character_face_state` 제거 후 표정은 항상 현재 감정을 따름 (기본값 `null`과 동일)
- face_state 오프셋 다이얼로그: 기존 `character-update-dialog.svelte` 패턴을 참고하여 구현
