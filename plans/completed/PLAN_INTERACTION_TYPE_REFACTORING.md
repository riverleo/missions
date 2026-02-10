# Interaction Type 구조 리팩토링

## 목표
Interaction 테이블에 명시적인 `type` 컬럼을 추가하여 once/fulfill/system 타입을 명확하게 관리

## 현재 문제점

### 현재 구조
```sql
-- building_interactions, item_interactions, character_interactions
once_interaction_type: once_interaction_type | null
fulfill_interaction_type: fulfill_interaction_type | null
system_interaction_type: system_interaction_type | null
```

### 문제
1. **타입 유추 필요**: 3개 컬럼 중 어떤 게 set되어 있는지 체크해야 함
2. **불명확한 의도**: 여러 컬럼이 동시에 set될 가능성 (데이터 무결성 문제)
3. **복잡한 로직**: `isOnceInteractionType`, `isFulfillInteractionType`, `isSystemInteractionType` 같은 헬퍼 함수 필요
4. **유지보수 어려움**: 타입 체크 로직이 여러 곳에 산재

### 현재 타입 유추 로직 예시
```typescript
// search-entity-sources.ts
function getInteractions(behaviorAction, actionType: 'once' | 'fulfill') {
  // once_interaction_type이 있으면 once
  // fulfill_interaction_type이 있으면 fulfill
  // system_interaction_type이 있으면 system
}

// label.ts
export function isOnceInteractionType(type: BehaviorInteractionType): type is OnceInteractionType {
  return type in ONCE_INTERACTION_TYPE_LABELS;
}
```

## 개선 방안

### 새로운 구조
```sql
-- building_interactions, item_interactions, character_interactions
type: text NOT NULL CHECK (type IN ('once', 'fulfill', 'system'))
once_interaction_type: once_interaction_type | null
fulfill_interaction_type: fulfill_interaction_type | null
system_interaction_type: system_interaction_type | null

-- CHECK constraint 추가
CONSTRAINT valid_interaction_type_combination CHECK (
  (type = 'once' AND once_interaction_type IS NOT NULL AND fulfill_interaction_type IS NULL AND system_interaction_type IS NULL) OR
  (type = 'fulfill' AND fulfill_interaction_type IS NOT NULL AND once_interaction_type IS NULL AND system_interaction_type IS NULL) OR
  (type = 'system' AND system_interaction_type IS NOT NULL AND once_interaction_type IS NULL AND fulfill_interaction_type IS NULL)
)
```

### TypeScript 타입
```typescript
type InteractionType = 'once' | 'fulfill' | 'system';

type BuildingInteraction = {
  type: InteractionType;
  once_interaction_type: OnceInteractionType | null;
  fulfill_interaction_type: FulfillInteractionType | null;
  system_interaction_type: SystemInteractionType | null;
  // ...
};
```

## 작업 순서

### 1. 데이터베이스 마이그레이션

#### 1.1 기존 마이그레이션 파일 확인 및 수정 방안 결정
- [ ] 기존 마이그레이션 파일 리스트업
- [ ] CREATE TABLE 마이그레이션 수정 vs 새 ALTER 마이그레이션 생성 결정

#### 1.2 새 마이그레이션 작성
- [ ] `type` 컬럼 추가
  ```sql
  -- building_interactions에 type 추가
  ALTER TABLE building_interactions
  ADD COLUMN type text;

  -- 기존 데이터 마이그레이션
  UPDATE building_interactions
  SET type = CASE
    WHEN once_interaction_type IS NOT NULL THEN 'once'
    WHEN fulfill_interaction_type IS NOT NULL THEN 'fulfill'
    WHEN system_interaction_type IS NOT NULL THEN 'system'
  END;

  -- NOT NULL 제약 추가
  ALTER TABLE building_interactions
  ALTER COLUMN type SET NOT NULL;

  -- CHECK 제약 추가
  ALTER TABLE building_interactions
  ADD CONSTRAINT building_interactions_type_check
  CHECK (type IN ('once', 'fulfill', 'system'));

  -- 타입 조합 검증 제약 추가
  ALTER TABLE building_interactions
  ADD CONSTRAINT building_interactions_valid_type_combination CHECK (
    (type = 'once' AND once_interaction_type IS NOT NULL AND fulfill_interaction_type IS NULL AND system_interaction_type IS NULL) OR
    (type = 'fulfill' AND fulfill_interaction_type IS NOT NULL AND once_interaction_type IS NULL AND system_interaction_type IS NULL) OR
    (type = 'system' AND system_interaction_type IS NOT NULL AND once_interaction_type IS NULL AND fulfill_interaction_type IS NULL)
  );
  ```
