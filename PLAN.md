# Plan - Admin 컴포넌트 리팩토링

## 🎯 목표

**핵심**: 컴포넌트에 중복된 라벨 함수들을 label.ts로 이동하여 재사용

1. **중복된 라벨 함수를 label.ts로 통합**
   - 동일한 패턴의 라벨 생성 로직을 하나의 함수로 통합
   - 예: condition-behavior-action-node와 need-behavior-action-node의 `typeLabel` → `getBehaviorActionString()`

2. **Label 옵션 배열을 label.ts의 Labels 함수로 변환**
   - 하드코딩된 label options 배열 제거
   - 예: `bodyStateTypes` → `getCharacterBodyStateLabels()`

3. **Store 직접 참조를 getter 함수로 치환**
   - `$xxxStore.data[id]` → `getXxx(id)` 패턴

4. **getOrUndefined 함수들의 타입 개선**
   - `string | null | undefined` 허용

## 📐 Label 함수 컨벤션

### ✅ 기본값을 함수 내부에서 관리

**원칙**: 컴포넌트에서 기본값을 하드코딩하지 않고, label 함수가 기본값을 책임진다.

```typescript
// ✅ Good - 기본값을 함수 내부에서 처리
export function getBehaviorActionTypeString(
  action: NeedBehaviorAction | ConditionBehaviorAction | undefined
): string {
  if (!action) return '액션 타입';  // 함수가 기본값 관리
  return BEHAVIOR_ACTION_TYPE_LABELS[action.type];
}

// 컴포넌트에서 사용
const label = $derived(getBehaviorActionTypeString(changes));

// ❌ Bad - 컴포넌트에서 기본값 하드코딩
const label = $derived(
  changes?.type ? getBehaviorActionTypeString(changes.type) : '액션 타입'
);
```

**적용 사항**:
- 모든 label 함수는 `undefined` 파라미터 허용
- 기본값(fallback string) 반환 로직 포함
- 컴포넌트에서 삼항 연산자로 기본값 처리 금지

## 작업 범위

**사용자가 완료한 영역**: behavior-priority ~ condition
**작업 대상 영역**: condition 이후 ~ 끝까지

## 🔍 주요 중복 패턴

### 패턴 1: typeLabel (동일한 로직)
**위치**:
- condition-behavior-action-node.svelte
- need-behavior-action-node.svelte

**로직**:
```typescript
const typeLabel = $derived.by(() => {
  const target = targetLabel;
  const behaviorLabel = behaviorTypeLabel;

  if (action.type === 'once') {
    if (behaviorLabel && target) {
      return `${josa(target, '을를')} ${behaviorLabel}`;
    }
    if (behaviorLabel) {
      return behaviorLabel;
    }
  }
  // ... fulfill, idle 로직
});
```

**통합 방안**: 이미 label.ts에 `getBehaviorActionString()` 존재, 개선 필요

### 패턴 2: selectedBodyStateLabel, selectedFaceStateLabel (반복)
**위치**:
- building-interaction-action-node-panel.svelte
- item-interaction-action-node-panel.svelte
- character-interaction-action-node-panel.svelte
- 기타 여러 dialog

**통합 방안**:
- `getCharacterBodyStateString()` - 이미 존재
- `getCharacterFaceStateString()` - 이미 존재
- 직접 사용하도록 변경

### 패턴 3: selectedTargetLabel (복잡한 로직 반복)
**위치**:
- need-fulfillment-node-panel.svelte
- condition-fulfillment-node-panel.svelte

**통합 방안**: `getFulfillmentTargetLabelString(fulfillment)` 추가

### 패턴 4: getInteractionLabel (인라인 반복)
**위치**:
- item-interaction-command.svelte
- character-interaction-command.svelte
- building-interaction-command.svelte

**통합 방안**: `getInteractionLabelString(interaction, character)` 추가

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
**발견된 중복 패턴**:
- ❌ Label options 배열: `bodyStateTypes`, `faceStateTypes` (lines 69-82)
  - 동일 패턴: building-interaction-action-node-panel, character-interaction-action-node-panel
- ❌ Derived label: `selectedBodyStateLabel`, `selectedFaceStateLabel` (lines 88-95)
  - 동일 패턴: 여러 interaction-action-node-panel, dialog 파일들
- Store 직접 참조: `$itemInteractionStore`, `$characterStore`, `$itemStateStore` (lines 44-49)

**작업 항목**:
- [ ] bodyStateTypes, faceStateTypes 제거 → `getCharacterBodyStateLabels()`, `getCharacterFaceStateLabels()` 사용
- [ ] selectedBodyStateLabel, selectedFaceStateLabel 제거 → 직접 `getCharacterBodyStateString()`, `getCharacterFaceStateString()` 사용
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

#### 3.0. need-behavior-action-node.svelte ⭐ **중복 패턴**
**발견된 중복 패턴**:
- ❌ `typeLabel` 로직 (lines ~40-60)
  - **동일 패턴**: condition-behavior-action-node.svelte
  - 완전히 동일한 로직 (targetLabel, behaviorLabel 조합)

**작업 항목**:
- [ ] typeLabel 로직 제거 → label.ts의 `getBehaviorActionString()` 개선하여 사용
- [ ] condition-behavior-action-node와 함께 처리

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

**중복 제거를 위한 함수**:

