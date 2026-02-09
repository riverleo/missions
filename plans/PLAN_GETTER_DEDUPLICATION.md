# Getter 함수 중복 로직 제거

## 목표
getXX 함수가 getOrUndefinedXX를 재사용하도록 리팩토링하여 중복 로직 제거

## 표준 패턴
```typescript
// Before (중복 로직)
function getXX(id: string): XX {
  const data = get(store).data[id];
  if (!data) throw new Error(`XX not found: ${id}`);
  return data;
}

function getOrUndefinedXX(id: string | null | undefined): XX | undefined {
  if (!id) return undefined;
  return get(store).data[id];
}

// After (재사용)
function getXX(id: string): XX {
  const data = getOrUndefinedXX(id);
  if (!data) throw new Error(`XX not found: ${id}`);
  return data;
}

function getOrUndefinedXX(id: string | null | undefined): XX | undefined {
  if (!id) return undefined;
  return get(store).data[id];
}
```

## 전수조사 결과

### 조사 대상 훅 (13개)
- use-behavior ✓
- use-narrative ✓ (getter 없음)
- use-world ✓
- use-app ✓ (getter 없음)
- use-building ✓
- use-chapter ✓ (getter 없음)
- use-character ✓
- use-current ✓ (getTick는 getOrUndefined 불필요)
- use-interaction ✓
- use-item ✓
- use-player ✓ (getter 없음)
- use-scenario ✓ (getter 없음)
- use-terrain ✓ (getter 없음)
- use-quest ✓ (getter 없음)

## 리팩토링 대상 (13개 함수) - 완료 ✅

### use-behavior.ts (4개)
- [x] `getBehaviorPriority` - getOrUndefinedBehaviorPriority 재사용
- [x] `getNeedBehavior` - getOrUndefinedNeedBehavior 재사용
- [x] `getNeedBehaviorAction` - getOrUndefinedNeedBehaviorAction 재사용
- [x] `getNextBehaviorAction` - getOrUndefinedNextBehaviorAction 재사용

### use-world.ts (5개)
- [x] `getWorld` - getOrUndefinedWorld 재사용
- [x] `getWorldCharacter` - getOrUndefinedWorldCharacter 재사용
- [x] `getWorldCharacterNeed` - getOrUndefinedWorldCharacterNeed 재사용
- [x] `getWorldBuilding` - getOrUndefinedWorldBuilding 재사용
- [x] `getWorldBuildingCondition` - getOrUndefinedWorldBuildingCondition 재사용

### use-building.ts (1개)
- [x] `getBuilding` - getOrUndefinedBuilding 재사용

### use-character.ts (1개)
- [x] `getCharacterNeed` - getOrUndefinedCharacterNeed 재사용

### use-interaction.ts (2개)
- [x] `getBuildingInteraction` - getOrUndefinedBuildingInteraction 재사용
- [x] `getInteractionByBehaviorAction` - getOrUndefinedInteractionByBehaviorAction 재사용

**참고**: `getInteraction(id)` 함수는 getOrUndefinedInteraction 버전이 존재하지 않아 제외

## 이미 올바르게 구현된 함수 (16개)

### use-behavior.ts (3개)
- ✓ `getConditionBehavior`
- ✓ `getConditionBehaviorAction`
- ✓ `getBehaviorAction`

### use-world.ts (2개)
- ✓ `getWorldItem`
- ✓ `getWorldTileMap`

### use-building.ts (3개)
- ✓ `getCondition`
- ✓ `getBuildingCondition`
- ✓ `getBuildingByWorldBuildingId`

### use-character.ts (4개)
- ✓ `getCharacter`
- ✓ `getCharacterBody`
- ✓ `getCharacterByWorldCharacterId`
- ✓ `getNeed`

### use-interaction.ts (2개)
- ✓ `getItemInteraction`
- ✓ `getCharacterInteraction`

### use-item.ts (2개)
- ✓ `getItem`
- ✓ `getItemByWorldItemId`

## 작업 순서
1. [x] use-building.ts (1개)
2. [x] use-character.ts (1개)
3. [x] use-interaction.ts (2개)
4. [x] use-behavior.ts (4개)
5. [x] use-world.ts (5개)
6. [x] pnpm check 통과 확인 ✅

## 완료 요약
- **리팩토링 완료**: 13개 함수
- **중복 코드 제거**: 각 get* 함수가 getOrUndefined* 재사용
- **최종 결과**: `pnpm check` 0 errors, 0 warnings

## 기대 효과
- 중복 코드 제거로 유지보수성 향상
- 일관된 에러 처리 패턴
- 코드 가독성 개선
- 버그 발생 가능성 감소
