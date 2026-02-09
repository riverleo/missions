# 잘못된 getOrUndefinedXX 사용 개선

## 목표
ID가 null이 아닌 것이 확실한 경우, getOrUndefinedXX 대신 getXX를 사용하여 명확한 에러 처리

## 원칙
- **getXX 사용**: ID가 required이고 undefined/null이 아닌 경우
  - 데이터가 없으면 즉시 에러 발생 → 디버깅 용이
- **getOrUndefinedXX 사용**: ID가 optional이거나 undefined를 허용해야 하는 경우
  - 데이터가 없어도 정상 흐름

## 분석 대상

### 1. behavior-state 파일들 (필수 체크 필요)
**파일**: `behavior-state-backup/*.ts`, `behavior-state/*.ts`

**현재 코드**:
```typescript
const behaviorAction = getOrUndefinedBehaviorAction(this.behaviorTargetId);
if (!behaviorAction) {
  throw new Error('[...] No behaviorAction found');
}
```

**문제점**:
- `this.behaviorTargetId`가 존재한다면 behaviorAction도 반드시 존재해야 함
- getOrUndefined 후 바로 체크하고 에러 던지는 패턴

**개선안**:
```typescript
if (!this.behaviorTargetId) return false;
const behaviorAction = getBehaviorAction(this.behaviorTargetId);
```

**대상 파일**:
- [x] `tick-action-if-once-item-use.ts:31`
- [x] `tick-action-if-system-item-pick.ts:24`
- [x] `tick-wait-if-idle.ts:15`
- [x] `tick-find-and-go.ts:26`
- [x] `tick-next-or-clear.ts:14` (backup)
- [x] `tick-next-or-clear.ts:32` (state) - 이미 올바르게 구현됨

### 2. label.ts - 필수 관계 데이터 조회

**케이스 A: Behavior → Condition/Character (필수 관계)**
```typescript
const behavior = getOrUndefinedConditionBehavior(conditionBehaviorId);
const condition = getOrUndefinedCondition(behavior.condition_id);
const character = getOrUndefinedCharacter(behavior.character_id);
```

**문제점**:
- behavior가 존재하면 condition_id, character_id는 필수 필드
- 하지만 getOrUndefined 사용 → 없어도 undefined 반환

**개선 필요 여부**:
- behavior.condition_id는 required, character_id는 nullable
- [x] `label.ts:404` - getCondition(behavior.condition_id)로 변경
- [x] `label.ts:405` - character_id는 nullable이므로 유지

**케이스 B: Interaction → Building/Item/Character (필수 관계)**
```typescript
const interaction = getOrUndefinedBuildingInteraction(fulfillment.building_interaction_id);
const building = getOrUndefinedBuilding(interaction.building_id);
```

**문제점**:
- interaction이 존재하면 building_id는 필수
- 하지만 getOrUndefined 사용

**조사 완료**:
- [x] `label.ts:776` - building_id는 required, getBuilding 사용
- [x] `label.ts:785` - target_character_id는 required, getCharacter 사용
- [x] `label.ts:794` - item_id는 required, getItem 사용

**케이스 C: Optional chaining 사용 (유지 가능)**
```typescript
return getOrUndefinedCharacter(id as CharacterId)?.name;
```

**판단**: Optional chaining 사용하므로 getOrUndefined가 적절

### 3. Admin 컴포넌트 - ID가 확실한 경우

**케이스 A: 삼항 연산자로 ID 체크 (개선 가능)**
```typescript
const behavior = $derived(needBehaviorId ? getOrUndefinedNeedBehavior(needBehaviorId) : undefined);
```

**문제점**:
- needBehaviorId가 있으면 behavior도 있어야 함
- 없으면 에러를 던지는 게 더 명확

**개선안**:
```typescript
const behavior = $derived(needBehaviorId ? getNeedBehavior(needBehaviorId) : undefined);
```

**대상**:
- [x] `need-behavior-delete-dialog.svelte:26`
- [x] `need-behavior-update-dialog.svelte:49`
- [x] `need-behavior-svelte-flow.svelte:30`
- [x] `condition-behavior-delete-dialog.svelte:31`
- [x] `condition-behavior-update-dialog.svelte:57`
- [x] `condition-behavior-svelte-flow.svelte:35`
- [x] `building-interaction-update-dialog.svelte:45`
- [x] `item-interaction-update-dialog.svelte:44`
- [x] `character-interaction-update-dialog.svelte:37`

**케이스 B: Interaction → Entity (필수 관계)**
```typescript
{@const building = getOrUndefinedBuilding(interaction.building_id)}
```

**문제점**:
- interaction.building_id가 있으면 building도 있어야 함
- building_id가 nullable인지 확인 필요

**대상 (조사 필요)**:
- [ ] `need-behavior-action-node-panel.svelte` (여러 줄)
- [ ] `condition-behavior-action-node-panel.svelte` (여러 줄)
- [ ] `building-interaction-action-node-panel.svelte`
- [ ] `item-interaction-action-node-panel.svelte`

### 4. Test World Inspector - 디버깅 도구

**현재 코드**:
```typescript
{@const conditionData = getOrUndefinedCondition(condition.condition_id)}
```

**판단**:
- 디버깅/검사 도구이므로 데이터가 없어도 표시하는 게 나을 수 있음
- **유지 검토**

### 5. tick-decrease-needs.ts

```typescript
const characterNeed = getOrUndefinedCharacterNeed(
  need.character_id as CharacterId,
  need.need_id as NeedId
);
```

**조사 필요**:
- [ ] character_id, need_id가 필수인지 확인
- [ ] 필수라면 getCharacterNeed로 변경

## 작업 순서

1. [x] **1단계**: behavior-state 파일들 (5개) - 명확한 케이스 (state 버전은 이미 올바름)
2. [x] **2단계**: Admin 다이얼로그 컴포넌트 (9개) - 삼항 연산자 패턴
3. [x] **3단계**: label.ts - 필수 관계 분석 후 개선 (4개 수정)
4. [ ] **4단계**: Admin 액션 패널 컴포넌트 - interaction 관계 분석
5. [ ] **5단계**: 기타 케이스 검토
6. [ ] **6단계**: pnpm check 통과 확인

## 예상 효과
- 버그를 조기에 발견 (데이터 누락 시 즉시 에러)
- 디버깅 시간 단축 (명확한 에러 메시지)
- 코드 의도 명확화 (필수 vs 선택적 데이터)