- [ ] item_interactions에 동일 작업
- [ ] character_interactions에 동일 작업

#### 1.3 타입 생성 (supabase gen types)
- [ ] `pnpm supabase gen types --lang=typescript --local > src/lib/types/supabase.generated.ts`
- [ ] 생성된 타입 확인

### 2. TypeScript 타입 업데이트

#### 2.1 core.ts 타입 정의 업데이트
- [ ] `InteractionType` 타입 추가
  ```typescript
  export type InteractionType = 'once' | 'fulfill' | 'system';
  ```
- [ ] `BuildingInteraction`, `ItemInteraction`, `CharacterInteraction` 타입에 `type` 필드 추가
- [ ] `Interaction` union 타입 업데이트

#### 2.2 타입 가드 함수 업데이트
- [ ] `isOnceInteraction(interaction: Interaction): boolean` 추가
  ```typescript
  export function isOnceInteraction(interaction: Interaction): boolean {
    return interaction.type === 'once';
  }
  ```
- [ ] `isFulfillInteraction(interaction: Interaction): boolean` 추가
- [ ] `isSystemInteraction(interaction: Interaction): boolean` 추가

### 3. Admin UI 개선

#### 3.1 Create Dialog 업데이트
- [ ] `building-interaction-create-dialog.svelte`
  - type 선택 라디오/셀렉트 추가
  - type에 따라 interaction_type 옵션 필터링
- [ ] `item-interaction-create-dialog.svelte`
- [ ] `character-interaction-create-dialog.svelte`

#### 3.2 Update Dialog 업데이트
- [ ] `building-interaction-update-dialog.svelte`
  - type 변경 시 기존 interaction_type 초기화 로직
- [ ] `item-interaction-update-dialog.svelte`
- [ ] `character-interaction-update-dialog.svelte`

#### 3.3 Panel 컴포넌트 업데이트
- [ ] `building-interaction-panel.svelte`
  - type 표시 추가
- [ ] `item-interaction-panel.svelte`
- [ ] `character-interaction-panel.svelte`

### 4. 로직 리팩토링

#### 4.1 search-interactions.ts 분리 및 개선
- [ ] `search-interactions.ts` 파일 생성
- [ ] `getInteractions()` → `searchInteractions()` 리네이밍
- [ ] 함수 시그니처 개선
  ```typescript
  // Before (search-entity-sources.ts 내부)
  function getInteractions(behaviorAction, actionType: 'once' | 'fulfill') {
    // once_interaction_type/fulfill_interaction_type 체크
  }

  // After (search-interactions.ts)

  // BehaviorTarget 기반 인터렉션 검색 (once/fulfill 자동 판단)
  export function searchInteractions(
    behaviorTargetId: BehaviorTargetId,
    characterId: CharacterId,
    entityId?: EntityId
  ): Interaction[] {
    // BehaviorAction의 once/fulfill 정보 사용
    // characterId로 NeedBehavior/ConditionBehavior의 캐릭터 제약 필터링
    const interactions = getAllInteractions();
    return interactions.filter(/* 적절한 인터렉션 필터링 */);
  }
  ```

**BehaviorInteractionType**: `OnceInteractionType | FulfillInteractionType | SystemInteractionType`

**역할**: 단순히 인터렉션 검색만 담당. 시퀀스 구성은 호출자(tick-enqueue-interactions.ts)에서 처리
  ```
- [ ] `useBehavior` 훅에서 `searchInteractions` export
  ```typescript
  // use-behavior.ts
  import { searchInteractions } from './search-interactions';

  return {
    // ...
    searchInteractions,
    // ...
  };
  ```

**참고**: 일관된 네이밍 패턴
```typescript
// 엔티티 소스 검색
searchEntitySources(behaviorTargetId: BehaviorTargetId, characterId: CharacterId): EntitySource[]

