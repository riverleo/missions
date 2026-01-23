# 작업 계획: Behavior Target Method UI 추가

## 목표
`behavior_target_method` 시스템을 UI에 적용하여 행동 액션의 타깃 결정 방법을 설정할 수 있도록 함.

## 완료된 작업
- [x] DB 마이그레이션: `behavior_target_method` enum 추가
- [x] `need_behavior_actions` 테이블에 `target_method` 컬럼 추가
- [x] `condition_behavior_actions` 테이블에 `target_method` 및 타깃 필드 추가
- [x] TypeScript 타입 재생성
- [x] 커밋: "Add behavior target method system for flexible action targeting"

## 진행 중인 작업

### 1. Need Behavior Action Node Panel UI 수정
**파일**: `src/lib/components/admin/need-behavior/need-behavior-action-node-panel.svelte`

**현재 UI 구조**:
- 행동 타입 선택 (go/interact/idle)
- go/interact: 대상 선택 (자동 선택 또는 건물/캐릭터/아이템)
- interact: 상호작용 타입 (use/repair/demolish/clean/pick)
- idle: 지속 시간

**작업 내용**:
- [x] 현재 UI 구조 파악 완료
- [x] `target_method` 선택 UI 추가 (explicit/search/search_or_continue)
  - 위치: "행동" 선택 후, "대상" 선택 앞
  - UI: Select 사용
- [x] `target_method`에 따른 대상 선택 UI 표시 로직
  - `explicit`: 대상 선택 표시 ("대상")
  - `search`: 대상 선택 숨김
  - `search_or_continue`: 대상 선택 표시 ("계속 사용할 대상")
- [x] 저장 로직에 `target_method` 추가
- [x] 툴팁 메시지 업데이트 (target_method별 설명 추가)
- [x] onTargetMethodChange 함수 추가 (search 모드 시 타깃 자동 제거)
- [x] go 타입에서도 character_behavior_type 선택 가능하도록 수정
  - "이동 목적" 레이블 표시 (건설/철거 등을 위한 이동)
- [x] character_behavior_type을 NOT NULL로 변경 (default: 'use')
  - 마이그레이션 파일 수정
  - ALTER 쿼리 실행
  - 타입 재생성
  - UI 코드에서 nullable 처리 제거
- [x] UI 필드 순서 변경
  - "이동 목적/상호작용"을 "행동" 바로 다음으로 이동
  - 최종 순서: 행동 → 이동 목적/상호작용 → 타깃 결정 → 대상 선택 → 지속 시간
- [x] BehaviorTargetMethod 타입 export
  - src/lib/types/supabase.ts에 추가
  - src/lib/types/index.ts에 re-export 추가
- [x] 대상 선택 UI 수정
  - `explicit`: 대상 선택 필수 (건물/캐릭터/아이템 중 하나 필수)
  - `search`: 대상 선택 UI 숨김
  - `search_or_continue`: 대상 선택 UI 숨김 (자동으로 이전 타깃 사용)
  - placeholder: "대상을 선택하세요"
  - 툴팁: "특정 대상을 반드시 지정해야 합니다"
- [ ] 테스트 및 검증

### 2. Condition Behavior Action Panel UI 적용
**파일**:
- `src/lib/components/admin/condition-behavior/condition-behavior-action-node-panel.svelte`
- `src/lib/components/admin/condition-behavior/condition-behavior-action-node.svelte`

**작업 내용**:
- [x] Need Behavior 작업 결과를 기반으로 동일하게 적용
- [x] BehaviorTargetMethod, BuildingId, CharacterId, ItemId 타입 import
- [x] useBuilding, useCharacter, useItem 훅 추가
- [x] targetMethods 배열 추가
- [x] target_method 선택 UI 추가 (go/interact일 때)
- [x] 타깃 선택 UI 추가 (explicit 모드일 때만)
- [x] go 타입에서도 character_behavior_type 선택 가능
- [x] 저장 로직에 target_method와 타깃 필드 추가
- [x] 노드 레이블 업데이트 (타깃 정보 표시, target_method 레이블, 자연스러운 한글 표현)

## 다음 단계
- [ ] 테스트 및 검증
- [ ] 커밋

---

_작업 시작: 2026-01-23_
