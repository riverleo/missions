# World Character Behavior System Integration

## 목표
WorldCharacterEntity에 행동 시스템을 통합하여 캐릭터가 욕구와 컨디션에 따라 자동으로 행동하도록 구현

## 완료된 작업

### 1. Building Items 테이블 생성
- ✅ `building_items` 테이블 생성 (건물에 보관 가능한 아이템 정의)
- ✅ `BuildingItem`, `BuildingItemId` 타입 추가
- ✅ `useBuildingItem` 훅에 CRUD 작업 추가
- ✅ Building 다이얼로그에 아이템 멀티 셀렉트 UI 추가

### 2. Interactable Entity Templates 필터링
- ✅ `getInteractableEntityTemplates` 함수 구현
  - NeedBehaviorAction: `needFulfillmentStore`에서 `need_id`와 `fulfillment_type` 기반 필터링
  - ConditionBehaviorAction: `buildingConditionStore`, `conditionFulfillmentStore` 사용
- ✅ explicit 타깃: 모든 엔티티 선택 가능
- ✅ search/search_or_continue: fulfillment 기반 필터링
- ✅ null 값 처리: `building_id`/`item_id`가 null이면 해당 타입의 모든 엔티티 반환

### 3. useBehavior 훅 리팩토링
- ✅ `use-behavior.ts` → `use-behavior/` 디렉토리 구조로 변경
- ✅ `index.ts`: export만 담당
- ✅ `use-behavior.ts`: 실제 구현
- ✅ `get-interactable-entity-templates.ts`: 헬퍼 함수
- ✅ `getInteractableEntityTemplates`를 `useBehavior()` 반환값에 포함

### 4. 행동 액션 UI 개선
- ✅ 대상 선택을 2-depth Select UI로 통합
  - "새로운 탐색 대상", "기존 선택 대상" 최상위
  - "지정된 대상" 그룹에 엔티티 목록
  - DropdownMenu 제거, SelectGroup/SelectLabel 사용
- ✅ BehaviorCompletionType 라벨 중앙화
  - `state-label.ts`에 라벨 및 헬퍼 함수 추가
  - 행동 패널에서 하드코딩 제거
- ✅ 행동 액션 노드에 completion type 표시
  - fixed: "N틱 동안" 형식
  - completion: "목표 달성까지"
  - immediate: "즉시"
  - idle 타입도 적용
- ✅ completion type 선택 제한
  - 아이템 관련 행동: immediate만 선택 가능
  - 건물 관련 행동: fixed, completion만 선택 가능

### 5. BehaviorActionId 타입 시스템
- ✅ `BehaviorActionId` 타입 정의 (`core.ts`)
  - Format: `"{behaviorType}_{behaviorId}_{actionId}"`
  - `need_{NeedBehaviorId}_{NeedBehaviorActionId}` | `condition_{ConditionBehaviorId}_{ConditionBehaviorActionId}`
- ✅ `BehaviorActionIdUtils` 유틸리티 (`behavior-id.ts`)
  - `create(type, behaviorId, actionId)`: BehaviorActionId 생성
  - `parse(id)`: type, behaviorId, actionId 추출
  - `type(id)`, `behaviorId<T>(id)`, `actionId<T>(id)`: 개별 요소 추출 (제네릭 지원)
  - `is(type, id)`: 타입 확인

## 다음 작업: WorldCharacterEntity 행동 시스템 통합

### 현재 WorldCharacterEntity 구조
```typescript
class WorldCharacterEntity extends Entity {
  readonly type = 'character' as const;
  body: Matter.Body;
  path: Vector[] = $state([]);
  direction: WorldCharacterEntityDirection = $state('right');
  heldWorldItemIds = $state<WorldItemId[]>([]);
  worldCharacterNeeds: Record<NeedId, WorldCharacterNeed> = $state({});

  // 기존 메서드
  - move()
  - decreaseNeeds()
  - beforeUpdate()
}
```

### 구현 단계

#### 1단계: Behavior Action 관리
- [ ] `currentBehaviorActionId` 상태 추가 (현재 실행 중인 BehaviorActionId | undefined)
- [ ] `useBehavior` 훅 통합
- [ ] `BehaviorActionIdUtils`를 사용한 ID 파싱 및 관리
- [ ] 액션 체인 순회 로직 (root action → next_action_id 따라가기)
- [ ] 행동 완료 시 다음 액션으로 전환

#### 2단계: 행동 우선순위 시스템
- [ ] `BehaviorPriority` 기반 우선순위 계산
- [ ] 욕구 레벨 기반 우선순위 동적 조정
- [ ] 컨디션 충족 여부 확인

#### 3단계: 행동 타입별 구현

**GO 행동 (이동)**
- [ ] `target_selection_method`에 따른 타깃 선택
  - explicit: 지정된 building/item으로 이동
  - search: `getInteractableEntityTemplates()` 사용
  - search_or_continue: 기존 타깃 유지 또는 새로 검색
- [ ] 경로 찾기 및 `path` 업데이트
- [ ] 목적지 도착 시 다음 액션으로 전환

**INTERACT 행동 (상호작용)**
- [ ] `behavior_interact_type`에 따른 상호작용 실행
  - building_execute: 건물 동작 실행
  - building_repair: 건물 수리
  - building_clean: 건물 청소
  - item_pick: 아이템 줍기
  - item_use: 아이템 사용
- [ ] `behavior_completion_type`에 따른 완료 조건
  - fixed: `duration_ticks` 후 완료
  - completion: 목표 달성 시 완료
  - immediate: 즉시
- [ ] 상호작용 결과 반영 (욕구 증가, 컨디션 변경 등)

**IDLE 행동 (대기)**
- [ ] `duration_ticks` 동안 대기
- [ ] 애니메이션 상태 업데이트

#### 4단계: tick 라이프사이클 통합
- [ ] tick마다 현재 행동 액션 확인
- [ ] 행동 액션이 없으면 우선순위에 따라 새 행동 선택 (root action부터 시작)
- [ ] 현재 행동 액션 실행 (tick 처리)
- [ ] 행동 액션 완료 시 next_action_id로 전환 또는 행동 종료

#### 5단계: 디버깅 및 테스트
- [ ] 행동 전환 로그 추가
- [ ] 타깃 선택 디버그 정보
- [ ] 경로 찾기 시각화
- [ ] 욕구/컨디션 변화 확인

## 참고 사항

### BehaviorAction 타입
```typescript
type BehaviorActionType = 'go' | 'interact' | 'idle';
type BehaviorTargetSelectionMethod = 'explicit' | 'search' | 'search_or_continue';
type BehaviorCompletionType = 'fixed' | 'completion' | 'immediate';
```

### 시나리오 예시
```
병원 건물 내구도가 20 이하인 경우:
1. 창고에서 자원을 가져옴 (go + item_pick)
2. 병원 건물로 이동 (go)
3. 병원 건물 수리 (interact + building_repair)
4. 다시 창고로 이동해서 자원을 가져옴 (go + item_pick)
```

### building_items 활용
- 건물에 보관 가능한 아이템 정의
- `item_pick` 시 `getInteractableEntityTemplates()`로 필터링
- world_items의 `world_building_id`를 통해 실제 위치 파악
