# Plan - 인라인 라벨 텍스트 중앙화

## 조사 결과 요약

총 **120개 이상의 컴포넌트 파일**에서 인라인 한글 라벨 발견

### 카테고리별 분류

#### 1. 버튼/액션 라벨 (공통 액션)
- **생성**: 생성 중... / 생성하기 / 생성
- **수정**: 저장 중... / 저장 / 수정 중... / 수정 / 수정하기
- **삭제**: 삭제 중... / 삭제 / 삭제하기
- **토글**: 목록 숨기기/보기, 검색창 숨기기/보기, 사이드 메뉴 열기/닫기
- **상태 전환**: 생성중으로 전환 / 공개로 전환

#### 2. Form 라벨 & Placeholder (도메인별 반복)
**입력 필드:**
- 이름: 건물 이름, 캐릭터 이름, 아이템 이름, 바디 이름, 제목 등
- 수치: 가로, 세로, 반지름, 넓이, 높이, X, Y, 최소, 최대

**검색:**
- 건물 검색..., 캐릭터 검색..., 아이템 검색..., 퀘스트 검색..., 바디 검색..., 지형 검색..., 행동 검색...

#### 3. 상태/타입 라벨
**동작 상태** (state-label.ts 중복):
- idle: 대기/기본, walk: 걷기, run: 뛰기/달리기, jump: 점프, pick: 줍기

**감정 상태** (state-label.ts 중복):
- idle: 기본, happy: 행복, sad: 슬픔, angry: 화남

**건설 상태** (state-label.ts 중복):
- damaged: 손상됨, planning: 계획 중, constructing: 건설 중

**스프라이트 상태** (신규):
- loop: 반복, ping-pong: 핑퐁, ping-pong-once: 핑퐁 1회

**엔티티 타입** (신규):
- building: 건물, character: 캐릭터, item: 아이템

#### 4. 복합 라벨 생성 패턴 ⚠️ 중요

**패턴 1: 캐릭터명 + 인터랙션 타입** (7개 파일)
```typescript
{@const characterName = character ? character.name : '모든 캐릭터'}
{@const label = `${characterName} ${getBehaviorInteractTypeLabel(interactionType)}`}
```
**위치:**
- building-interaction-command.svelte
- item-interaction-command.svelte
- character-interaction-command.svelte
- need-fulfillment-node-panel.svelte
- condition-fulfillment-node-panel.svelte
- condition-effect-node.svelte
- admin-site-header.svelte

**패턴 2: Fallback with ID** (10+ 파일)
```typescript
{terrain.title || `제목없음 (${terrain.id.split('-')[0]})`}
{character.name || `이름없음 (${character.id.split('-')[0]})`}
```
**위치:**
- test-world-command-panel.svelte (terrain, character, building, item, tile)
- need-command.svelte
- character-command.svelte
- narrative-command.svelte
- narrative-node-node.svelte
- tile-command.svelte
- 기타 command 컴포넌트들

**패턴 3: 도메인명 + 동작** (interaction-panel, node-panel 등)
```typescript
const labels: Record<string, string> = {
  idle: '대기',
  walk: '걷기',
  // ...
};
```

#### 5. 기타
**선택지/드롭다운:**
- 모두, 모든 캐릭터, 아이템 선택, 대상 캐릭터 선택, 바디 선택, 스프라이트 선택

**상태 표시:**
- published: 공개됨, draft/unpublished: 작업중
- primary: 메인 퀘스트/메인, secondary: 보조 퀘스트/보조

**Fallback 텍스트:**
- 제목없음, 이름없음, 챕터 없음, 최대 내구도 없음

**네비게이션:**
- 홈, 시나리오, 챕터, 퀘스트, 내러티브, 지형 등 (breadcrumb)

## 문제점

1. **중복**: 동일한 라벨이 여러 파일에서 반복됨 (생성, 수정, 삭제 등)
2. **불일치**: 같은 의미의 다른 표현 (뛰기 vs 달리기)
3. **비효율**: 도메인별로 동일한 패턴의 dialog가 각각 독립적으로 라벨 정의
4. **유지보수**: 라벨 변경 시 여러 파일 수정 필요

## 리팩토링 전략

### Phase 1: 공통 액션 라벨 중앙화
**파일**: `src/lib/constants/labels.ts` (신규 생성)

```typescript
// 공통 액션 라벨
export const ACTION_LABELS = {
  create: '생성',
  creating: '생성 중...',
  update: '수정',
  updating: '수정 중...',
  save: '저장',
  saving: '저장 중...',
  delete: '삭제',
  deleting: '삭제 중...',
  cancel: '취소',
  confirm: '확인',
} as const;

// 토글 액션
export const TOGGLE_LABELS = {
  show: '보기',
  hide: '숨기기',
  open: '열기',
  close: '닫기',
} as const;
```

**적용 대상**: 모든 create/update/delete-dialog 파일들

### Phase 2: Form 라벨 중앙화
```typescript
// Form 필드 라벨
export const FORM_LABELS = {
  name: '이름',
  title: '제목',
  width: '가로',
  height: '세로',
  radius: '반지름',
  x: 'X',
  y: 'Y',
  min: '최소',
  max: '최대',
} as const;

// Placeholder 생성 헬퍼
export function getSearchPlaceholder(domain: string): string {
  return `${domain} 검색...`;
}

export function getNamePlaceholder(domain: string): string {
  return `${domain} 이름`;
}
```

