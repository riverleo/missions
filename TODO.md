# TODO

## Behavior System 개선 필요

### 문제점

#### 1. 액션 체인에서 타깃 컨텍스트 유지 불가
- **현상**:
  - 액션 1: `go` (자동 탐색) → 아이템 A 발견
  - 액션 2: `interact` → 아이템 A를 대상으로 해야 하는데 표현 불가
- **원인**: 각 액션이 독립적으로만 동작, 이전 액션의 결과를 다음 액션에 전달할 방법 없음
- **영향**:
  - "특정 대상을 찾아가서 상호작용"하는 자연스러운 행동 시퀀스 구현 불가
  - 매 액션마다 타깃을 재탐색하거나 명시해야 함

#### 2. Fulfillment 기반 자동 선택의 제어 부족
- **현상**:
  - 니즈 20 이하 → 이동(자동 선택) 실행
  - `need_fulfillments`로 "어떤 종류"는 알 수 있음 (예: 음식 아이템)
  - 하지만 "구체적으로 어느 것"은 랜덤 → 행동 예측 불가능
- **원인**: 우선순위나 조건 기반 선택 로직이 없음
- **영향**:
  - 캐릭터가 비효율적인 선택을 할 수 있음
  - 게임 디자이너가 행동을 세밀하게 제어할 수 없음

### 해결 아이디어

#### 1. 타깃 전달 메커니즘
**방안 A: `target_source` enum 추가**
```sql
CREATE TYPE target_source AS ENUM ('explicit', 'search', 'previous');
ALTER TABLE condition_behavior_actions ADD COLUMN target_source target_source DEFAULT 'search';
ALTER TABLE need_behavior_actions ADD COLUMN target_source target_source DEFAULT 'search';
```
- `explicit`: character_id/building_id/item_id 중 하나 지정 (고정 타깃)
- `search`: 자동 탐색 (새로운 타깃)
- `previous`: 이전 액션의 타깃 재사용 (컨텍스트 유지)

**방안 B: `use_previous_target` boolean (더 단순)**
```sql
ALTER TABLE condition_behavior_actions ADD COLUMN use_previous_target boolean DEFAULT false;
ALTER TABLE need_behavior_actions ADD COLUMN use_previous_target boolean DEFAULT false;
```

**방안 C: `target_action_id` 참조 (가장 유연)**
```sql
ALTER TABLE condition_behavior_actions ADD COLUMN target_action_id condition_behavior_action_id;
ALTER TABLE need_behavior_actions ADD COLUMN target_action_id need_behavior_action_id;
```

#### 2. 타깃 선택 전략 개선
**현재**: "explicit(명시)" vs "search(탐색)" 이분법
**필요**: 세밀한 제어

- **컨텍스트 기반 선택**
  - 이전 액션의 결과 재사용
  - "현재 들고 있는 아이템"
  - "현재 위치한 건물"

- **조건 기반 필터링**
  - "가장 가까운"
  - "가장 많이 회복시키는"
  - "특정 상태인"
  - 우선순위 규칙

- **행동의 의도 명확화**
  - "음식 찾아서 먹기"라는 하나의 행동 묶음으로 이해

**구현 아이디어**:
- Action Context / Session 개념 (런타임 상태)
- Target Selector 표현식
- Action Group / Macro (여러 액션을 논리적 단위로 묶음)

---

_마지막 업데이트: 2026-01-23_
