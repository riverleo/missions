# PLAN: Sprite Animation Completion Callback System

## 목표

스프라이트 애니메이터에서 애니메이션이 완료되었을 때 실행되는 콜백 시스템을 구현하여, 상호작용 액션의 `duration_ticks = 0` 처리를 지원합니다.

## 배경

현재 어드민 UI에서 액션 duration 설명:
> "액션이 지속되는 시간입니다. 0인 경우 캐릭터 바디 애니메이션이 종료될 때까지 실행됩니다."

이 기능을 실제로 구현하려면:
1. 스프라이트 애니메이터가 애니메이션 완료를 감지해야 함
2. 완료 시점에 콜백을 실행해야 함
3. 행동 시스템(behavior state)에서 이 콜백을 구독하여 다음 단계로 진행해야 함

## 현재 상태 분석

### SpriteAnimator 구조
- 위치: `src/lib/components/app/world/entities/sprite-animator/`
- 현재 기능: 스프라이트 시트 기반 프레임 애니메이션
- 부족한 기능: 애니메이션 완료 감지 및 콜백

### CharacterBodyStateType
- `idle`, `walk`, `run` 등의 상태
- 각 상태마다 애니메이션 프레임 정의
- 반복(loop) vs 한번만 재생(once) 구분 필요

### InteractionAction duration_ticks
- `duration_ticks > 0`: 고정 틱 수만큼 실행
- `duration_ticks = 0`: 애니메이션 종료까지 실행 (미구현)

## 설계

### Phase 1: SpriteAnimator 애니메이션 상태 추적

**목표:** 애니메이션이 언제 완료되는지 감지

#### 1.1 Animation Metadata 정의
**File:** `src/lib/types/animation.ts` (신규)

```typescript
export type AnimationPlayMode = 'loop' | 'once';

export interface AnimationMetadata {
  totalFrames: number;
  playMode: AnimationPlayMode;
  frameRate: number; // frames per second
}
```

#### 1.2 SpriteAnimator State 확장
**File:** `sprite-animator.svelte.ts`

```typescript
export class SpriteAnimator {
  // 기존 상태
  currentFrame = $state(0);

  // 추가 상태
  currentAnimation = $state<string | undefined>();
  animationMetadata = $state<AnimationMetadata | undefined>();
  isAnimationComplete = $state(false);

  // 애니메이션 완료 콜백
  onAnimationComplete: (() => void) | undefined;
}
```

#### 1.3 애니메이션 진행 로직 수정
- 매 프레임 업데이트 시 완료 여부 체크
- `playMode === 'once'`이고 마지막 프레임이면 `isAnimationComplete = true`
- 완료 시 `onAnimationComplete` 콜백 호출
- `playMode === 'loop'`이면 계속 반복

#### 작업 목록
- [ ] `src/lib/types/animation.ts` 생성
- [ ] `AnimationMetadata` 타입 정의
- [ ] `SpriteAnimator`에 애니메이션 상태 추가
- [ ] 프레임 업데이트 로직에 완료 감지 추가
- [ ] 콜백 호출 메커니즘 구현

### Phase 2: CharacterBodyStateType Animation Configuration

**목표:** 각 바디 상태마다 애니메이션 메타데이터 정의

#### 2.1 Animation Config 파일
**File:** `src/lib/config/character-animations.ts` (신규)

```typescript
export const CHARACTER_ANIMATIONS: Record<CharacterBodyStateType, AnimationMetadata> = {
  idle: {
    totalFrames: 4,
    playMode: 'loop',
    frameRate: 8,
  },
  walk: {
    totalFrames: 8,
    playMode: 'loop',
    frameRate: 12,
  },
  // interaction actions용 - 한번만 재생
  interact: {
    totalFrames: 6,
    playMode: 'once',
    frameRate: 10,
  },
  // ... 기타 상태들
};
```

#### 2.2 SpriteAnimator 초기화 시 메타데이터 연결
- 바디 상태 변경 시 해당 애니메이션 메타데이터 로드
- `currentAnimation`, `animationMetadata` 업데이트

#### 작업 목록
- [ ] `src/lib/config/character-animations.ts` 생성
- [ ] 모든 `CharacterBodyStateType`에 대한 메타데이터 정의
- [ ] 스프라이트 시트 확인하여 정확한 프레임 수 설정
- [ ] SpriteAnimator에서 상태 변경 시 메타데이터 로드

### Phase 3: Behavior State Integration

**목표:** 행동 시스템에서 애니메이션 완료 콜백 활용

#### 3.1 InteractionAction 실행 로직
**File:** `tick-dequeue-interaction.ts` (신규 또는 수정)

