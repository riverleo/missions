# Getter 함수 네이밍 컨벤션 통일 ✅

**완료일**: 2026-02-09
**상태**: 완료

## 목표
모든 훅의 getter 함수를 표준 네이밍 컨벤션에 맞게 수정

## 표준 패턴
```typescript
// throw Error if not found
function getXX(id: string): XX

// return undefined if not found (null/undefined 입력도 허용)
function getOrUndefinedXX(id: string | null | undefined): XX | undefined
```

## 문제점 분류

### 1. getOrUndefined 함수인데 파라미터가 `string | null | undefined`가 아닌 경우

#### use-behavior.ts
- [x] `getOrUndefinedBehaviorPriority(id: string)` → `(id: string | null | undefined)`
- [x] `getOrUndefinedNeedBehavior(id: string)` → `(id: string | null | undefined)`
- [x] `getOrUndefinedNeedBehaviorAction(id: string)` → `(id: string | null | undefined)`
- [x] `getOrUndefinedConditionBehavior(id: string)` → `(id: string | null | undefined)`
- [x] `getOrUndefinedConditionBehaviorAction(id: string)` → `(id: string | null | undefined)`

### 2. getOrUndefined는 있는데 get(throw) 버전이 없는 경우

#### use-behavior.ts
- [x] `getBehaviorPriority(id: string): BehaviorPriority` 추가
- [x] `getNeedBehavior(id: string): NeedBehavior` 추가
- [x] `getNeedBehaviorAction(id: string): NeedBehaviorAction` 추가
- [x] `getConditionBehavior(id: string): ConditionBehavior` 추가
- [x] `getConditionBehaviorAction(id: string): ConditionBehaviorAction` 추가
- [x] `getBehaviorAction(id: string): BehaviorAction` 추가 (기존 getBehaviorAction 수정)
- [x] `getNextBehaviorAction(behaviorAction: BehaviorAction): BehaviorAction` 추가

### 3. undefined 리턴하는데 getOrUndefined가 아닌 경우

#### use-building.ts
- [x] `getBuildingItem(id: string | null | undefined): BuildingItem | undefined`
  → `getOrUndefinedBuildingItem(id: string | null | undefined): BuildingItem | undefined`
- [x] `getBuildingStates(buildingId: string | null | undefined): BuildingState[] | undefined`
  → `getOrUndefinedBuildingStates(buildingId: string | null | undefined): BuildingState[] | undefined`
- [x] `getConditionFulfillment(id: string | null | undefined): ConditionFulfillment | undefined`
  → `getOrUndefinedConditionFulfillment(id: string | null | undefined): ConditionFulfillment | undefined`
- [x] `getConditionEffect(id: string): ConditionEffect | undefined`
  → `getOrUndefinedConditionEffect(id: string | null | undefined): ConditionEffect | undefined`

#### use-character.ts
- [x] `getCharacterFaceStates(characterId: string | null | undefined): CharacterFaceState[] | undefined`
  → `getOrUndefinedCharacterFaceStates(characterId: string | null | undefined): CharacterFaceState[] | undefined`
- [x] `getCharacterBodyStates(bodyId: string | null | undefined): CharacterBodyState[] | undefined`
  → `getOrUndefinedCharacterBodyStates(bodyId: string | null | undefined): CharacterBodyState[] | undefined`
- [x] `getNeedFulfillment(id: string): NeedFulfillment | undefined`
  → `getOrUndefinedNeedFulfillment(id: string | null | undefined): NeedFulfillment | undefined`

#### use-item.ts
- [x] `getItemStates(itemId: string | null | undefined): ItemState[] | undefined`
  → `getOrUndefinedItemStates(itemId: string | null | undefined): ItemState[] | undefined`

#### use-behavior.ts
- [x] `getNextBehaviorAction(behaviorAction: BehaviorAction): BehaviorAction | undefined`
  → `getOrUndefinedNextBehaviorAction(behaviorAction: BehaviorAction): BehaviorAction | undefined`

#### use-world.ts
- [x] throw 버전 추가: `getWorld(id: string): World`
- [x] throw 버전 추가: `getWorldCharacter(id: string): WorldCharacter`
- [x] throw 버전 추가: `getWorldCharacterNeed(id: string): WorldCharacterNeed`
- [x] throw 버전 추가: `getWorldBuilding(id: string): WorldBuilding`
- [x] throw 버전 추가: `getWorldBuildingCondition(id: string): WorldBuildingCondition`
- [x] throw 버전 추가: `getWorldItem(id: string): WorldItem`
- [x] throw 버전 추가: `getWorldTileMap(worldId: string): WorldTileMap`
- [x] throw 버전 추가: `getInteraction(action: BehaviorAction): Interaction`
- [x] `getInteractionActions` → `getAllInteractionActionsByInteraction` (네이밍 개선)

### 4. throw 하는데 파라미터가 `| undefined` 받는 경우

#### use-behavior.ts
- [x] `getRootBehaviorAction(behavior: Behavior | undefined): BehaviorAction`
  → `getRootBehaviorAction(behavior: Behavior): BehaviorAction`

### 5. 추가 개선사항

#### label.ts
- [x] `buildingStateOptions` 상수 → `getBuildingStateTypeLabels()` 함수로 변경
- [x] condition-behavior 다이얼로그에서 getter 함수 사용하도록 개선

#### entity-id.ts
- [x] `WorldTileId` → `WorldTileMapId` 타입 수정

## 작업 순서
1. [x] use-behavior.ts 수정 (가장 많은 문제)
2. [x] use-building.ts 수정
3. [x] use-character.ts 수정
4. [x] use-item.ts 수정
5. [x] use-world.ts 수정
6. [x] 모든 사용처 업데이트
   - [x] label.ts - getOrUndefinedConditionFulfillment, getOrUndefinedNeedFulfillment 사용
   - [x] search-entity-sources.ts - getOrUndefined 버전 사용
   - [x] condition-behavior 다이얼로그 - getter 함수 및 라벨 함수 사용
   - [x] behavior-state 파일들 - getOrUndefinedBehaviorAction 사용
   - [x] tick-find-behavior-target.ts (2개) - behaviors[0] 안전성 체크 추가
   - [x] accordion-item-world-character-entity.svelte - EntityIdUtils.instanceId 타입 파라미터 추가
   - [x] tick-action-if-once-item-use.ts - EntityIdUtils.parse 타입 파라미터 제거
7. [x] pnpm check 통과 확인 ✅

## 완료 요약

총 40+ 개의 getter 함수를 표준 네이밍 컨벤션에 맞게 수정 완료:
- **throw 버전 추가**: 15개의 함수에 에러를 던지는 get* 버전 추가
- **getOrUndefined로 리네임**: 10개의 함수명 변경
- **파라미터 타입 수정**: 모든 getOrUndefined 함수가 `string | null | undefined` 허용
- **사용처 업데이트**: 9개 파일에서 새로운 getter 함수 적용
- **타입 에러 수정**: 11개 → 0개로 모든 타입 에러 해결
- **잘못된 alias 제거**: 4개의 alias export 제거 및 6개 파일 사용처 업데이트
  - `getCharacterFaceStates: getOrUndefinedCharacterFaceStates` (use-character.ts)
  - `getCharacterBodyStates: getOrUndefinedCharacterBodyStates` (use-character.ts)
  - `getBuildingStates: getOrUndefinedBuildingStates` (use-building.ts)
  - `getItemStates: getOrUndefinedItemStates` (use-item.ts)
  - 사용처: use-scenario.ts + 5개 svelte component 파일

최종 결과: `pnpm check` 0 errors, 0 warnings ✅
