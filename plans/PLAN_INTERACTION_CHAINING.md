# WorldCharacterEntityBehavior 인터렉션 체이닝 리팩토링

## 목표
캐릭터가 타겟 엔티티에 대해 여러 인터렉션을 순차적으로 실행할 수 있도록 구조 개선

## 인터렉션 체이닝 예시
```
아이템으로 이동 → 아이템 줍기 → 아이템 사용 → 감정 표현
```

## 현재 구조 분석

### 현재 상태
```typescript
class WorldCharacterEntityBehavior {
  behaviorTargetId: BehaviorTargetId | undefined;           // 현재 실행 중인 행동
  behaviorTargetStartTick: number | undefined;
  interactionTargetId: InteractionTargetId | undefined;     // 현재 실행 중인 인터렉션
  interactionTargetStartTick: number | undefined;
  targetEntityId: EntityId | undefined;                     // 타겟 엔티티
  path: Vector[];                                           // 이동 경로
}
```

### 현재 플로우 (tick.ts)
```typescript
1. tickFindBehaviorTarget()     // 행동 찾기
2. tickFindTargetEntityAndGo()  // 타겟 엔티티 찾기 & 이동
3. tickNextOrClear()            // 다음 행동으로 전환 또는 종료
```

### 문제점
- **단일 인터렉션만 지원**: 한 번에 하나의 인터렉션만 실행 가능
- **체이닝 불가**: 여러 인터렉션을 순차적으로 연결할 방법 없음
- **컨텍스트 유지 어려움**: 각 인터렉션 간 상태/데이터 전달 불가
- **유연성 부족**: 동적으로 인터렉션 추가/변경 어려움

## 설계: 인터렉션 체이닝 시스템

### 핵심 개념

#### 1. InteractionChain (인터렉션 체인)
```typescript
type InteractionChainStep = {
  type: 'move' | 'interaction' | 'expression';
  interactionId?: InteractionTargetId;
  targetEntityId?: EntityId;
  duration?: number;
};

type InteractionChain = {
  steps: InteractionChainStep[];
  currentStepIndex: number;
  startTick: number;
};
```

#### 2. 체인 실행 흐름
```
1. 체인 초기화 (setBehaviorTarget 시점)
   - 타겟 엔티티 결정
   - 필요한 인터렉션 순서 결정
   - InteractionChain 생성

2. 각 Step 실행
   - move: 타겟 엔티티로 이동
   - interaction: 인터렉션 실행 (기존 로직)
   - expression: 감정 표현

3. Step 완료 → 다음 Step
   - currentStepIndex++
   - 다음 Step 시작

4. 모든 Step 완료 → 행동 종료
   - tickNextOrClear() 호출
```

### 새로운 구조

```typescript
class WorldCharacterEntityBehavior {
  // 기존 필드 유지
  behaviorTargetId: BehaviorTargetId | undefined;
  targetEntityId: EntityId | undefined;
  path: Vector[];

  // 새로운 필드 추가
  interactionChain: InteractionChain | undefined;

  // 기존 단일 인터렉션 필드는 제거 또는 deprecated
  // interactionTargetId: InteractionTargetId | undefined;
  // interactionTargetStartTick: number | undefined;
}
```

## 구현 전략

### Phase 1: 체인 구조 설계 및 타입 정의
- [ ] `InteractionChain` 타입 정의 (`src/lib/types/core.ts`)
- [ ] `InteractionChainStep` 타입 정의
- [ ] InteractionChainUtils 유틸리티 생성 (`src/lib/utils/interaction-chain.ts`)
  - `createChain(steps: InteractionChainStep[]): InteractionChain`
  - `getCurrentStep(chain: InteractionChain): InteractionChainStep | undefined`
  - `moveToNextStep(chain: InteractionChain): boolean`
  - `isChainComplete(chain: InteractionChain): boolean`

### Phase 2: WorldCharacterEntityBehavior 확장
- [ ] `interactionChain` 필드 추가
- [ ] `setInteractionChain()` 메서드 추가
- [ ] `clearInteractionChain()` 메서드 추가
- [ ] `clear()` 메서드 업데이트 (체인도 클리어)

