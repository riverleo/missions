# EntityId 포맷 확장

## 목표
EntityId에 WorldId와 Instance ID를 포함하여 월드 내 특정 인스턴스를 정확히 식별

## 현재 문제점

### 현재 EntityId 포맷 (추정)
```typescript
// 현재 (불완전)
item_${itemId}
building_${buildingId}
character_${characterId}
```

### 문제
- 어느 월드의 엔티티인지 알 수 없음
- 템플릿만 식별 가능하고 특정 인스턴스를 구분할 수 없음
- 같은 아이템이 여러 개 있을 때 구분 불가

## 개선 방안

### 새로운 EntityId 포맷
```typescript
// 아이템
item_${WorldId}_${itemId}_${WorldItemId}

// 건물
building_${WorldId}_${buildingId}_${WorldBuildingId}

// 캐릭터
character_${WorldId}_${characterId}_${WorldCharacterId}
```

### 구성 요소
1. **Entity Type**: `item` | `building` | `character`
2. **WorldId**: 어느 월드인지
3. **Source ID**: `itemId` | `buildingId` | `characterId` (마스터 데이터)
4. **Instance ID**: `WorldItemId` | `WorldBuildingId` | `WorldCharacterId` (월드 인스턴스)

## 구현 전략

### Phase 1: 타입 정의 및 유틸리티
- [ ] `EntityId` 타입 정의 확인 (`src/lib/types/core.ts`)
  ```typescript
  // 현재 정의 확인
  export type EntityId = string;
  ```

- [ ] EntityIdUtils 유틸리티 확장 (`src/lib/utils/entity-id.ts`)
  - [ ] `create()` 함수 시그니처 변경
    ```typescript
    // Before (추정)
    create(type: 'item', itemId: ItemId): EntityId
    create(type: 'building', buildingId: BuildingId): EntityId
    create(type: 'character', characterId: CharacterId): EntityId

    // After
    create(type: 'item', worldId: WorldId, itemId: ItemId, worldItemId: WorldItemId): EntityId
    create(type: 'building', worldId: WorldId, buildingId: BuildingId, worldBuildingId: WorldBuildingId): EntityId
    create(type: 'character', worldId: WorldId, characterId: CharacterId, worldCharacterId: WorldCharacterId): EntityId
    ```

  - [ ] `parse()` 함수 업데이트
    ```typescript
    // Before (추정)
    parse(entityId: EntityId): { type: string; sourceId: string }

    // After
    parse(entityId: EntityId): {
      type: 'item' | 'building' | 'character';
      worldId: WorldId;
      sourceId: ItemId | BuildingId | CharacterId;
      instanceId: WorldItemId | WorldBuildingId | WorldCharacterId;
    }
    ```

  - [ ] 기타 유틸리티 함수 업데이트
    - `is()`: EntityId 검증
    - `getType()`: 타입 추출
    - `getWorldId()`: WorldId 추출 (신규)
    - `sourceId<T>()`: 소스 ID 추출 (신규, 제네릭으로 타입 안전성)
      ```typescript
      sourceId<BuildingId>(entityId: EntityId): BuildingId
      sourceId<ItemId>(entityId: EntityId): ItemId
      sourceId<CharacterId>(entityId: EntityId): CharacterId
      ```
    - `instanceId<T>()`: 인스턴스 ID 추출 (신규, 제네릭으로 타입 안전성)
      ```typescript
      instanceId<WorldBuildingId>(entityId: EntityId): WorldBuildingId
      instanceId<WorldItemId>(entityId: EntityId): WorldItemId
      instanceId<WorldCharacterId>(entityId: EntityId): WorldCharacterId
      ```

### Phase 2: EntityId 생성 위치 수정
- [ ] EntityId를 생성하는 모든 위치 찾기
  ```bash
  grep -r "EntityIdUtils.create" src/
  ```

- [ ] 각 생성 위치에서 WorldId와 Instance ID 추가
  - WorldCharacterEntity에서 생성 시
  - WorldBuildingEntity에서 생성 시
  - WorldItemEntity에서 생성 시

### Phase 3: EntityId 파싱 위치 수정
- [ ] EntityId를 파싱하는 모든 위치 찾기
  ```bash
  grep -r "EntityIdUtils.parse" src/
  ```

