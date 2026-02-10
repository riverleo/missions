# WorldCharacterEntityBehavior 인터렉션 큐 리팩토링

## 목표
캐릭터가 타겟 엔티티에 대해 여러 인터렉션을 순차적으로 실행할 수 있도록 구조 개선 (FIFO 큐 패턴 사용)

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

## 설계: 인터렉션 큐 시스템

### 핵심 개념

#### 1. InteractionQueue (인터렉션 큐)
```typescript
interface InteractionQueue {
  interactionTargetIds: InteractionTargetId[];                    // FIFO 큐: 대기 중인 인터렉션 ID 배열
  poppedInteractionTargetId: InteractionTargetId | undefined;     // 현재 실행 중인 인터렉션 ID
  poppedAtTick: number;                                           // 현재 인터렉션이 pop된 틱
}
```

**InteractionTargetId 형식**:
```typescript
// 예시:
// - "building_123_456" (BuildingInteractionId_BuildingInteractionActionId)
// - "item_789_012"
// - "character_345_678"
```

**필드 설명**:
- `interactionTargetIds`: 아직 실행되지 않은 대기 중인 인터렉션들
- `poppedInteractionTargetId`: 현재 실행 중인 인터렉션 (shift로 pop된 ID 저장)
- `poppedAtTick`: 현재 인터렉션 실행 시작 시점

**장점**:
- ✅ 진정한 FIFO 큐 구조 (push로 추가, shift/pop으로 소비)
- ✅ ID만 저장하여 메모리 효율적
- ✅ 동적 인터렉션 추가가 매우 용이 (큐에 push만 하면 됨)
- ✅ poppedInteractionTargetId로 현재 실행 중인 인터렉션 추적
- ✅ poppedAtTick으로 duration 경과 체크 가능
- ✅ 실제 Interaction 객체는 필요할 때 ID로 조회

#### 2. 큐 실행 흐름
```
1. 인터렉션 enqueue (tickEnqueueInteractions)
   - behaviorTargetId와 targetEntityId 사용
   - searchInteractions로 핵심 인터렉션 검색 및 첫 번째 선택
   - 핵심 인터렉션 타입에 따라 절차적으로 시퀀스 구성:
     * item_use: searchInteractions로 item_pick 찾아서 추가 → core → express 추가
     * building_interact: core → express 추가
     * 기타: 타입별 분기 처리
   - InteractionTargetId 배열 구성
   - InteractionQueue 생성 및 설정

2. 인터렉션 시작 (향후 구현)
   - poppedInteractionTargetId가 undefined면 첫 인터렉션 시작
   - interactionTargetIds에서 shift()로 ID 꺼내기
   - poppedInteractionTargetId = shift된 ID
   - poppedAtTick = 현재 tick
   - poppedInteractionTargetId로 실제 Interaction 조회
   - 해당 인터렉션의 InteractionAction 체인 실행

3. 인터렉션 실행 중 (향후 구현)
   - poppedInteractionTargetId로 현재 인터렉션 확인
   - poppedAtTick 기준으로 duration_ticks 경과 체크
   - duration 완료 전까지 InteractionAction 실행 계속

4. 인터렉션 완료 → 다음 인터렉션 (향후 구현)
   - duration_ticks 경과 확인
   - interactionTargetIds에서 다음 ID shift()
   - poppedInteractionTargetId = 새로 shift된 ID
   - poppedAtTick = 현재 tick
   - 다음 인터렉션 시작

5. 동적 인터렉션 추가 (향후)
   - 실행 중에도 interactionTargetIds.push() 가능
   - 예: 조건 충족 시 추가 감정 표현 인터렉션 삽입

6. 모든 인터렉션 완료 → 행동 종료
   - interactionTargetIds.length === 0 && poppedInteractionTargetId의 duration 완료
   - poppedInteractionTargetId = undefined로 초기화
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
  interactionQueue: InteractionQueue | undefined;

  // 기존 단일 인터렉션 필드는 제거 또는 deprecated
  // interactionTargetId: InteractionTargetId | undefined;
  // interactionTargetStartTick: number | undefined;
}
```

## 구현 전략

### Phase 1: 큐 구조 설계 및 타입 정의
- [ ] `InteractionQueue` 타입 정의 (`src/lib/types/core.ts`)
  ```typescript
  export interface InteractionQueue {
    interactionTargetIds: InteractionTargetId[];
    poppedInteractionTargetId: InteractionTargetId | undefined;
    poppedAtTick: number;
  }
  ```

**참고**: 큐 조작은 별도 유틸리티 없이 직접 배열 메서드 사용
- 다음 인터렉션 확인: `queue.interactionTargetIds[0]`
- 현재 실행 중인 인터렉션: `queue.poppedInteractionTargetId`
- Pop (다음 인터렉션 시작):
  ```typescript
  queue.poppedInteractionTargetId = queue.interactionTargetIds.shift();
  queue.poppedAtTick = tick;
  ```