### Phase 3: 도메인 라벨
```typescript
// 도메인 이름
export const DOMAIN_LABELS = {
  building: '건물',
  character: '캐릭터',
  item: '아이템',
  quest: '퀘스트',
  chapter: '챕터',
  scenario: '시나리오',
  terrain: '지형',
  tile: '타일',
  need: '욕구',
  condition: '컨디션',
} as const;
```

### Phase 4: state-label.ts 확장
기존 state-label.ts에 추가:
```typescript
// 스프라이트 애니메이션 상태
const spriteAnimationStateLabels: Record<SpriteAnimationState, string> = {
  loop: '반복',
  'ping-pong': '핑퐁',
  'ping-pong-once': '핑퐁 1회',
};

// 퀘스트 타입
const questTypeLabels: Record<QuestType, string> = {
  primary: '메인 퀘스트',
  secondary: '보조 퀘스트',
};

// 공개 상태
const publishStatusLabels: Record<PublishStatus, string> = {
  published: '공개됨',
  draft: '작업중',
};
```

### Phase 5: Fallback 텍스트 & 복합 라벨 헬퍼
```typescript
// 기본값/Fallback 텍스트
export const FALLBACK_LABELS = {
  untitled: '제목없음',
  unnamed: '이름없음',
  noChapter: '챕터 없음',
  noDurability: '최대 내구도 없음',
  all: '모두',
  allCharacters: '모든 캐릭터',
  select: '선택',
} as const;

// Fallback 헬퍼 함수
export function getUntitledLabel(id: string): string {
  return `제목없음 (${id.split('-')[0]})`;
}

export function getUnnamedLabel(id: string): string {
  return `이름없음 (${id.split('-')[0]})`;
}

export function getDisplayName(name: string | undefined | null, id: string): string {
  return name || getUnnamedLabel(id);
}

export function getDisplayTitle(title: string | undefined | null, id: string): string {
  return title || getUntitledLabel(id);
}

// 복합 라벨 생성 헬퍼
export function getInteractionLabel(params: {
  characterName?: string;
  behaviorInteractionType: BehaviorInteractionType;
}): string {
  const { characterName, behaviorInteractionType } = params;
  const name = characterName || FALLBACK_LABELS.allCharacters;
  return `${name} ${getBehaviorInteractTypeLabel(behaviorInteractionType)}`;
}
```

**적용 예시:**
```typescript
// Before
{@const characterName = character ? character.name : '모든 캐릭터'}
{@const label = `${characterName} ${getBehaviorInteractTypeLabel(interactionType)}`}

// After
{@const label = getInteractionLabel({
  characterName: character?.name,
  behaviorInteractionType
})}
```

## Phase 0: 공통 타입 정의

### core.ts에 공통 타입 추가
**파일**: `src/lib/types/core.ts`

```typescript
// 셀렉트 옵션 타입
export type Option<T = string> = {
  value: T;
  label: string;
};

// Behavior 인터랙션 타입 통합
export type BehaviorInteractionType =
  | OnceInteractionType
  | FulfillInteractionType
  | SystemInteractionType;
```

**BehaviorInteractionType 사용처:**
- state-label.ts의 `getBehaviorInteractTypeLabel()` 파라미터 타입
- 복합 라벨 헬퍼 함수들
- interaction-command 컴포넌트들의 타입 추론

**변경 예시:**
```typescript
// Before
export function getBehaviorInteractTypeLabel(
  type: OnceInteractionType | FulfillInteractionType | SystemInteractionType
): string {
  // ...
}

// After
export function getBehaviorInteractTypeLabel(type: BehaviorInteractionType): string {
  // ...
}
```

**현재 사용처** (리팩토링 대상):
- state-label.ts의 모든 getXXXOptions 함수 반환 타입
- 각종 dialog/panel의 옵션 배열
- Command 컴포넌트의 items prop

**변경 예시**:
```typescript
// Before
export function getOnceInteractionTypeOptions(): { value: OnceInteractionType; label: string }[] {
  // ...
}

// After
export function getOnceInteractionTypeOptions(): Option<OnceInteractionType>[] {
  // ...
}
```

## 구현 순서

### Phase 0: 타입 정의 ✅
1. [x] `src/lib/types/core.ts`에 Label<T> 타입 정의
2. [x] `src/lib/types/core.ts`에 BehaviorInteractionType 유니온 타입 정의
3. [x] state-label.ts의 모든 함수 반환 타입을 Label<T>로 변경
4. [x] state-label.ts의 getBehaviorInteractTypeLabel 파라미터를 BehaviorInteractionType으로 변경
5. [x] state-label.ts를 label/label.ts로 이동

