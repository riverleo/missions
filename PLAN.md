# Plan - Admin 컴포넌트 리팩토링

## 목표

1. **Label 옵션들을 label.ts 또는 constants.ts로 중앙화**
2. **Store 직접 참조를 getter 함수로 치환**
3. **변수 네이밍 개선**
4. **getOrUndefined 함수들의 타입 개선** (string | null | undefined 허용)

## 작업 범위

**사용자가 완료한 영역**: behavior-priority ~ condition
**작업 대상 영역**: condition 이후 ~ 끝까지

## Phase 1: 패턴 분석 및 목록화

### 패턴 1: Label Options를 label.ts로 이동
**현재 문제**: 동일한 label options가 여러 컴포넌트에 중복 정의됨

**대상 항목**:
- `faceStateOptions` - need-behavior dialogs
- `bodyStateTypes`, `faceStateTypes` - interaction-action-node-panel들
- 기타 중복된 state/type options

**이동 위치**: `src/lib/utils/label.ts`
**새로운 함수**:
- `getCharacterBodyStateLabels(): Label<CharacterBodyStateType>[]`
- `getCharacterFaceStateLabels(): Label<CharacterFaceStateType>[]`
- 기타 필요한 Labels 함수

### 패턴 2: Label Constraints를 constants.ts로 이동
**현재 문제**: UI에서 사용되는 state/type 제약사항들이 컴포넌트에 하드코딩됨

**대상 항목**:
- `bodyStateTypes` - character-action-panel
- `colliderTypes` - character-body-action-panel
- `stateTypes` - character-face/body-state-item-group
- `faceStateOptions` - character-body-state-item

**이동 위치**: `src/lib/constants.ts`
**새로운 상수**:
- `CHARACTER_BODY_STATE_TYPES: CharacterBodyStateType[]`
- `COLLIDER_TYPES: ColliderType[]`
- 기타 필요한 타입 배열

### 패턴 3: Derived Label 로직을 label.ts로 이동
**현재 문제**: 컴포넌트 내부에서 복잡한 label 생성 로직 존재

**대상 항목**:
- `selectedBodyLabel`, `selectedFaceLabel` (character dialogs)
- `selectedTargetLabel` (fulfillment-node-panel)
- `typeLabel` (fulfillment-node)
- `getInteractionLabel` (character-interaction-command)

**이동 위치**: `src/lib/utils/label.ts`
**새로운 함수 형식**: `getXxxString()` 또는 `getXxxLabelString()`

### 패턴 4: Store 직접 참조를 getter로 치환
**현재 문제**: 컴포넌트에서 `$store.data[id]` 형태로 직접 접근

**변경 방향**:
```typescript
// Before
const character = $characterStore.data[characterId];

// After
const character = getCharacter(characterId);
```

### 패턴 5: getOrUndefined 함수 타입 개선
**현재 문제**: `getOrUndefinedCharacter(id: CharacterId)`만 허용, null/undefined 전달 시 타입 에러

**개선 방향**:
```typescript
// Before
getOrUndefinedCharacter(id: CharacterId): Character | undefined

// After
getOrUndefinedCharacter(id: CharacterId | null | undefined): Character | undefined
```

**적용 대상**:
- `getOrUndefinedCharacter`
- `getOrUndefinedBuilding`
- `getOrUndefinedItem`
- 기타 모든 getOrUndefined 함수들

## Phase 2: 영역별 작업 계획

### 영역 1: Item & Item Interaction (Priority: High)

#### 1.1. item-interaction-action-node-panel.svelte
**발견된 패턴**:
- Label options 배열: `bodyStateTypes`, `faceStateTypes` (lines 69-82)
- Derived label: `selectedBodyStateLabel`, `selectedFaceStateLabel` (lines 88-95)
- Store 직접 참조: `$itemInteractionStore`, `$characterStore`, `$itemStateStore` (lines 44-49)

**작업 항목**:
- [ ] bodyStateTypes, faceStateTypes를 constants.ts로 이동
- [ ] selectedBodyStateLabel → `getCharacterBodyStateString()` 사용
- [ ] selectedFaceStateLabel → `getCharacterFaceStateString()` 사용
- [ ] Store 직접 참조를 getter로 변경

