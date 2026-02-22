# PLAN: InteractionAction `duration_ticks = 0` Spec

## 목표
특정 `InteractionAction`의 `duration_ticks = 0`일 때, 캐릭터 바디 애니메이션이 끝나는 시점에 다음 인터렉션 액션으로 전환한다.

## 스코프
- 포함: 실행 스펙 정의, 상태 전이, 완료 신호 계약, 예외/폴백 정책
- 제외: `tickDequeueInteraction` 전체 구현 상세 (별도 TODO에서 구현)

## 용어
- `currentInteractionAction`: 현재 실행 중인 `InteractionAction` (=`interactionQueue.poppedInteractionTargetId`로 조회한 액션)
- `duration_ticks`: 액션 지속 틱
- `bodyAnimationComplete`: 현재 `currentInteractionAction`이 지정한 바디 상태 애니메이션의 1회 재생 완료 신호

## 핵심 규칙
1. `duration_ticks > 0`
- 기존 규칙 유지: `tick - interactionQueue.poppedAtTick >= duration_ticks`이면 완료

2. `duration_ticks = 0`
- 시간 기반이 아니라 애니메이션 완료 기반으로 완료
- `bodyAnimationComplete` 신호를 받은 tick에서 액션 완료 처리

## 상태 전이 스펙 (Interaction Queue)
1. `ready -> running`
- 액션 pop 시 `currentInteractionAction` 확정, `interactionQueue.poppedAtTick` 기록
- 애니메이션 완료 플래그 `false`로 초기화

2. `running -> running`
- `duration_ticks > 0`이면 틱 경과 확인
- `duration_ticks = 0`이면 완료 플래그 확인

3. `running -> next action or completed`
- 완료 조건 충족 시 다음 액션 pop
- 다음 액션이 없으면 queue `completed`

## 완료 신호 계약 (Animator -> Entity/Behavior)
1. 신호 출처
- `CharacterSpriteAnimator` body animation `onComplete`

2. 신호 소비
- `WorldCharacterEntity`가 이벤트를 emit
- behavior 실행기가 이를 구독해 "현재 액션 완료 가능" 플래그를 갱신

3. 정확성 규칙
- 액션당 최대 1회 완료로 처리 (중복 emit 무시)
- 액션 전환 시 플래그 반드시 reset
- `clear()` 시 구독/플래그 정리

## 선행 조건 (duration=0이 유효하려면)
- 현재 액션의 바디 상태가 실제로 재생되어야 함
- 해당 바디 상태의 loop 모드가 완료 가능한 모드여야 함 (`once` 또는 `ping-pong-once`)

## loop 타입별 `duration_ticks = 0` 처리 규칙
1. `loop = 'once' | 'ping-pong-once'`
- `onComplete` 신호를 정상 완료 조건으로 사용

2. `loop = 'loop' | 'ping-pong'`
- `onComplete`가 발생하지 않으므로 `duration_ticks = 0`과 조합 시 무한 대기 위험
- 런타임 폴백: `1 tick` 후 완료 처리
- 디버깅 신호: `console.warn` 출력

## 폴백 정책 (무한 대기 방지)
- `duration_ticks = 0`인데 완료 불가능 loop(`loop`, `ping-pong`)인 경우:
  - 기본 정책: `1 tick` 후 완료 처리 + 경고 로그
  - 목적: gameplay 진행 정지 방지

## 데이터/어드민 가드 (권장)
- `duration_ticks = 0`일 때 loop를 `once`/`ping-pong-once`로 제한하거나 경고를 노출한다.
- 목표: 런타임 폴백 의존도를 줄이고 설정 실수를 조기에 발견한다.

## 엣지 케이스
1. 같은 바디 상태가 연속 실행되는 경우
- 액션 식별자 기준으로 재생/완료를 구분해야 함 (이전 액션 완료 신호 재사용 금지)

2. 액션 도중 행동 중단/변경
- 현재 액션 완료 대기 상태를 즉시 폐기
- 이후 늦게 도착한 완료 신호는 무시

3. 애니메이션 리소스 없음/상태 없음
- 폴백 정책 적용 (1 tick 완료 + 경고)

## 수용 기준 (Acceptance Criteria)
- [x] `duration_ticks > 0` 기존 동작 회귀 없음
- [x] `duration_ticks = 0` + `once` 바디 애니메이션에서 종료 시점에 다음 액션으로 전환
- [x] 완료 불가능 loop에서 무한 대기 없이 진행
- [x] 액션 전환/clear 이후 늦게 들어온 완료 신호로 오동작하지 않음
- [x] 같은 state 연속 액션에서도 각 액션 단위로 정상 완료 처리