### Phase 1-5: 라벨 상수 생성 ✅
1. [x] `src/lib/utils/label/action.ts`: ACTION_LABELS, TOGGLE_LABELS
2. [x] `src/lib/utils/label/form.ts`: FORM_LABELS, placeholder 헬퍼
3. [x] `src/lib/utils/label/domain.ts`: DOMAIN_LABELS
4. [x] `src/lib/utils/label/fallback.ts`: FALLBACK_LABELS, 복합 라벨 헬퍼
5. [x] `src/lib/utils/label/index.ts`: 모든 export 통합

### Phase 6: 함수 네이밍 및 구조 리팩토링
**목적**: Label 타입과 혼동 방지를 위한 명확한 네이밍 + 중복 제거

**A. Labels 객체 통합:**
```typescript
// 현재 (3개 분리)
const onceInteractionTypeLabels: Record<OnceInteractionType, string> = { ... };
const fulfillInteractionTypeLabels: Record<FulfillInteractionType, string> = { ... };
const systemInteractionTypeLabels: Record<SystemInteractionType, string> = { ... };

// 변경 (1개 통합)
const behaviorInteractionTypeLabels: Record<BehaviorInteractionType, string> = {
  // once
  item_use: '아이템 사용',
  building_use: '건물 사용',
  building_construct: '건물 건설',
  building_demolish: '건물 철거',
  // fulfill
  building_repair: '건물 수리',
  building_clean: '건물 청소',
  character_hug: '캐릭터 포옹',
  // system
  item_pick: '아이템 줍기',
};
```

**B. 네이밍 규칙:**
- `Label<T>[]` 반환 → `getXxxLabels`
- `string` 반환 → `getXxxString`
- 객체 반환 → `getXxxInfo`

**변경 목록 (label/label.ts):**

String 반환 함수:
- [ ] `getColliderTypeLabel` → `getColliderTypeString`
- [ ] `getCharacterBodyStateLabel` → `getCharacterBodyStateString`
- [ ] `getCharacterFaceStateLabel` → `getCharacterFaceStateString`
- [ ] `getBuildingStateLabel` → `getBuildingStateString`
- [ ] `getOnceInteractionTypeLabel` → `getOnceInteractionTypeString`
- [ ] `getFulfillInteractionTypeLabel` → `getFulfillInteractionTypeString`
- [ ] `getSystemInteractionTypeLabel` → `getSystemInteractionTypeString`
- [ ] `getBehaviorInteractTypeLabel` → `getBehaviorInteractTypeString`
- [ ] `getItemStateLabel` → `getItemStateString`
- [ ] `getTileStateLabel` → `getTileStateString`
- [ ] `getBehaviorActionLabel` → `getBehaviorActionString`

객체 반환 함수:
- [ ] `getNeedBehaviorLabel` → `getNeedBehaviorInfo`
- [ ] `getConditionBehaviorLabel` → `getConditionBehaviorInfo`

Label<T>[] 반환 함수 (Options → Labels):
- [ ] `getOnceInteractionTypeOptions` → `getOnceInteractionTypeLabels`
- [ ] `getFulfillInteractionTypeOptions` → `getFulfillInteractionTypeLabels`
- [ ] `getSystemInteractionTypeOptions` → `getSystemInteractionTypeLabels`
- [ ] `getBuildingOnceInteractionTypeOptions` → `getBuildingOnceInteractionTypeLabels`
- [ ] `getBuildingFulfillInteractionTypeOptions` → `getBuildingFulfillInteractionTypeLabels`
- [ ] `getBuildingSystemInteractionTypeOptions` → `getBuildingSystemInteractionTypeLabels`
- [ ] `getItemOnceInteractionTypeOptions` → `getItemOnceInteractionTypeLabels`
- [ ] `getItemFulfillInteractionTypeOptions` → `getItemFulfillInteractionTypeLabels`
- [ ] `getItemSystemInteractionTypeOptions` → `getItemSystemInteractionTypeLabels`
- [ ] `getCharacterOnceInteractionTypeOptions` → `getCharacterOnceInteractionTypeLabels`
- [ ] `getCharacterFulfillInteractionTypeOptions` → `getCharacterFulfillInteractionTypeLabels`
- [ ] `getCharacterSystemInteractionTypeOptions` → `getCharacterSystemInteractionTypeLabels`
- [ ] `getBehaviorInteractTypeOptions` → `getBehaviorInteractTypeLabels`

**적용 순서:**
1. [x] label/label.ts에서 3개의 labels 객체를 behaviorInteractionTypeLabels 하나로 통합
2. [x] label/label.ts 함수명 변경 (위 목록대로)
3. [x] fallback.ts의 getInteractionLabel에서 getBehaviorInteractTypeString 사용
4. [x] 모든 사용처 import/호출 업데이트 (Grep으로 검색 후 일괄 변경)

✅ **Phase 6 완료!** 타입 체크 통과

### Phase 6.5: Label 구조 재정리
**목적**: 파일 구조 단순화 + 네이밍 컨벤션 통일 + 캡슐화

**A. 파일 통합**
현재 구조:
```
src/lib/utils/label/
├── action.ts
├── form.ts
├── domain.ts
├── fallback.ts
├── label.ts
└── index.ts
```

변경 구조:
```
src/lib/utils/label/
└── index.ts  (모든 내용 통합)
```