#### 1.2. item-interaction-command.svelte
**발견된 패턴**:
- Store 직접 참조: `$itemInteractionStore`, `$itemStore`, `$characterStore` (lines 33-48)
- Derived label: 인라인 label 생성 (characterName + getBehaviorInteractTypeString)

**작업 항목**:
- [ ] Store 직접 참조를 getter로 변경
- [ ] getInteractionLabel 함수를 label.ts로 이동

#### 1.3. item-update-dialog.svelte
**발견된 패턴**:
- Store 직접 참조: `$itemStore.data[itemId]` (line 28)

**작업 항목**:
- [ ] Store 직접 참조를 getter로 변경

---

### 영역 2: Narrative (Priority: Medium)

#### 2.1. narrative-node-panel.svelte
**발견된 패턴**:
- Store 직접 참조: `$narrativeNodeChoiceStore.data` (lines 58-60)
- Derived label: 타입별 라벨 ("텍스트", "선택지")

**작업 항목**:
- [ ] Store 직접 참조를 getter로 변경
- [ ] 타입 라벨을 label.ts의 `getNarrativeNodeTypeString()`로 이동

#### 2.2. narrative-command.svelte
**발견된 패턴**:
- Store 직접 참조: `$narrativeStore.data` (lines 27-28)

**작업 항목**:
- [ ] Store 직접 참조를 getter로 변경

---

### 영역 3: Need & Need Behavior (Priority: High)

#### 3.1. need-behavior-create-dialog.svelte (PREP.md 언급)
**발견된 패턴**:
- Label options 배열: `faceStateOptions` (lines 49-54)
- Derived label: `selectedNeedName`, `selectedCharacterName` (lines 56-59)
- Store 직접 참조: `$needStore.data`, `$characterStore.data` (lines 39-40)

**작업 항목**:
- [ ] faceStateOptions를 constants.ts로 이동
- [ ] Derived label들을 label.ts로 이동
- [ ] Store 직접 참조를 getter로 변경

#### 3.2. need-behavior-update-dialog.svelte (PREP.md 언급)
**발견된 패턴**:
- Label options 배열: `faceStateOptions` (lines 56-61) - create-dialog와 동일
- Derived label: `selectedNeedName`, `selectedCharacterName` (lines 63-66)
- Store 직접 참조: `$needBehaviorStore`, `$needStore`, `$characterStore` (lines 44-47)

**작업 항목**:
- [ ] faceStateOptions를 constants.ts로 이동 (create-dialog와 공통화)
- [ ] Derived label들을 label.ts로 이동
- [ ] Store 직접 참조를 getter로 변경

#### 3.3. need-command.svelte
**발견된 패턴**:
- Store 직접 참조: `$needStore.data` (line 29)

**작업 항목**:
- [ ] Store 직접 참조를 getter로 변경

#### 3.4. need-fulfillment-node-panel.svelte
**발견된 패턴**:
- Store 직접 참조: `$buildingStore`, `$characterStore`, `$itemStore`, `$buildingInteractionStore`, `$characterInteractionStore`, `$itemInteractionStore` (lines 53-58)
- Derived label: `getTypeLabel`, `getTaskConditionLabel` (lines 60-68)
- Complex derived: `selectedTargetLabel` (lines 74-122)

**작업 항목**:
- [ ] Store 직접 참조를 getter로 변경
- [ ] getTypeLabel을 label.ts의 `getNeedFulfillmentTypeString()`로 이동
- [ ] selectedTargetLabel 로직을 label.ts의 `getFulfillmentTargetLabelString()`로 이동

---

### 영역 4: Quest (Priority: Medium)

#### 4.1. quest-command.svelte
**발견된 패턴**:
- Store 직접 참조: `$questStore.data`, `$chapterStore.data` (lines 33-34)
- Derived label: 챕터 제목, 퀘스트 타입, 상태 라벨

**작업 항목**:
- [ ] Store 직접 참조를 getter로 변경
- [ ] 타입/상태 라벨을 label.ts로 이동

#### 4.2. quest-create-dialog.svelte
**발견된 패턴**:
- Store 직접 참조: `$chapterStore.data` (line 50)
- Derived label: `chapterLabel`, `getTypeLabel` (lines 71-79)

**작업 항목**:
- [ ] Store 직접 참조를 getter로 변경
- [ ] getTypeLabel을 label.ts의 `getQuestTypeString()`로 이동