- [ ] 파싱 결과에서 worldId, instanceId 사용하도록 업데이트

### Phase 4: 영향 받는 컴포넌트 수정
- [ ] behavior-state 관련 파일들
  - `tickFindTargetEntityAndGo.ts`
  - `tick-enqueue-interactions.ts` (향후)
  - 기타 EntityId를 사용하는 tick 함수들

- [ ] searchEntitySources, searchInteractions 함수
  - EntityId 파라미터 처리 확인

### Phase 5: 불필요한 함수 제거

#### 5.1 리팩토링 대상 찾기
- [ ] `getBuildingByWorldBuildingId` 사용처 찾기
  ```bash
  grep -r "getBuildingByWorldBuildingId" src/
  ```
- [ ] `getItemByWorldItemId` 사용처 찾기
- [ ] `getCharacterByWorldCharacterId` 사용처 찾기
- [ ] `getOrUndefinedItemByWorldItemId` 등 or undefined 변형 확인

#### 5.2 패턴별 리팩토링

##### 패턴 A: EntityId parse 후 instanceId로 호출
현재 패턴:
```typescript
// accordion-item-world-character-entity.svelte:40-50
const { type, instanceId } = EntityIdUtils.parse(entity.behavior.targetEntityId);

if (type === 'building') {
  return getBuildingByWorldBuildingId(instanceId).name;
} else if (type === 'item') {
  return getItemByWorldItemId(instanceId).name;
} else if (type === 'character') {
  return getCharacterByWorldCharacterId(instanceId).name;
}
```

리팩토링 후:
```typescript
const { type } = EntityIdUtils.parse(entity.behavior.targetEntityId);

if (type === 'building') {
  const buildingId = EntityIdUtils.sourceId<BuildingId>(entity.behavior.targetEntityId);
  return getBuilding(buildingId).name;
} else if (type === 'item') {
  const itemId = EntityIdUtils.sourceId<ItemId>(entity.behavior.targetEntityId);
  return getItem(itemId).name;
} else if (type === 'character') {
  const characterId = EntityIdUtils.sourceId<CharacterId>(entity.behavior.targetEntityId);
  return getCharacter(characterId).name;
}
```

**대상 파일**:
- [ ] `src/lib/components/admin/test-world/test-world-inspector-panel/accordion-item-world-character-entity.svelte:40-50`

##### 패턴 B: EntityIdUtils.instanceId() + getOrUndefinedByWorldId 조합
현재 패턴:
```typescript
// accordion-item-world-character-entity.svelte:112
const item = getOrUndefinedItemByWorldItemId(EntityIdUtils.instanceId<WorldItemId>(itemId));
```

리팩토링 후:
```typescript
const itemId = EntityIdUtils.sourceId<ItemId>(entityId);
const item = getOrUndefinedItem(itemId);
```

**대상 파일**:
- [ ] `src/lib/components/admin/test-world/test-world-inspector-panel/accordion-item-world-character-entity.svelte:112`

##### 패턴 C: 엔티티 클래스 getter 메서드
현재 패턴:
```typescript
// world-building-entity.svelte.ts:72-79
get building(): Building {
  const { getWorldBuilding } = useWorld();
  const { getBuilding } = useBuilding();

  const worldBuilding = getWorldBuilding(this.instanceId);
  if (!worldBuilding) throw new Error(`WorldBuilding not found for id ${this.instanceId}`);

  return getBuilding(worldBuilding.building_id);
}

// world-item-entity.svelte.ts:59-66
get item(): Item {
  const { getWorldItem } = useWorld();
  const { getItem } = useItem();

  const worldItem = getWorldItem(this.instanceId);
  if (!worldItem) throw new Error(`WorldItem not found for id ${this.instanceId}`);

  return getItem(worldItem.item_id);
}

// world-character-entity.svelte.ts:89-98
get characterBody(): CharacterBody {
  const { getWorldCharacter } = useWorld();
  const { getCharacter, getCharacterBody } = useCharacter();

  const worldCharacter = getWorldCharacter(this.instanceId);
  if (!worldCharacter) throw new Error(`WorldCharacter not found for id ${this.instanceId}`);

  const character = getCharacter(worldCharacter.character_id);
  return getCharacterBody(character.character_body_id);
}
```

