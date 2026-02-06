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

### Phase 7: 인라인 라벨 교체
- [ ] 모든 컴포넌트 파일에서 인라인 라벨 → 상수 참조로 교체
- [ ] 검증: 개발 서버 실행 및 UI 확인

## 예상 효과

1. **일관성**: 모든 라벨이 중앙에서 관리되어 표현 통일
2. **유지보수**: 라벨 변경 시 한 곳만 수정
3. **재사용성**: 공통 라벨을 여러 곳에서 재사용
4. **타입 안정성**: 상수로 정의하여 오타 방지
