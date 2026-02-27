# 마우스 클릭 시 캐릭터 이동 기능 제거

## 목표

월드에서 빈 공간 클릭 시 선택된 캐릭터가 해당 위치로 이동하는 기능을 제거한다.

현재 동작: 캐릭터 선택 상태에서 빈 공간 클릭 → `handleCanvasMouseUp`에서 `WorldCharacterEntity.moveTo()` 호출 → pathfinder 경로 계산 → 캐릭터 이동.

제거 대상 코드:
- `world-context.svelte.ts`의 `handleCanvasMouseUp` 내 캐릭터 이동 분기 (lines 157-164)
- `world-character-entity.svelte.ts`의 `moveTo()` 메서드 (lines 124-130) — 유일한 호출처가 제거되므로 데드 코드
- `world-character-entity-renderer.svelte`의 이동 경로 SVG 시각화 (path 디버그 표시)

pathfinder 자체는 AI 행동(`tick-find-target-entity-and-go.ts`)에서 사용하므로 유지한다.

## 담당자

- 플래너
- 게임 디자이너

## 할 일

### 플래너

- [ ] 본 플랜 작성 및 PR 생성

### 게임 디자이너

- [ ] `world-context.svelte.ts`의 `handleCanvasMouseUp`에서 캐릭터 이동 분기(`if (EntityIdUtils.is('character', selectedEntityId))` 블록, lines 157-164)를 제거한다. 제거 후 `else if (this.blueprint.cursor)` 분기가 빈 공간 클릭의 첫 번째 조건이 되도록 정리한다.
- [ ] `world-character-entity.svelte.ts`의 `moveTo()` 메서드를 제거한다.
- [ ] `world-character-entity-renderer.svelte`에서 이동 경로 SVG 시각화 관련 코드(`entity.behavior.path`를 사용하는 `<svg>` 블록)를 제거한다.
- [ ] 빈 공간 클릭 시 캐릭터가 이동하지 않고, 엔티티 배치·선택 해제 등 나머지 클릭 동작은 정상 동작하는지 확인한다.

## 노트

### 2026-02-27

- `moveTo`의 유일한 호출처: `world-context.svelte.ts:162`
- pathfinder(`findPath`)는 AI 행동(`tick-find-target-entity-and-go.ts:74`)에서도 사용하므로 유지
- `behavior.path`는 AI 행동에서도 설정되므로 path 속성 자체는 유지, 경로 SVG 시각화만 제거 여부를 구현 시 판단
- 수정 대상 파일:
  - `src/lib/components/app/world/context/world-context.svelte.ts`
  - `src/lib/components/app/world/entities/world-character-entity/world-character-entity.svelte.ts`
  - `src/lib/components/app/world/entities/world-character-entity/world-character-entity-renderer.svelte`