리팩토링 후:
```typescript
get building(): Building {
  const { getBuilding } = useBuilding();
  return getBuilding(EntityIdUtils.sourceId<BuildingId>(this.id));
}

get item(): Item {
  const { getItem } = useItem();
  return getItem(EntityIdUtils.sourceId<ItemId>(this.id));
}

get characterBody(): CharacterBody {
  const { getCharacter, getCharacterBody } = useCharacter();
  const character = getCharacter(EntityIdUtils.sourceId<CharacterId>(this.id));
  return getCharacterBody(character.character_body_id);
}
```

**대상 파일**:
- [ ] `src/lib/components/app/world/entities/world-building-entity/world-building-entity.svelte.ts:72-79`
- [ ] `src/lib/components/app/world/entities/world-item-entity/world-item-entity.svelte.ts:59-66`
- [ ] `src/lib/components/app/world/entities/world-character-entity/world-character-entity.svelte.ts:89-98`

##### 패턴 D: instanceId만 있는 경우 (리팩토링 불가)
```typescript
// accordion-item-world-character-entity.svelte:33
const character = $derived(getCharacterByWorldCharacterId(entity.instanceId));
```

이 경우는 EntityId가 없고 instanceId만 있으므로 현재 방식 유지. 함수는 제거하지 않음.

#### 5.3 함수 제거 판단
- [ ] 모든 사용처 리팩토링 완료 확인
- [ ] 패턴 C 같이 instanceId만 있는 케이스 확인
- [ ] instanceId만 있는 합법적 사용이 있다면 함수 유지
- [ ] 모든 사용처가 EntityId로 대체 가능하다면 함수 제거

#### 5.4 함수 제거 실행 (조건부)
- [ ] `getBuildingByWorldBuildingId` 제거 여부 결정
- [ ] `getItemByWorldItemId` 제거 여부 결정
- [ ] `getCharacterByWorldCharacterId` 제거 여부 결정
- [ ] import 정리

### Phase 6: 테스트 및 검증
- [ ] EntityIdUtils 단위 테스트 업데이트
- [ ] EntityId 생성/파싱 동작 확인
- [ ] 월드 내 엔티티 식별이 정확한지 검증
- [ ] 제거된 함수 사용처가 없는지 확인
- [ ] pnpm check 통과 확인

## 예시

### 사용 예시
```typescript
// EntityId 생성
const entityId = EntityIdUtils.create(
  'item',
  worldId,
  itemId,
  worldItemId
);
// "item_world123_item456_worldItem789"

// EntityId 파싱
const parsed = EntityIdUtils.parse(entityId);
// {
//   type: 'item',
//   worldId: 'world123',
//   sourceId: 'item456',
//   instanceId: 'worldItem789'
// }
```

## 고려사항

### 1. 하위 호환성
- 기존 EntityId 포맷과의 호환성 유지 필요?
- 마이그레이션 전략 필요?

### 2. 성능
- EntityId 길이 증가로 인한 영향 미미
- 파싱 오버헤드 무시할 수 있는 수준

### 3. 데이터베이스
- EntityId가 DB에 저장되는 경우 있는지 확인 필요
- 대부분 런타임에만 사용되는 것으로 추정

## 예상 효과
- ✅ 월드 내 특정 인스턴스 정확히 식별
- ✅ 같은 템플릿의 여러 인스턴스 구분 가능
- ✅ 월드 간 엔티티 구분 명확
- ✅ 인터렉션 검색 시 정확도 향상
- ✅ 불필요한 함수 제거로 코드베이스 단순화 (getBuildingByWorldBuildingId 등)

## 작업 순서

1. [ ] Phase 1: 타입 정의 및 유틸리티
2. [ ] Phase 2: EntityId 생성 위치 수정
3. [ ] Phase 3: EntityId 파싱 위치 수정
4. [ ] Phase 4: 영향 받는 컴포넌트 수정
5. [ ] Phase 5: 불필요한 함수 제거
6. [ ] Phase 6: 테스트 및 검증