- Push (동적 추가): `queue.interactionTargetIds.push(id)`
- 완료 체크: `queue.interactionTargetIds.length === 0 && duration 완료`

### Phase 2: WorldCharacterEntityBehavior 확장
- [ ] `interactionQueue` 필드 추가
- [ ] `setInteractionQueue(queue: InteractionQueue)` 메서드 추가
- [ ] `clearInteractionQueue()` 메서드 추가
- [ ] `clear()` 메서드 업데이트 (큐도 클리어)

### Phase 3: 인터렉션 enqueue 로직 구현
- [ ] `tick-enqueue-interactions.ts` 생성

#### 핵심 개념
**입력**:
- `behaviorTargetId`: 선정된 행동 타겟 (이미 behavior에 설정됨)
- `targetEntityId`: 선정된 타겟 엔티티 (이미 behavior에 설정됨)

**출력**: 맥락에 맞는 완전한 인터렉션 시퀀스
- 핵심 인터렉션 + 필요한 system 인터렉션들

#### 구현 로직

- [ ] **핵심 인터렉션 선택**
  ```typescript
  // tick-enqueue-interactions.ts

  // 1. 핵심 인터렉션 검색 및 선택 (BehaviorAction의 once/fulfill 자동 판단 + 캐릭터 제약)
  const coreInteractions = searchInteractions(
    this.behaviorTargetId,
    this.worldCharacterEntity.characterId,  // 캐릭터 제약 필터링
    this.targetEntityId
  );
  const coreInteraction = coreInteractions[0];  // 첫 번째 선택

  if (!coreInteraction) {
    return false;  // 인터렉션 없으면 실패
  }
  ```

- [ ] **시스템 인터렉션 구성 (절차적 코드)**
  ```typescript
  const interactionTargetIds: InteractionTargetId[] = [];

  // 2. 핵심 인터렉션 타입에 따라 시스템 인터렉션 추가

  // 아이템 사용 인터렉션인 경우
  if (coreInteraction.once_interaction_type === 'item_use') {
    // 앞에 item_pick 시스템 인터렉션 추가
    // searchInteractions로 system 인터렉션 검색 후 item_pick 찾기
    const systemInteractions = searchInteractions(
      this.behaviorTargetId,
      this.worldCharacterEntity.characterId,
      this.targetEntityId
    );
    const pickInteraction = systemInteractions.find(i =>
      i.system_interaction_type === 'item_pick'
    );
    if (pickInteraction) {
      interactionTargetIds.push(pickInteraction.id);
    }
  }

  // 3. 핵심 인터렉션 추가
  interactionTargetIds.push(coreInteraction.id);

  // 4. 감정 표현 시스템 인터렉션 추가 (선택적)
  const systemInteractions = searchInteractions(
    this.behaviorTargetId,
    this.worldCharacterEntity.characterId,
    this.targetEntityId
  );
  const expressInteraction = systemInteractions.find(i =>
    i.system_interaction_type === 'express'
  );
  if (expressInteraction) {
    interactionTargetIds.push(expressInteraction.id);
  }
  ```

**구현 포인트**:
- `searchInteractions`는 단순히 인터렉션 검색만 담당
- 시퀀스 구성 로직은 `tick-enqueue-interactions.ts`에 절차적으로 작성
- 핵심 인터렉션 타입(`item_use`, `building_interact` 등)에 따라 분기 처리
- 각 타입별로 필요한 시스템 인터렉션 찾아서 추가

**함수 시그니처**:
```typescript
searchInteractions(
  behaviorTargetId: BehaviorTargetId,
  characterId: CharacterId,
  entityId?: EntityId
): Interaction[]
```

- [ ] InteractionQueue 생성 및 설정
  ```typescript
  const interactionQueue: InteractionQueue = {
    interactionTargetIds: [...extractedIds],
    poppedInteractionTargetId: undefined,  // 아직 실행 시작 전
    poppedAtTick: 0  // 또는 현재 tick
  };
  ```
  - `setInteractionQueue()` 호출하여 behavior에 설정
- [ ] `tick.ts` 플로우에 enqueue 단계 추가
  ```typescript
  // tick.ts
  export default function tick(this: WorldCharacterEntityBehavior, tick: number): void {
    if (this.tickFindBehaviorTarget(tick)) return;      // 1. 행동 선정 (BehaviorAction)
    if (this.tickFindTargetEntityAndGo(tick)) return;   // 2. 타겟 엔티티 찾기 & 이동
    if (this.tickEnqueueInteractions(tick)) return;     // 3. 인터렉션 큐 구성 (새로 추가)
    // TODO: 큐 실행은 다음 단계에서 구현
    // if (this.tickDequeueInteraction(tick)) return;   // 4. 인터렉션 실행
    this.tickNextOrClear(tick);
  }
  ```