#### 4.3. quest-update-dialog.svelte
**발견된 패턴**:
- Store 직접 참조: `$questStore.data?.[questId]`, `$chapterStore.data` (lines 49-50)
- Derived label: `chapterLabel`, `getTypeLabel` (lines 71-79)

**작업 항목**:
- [ ] Store 직접 참조를 getter로 변경
- [ ] getTypeLabel을 label.ts의 `getQuestTypeString()`로 이동 (create-dialog와 공통화)

---

### 영역 5: Sidebar (Priority: High)

#### 5.1. admin-site-header.svelte
**발견된 패턴**:
- Store 직접 참조: 16개 store의 data 직접 접근 (lines 46-127)
  - `$scenarioStore`, `$chapterStore`, `$questStore`, `$narrativeStore`, `$terrainStore`
  - `$characterStore`, `$characterBodyStore`, `$buildingStore`
  - `$buildingInteractionStore`, `$characterInteractionStore`, `$itemInteractionStore`
  - `$conditionStore`, `$conditionBehaviorStore`, `$itemStore`
  - `$needStore`, `$needBehaviorStore`
- Derived label: 인터랙션별 복잡한 라벨 생성 (lines 73-127)

**작업 항목**:
- [ ] Store 직접 참조를 getter로 변경 (16개 store)
- [ ] getTitle 함수를 label.ts의 `getBreadcrumbTitleString()`로 이동

---

### 영역 6: Terrain & Terrain Files (Priority: Low)

#### 6.1. terrain-command.svelte
**발견된 패턴**:
- Store 직접 참조: `$terrainStore.data` (line 32)

**작업 항목**:
- [ ] Store 직접 참조를 getter로 변경

#### 6.2. terrains-tiles-svelte-flow.svelte
**발견된 패턴**:
- Store 직접 참조: `$terrainStore.data`, `$tileStore.data`, `$terrainTileStore.data` (lines 39-41)

**작업 항목**:
- [ ] Store 직접 참조를 getter로 변경

---

### 영역 7: Test World (Priority: High)

#### 7.1. test-world-command-panel.svelte
**발견된 패턴**:
- Store 직접 참조: `$terrainStore`, `$characterStore`, `$buildingStore`, `$itemStore`, `$tileStore` (lines 33-37)

**작업 항목**:
- [ ] Store 직접 참조를 getter로 변경

#### 7.2. accordion-item-world-character-entity.svelte
**발견된 패턴**:
- Store 직접 참조: 13개 store의 data 직접 접근 (lines 43-46, 56-68)
  - `$worldCharacterStore`, `$characterStore`, `$worldBuildingStore`, `$buildingStore`
  - `$worldItemStore`, `$itemStore`, `$needBehaviorStore`, `$needBehaviorActionStore`
  - `$conditionBehaviorStore`, `$conditionBehaviorActionStore`, `$needStore`
- Derived label: `currentTargetName`, `currentBehaviorInfo` (lines 49-111)

**작업 항목**:
- [ ] Store 직접 참조를 getter로 변경 (13개 store)
- [ ] currentTargetName을 label.ts의 `getEntityTargetNameString()`로 이동
- [ ] currentBehaviorInfo를 label.ts의 `getBehaviorInfoString()`로 이동

---

### 영역 8: Tile (Priority: Low)

#### 8.1. tile-command.svelte
**발견된 패턴**:
- Store 직접 참조: `$tileStore.data` (line 29)

**작업 항목**:
- [ ] Store 직접 참조를 getter로 변경

#### 8.2. tile-update-dialog.svelte
**발견된 패턴**:
- Store 직접 참조: `$tileStore.data[tileId]` (line 31)

**작업 항목**:
- [ ] Store 직접 참조를 getter로 변경

---

### 작업 우선순위 요약

**High Priority** (Label Options 배열):
1. item-interaction-action-node-panel: bodyStateTypes, faceStateTypes → constants.ts
2. need-behavior-create/update-dialog: faceStateOptions → constants.ts

**High Priority** (복잡한 Derived Label):
1. need-fulfillment-node-panel: selectedTargetLabel → label.ts
2. admin-site-header: getTitle → label.ts
3. accordion-item-world-character-entity: currentTargetName, currentBehaviorInfo → label.ts