**B. 내부 상수 네이밍 컨벤션 (UPPERCASE)**
```typescript
// 현재
const colliderTypeLabels: Record<ColliderType, string> = { ... };
const characterBodyStateLabels: Record<CharacterBodyStateType, string> = { ... };
const behaviorInteractionTypeLabels: Record<BehaviorInteractionType, string> = { ... };

// 변경
const COLLIDER_TYPE_LABELS: Record<ColliderType, string> = { ... };
const CHARACTER_BODY_STATE_LABELS: Record<CharacterBodyStateType, string> = { ... };
const BEHAVIOR_INTERACTION_TYPE_LABELS: Record<BehaviorInteractionType, string> = { ... };
const ACTION_LABELS = { ... };
const TOGGLE_LABELS = { ... };
const FORM_LABELS = { ... };
const DOMAIN_LABELS = { ... };
const FALLBACK_LABELS = { ... };
```

**C. 캡슐화: 상수 직접 export 금지, getter만 제공**

현재 (직접 export):
```typescript
export const ACTION_LABELS = { ... };
// 사용: ACTION_LABELS.create
```

변경 옵션 1 (개별 getter):
```typescript
const ACTION_LABELS = { ... }; // private

export function getActionLabel(key: keyof typeof ACTION_LABELS): string {
  return ACTION_LABELS[key];
}
// 사용: getActionLabel('create')
```

변경 옵션 2 (객체 getter):
```typescript
const ACTION_LABELS = { ... }; // private

export function getActionLabels() {
  return ACTION_LABELS;
}
// 사용: getActionLabels().create
```

**질문**: 옵션 1 vs 옵션 2? 또는 다른 방식?

**적용 순서 (단순화 버전):**
1. [x] state-label.ts의 모든 내부 상수를 UPPERCASE로 변경
   - colliderTypeLabels → COLLIDER_TYPE_LABELS
   - characterBodyStateLabels → CHARACTER_BODY_STATE_LABELS
   - buildingStateLabels → BUILDING_STATE_LABELS
   - onceInteractionTypeLabels → ONCE_INTERACTION_TYPE_LABELS
   - fulfillInteractionTypeLabels → FULFILL_INTERACTION_TYPE_LABELS
   - systemInteractionTypeLabels → SYSTEM_INTERACTION_TYPE_LABELS
   - itemStateLabels → ITEM_STATE_LABELS
   - tileStateLabels → TILE_STATE_LABELS

✅ **Phase 6.5 완료!** (파일 통합 및 getter 캡슐화는 보류)

### Phase 7: 인라인 라벨 교체 ✅ 완료
**작업 내용:**
1. [x] state-label.ts에 ACTION_LABELS 추가 (create, update, delete, save, cancel, confirm + 하기 variants)
2. [x] getter 함수명 수정: getActionLabel → getActionString, getFormLabel → getFormString 등
3. [x] 59개 admin 컴포넌트에서 액션 라벨 교체 (생성 중..., 수정 중..., 삭제 중..., 저장 중...)
4. [x] 59개 파일에 `import { getActionString } from '$lib/utils/state-label'` 자동 추가
5. [x] TypeScript 에러 수정 (multi-line import 내 잘못된 import 위치 문제)
6. [x] 타입 체크 통과 확인
7. [x] Form placeholder 라벨 교체 (이름, 제목, 가로, 세로 등) - 19개 파일
8. [x] Cancel 버튼 라벨 교체 (standalone '취소') - 14개 파일
9. [x] Fallback 라벨 교체:
   - [x] '모두', '모든 캐릭터' → getFallbackString('all'/'allCharacters')
   - [x] '챕터 없음' → getFallbackString('noChapter')
   - [x] '최대 내구도 없음' → getFallbackString('noDurability')
   - [x] 제목없음/이름없음 패턴 → getDisplayTitle/getDisplayName 헬퍼 함수
   - [x] state-label.ts에 헬퍼 함수 추가: getUntitledWithId, getUnnamedWithId, getDisplayTitle, getDisplayName
   - [x] 7개 파일 패턴 교체 (quest, chapter, narrative, test-world)
10. [x] 모든 import 추가 및 중복 import 수정
11. [x] 최종 타입 체크 통과 확인

**교체된 패턴 예시:**
```typescript
// 액션 라벨
{isSubmitting ? '생성 중...' : '생성하기'}
→ {isSubmitting ? getActionString('creating') : getActionString('createAction')}

// Form placeholder
<InputGroupInput placeholder="제목" bind:value={title} />
→ <InputGroupInput placeholder={getFormString('title')} bind:value={title} />

// Fallback
{character?.name ?? '모든 캐릭터'}
→ {character?.name ?? getFallbackString('allCharacters')}

// ID-based fallback
{terrain.title || `제목없음 (${terrain.id.split('-')[0]})`}
→ {getDisplayTitle(terrain.title, terrain.id)}
```

**완료된 파일 타입:**
- create/update/delete-dialog.svelte (CRUD 다이얼로그)
- *-node-panel.svelte, *-edge-panel.svelte (노드/엣지 패널)
- *-command.svelte (커맨드 컴포넌트)
- *-node.svelte (노드 컴포넌트)
- interaction-panel.svelte (인터랙션 패널)
- publish-dialog.svelte (공개 다이얼로그)

