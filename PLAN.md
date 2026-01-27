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
  - NeedBehaviorAction: `needFulfillmentStore` 사용
  - ConditionBehaviorAction: `buildingConditionStore`, `conditionFulfillmentStore` 사용
- ✅ explicit 타깃: 모든 엔티티 선택 가능
- ✅ search/search_or_continue: fulfillment 기반 필터링

### 3. useBehavior 훅 리팩토링
- ✅ `use-behavior.ts` → `use-behavior/` 디렉토리 구조로 변경
- ✅ `index.ts`: export만 담당
- ✅ `use-behavior.ts`: 실제 구현
- ✅ `get-interactable-entity-templates.ts`: 헬퍼 함수
- ✅ `getInteractableEntityTemplates`를 `useBehavior()` 반환값에 포함

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

#### 1단계: Behavior 인스턴스 관리
- [ ] `currentBehavior` 상태 추가
- [ ] `useBehavior` 훅 통합
- [ ] `getBehavior()`, `addBehavior()`, `removeBehavior()` 사용

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

#### 4단계: beforeUpdate 통합
- [ ] 매 tick마다 현재 행동 확인
- [ ] 행동이 없으면 우선순위에 따라 새 행동 선택
- [ ] 현재 행동 실행 (tick 처리)
- [ ] 행동 완료 시 다음 액션으로 전환 또는 행동 제거

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
