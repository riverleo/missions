# Admin UI 버그 수정

## 목표
어드민 UI에서 발견된 버그들을 수정하여 데이터 무결성 보장

## 버그 목록

### 1. 욕구/컨디션 행동 노드 패널 - 행동 변경 시 대상 미초기화

#### 문제
- 욕구/컨디션 행동 노드 패널에서 행동(behavior)마다 선택 가능한 대상(target)이 다름
- 행동 선택이 바뀌어도 기존 선택된 대상이 그대로 유지됨
- 결과: 불가능한 행동-대상 조합이 선택 가능

#### 예시
```
1. 행동 A 선택 → 대상 X 선택 (유효)
2. 행동 B로 변경 → 대상 X가 그대로 남아있음 (행동 B는 대상 X 불가능 - 무효)
```

#### 해결 방안

**옵션 A: 대상 초기화**
- 행동이 변경되면 선택된 대상을 초기화
- 장점: 단순하고 명확
- 단점: 실수로 행동을 변경하면 대상 재선택 필요

**옵션 B: 대상 필터링 + 유효성 체크**
- 행동이 변경되면 대상 목록을 필터링
- 현재 선택된 대상이 새 행동에 유효하지 않으면 초기화
- 장점: 유효한 경우 대상 유지 가능
- 단점: 로직 복잡

**권장**: 옵션 A (단순하고 명확)

#### 영향 받는 파일 추정
- `src/lib/components/admin/scenarios/[scenarioId]/character-needs/behavior-node-panel.svelte` (추정)
- `src/lib/components/admin/scenarios/[scenarioId]/building-conditions/behavior-node-panel.svelte` (추정)
- 또는 공통 behavior-node 관련 컴포넌트

#### 구현 계획
- [x] 영향 받는 컴포넌트 파일 찾기
- [x] 행동 선택 변경 이벤트 핸들러 확인
- [x] 행동 변경 시 대상 초기화 로직 추가
- [x] 테스트: 행동 변경 → 대상이 초기화되는지 확인

#### 구현 결과
- 수정 파일:
  - `src/lib/components/admin/need-behavior/need-behavior-action-node-panel.svelte`
  - `src/lib/components/admin/condition-behavior/condition-behavior-action-node-panel.svelte`
- onTypeChange 함수에 target_selection_method='search', 모든 interaction_id=null 초기화 로직 추가

## 추가 버그 (발견 시 여기에 추가)

### 2. 탐색 대상 라벨 오류

#### 문제
- 현재: "새로운 탐색 대상"
- 수정: "가까운 대상을 탐색"

#### 해결 방안
- 라벨 텍스트 수정

#### 영향 받는 파일 추정
- label.ts 또는 관련 컴포넌트

#### 구현 계획
- [x] 라벨 정의 위치 찾기
- [x] "새로운 탐색 대상" → "가까운 대상을 탐색" 수정

#### 구현 결과
- 수정 파일:
  - `src/lib/utils/label.ts` (2곳)
  - 양쪽 노드 패널 파일 (각 2곳)
- 추가 개선: "행동" → "동작 방식", "대상" → "대상 탐색" 라벨 개선

### 3. NeedBehavior 페이지 접근 시 데이터 로딩 전 에러

#### 문제
- URL: `/admin/scenarios/[scenarioId]/need-behaviors/[needBehaviorId]`
- 에러: `Uncaught Error: NeedBehavior not found: [id]`
- 원인: 서버로부터 데이터가 초기화되기 전에 `getNeedBehavior()` 호출

#### 에러 발생 위치
```
at getNeedBehavior (use-behavior.ts:237:20)
at need-behavior-svelte-flow.svelte:30:45
at get behavior (need-behavior-svelte-flow.svelte:310:90)
at need-behavior-action-panel.svelte:65:27
```

#### 해결 방안

**옵션 A: use-scenario의 fetchAllStatus로 어드민 레이아웃 렌더링 제어** ⭐️ (권장)
- 어드민 레이아웃 레벨에서 `fetchAllStatus` 확인
- 데이터 로딩 완료 전: 로딩 UI 표시
- 데이터 로딩 완료 후: 어드민 콘텐츠 렌더링
- 장점:
  - 한 곳에서 해결 (DRY)
  - 모든 하위 컴포넌트는 데이터 존재 보장
  - 각 컴포넌트에 방어 로직 불필요
- 단점:
  - 전체 어드민 UI가 로딩 완료까지 대기

**옵션 B: 각 컴포넌트에서 getOrUndefined 사용**
- `getNeedBehavior()` → `getOrUndefinedNeedBehavior()` 사용
- undefined 체크 후 로딩 상태 표시
- 장점: 부분적 렌더링 가능
- 단점: 여러 컴포넌트에서 중복 처리 필요

#### 영향 받는 파일
- `src/routes/admin/scenarios/[scenarioId]/+layout.svelte` (어드민 레이아웃)
- `src/lib/hooks/use-scenario/use-scenario.ts` (fetchAllStatus 확인)

#### 구현 계획
- [x] `use-scenario`의 `fetchAllStatus` 확인
- [x] 어드민 레이아웃에서 fetchAllStatus 가져오기
- [x] fetchAllStatus가 'loading'이면 로딩 UI 표시
- [x] fetchAllStatus가 'success'일 때만 어드민 콘텐츠 렌더링
- [x] fetchAllStatus가 'error'면 에러 UI 표시

#### 구현 결과
- 수정 파일: `src/routes/admin/scenarios/[scenarioId]/+layout.svelte`
- fetchAllStatus에 따라 로딩/에러/성공 UI 분기 처리
- 데이터 로딩 완료 후에만 children 렌더링

## 작업 순서

### 완료된 작업
- [x] 버그 #1: 행동 변경 시 대상 미초기화 수정
- [x] 버그 #2: 탐색 대상 라벨 오류 수정
- [x] 버그 #3: 데이터 로딩 전 에러 수정

## 완료 일자
2026-02-10