**통계:**
- 약 100+ 파일 수정
- 300+ 인라인 라벨 교체
- 타입 안전성 유지

## 예상 효과

1. **일관성**: 모든 라벨이 중앙에서 관리되어 표현 통일
2. **유지보수**: 라벨 변경 시 한 곳만 수정
3. **재사용성**: 공통 라벨을 여러 곳에서 재사용
4. **타입 안정성**: 상수로 정의하여 오타 방지

---

# Plan - Derived 패턴 개선 및 라벨 로직 중앙화

## 목표

1. `$derived(() => {...})` → `$derived.by(() => {...})` 변환
2. 컴포넌트 내 라벨 생성 로직을 utils/label.ts로 이동
3. 중복된 라벨 정의 제거

## Phase 0: 체계적인 라벨 발견 및 이동 계획

### 전략
1. **발견**: components/admin/** 모든 파일 순회하여 라벨 패턴 수집 ✅
2. **분류**: 중복/신규 라벨 구분 (진행중)
3. **이동**: utils/label.ts에 함수 추가
4. **교체**: 컴포넌트에서 label.ts 함수 사용
5. **검증**: 타입 체크 및 동작 확인

### 발견 결과 (Phase 1 완료)

**패턴 1: Character State Labels (중복)**
- 위치: 12개 파일
  - building-interaction-action-node.svelte (body, face)
  - building-interaction-panel.svelte (body, face)
  - item-interaction-action-node.svelte (body, face)
  - item-interaction-panel.svelte (body, face)
  - character-interaction-action-node.svelte (body, face)
  - character-interaction-panel.svelte (body, face)
- 문제: `getCharacterBodyStateString`, `getCharacterFaceStateString` 이미 존재하는데 중복 정의
- 해결: 기존 함수 사용

**패턴 2: BehaviorActionType Labels (신규)**
- 위치: 2개 파일
  - need-behavior-action-node-panel.svelte
  - condition-behavior-action-node-panel.svelte
- 라벨:
  - 'once' → '한번 실행'
  - 'fulfill' → '반복 실행'
  - 'idle' → '대기'
- 해결: `getBehaviorActionTypeString(type)` 추가

**패턴 3: Target Selection Method Labels (신규)**
- 위치: 2개 파일
  - need-behavior-action-node-panel.svelte (selectedTargetMethodLabel)
  - condition-behavior-action-node-panel.svelte (selectedTargetMethodLabel)
- 로직:
  - 'search' → '새로운 탐색 대상'
  - 'explicit' + building → '건물명 - 인터랙션타입'
  - 'explicit' + item → '아이템명 - 인터랙션타입'
  - 'explicit' + character → '캐릭터명 - 인터랙션타입'
  - 'explicit' (no specific) → '지정된 대상'
  - undefined → '타깃 결정 방법'
- 해결: `getTargetSelectionMethodLabel(action)` 추가

**패턴 4: Fulfillment Type Labels (신규)**
- 위치: 2개 파일
  - need-fulfillment-node-panel.svelte
  - condition-fulfillment-node-panel.svelte
- 라벨:
  - 'building' → '건물'
  - 'character' → '캐릭터'
  - 'item' → '아이템'
  - 'task' → '할 일'
- 문제: DOMAIN_LABELS와 중복 ('building', 'character', 'item')
- 해결: `getDomainString()` 사용 + 'task' 라벨 추가

**패턴 5: Task Condition Labels (신규)**
- 위치: 2개 파일
  - need-fulfillment-node-panel.svelte
  - condition-fulfillment-node-panel.svelte
- 라벨:
  - 'completed' → '완료'
  - 'created' → '생성'
- 해결: `getNeedFulfillmentTaskConditionString(condition)` 추가

**패턴 6: Interaction Info (객체 반환 → 분리 필요)**
- 위치: 2개 파일
  - need-behavior-action-node.svelte
  - condition-behavior-action-node.svelte
- 현재: `interactionInfo = $derived(() => { target, behaviorLabel })`
- 해결:
  - `getInteractionTargetName(action): string | undefined`
  - `getInteractionBehaviorLabel(action): string | undefined`

**패턴 7: Action Summary (복합 라벨)**
- 위치: 3개 파일
  - building-interaction-action-node.svelte
  - item-interaction-action-node.svelte
  - character-interaction-action-node.svelte
- 현재: `summary = $derived(() => "${duration}${face}${body}")`
- 내부에서 bodyStateLabel, faceStateLabel 중복 정의
- 해결: `getInteractionActionSummary(action): string`

### 파일별 작업 목록

**그룹 1: interaction-action-node (중복 state labels + summary) - 3개**
- [ ] `building-interaction-action-node.svelte`
  - bodyStateLabel → `getCharacterBodyStateString()`
  - faceStateLabel → `getCharacterFaceStateString()`
  - summary → `getInteractionActionSummary()`

- [ ] `item-interaction-action-node.svelte`
  - bodyStateLabel → `getCharacterBodyStateString()`
  - faceStateLabel → `getCharacterFaceStateString()`
  - summary → `getInteractionActionSummary()`

- [ ] `character-interaction-action-node.svelte`
  - bodyStateLabel → `getCharacterBodyStateString()`
  - faceStateLabel → `getCharacterFaceStateString()`
  - summary → `getInteractionActionSummary()`

**그룹 2: behavior-action-node (interactionInfo 분리) - 2개**
- [ ] `need-behavior-action-node.svelte`
  - interactionInfo → getInteractionTargetName() + getInteractionBehaviorLabel()

- [ ] `condition-behavior-action-node.svelte`
  - interactionInfo → getInteractionTargetName() + getInteractionBehaviorLabel()

**그룹 3: behavior-action-node-panel (actionType + targetMethod) - 2개**
- [ ] `need-behavior-action-node-panel.svelte`
  - actionTypes → `getBehaviorActionTypeString()`
  - selectedTypeLabel → 단순화
  - selectedTargetMethodLabel → `getTargetSelectionMethodLabel()`

- [ ] `condition-behavior-action-node-panel.svelte`
  - actionTypes → `getBehaviorActionTypeString()`
  - selectedTypeLabel → 단순화
  - selectedTargetMethodLabel → `getTargetSelectionMethodLabel()`

**그룹 4: fulfillment-node-panel (fulfillmentType + taskCondition) - 2개**
- [ ] `need-fulfillment-node-panel.svelte`
  - fulfillmentTypeOptions → `getDomainString()` + task 추가
  - taskConditionOptions → `getNeedFulfillmentTaskConditionString()`

- [ ] `condition-fulfillment-node-panel.svelte`
  - fulfillmentTypeOptions → `getDomainString()` + task 추가
  - taskConditionOptions → `getConditionFulfillmentTaskConditionString()`

**그룹 5: interaction-panel (중복 state labels) - 3개**
- [ ] `building-interaction-panel.svelte`
- [ ] `item-interaction-panel.svelte`
- [ ] `character-interaction-panel.svelte`

### 우선순위별 작업 순서

**Phase 2A: label.ts에 함수 추가**
1. [ ] `getBehaviorActionTypeString(type: BehaviorActionType): string`
2. [ ] `getTargetSelectionMethodLabel(action: BehaviorAction): string`
3. [ ] `getInteractionTargetName(action: BehaviorAction): string | undefined`
4. [ ] `getInteractionBehaviorLabel(action: BehaviorAction): string | undefined`
5. [ ] `getInteractionActionSummary(action: InteractionAction): string`
6. [ ] `getNeedFulfillmentTaskConditionString(condition: string): string`
7. [ ] DOMAIN_LABELS에 'task' 추가

**Phase 2B: 컴포넌트 교체 (총 12개 파일)**
1. [ ] 그룹 1: interaction-action-node (3개)
2. [ ] 그룹 2: behavior-action-node (2개)
3. [ ] 그룹 3: behavior-action-node-panel (2개)
4. [ ] 그룹 4: fulfillment-node-panel (2개)
5. [ ] 그룹 5: interaction-panel (3개)

### Step 1: 라벨 패턴 검색

**검색 대상 파일 패턴:**
- `*-action-node.svelte`: action 노드 컴포넌트
- `*-action-node-panel.svelte`: action 패널 컴포넌트
- `*-node.svelte`: 일반 노드 컴포넌트
- `*-node-panel.svelte`: 일반 패널 컴포넌트
- `*-edge.svelte`: 엣지 컴포넌트
- `*-dialog.svelte`: 다이얼로그 컴포넌트
- `*-command*.svelte`: 커맨드 컴포넌트

**검색할 패턴:**
```bash
# 1. 하드코딩된 라벨 객체
grep -r "const.*labels.*Record<" src/lib/components/admin/

# 2. derived 라벨
grep -r "\$derived.*[Ll]abel" src/lib/components/admin/

# 3. 인라인 라벨 매핑
grep -r "value.*label.*:" src/lib/components/admin/

# 4. 조건부 라벨 생성
grep -r "? '.*' :" src/lib/components/admin/ | grep -E "(라벨|Label)"
```

### Step 2: 발견된 라벨 분류 (예시)

**A. 이미 label.ts에 존재 (중복 제거 필요):**
- [ ] Character body state (idle, walk, run, jump, pick)
  - 현재: `building/item/character-interaction-action-node.svelte`
  - 교체: `getCharacterBodyStateString()`

- [ ] Character face state (idle, happy, sad, angry)
  - 현재: `building/item/character-interaction-action-node.svelte`
  - 교체: `getCharacterFaceStateString()`

**B. label.ts에 추가 필요:**

1. [ ] **BehaviorActionType labels**
   ```typescript
   const BEHAVIOR_ACTION_TYPE_LABELS: Record<BehaviorActionType, string> = {
     once: '한번 실행',
     fulfill: '반복 실행',
     idle: '대기',
   };
   export function getBehaviorActionTypeString(type: BehaviorActionType): string;
   ```
   - 위치: `need/condition-behavior-action-node-panel.svelte`

2. [ ] **TargetSelectionMethod labels**
   ```typescript
   const TARGET_SELECTION_METHOD_LABELS: Record<TargetSelectionMethod, string> = {
     search: '새로운 탐색 대상',
     explicit: '지정된 대상',
   };
   export function getTargetSelectionMethodString(
     method: TargetSelectionMethod,
     action?: BehaviorAction
   ): string;
   ```
   - 위치: `need/condition-behavior-action-node-panel.svelte`

3. [ ] **Interaction target name**
   ```typescript
   export function getInteractionTargetName(
     action: NeedBehaviorAction | ConditionBehaviorAction
   ): string | undefined;
   ```

4. [ ] **Interaction with type label** (엔티티명 + 인터랙션 타입)
   ```typescript
   export function getInteractionWithTypeLabel(
     action: NeedBehaviorAction | ConditionBehaviorAction
   ): string;
   // 예: "건물 - 건물 사용", "아이템 - 아이템 줍기"
   ```

5. [ ] **Action summary** (복합 라벨)
   ```typescript
   export function getInteractionActionSummary(
     action: BuildingInteractionAction | ItemInteractionAction | CharacterInteractionAction
   ): string;
   // 예: "5틱 동안 \"행복\" 표정으로 \"걷기\""
   ```

### Step 3: 파일별 작업 계획

**우선순위 1: action-node 컴포넌트 (6개)**
- [ ] `building-interaction-action-node.svelte`
- [ ] `item-interaction-action-node.svelte`
- [ ] `character-interaction-action-node.svelte`
- [ ] `need-behavior-action-node.svelte`
- [ ] `condition-behavior-action-node.svelte`

**우선순위 2: action-panel 컴포넌트 (6개)**
- [ ] `building-interaction-action-node-panel.svelte`
- [ ] `item-interaction-action-node-panel.svelte`
- [ ] `character-interaction-action-node-panel.svelte`
- [ ] `need-behavior-action-node-panel.svelte`
- [ ] `condition-behavior-action-node-panel.svelte`

**우선순위 3: 기타 노드/패널 (10개)**
- [ ] `need-fulfillment-node.svelte` / `need-fulfillment-node-panel.svelte`
- [ ] `condition-fulfillment-node.svelte` / `condition-fulfillment-node-panel.svelte`
- [ ] `condition-effect-node.svelte` / `condition-effect-node-panel.svelte`
- [ ] 기타...

**우선순위 4: dialog, command, edge 컴포넌트 (나머지)**

### Step 4: 작업 흐름

각 파일마다:
1. 라벨 패턴 식별
2. 해당 함수가 label.ts에 있는지 확인
3. 없으면 label.ts에 추가
4. 컴포넌트에서 함수 호출로 교체
5. `$derived(() => ...)` → `$derived(...)` 또는 `$derived.by(...)` 변환
6. import 추가

### Step 5: 검증
- [ ] `pnpm check` 통과
- [ ] 각 컴포넌트 UI 동작 확인 (개발 서버)

## 구현 단계

### Phase 1: 발견 및 목록화
1. [ ] 모든 admin 컴포넌트에서 라벨 패턴 검색
2. [ ] 발견된 패턴을 카테고리별로 분류
3. [ ] label.ts에 추가할 함수 목록 작성
4. [ ] 교체 대상 파일 및 라인 목록 작성

### Phase 2: label.ts 함수 추가
1. [ ] `BEHAVIOR_ACTION_TYPE_LABELS` 상수 추가
2. [ ] `getBehaviorActionTypeString()` 함수 추가
3. [ ] `getTargetSelectionMethodString()` 함수 추가
4. [ ] `getInteractionTargetName()` 함수 추가
5. [ ] `getInteractionWithTypeLabel()` 함수 추가
6. [ ] `getInteractionActionSummary()` 함수 추가
7. [ ] 타입 체크 확인

### Phase 3: 컴포넌트 교체 (우선순위별)
1. [ ] action-node 컴포넌트 (6개)
2. [ ] action-panel 컴포넌트 (6개)
3. [ ] 기타 node/panel 컴포넌트 (10개)
4. [ ] dialog, command, edge 컴포넌트 (나머지)

### Phase 4: $derived 패턴 개선
1. [ ] `$derived(() => {...})` → `$derived.by(() => {...})` 변환
2. [ ] `$derived(() => expression)` → `$derived(expression)` 변환
3. [ ] 객체 반환 derived 제거

## 예상 효과
1. **중앙화**: 모든 라벨 로직이 utils/label.ts에 집중
2. **일관성**: 동일한 라벨이 모든 곳에서 동일하게 표시
3. **유지보수**: 라벨 변경 시 한 곳만 수정
4. **가독성**: 컴포넌트 코드가 간결해짐
5. **재사용성**: 라벨 함수를 다른 곳에서도 사용 가능

## Phase 2C: $derived 패턴 개선

### 패턴 1: $derived.by 변환
`$derived(() => { ... })` → `$derived.by(() => { ... })`

**적용 파일:**
- need-behavior-action-node-panel.svelte (selectedTargetMethodLabel)
- condition-behavior-action-node-panel.svelte (selectedTargetMethodLabel)

### 패턴 2: 객체 반환 제거
`interactionInfo = $derived(() => { return { target, label } })` → 개별 derived

**적용 파일:**
- need-behavior-action-node.svelte
- condition-behavior-action-node.svelte

### 패턴 3: 함수 반환 제거
`label = $derived(() => expression)` → `label = $derived(expression)`

**적용 파일:**
- 모든 interaction-action-node, interaction-panel 파일

## 작업 통계

- **총 파일 수**: 12개
- **추가할 함수**: 7개
- **제거할 중복 라벨**: 18개 (body state 6 + face state 6 + 기타 6)
- **예상 작업 시간**: 2-3시간

## 다음 단계

### 변환 대상 패턴
객체를 반환하는 derived 로직을 utils/label.ts의 헬퍼 함수로 추출

**Before:**
```svelte
const interactionInfo = $derived(() => {
  if (action.building_interaction_id) {
    const interaction = $buildingInteractionStore.data[action.building_interaction_id];
    if (!interaction) return undefined;
    const building = $buildingStore.data[interaction.building_id];
    const interactionType = (interaction.once_interaction_type ||
      interaction.fulfill_interaction_type)!;
    return {
      target: `"${building?.name ?? '건물'}" 건물`,
      behaviorLabel: getBehaviorInteractTypeString(interactionType),
    };
  }
  // ... 유사한 item, character 로직
  return undefined;
});

// 사용
{interactionInfo()?.target}
{interactionInfo()?.behaviorLabel}
```

**After (utils/label.ts에 함수 추가):**
```typescript
export function getInteractionTarget(
  action: NeedBehaviorAction | ConditionBehaviorAction
): string | undefined {
  const { getBuilding } = useBuilding();
  const { getItem } = useItem();
  const { getCharacter } = useCharacter();
  const { getBuildingInteraction, getItemInteraction, getCharacterInteraction } = useInteraction();

  if (action.building_interaction_id) {
    const interaction = getBuildingInteraction(action.building_interaction_id);
    if (!interaction) return undefined;
    const building = getBuilding(interaction.building_id);
    return `"${building.name ?? '건물'}" 건물`;
  }
  if (action.item_interaction_id) {
    const interaction = getItemInteraction(action.item_interaction_id);
    if (!interaction) return undefined;
    const item = getItem(interaction.item_id);
    return `"${item.name ?? '아이템'}" 아이템`;
  }
  if (action.character_interaction_id) {
    const interaction = getCharacterInteraction(action.character_interaction_id);
    if (!interaction) return undefined;
    const character = getCharacter(interaction.target_character_id);
    return `"${character.name ?? '캐릭터'}" 캐릭터`;
  }
  return undefined;
}

export function getInteractionBehaviorLabel(
  action: NeedBehaviorAction | ConditionBehaviorAction
): string | undefined {
  const { getBuildingInteraction, getItemInteraction, getCharacterInteraction } = useInteraction();

  if (action.building_interaction_id) {
    const interaction = getBuildingInteraction(action.building_interaction_id);
    if (!interaction) return undefined;
    const interactionType = (interaction.once_interaction_type ||
      interaction.fulfill_interaction_type)!;
    return getBehaviorInteractTypeString(interactionType);
  }
  if (action.item_interaction_id) {
    const interaction = getItemInteraction(action.item_interaction_id);
    if (!interaction) return undefined;
    const interactionType = (interaction.once_interaction_type ||
      interaction.fulfill_interaction_type)!;
    return getBehaviorInteractTypeString(interactionType);
  }
  if (action.character_interaction_id) {
    const interaction = getCharacterInteraction(action.character_interaction_id);
    if (!interaction) return undefined;
    const interactionType = (interaction.once_interaction_type ||
      interaction.fulfill_interaction_type)!;
    return getBehaviorInteractTypeString(interactionType);
  }
  return undefined;
}
```

**After (컴포넌트):**
```svelte
const interactionTarget = $derived(getInteractionTarget(action));
const interactionBehaviorLabel = $derived(getInteractionBehaviorLabel(action));

// 사용
{interactionTarget}
{interactionBehaviorLabel}
```

### 장점
- 로직이 utils/label.ts에 중앙화되어 재사용 가능
- 컴포넌트 코드가 간결해짐
- 사용처에서 함수 호출 불필요 (`interactionInfo()?.target` → `interactionTarget`)
- getBehaviorActionString, getNeedBehaviorString과 동일한 패턴 유지

### 작업 순서
1. [ ] utils/label.ts에 `getInteractionTarget`, `getInteractionBehaviorLabel` 함수 추가
2. [ ] 객체를 반환하는 `$derived` 패턴 검색
3. [ ] 컴포넌트에서 utils/label.ts 함수 사용하도록 변경
4. [ ] 사용처 업데이트 (함수 호출 제거: `interactionInfo()?.target` → `interactionTarget`)
5. [ ] 타입 체크 확인

## 검색 대상 파일 범위
- `src/lib/components/admin/**/*.svelte`
- 특히 *-panel, *-node, *-dialog 패턴 파일들

## 예상 효과
1. **명확성**: `$derived` vs `$derived.by` 구분으로 의도 명확화
2. **성능**: 개별 derived로 분리하여 불필요한 재계산 방지
3. **가독성**: 함수 호출 없이 직접 값 사용
4. **유지보수**: 각 derived 값의 책임이 명확해짐