**참고**: 큐 **실행** 로직은 이후 단계에서 별도로 구현 예정

### Phase 4: 인터렉션 enqueue 통합
- [ ] `tickFindTargetEntityAndGo.ts`와 `tickEnqueueInteractions.ts` 연계
  - 타겟 엔티티 결정 → 인터렉션 enqueue로 자연스럽게 흐름
  - enqueue 완료 후 다음 단계로 진행

### Phase 5: 인터렉션 dequeue 로직 구현 (향후)
- [ ] `tick-dequeue-interaction.ts` 생성 (별도 작업)

  **인터렉션 시작 로직**:
  - `poppedInteractionTargetId === undefined`면 새 인터렉션 시작
  - `interactionTargetIds.shift()`로 다음 ID 꺼내기
  - `poppedInteractionTargetId = shift된 ID`
  - `poppedAtTick = 현재 tick`

  **인터렉션 실행 로직**:
  - `poppedInteractionTargetId`로 현재 인터렉션 확인
  - InteractionTargetId로 실제 Interaction 조회
  - 현재 인터렉션의 InteractionAction 체인 실행
  - `poppedAtTick` 기준으로 duration_ticks 경과 체크

  **인터렉션 완료 → 다음 인터렉션**:
  - duration_ticks 경과 확인
  - `poppedInteractionTargetId = interactionTargetIds.shift()`
  - `poppedAtTick = 현재 tick`
  - shift 결과가 undefined면 큐 완료

  **큐 완료**:
  - `interactionTargetIds.length === 0` && `poppedInteractionTargetId === undefined`
  - 다음 단계로 진행

- [ ] 기존 단일 인터렉션 로직을 큐 시스템으로 마이그레이션

### Phase 6: 테스트 및 정리 (향후)
- [ ] 사용하지 않는 필드/메서드 제거
  - `interactionTargetId`, `interactionTargetStartTick` 필드 제거
- [ ] `behavior-state-backup` 디렉토리 삭제
  - 새로운 큐 시스템으로 완전히 대체되어 더 이상 참조 불필요
- [ ] 문서화 업데이트
- [ ] 성능 최적화

## 고려사항

### 1. 하위 호환성
- 기존 단일 인터렉션 시스템과 병행 운영 필요?
- 점진적 마이그레이션 전략

### 2. 체인 중단/재개
- 체인 실행 중 다른 행동으로 전환 시 처리?
- 체인 일시정지/재개 기능 필요?

### 3. 조건부 인터렉션
- 특정 조건에서만 실행되는 인터렉션 지원?
- 예: "아이템이 이미 들고 있으면 pick 인터렉션 스킵"

### 4. 동적 체인 수정
- 실행 중 체인에 인터렉션 추가/제거 가능?

### 5. 에러 처리
- 인터렉션 실행 실패 시 체인 중단? 계속 진행? 재시도?

## 테스트 시나리오

### 1. 기본 큐 실행
```typescript
// 아이템 줍기 → 사용 → 감정표현
describe('아이템 사용 큐', () => {
  it('아이템으로 이동 → 줍기 → 사용 → 감정표현 순서로 실행된다');
  it('각 인터렉션이 완료되면 큐에서 pop하고 다음 인터렉션으로 전환된다');
  it('모든 인터렉션 완료 후 행동이 종료된다');
});
```

### 2. 동적 인터렉션 추가
```typescript
describe('동적 큐 조작', () => {
  it('실행 중에 큐에 새로운 인터렉션을 push할 수 있다');
  it('조건 충족 시 추가 인터렉션이 큐 끝에 추가된다');
});
```

### 3. 큐 중단
```typescript
describe('큐 중단', () => {
  it('다른 행동으로 전환 시 현재 큐가 중단된다');
  it('중단된 큐의 상태가 정리된다');
});
```

## 예상 효과
- ✅ 복잡한 행동 시퀀스 표현 가능
- ✅ FIFO 큐 패턴으로 직관적인 인터렉션 관리
- ✅ 동적 인터렉션 추가가 매우 용이 (push만 하면 됨)
- ✅ 메모리 효율적 (ID만 저장)
- ✅ 유지보수 용이성 증가
- ✅ 확장성 개선

## 작업 순서

### 🎯 현재 스코프 (인터렉션 enqueue)
1. [ ] Phase 1: 타입 정의
2. [ ] Phase 2: Behavior 클래스 확장
3. [ ] Phase 3: 인터렉션 enqueue 로직 구현 (`tick-enqueue-interactions.ts`)
4. [ ] Phase 4: 인터렉션 enqueue 통합

### 🔮 향후 스코프 (인터렉션 dequeue)
5. [ ] Phase 5: 인터렉션 dequeue 로직 구현 (별도 작업)
6. [ ] Phase 6: 테스트 및 정리 (별도 작업)

**현재는 Phase 1-4만 진행하여 인터렉션 enqueue 기능 완성**
