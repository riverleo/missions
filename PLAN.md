# Plan

## Getter Function Refactoring

### 목표
훅의 getter 함수들을 `getXX`(필수, throw)와 `getOrUndefinedXX`(옵셔널, undefined 반환)로 명확히 구분하여 일관성 없는 throw 로직을 정리한다.

### 현재 상태 조사 결과

#### use-world.ts
**단일 조회:**
- `getWorld(id)` → World | undefined
- `getWorldCharacter(id)` → WorldCharacter | undefined
- `getWorldCharacterNeed(id)` → WorldCharacterNeed | undefined
- `getWorldBuilding(id)` → WorldBuilding | undefined
- `getWorldBuildingCondition(id)` → WorldBuildingCondition | undefined
- `getWorldItem(id)` → WorldItem | undefined
- `getWorldTileMap(worldId)` → WorldTileMap | undefined
- `getEntityInstance(entityId)` → EntityInstance ⚠️ **THROWS ERROR**
- `getEntitySourceId(data)` → EntitySourceId | undefined
- `getInteraction(action)` → Interaction | undefined
- `getInteractionActions(interaction)` → InteractionAction[]

**전체 조회:**
- `getAllWorlds()` → World[]
- `getAllWorldCharacters()` → WorldCharacter[]
- `getAllWorldCharacterNeeds()` → WorldCharacterNeed[]
- `getAllWorldBuildings()` → WorldBuilding[]
- `getAllWorldBuildingConditions()` → WorldBuildingCondition[]
- `getAllWorldItems()` → WorldItem[]
- `getAllWorldTileMaps()` → WorldTileMap[]

#### use-building.ts
**단일 조회:**
- `getBuilding(id)` → Building | undefined
- `getBuildingBody(id)` → BuildingBody | undefined
- `getCondition(id)` → Condition | undefined
- `getBuildingCondition(id)` → BuildingCondition | undefined

**전체 조회:**
- `getAllBuildings()` → Building[]
- `getAllConditions()` → Condition[]
- `getAllBuildingConditions()` → BuildingCondition[]

#### use-character.ts
**단일 조회:**
- `getCharacter(id)` → Character | undefined
- `getCharacterBody(id)` → CharacterBody | undefined

**전체 조회:**
- `getAllCharacters()` → Character[]
- `getAllCharacterBodies()` → CharacterBody[]

#### use-item.ts
**단일 조회:**
- `getItem(id)` → Item | undefined
- `getItemBody(id)` → ItemBody | undefined
- `getDurability(id)` → Durability | undefined
- `getItemDurability(id)` → ItemDurability | undefined

**전체 조회:**
- `getAllItems()` → Item[]
- `getAllDurabilities()` → Durability[]
- `getAllItemDurabilities()` → ItemDurability[]

#### use-interaction.ts
**단일 조회:**
- `getInteraction(id)` → Interaction | undefined
- `getBuildingInteraction(id)` → BuildingInteraction | undefined
- `getItemInteraction(id)` → ItemInteraction | undefined
- `getCharacterInteraction(id)` → CharacterInteraction | undefined
- `getBuildingInteractionActions(id)` → BuildingInteractionAction[] | undefined
- `getItemInteractionActions(id)` → ItemInteractionAction[] | undefined
- `getCharacterInteractionActions(id)` → CharacterInteractionAction[] | undefined

**전체 조회:**
- `getAllBuildingInteractions()` → BuildingInteraction[]
- `getAllItemInteractions()` → ItemInteraction[]
- `getAllCharacterInteractions()` → CharacterInteraction[]
- `getAllBuildingInteractionActions()` → BuildingInteractionAction[]
- `getAllItemInteractionActions()` → ItemInteractionAction[]
- `getAllCharacterInteractionActions()` → CharacterInteraction Action[]

#### use-behavior/use-behavior.ts
**단일 조회:**
- `getBehaviorAction(id)` → BehaviorAction | undefined
- `getNeedBehavior(id)` → NeedBehavior | undefined
- `getNeed(id)` → Need | undefined
- `getNeedBehaviorAction(needBehaviorId)` → NeedBehaviorAction[] (빈 배열 가능)
- `searchEntitySources(action)` → EntitySource[] (빈 배열 가능)

**전체 조회:**
- `getAllNeedBehaviors()` → NeedBehavior[]
- `getAllNeeds()` → Need[]
- `getAllNeedBehaviorActions()` → NeedBehaviorAction[]

