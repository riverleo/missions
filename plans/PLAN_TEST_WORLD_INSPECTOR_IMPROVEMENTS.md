# test-world-inspector-panel 개선 및 라벨링

## 목표
test-world-inspector-panel의 코드 구조 개선 및 라벨링 로직 정리

## 작업 내용

### 1. accordion-item-world-character-entity 리팩토링
- [x] `currentBehaviorInfo` 오브젝트 구조 제거
  - [x] `currentBehaviorName` derived로 분리
  - [x] `currentBehaviorActionLabel` derived로 분리
  - [x] 템플릿에서 개별 derived 사용하도록 수정

### 2. behaviors 툴팁 표시
- [x] `accordion-content-item.svelte`에 tooltip prop 추가
  - [x] Tooltip 컴포넌트 import
  - [x] tooltip prop 타입 정의 (`string?`)
  - [x] tooltip이 있을 때 Tooltip UI 렌더링
  - [x] `whitespace-pre-line`으로 줄바꿈 지원
- [x] `accordion-item-world-character-entity.svelte`에서 behaviors 툴팁 구현
  - [x] `entity.behavior.behaviors` 데이터 확인
  - [x] Behavior 타입 구조 파악
  - [x] behaviors 배열을 문자열로 포맷팅하는 로직 작성
  - [x] AccordionContentItem에 tooltip prop 전달

### 3. behaviorLabel 로직 utils/label.ts로 이동
- [x] `utils/label.ts`에 함수 추가
  - [x] `getNeedBehaviorPriorityLabel` 함수 작성
  - [x] `getConditionBehaviorPriorityLabel` 함수 작성
  - [x] 기존 behavior-priority-list-item의 로직 이동
- [x] `behavior-priority-list-item.svelte` 수정
  - [x] utils/label.ts의 함수 import
  - [x] 기존 behaviorLabel 로직 제거
  - [x] 새 함수 사용하도록 수정

### 4. tooltip 타입 및 UI 개선
- [x] `accordion-content-item.svelte` 수정
  - [x] tooltip prop 타입을 `string?`에서 `string[]?`로 변경
  - [x] 배열 아이템에 인덱스 번호를 추가하여 렌더링 (예: "1. 행동명")
  - [x] tooltip trigger를 버튼으로 변경
  - [x] `<span {...props} class="cursor-help text-muted-foreground">{label}</span>`를 Button 컴포넌트로 변경
  - [x] `cursor-help` 같은 불필요한 스타일 제거
  - [x] Button 컴포넌트 사용 (variant="ghost", size="sm")
- [x] `accordion-item-world-character-entity.svelte` 수정
  - [x] `behaviorsTooltip`을 `string`이 아닌 `string[]`로 변경
  - [x] 인덱스 번호 제거 (accordion-content-item에서 처리)
  - [x] `heldItemsTooltip` 추가
    - [x] `entity.heldItemIds`를 순회하며 아이템 이름과 ID 프리픽스 배열 생성
    - [x] 형식: "아이템명 (ID프리픽스)"
    - [x] "소지 아이템" AccordionContentItem에 tooltip 전달
  - [x] 라벨 변경: "들고 있는 아이템" → "소지 아이템"

### 5. 훅 헬퍼 함수 추가
- [x] `useItem` 훅에 함수 추가
  - [x] `getItemByWorldItem(WorldItemId)`: 없으면 throw Error
  - [x] `getOrUndefinedItemByWorldItem(WorldItemId)`: 없으면 undefined 반환
- [x] `useCharacter` 훅에 함수 추가
  - [x] `getCharacterByWorldCharacter(WorldCharacterId)`: 없으면 throw Error
  - [x] `getOrUndefinedCharacterByWorldCharacter(WorldCharacterId)`: 없으면 undefined 반환
- [x] `useBuilding` 훅에 함수 추가
  - [x] `getBuildingByWorldBuilding(WorldBuildingId)`: 없으면 throw Error
  - [x] `getOrUndefinedBuildingByWorldBuilding(WorldBuildingId)`: 없으면 undefined 반환
- [ ] 기존 코드에서 해당 패턴 사용하는 부분 리팩토링 (추후)
  - [ ] `accordion-item-world-character-entity.svelte`의 `currentTargetName` 로직

## 파일 목록
- `src/lib/components/admin/test-world/test-world-inspector-panel/accordion-item-world-character-entity.svelte`
- `src/lib/components/admin/test-world/test-world-inspector-panel/accordion-content-item.svelte`
- `src/lib/components/admin/behavior-priority/behavior-priority-list-item.svelte`
- `src/lib/utils/label.ts`

## 진행 상태
- 작업 1: ✅ 완료
- 작업 2: ✅ 완료
- 작업 3: ✅ 완료
- 작업 4: ✅ 완료
- 작업 5: ✅ 완료 (리팩토링은 추후)