**Medium Priority** (Store 직접 참조 많은 파일):
1. admin-site-header: 16개 store
2. accordion-item-world-character-entity: 13개 store

**Low Priority** (단순 Store 직접 참조):
- 나머지 모든 파일의 store 직접 참조

## Phase 3: 공통 작업 (모든 영역)

### 3.1: getOrUndefined 함수 타입 개선
**파일**: `src/lib/hooks/use-*.ts`

**변경 목록**:
- [ ] `getOrUndefinedCharacter(id: CharacterId | null | undefined)`
- [ ] `getOrUndefinedBuilding(id: BuildingId | null | undefined)`
- [ ] `getOrUndefinedItem(id: ItemId | null | undefined)`
- [ ] `getOrUndefinedNeed(id: NeedId | null | undefined)`
- [ ] `getOrUndefinedCondition(id: ConditionId | null | undefined)`
- [ ] 기타 모든 getOrUndefined 함수들

**구현 예시**:
```typescript
// Before
function getOrUndefinedCharacter(id: CharacterId): Character | undefined {
  return $characterStore.data[id];
}

// After
function getOrUndefinedCharacter(id: CharacterId | null | undefined): Character | undefined {
  if (!id) return undefined;
  return $characterStore.data[id];
}
```

### 3.2: label.ts에 새로운 함수 추가

**추가할 함수 목록**:
1. [ ] `getCharacterBodyStateLabels(): Label<CharacterBodyStateType>[]`
2. [ ] `getCharacterFaceStateLabels(): Label<CharacterFaceStateType>[]`
3. [ ] `getColliderTypeLabels(): Label<ColliderType>[]`
4. [ ] `getSelectedBodyStateString(type: CharacterBodyStateType | null | undefined): string`
5. [ ] `getSelectedFaceStateString(type: CharacterFaceStateType | null | undefined): string`
6. [ ] `getInteractionLabelString(params: {...}): string`
7. [ ] 기타 필요한 label 함수들

### 3.3: constants.ts에 새로운 상수 추가

**추가할 상수 목록**:
1. [ ] `CHARACTER_BODY_STATE_TYPES: CharacterBodyStateType[]`
2. [ ] `CHARACTER_FACE_STATE_TYPES: CharacterFaceStateType[]`
3. [ ] `COLLIDER_TYPES: ColliderType[]`
4. [ ] 기타 필요한 타입 배열

## Phase 4: 구현 순서

### Step 1: 기반 작업
1. [ ] getOrUndefined 함수 타입 개선 (Phase 3.1)
2. [ ] label.ts에 공통 함수 추가 (Phase 3.2)
3. [ ] constants.ts에 공통 상수 추가 (Phase 3.3)
4. [ ] 타입 체크 확인

### Step 2: 영역별 순차 작업
1. [ ] 영역 1: Item & Item Interaction
2. [ ] 영역 2: Narrative
3. [ ] 영역 3: Need & Need Behavior
4. [ ] 영역 4: Quest
5. [ ] 영역 5: Sidebar
6. [ ] 영역 6: Terrain & Terrain Files
7. [ ] 영역 7: Test World
8. [ ] 영역 8: Tile

**각 영역별 작업 흐름**:
1. 파일 목록 확인
2. 패턴별 변경사항 적용
3. Import 추가/수정
4. 타입 체크 확인
5. 커밋

## Phase 5: 검증

### 최종 검증 항목
- [ ] `pnpm check` 통과
- [ ] 모든 label 옵션이 중앙화됨
- [ ] Store 직접 참조가 getter로 변경됨
- [ ] 변수 네이밍이 일관성 있게 개선됨
- [ ] getOrUndefined 함수들이 null/undefined 처리 가능

## 예상 효과

1. **중앙화**: Label 옵션과 제약사항이 한 곳에서 관리됨
2. **일관성**: 동일한 패턴의 label/getter 사용
3. **타입 안정성**: getOrUndefined 함수의 null-safe 처리
4. **유지보수성**: 변경 시 한 곳만 수정하면 됨
5. **가독성**: 명확한 네이밍과 getter 패턴 사용

## 다음 단계

Step 1 (기반 작업)부터 시작하여 순차적으로 진행합니다.
사용자 승인 후 구현을 시작합니다.
