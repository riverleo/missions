# character_body_states에서 in_front, character_face_state 컬럼 제거

## 목표

`character_body_states` 테이블의 `in_front`(바디/페이스 렌더링 순서)와 `character_face_state`(바디 상태별 강제 표정) 컬럼을 제거하고, 관련 코드를 정리한다.

## 제거 대상

### DB 컬럼 (character_body_states)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `in_front` | `boolean` (기본 false) | true면 바디가 페이스 앞에 렌더링 |
| `character_face_state` | `character_face_state_type` (nullable) | 해당 바디 상태일 때 강제할 표정 (null이면 현재 감정 따름) |

### 코드 사용처

1. **`character-sprite-animator.svelte`**: `isBodyInFront = bodyState?.in_front ?? false` → 바디/페이스 렌더링 순서 분기
2. **`character-body-state-item.svelte`**: `in_front` 토글 버튼 + `character_face_state` 드롭다운 UI
3. **`supabase.generated.ts`**: 자동 생성 타입 (마이그레이션 후 재생성)

## 담당자

- 플래너
- 플랫폼 엔지니어

## 할 일

### 플래너

- [ ] 본 플랜 작성 및 PR 생성

### 플랫폼 엔지니어

- [ ] 마이그레이션 파일 생성: `character_body_states`에서 `in_front`, `character_face_state` 컬럼 DROP
- [ ] `supabase.generated.ts` 타입 재생성
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