1. [ ] **Labels 함수** (options 배열 대체)
   - `getCharacterBodyStateLabels(): Label<CharacterBodyStateType>[]`
   - `getCharacterFaceStateLabels(): Label<CharacterFaceStateType>[]`
   - `getColliderTypeLabels(): Label<ColliderType>[]`

2. [ ] **Behavior Action Labels** (typeLabel 통합)
   - `getBehaviorActionString()` 개선 - targetLabel, behaviorLabel 조합 로직 추가
   - 또는 새로운 `getBehaviorActionLabelString(action, targetLabel?, behaviorLabel?): string`

3. [ ] **Interaction Labels** (getInteractionLabel 통합)
   - `getInteractionLabelString(interaction, character?): string`
   - item, building, character interaction에서 공통 사용

4. [ ] **Fulfillment Target Labels** (selectedTargetLabel 통합)
   - `getFulfillmentTargetLabelString(fulfillment): string`
   - need/condition fulfillment-node-panel에서 공통 사용

5. [ ] **Quest/Narrative Type Labels** (getTypeLabel 통합)
   - `getQuestTypeString(type): string`
   - `getNarrativeNodeTypeString(type): string`

6. [ ] **Entity/Breadcrumb Labels** (복잡한 로직 통합)
   - `getBreadcrumbTitleString(params): string` - admin-site-header
   - `getEntityTargetNameString(entity): string` - test-world inspector
   - `getBehaviorInfoString(behavior): string` - test-world inspector

## Phase 4: 구현 순서

### Step 1: 기반 작업 (label.ts 함수 추가)
**목적**: 중복 제거를 위한 공통 함수 먼저 구축

**⚠️ 모든 함수는 컨벤션 준수**: `undefined` 허용 + 기본값 반환

1. [ ] **Labels 함수 추가** (options 배열 대체)
   ```typescript
   // 모두 undefined가 아닌 빈 배열 반환
   getCharacterBodyStateLabels(): Label<CharacterBodyStateType>[]
   getCharacterFaceStateLabels(): Label<CharacterFaceStateType>[]
   getColliderTypeLabels(): Label<ColliderType>[]
   ```

2. [ ] **중복 로직 통합 함수 추가**
   ```typescript
   // typeLabel 통합 - 이미 개선됨: ✅ getBehaviorActionTypeString(action?)
   // targetMethod 통합 - 이미 개선됨: ✅ getTargetSelectionMethodLabelString(action?)

   // 추가 필요:
   getInteractionLabelString(interaction?, character?): string  // 기본값: '상호작용'
   getFulfillmentTargetLabelString(fulfillment?): string  // 기본값: '대상 선택...'
   getQuestTypeString(type?): string  // 기본값: '퀘스트 타입'
   getNarrativeNodeTypeString(type?): string  // 기본값: '노드 타입'
   getBreadcrumbTitleString(params?): string  // 기본값: '제목 없음'
   getEntityTargetNameString(entity?): string  // 기본값: '대상 없음'
   getBehaviorInfoString(behavior?): string  // 기본값: '행동 정보 없음'
   ```

3. [ ] **기존 함수들 컨벤션 적용 확인**
   - `getInteractionTargetNameString()` - undefined 허용 확인
   - `getInteractionBehaviorLabelString()` - undefined 허용 확인
   - `getInteractionActionSummaryString()` - undefined 허용 확인
   - 기타 String suffix 함수들

4. [ ] **getOrUndefined 함수 타입 개선**
   - 모든 getOrUndefined 함수에 `| null | undefined` 추가

5. [ ] 타입 체크 확인

### Step 2: 중복 제거 작업 (우선순위별)

#### 2.1. High Priority - 동일 패턴 중복 제거
1. [ ] **typeLabel 통합** (완전 동일)
   - need-behavior-action-node.svelte
   - condition-behavior-action-node.svelte
   - → `getBehaviorActionString()` 사용

2. [ ] **selectedBodyStateLabel, selectedFaceStateLabel 제거** (여러 파일)
   - item-interaction-action-node-panel.svelte
   - building-interaction-action-node-panel.svelte (이미 완료?)
   - character-interaction-action-node-panel.svelte (이미 완료?)
   - → 직접 `getCharacterBodyStateString()` 사용

3. [ ] **faceStateOptions 배열 제거** (중복)
   - need-behavior-create-dialog.svelte
   - need-behavior-update-dialog.svelte
   - → `getCharacterFaceStateLabels()` 사용

#### 2.2. Medium Priority - 복잡한 로직 통합
4. [ ] **selectedTargetLabel 통합**
   - need-fulfillment-node-panel.svelte
   - condition-fulfillment-node-panel.svelte
   - → `getFulfillmentTargetLabelString()` 사용

5. [ ] **getInteractionLabel 통합**
   - item-interaction-command.svelte
   - character-interaction-command.svelte
   - building-interaction-command.svelte
   - → `getInteractionLabelString()` 사용

6. [ ] **admin-site-header 대규모 정리**
   - 16개 store 직접 참조 → getter
   - getTitle 로직 → `getBreadcrumbTitleString()`

#### 2.3. Low Priority - Store getter 치환
7. [ ] 나머지 모든 파일의 store 직접 참조 → getter 변경

**각 작업별 흐름**:
1. 해당 파일들 수정
2. 중복 코드 제거
3. label.ts 함수 사용
4. Import 추가/수정
5. 타입 체크 확인
6. 그룹별 커밋

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