```typescript
// duration_ticks = 0인 경우
if (action.duration_ticks === 0) {
  // 애니메이션 완료 대기 모드
  const animator = this.worldCharacterEntity.spriteAnimator;

  if (!animator.onAnimationComplete) {
    // 콜백 등록 (한번만)
    animator.onAnimationComplete = () => {
      // 애니메이션 완료 시 다음 액션으로
      this.tickNextOrClear(tick);
    };
  }

  // 애니메이션이 완료될 때까지 대기
  return true; // 중단
}
```

#### 3.2 콜백 정리 (Cleanup)
- 액션 전환 시 이전 콜백 제거
- clear() 호출 시 콜백 초기화

#### 작업 목록
- [ ] `tick-dequeue-interaction.ts` 생성 (또는 기존 로직 확인)
- [ ] `duration_ticks = 0` 처리 로직 구현
- [ ] 애니메이션 완료 콜백 등록
- [ ] 콜백 정리 로직 구현
- [ ] `WorldCharacterEntityBehavior.clear()`에 콜백 정리 추가

### Phase 4: Edge Cases & Testing

#### 4.1 엣지 케이스 처리
- [ ] 애니메이션 도중 행동이 중단되는 경우
- [ ] 콜백 등록 전에 애니메이션이 이미 완료된 경우
- [ ] 같은 애니메이션이 연속으로 재생되는 경우
- [ ] 애니메이션 없이 바로 완료되어야 하는 경우

#### 4.2 테스트
- [ ] 단위 테스트: SpriteAnimator 애니메이션 완료 감지
- [ ] 단위 테스트: 콜백 호출 확인
- [ ] 통합 테스트: duration_ticks = 0 동작 확인
- [ ] 수동 테스트: 어드민에서 상호작용 액션 생성 및 실행

### Phase 5: Admin UI & Documentation

#### 5.1 Admin UI 개선
- [ ] duration_ticks 입력 시 힌트 개선
- [ ] "0 = 애니메이션 종료까지" 명시적 표시
- [ ] 애니메이션이 없는 액션 타입에 대한 경고

#### 5.2 문서화
- [ ] 애니메이션 시스템 동작 방식 문서
- [ ] `CHARACTER_ANIMATIONS` 설정 가이드
- [ ] 새로운 애니메이션 추가 방법

## 기술적 고려사항

### 1. 프레임 vs 틱
- **프레임**: 애니메이션 스프라이트의 인덱스 (0, 1, 2, ...)
- **틱**: 게임 로직 업데이트 단위
- 둘의 동기화 필요: `frameRate`와 틱 레이트 관계 명확히

### 2. 콜백 메모리 관리
- 콜백은 closure이므로 메모리 누수 주의
- 사용 후 반드시 `undefined`로 설정
- WeakMap 활용 고려

### 3. Svelte Runes
- `$state`와 콜백의 상호작용 주의
- 콜백 내에서 `$state` 변경 시 리액티비티 보장

### 4. 애니메이션 프레임 레이트
- 현재 틱 레이트와 애니메이션 프레임 레이트가 다를 수 있음
- `requestAnimationFrame` vs 틱 기반 업데이트 고려

## 의존성

### 선행 작업
- SpriteAnimator 구조 이해
- WorldCharacterEntity 구조 이해
- Behavior State 플로우 이해

### 차단 요소
- 없음 (독립적으로 진행 가능)

## 예상 일정

- Phase 1: 1-2일 (SpriteAnimator 확장)
- Phase 2: 0.5일 (애니메이션 설정)
- Phase 3: 1일 (Behavior State 통합)
- Phase 4: 1일 (테스트)
- Phase 5: 0.5일 (문서화)

**총 예상: 4-5일**

## 검증 기준

### 기능 검증
- [ ] `duration_ticks = 0`인 액션이 애니메이션 종료 시 완료됨
- [ ] `duration_ticks > 0`인 액션은 기존대로 동작
- [ ] 애니메이션이 loop인 경우 무한 대기하지 않음
- [ ] 행동 중단 시 콜백이 정리됨

### 성능 검증
- [ ] 메모리 누수 없음
- [ ] 콜백 등록/해제가 틱 성능에 영향 없음

### UX 검증
- [ ] 어드민에서 duration_ticks 설정이 직관적
- [ ] 실제 게임에서 자연스러운 애니메이션 종료

## 참고사항

### 유사 사례
- Unity Animator의 `AnimationEvent`
- Phaser의 `Animation.onComplete`
- CSS animation의 `animationend` 이벤트

### 향후 확장
- 애니메이션 중간 프레임 이벤트 (footstep sound 등)
- 애니메이션 블렌딩
- 애니메이션 재생 속도 조절