### Phase 3: 체인 생성 로직 구현
- [ ] `tick-create-interaction-chain.ts` 생성
  - BehaviorAction과 타겟 엔티티 기반으로 체인 생성
  - 엔티티 타입별 체인 구성:
    - 아이템: move → pick → use → express
    - 건물: move → interact → express
    - 캐릭터: move → interact → express
  - `searchInteractions()`로 필요한 인터렉션 검색
  - `InteractionChainUtils.createChain()` 사용
  - `setInteractionChain()` 호출하여 behavior에 설정
- [ ] `tick.ts` 플로우에 체인 생성 단계 추가
  ```typescript
  if (this.tickFindBehaviorTarget(tick)) return;
  if (this.tickFindTargetEntityAndGo(tick)) return;
  if (this.tickCreateInteractionChain(tick)) return;  // 새로 추가
  // TODO: 체인 실행은 다음 단계에서 구현
  this.tickNextOrClear(tick);
  ```

**참고**: 체인 **실행** 로직은 이후 단계에서 별도로 구현 예정

### Phase 4: 체인 생성 통합
- [ ] `tickFindTargetEntityAndGo.ts`와 `tickCreateInteractionChain.ts` 연계
  - 타겟 엔티티 결정 → 체인 생성으로 자연스럽게 흐름
  - 체인 생성 완료 후 다음 단계로 진행

### Phase 5: 체인 실행 로직 구현 (향후)
- [ ] `tick-execute-interaction-chain.ts` 생성 (별도 작업)
  - 현재 step 가져오기
  - step 타입별 처리:
    - `move`: 이동 처리
    - `interaction`: 인터렉션 실행
    - `expression`: 감정 표현
  - step 완료 체크 및 전환
- [ ] 기존 단일 인터렉션 로직을 체인 시스템으로 마이그레이션
- [ ] backup의 `tick-action-if-*` 로직들을 체인 step으로 변환

### Phase 6: 테스트 및 정리 (향후)
- [ ] 사용하지 않는 필드/메서드 제거
- [ ] 문서화 업데이트
- [ ] 성능 최적화

## 고려사항

### 1. 하위 호환성
- 기존 단일 인터렉션 시스템과 병행 운영 필요?
- 점진적 마이그레이션 전략

### 2. 체인 중단/재개
- 체인 실행 중 다른 행동으로 전환 시 처리?
- 체인 일시정지/재개 기능 필요?

### 3. 조건부 Step
- 특정 조건에서만 실행되는 step 지원?
- 예: "아이템이 이미 들고 있으면 pick step 스킵"

### 4. 동적 체인 수정
- 실행 중 체인에 step 추가/제거 가능?

### 5. 에러 처리
- Step 실행 실패 시 체인 중단? 계속 진행? 재시도?

## 테스트 시나리오

### 1. 기본 체이닝
```typescript
// 아이템 줍기 → 사용 → 감정표현
describe('아이템 사용 체인', () => {
  it('아이템으로 이동 → 줍기 → 사용 → 감정표현 순서로 실행된다');
  it('각 step이 완료되면 자동으로 다음 step으로 전환된다');
  it('모든 step 완료 후 행동이 종료된다');
});
```

### 2. Step 스킵
```typescript
describe('조건부 step', () => {
  it('이미 아이템을 들고 있으면 move와 pick step을 스킵한다');
});
```

### 3. 체인 중단
```typescript
describe('체인 중단', () => {
  it('다른 행동으로 전환 시 현재 체인이 중단된다');
  it('중단된 체인의 상태가 정리된다');
});
```

## 예상 효과
- ✅ 복잡한 행동 시퀀스 표현 가능
- ✅ 코드 재사용성 향상 (step 단위 모듈화)
- ✅ 유지보수 용이성 증가
- ✅ 확장성 개선 (새로운 step 타입 추가 용이)

## 작업 순서

### 🎯 현재 스코프 (체인 생성)
1. [ ] Phase 1: 타입 및 유틸리티 정의
2. [ ] Phase 2: Behavior 클래스 확장
3. [ ] Phase 3: 체인 생성 로직 구현 (`tick-create-interaction-chain.ts`)
4. [ ] Phase 4: 체인 생성 통합

### 🔮 향후 스코프 (체인 실행)
5. [ ] Phase 5: 체인 실행 로직 구현 (별도 작업)
6. [ ] Phase 6: 테스트 및 정리 (별도 작업)

**현재는 Phase 1-4만 진행하여 체인 생성 기능 완성**