### 주요 발견사항

1. **대부분 일관적**: 거의 모든 getter가 undefined를 반환하는 패턴으로 이미 일관성 있음
2. **유일한 예외**: `getEntityInstance()`만 Error를 throw함
3. **전체 조회 함수**: 모두 빈 배열을 반환 (undefined/null 아님)
4. **사용처의 문제**: 훅 자체보다 entity 클래스 등 사용처에서 일관성 없는 throw 로직이 산재

### 리팩토링 전략

#### 1단계: 네이밍 컨벤션 정의

```typescript
// 패턴 A: 필수 데이터 - 없으면 throw
getXX(id: string): XX {
  const data = this.store[id];
  if (!data) throw new Error(`XX not found: ${id}`);
  return data;
}

// 패턴 B: 옵셔널 데이터 - 없으면 undefined
getOrUndefinedXX(id: string): XX | undefined {
  return this.store[id];
}
```

#### 2단계: 각 훅별 분류 기준

**필수 데이터 (throw 필요):**
- Entity의 source 데이터: Building, Character, Item, CharacterBody, BuildingBody, ItemBody
- Entity가 참조하는 핵심 데이터: Condition, Need, Durability 등

**옵셔널 데이터 (undefined 허용):**
- World 인스턴스: WorldCharacter, WorldBuilding, WorldItem 등 (생성/삭제 가능)
- Interaction 관련: 존재하지 않을 수 있음
- BehaviorAction: 동적으로 생성/삭제됨

#### 3단계: 구현 계획

**Phase 1: use-building.ts** ✅
- [x] `getBuilding()` → throw 추가
- [x] `getCondition()` → throw 추가
- [x] `getBuildingCondition()` → throw 추가
- [x] 기존 함수 `getOrUndefinedXX()` 추가
- [x] entity 사용처에서 throw 로직 제거
  - world-building-entity.svelte.ts: building getter 간소화
  - search-entity-sources.ts: getOrUndefinedBuilding 사용
  - world-context-blueprint.svelte.ts: getOrUndefinedBuilding 사용

**Phase 2: use-character.ts** ✅
- [x] `getCharacter()` → throw 추가
- [x] `getCharacterBody()` → throw 추가
- [x] 기존 함수 `getOrUndefinedXX()` 추가
- [x] entity 사용처에서 throw 로직 제거
  - world-character-entity.svelte.ts: characterBody getter 간소화
  - search-entity-sources.ts: getOrUndefinedCharacter 사용

**Phase 3: use-item.ts** ✅
- [x] `getItem()` → throw 추가
- [x] 기존 함수 `getOrUndefinedItem()` 추가
- [x] entity 사용처에서 throw 로직 제거
  - world-item-entity.svelte.ts: item getter 간소화
  - search-entity-sources.ts: getOrUndefinedItem 사용
  - world-context-blueprint.svelte.ts: getOrUndefinedItem 사용
- Note: ItemBody, Durability, ItemDurability는 별도 테이블이 아님 (초기 조사 오류)

**Phase 4: use-world.ts**
- [ ] World 인스턴스 getters는 undefined 반환 유지 (현재 패턴 유지)
- [ ] `getEntityInstance()` → 이미 throw하므로 유지
- [ ] entity 사용처에서 중복 throw 로직 제거

**Phase 5: use-interaction.ts**
- [ ] Interaction getters는 undefined 반환 유지 (옵셔널 특성)
- [ ] InteractionAction getters는 빈 배열 반환 유지

**Phase 6: use-behavior.ts**
- [ ] `getNeed()` → throw 추가, 기존은 `getOrUndefinedNeed()`
- [ ] `getBehaviorAction()` → undefined 반환 유지 (동적 생성/삭제)
- [ ] `getNeedBehavior()` → undefined 반환 유지 (동적 생성/삭제)

#### 4단계: 검증
- [ ] 모든 entity 클래스에서 throw 로직 제거 확인
- [ ] TypeScript 컴파일 에러 없음 확인
- [ ] 테스트 월드 실행하여 동작 확인

### 예상 효과

1. **명확한 의도**: 함수명만 봐도 에러 처리 방식을 알 수 있음
2. **중복 제거**: entity 클래스의 덕지덕지 붙은 throw 로직 제거
3. **유지보수성**: 에러 메시지가 훅에서 통일되어 관리됨
4. **타입 안정성**: undefined 체크가 명시적으로 필요한 곳이 명확해짐