// 인터렉션 검색
searchInteractions(behaviorTargetId: BehaviorTargetId, characterId: CharacterId, entityId?: EntityId): Interaction[]
```

**타입 구분**:
- `InteractionType`: `'once' | 'fulfill' | 'system'` (DB 컬럼 타입)
- `BehaviorInteractionType`: `OnceInteractionType | FulfillInteractionType | SystemInteractionType` (구체적인 인터렉션 타입: 'item_pick', 'item_use', 'express' 등)

#### 4.2 search-entity-sources.ts 업데이트
- [ ] `searchEntitySources` 시그니처 업데이트
  ```typescript
  // search-entity-sources.ts
  export function searchEntitySources(
    behaviorTargetId: BehaviorTargetId,
    characterId: CharacterId  // 추가!
  ): EntitySource[] {
    // BehaviorTarget 분석
    // characterId로 캐릭터 제약 필터링
    // 적절한 엔티티 소스 반환
  }
  ```

**중요**: characterId 파라미터 추가하여 NeedBehavior/ConditionBehavior의 캐릭터 제약 필터링

#### 4.3 use-interaction.ts (hook)
- [ ] `getInteractionsByType(type: InteractionType)` 추가
- [ ] 기존 로직에서 type 필드 사용

#### 4.4 label.ts 유틸리티
- [ ] `isOnceInteractionType()` → `isOnceInteraction()` 변경 (Interaction 객체 받도록)
- [ ] `isFulfillInteractionType()` → `isFulfillInteraction()` 변경
- [ ] `isSystemInteractionType()` → `isSystemInteraction()` 변경
- [ ] 또는 완전히 제거하고 `interaction.type === 'once'` 직접 사용

#### 4.5 기타 영향 받는 파일
- [ ] `getInteractionLabelString()` 함수 업데이트 (label.ts)
- [ ] Admin 컴포넌트들에서 type 체크 로직 업데이트
- [ ] behavior-state 로직 업데이트 (필요 시)

### 5. 테스트 및 검증

#### 5.1 데이터베이스 마이그레이션 테스트
- [ ] 로컬 DB에 마이그레이션 적용
- [ ] 기존 데이터가 올바르게 마이그레이션되었는지 확인
- [ ] CHECK 제약이 올바르게 작동하는지 테스트

#### 5.2 Admin UI 테스트
- [ ] 새 interaction 생성 테스트 (type 선택)
- [ ] 기존 interaction 수정 테스트 (type 변경)
- [ ] type에 따른 interaction_type 필터링 동작 확인

#### 5.3 로직 테스트
- [ ] search-entity-sources.ts 동작 확인
- [ ] behavior-state 로직 동작 확인
- [ ] pnpm check 통과 확인

### 6. 정리 및 문서화

#### 6.1 Deprecated 코드 제거
- [ ] `isOnceInteractionType()` 제거 (또는 deprecate)
- [ ] `isFulfillInteractionType()` 제거
- [ ] `isSystemInteractionType()` 제거
- [ ] 사용되지 않는 타입 체크 로직 제거

#### 6.2 문서화
- [ ] 마이그레이션 가이드 작성 (필요 시)
- [ ] 새로운 type 필드 사용법 문서화

## 고려사항

### 1. 마이그레이션 전략
- **옵션 A**: 기존 마이그레이션 파일 수정 (로컬 전용, 아직 프로덕션 배포 안 됨)
- **옵션 B**: 새 ALTER 마이그레이션 추가 (프로덕션 배포 후)
- **권장**: 로컬 개발 단계면 옵션 A, 이미 배포되었으면 옵션 B

### 2. 데이터 무결성
- CHECK 제약으로 type과 interaction_type 조합 검증
- 기존 데이터 마이그레이션 시 검증 로직 필요

### 3. 하위 호환성
- 기존 코드와의 호환성 유지 필요?
- 점진적 마이그레이션 vs 한번에 변경

### 4. 타입 변경 정책
- interaction type 변경 시 기존 interaction_type 초기화 필요
- Admin UI에서 명확한 경고 메시지

## searchInteractions 분리의 이점

### 인터렉션 큐와의 연계
```typescript
// tick-enqueue-interactions.ts에서 사용
const { searchInteractions } = useBehavior();

// 인터렉션 검색 (BehaviorAction의 once/fulfill 정보 자동 사용 + 캐릭터 제약 필터링)
const interactions = searchInteractions(
  this.behaviorTargetId,
  this.worldCharacterEntity.characterId,  // 캐릭터 제약 필터링
  this.targetEntityId
);

// 검색된 인터렉션들로 큐 구성
```

### 재사용성 향상
- `tick-enqueue-interactions.ts`: 인터렉션 큐 구성
- 기타 behavior-state 로직: 인터렉션 찾기
- `searchEntitySources`와 일관된 API 패턴

## 예상 효과
- ✅ 타입 판별 로직 단순화 (3개 컬럼 체크 → 1개 컬럼 체크)
- ✅ 데이터 무결성 향상 (CHECK 제약)
- ✅ 코드 가독성 향상 (`interaction.type === 'once'`)
- ✅ 유지보수 용이성 증가
- ✅ 버그 가능성 감소
- ✅ 인터렉션 검색 로직 재사용 가능 (체이닝에서 활용)

## 작업 추정
- **1단계 (DB)**: 2-3시간
- **2단계 (타입)**: 1시간
- **3단계 (Admin UI)**: 3-4시간
- **4단계 (로직)**: 2-3시간
- **5단계 (테스트)**: 2시간
- **6단계 (정리)**: 1시간

**총 추정**: 11-16시간
