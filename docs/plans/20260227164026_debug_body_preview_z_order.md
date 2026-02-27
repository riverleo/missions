# 디버그 모드 물리 바디 미리보기 z-order 수정

## 목표

월드에서 디버그 모드 활성 시 엔티티의 물리 바디 미리보기(Matter.js canvas)가 스프라이트 SVG/div 뒤로 가려지는 현상을 수정한다.

원인: `world-context.svelte.ts`에서 `Render.create({ element })`로 생성한 Matter.js `<canvas>`는 `world-container` div의 마지막 자식으로 추가된다. 그러나 `world-renderer.svelte`의 카메라 레이어 `<div class="pointer-events-none absolute">`가 `position: absolute`로 렌더링되어 canvas 위에 쌓인다. 결과적으로 디버그 바디 윤곽선이 스프라이트 div/svg 아래에 그려진다.

수정 방향: Matter.js canvas에 `position: absolute`, `z-index`, `pointer-events: none` 스타일을 적용하여 카메라 레이어 위에 오버레이되도록 한다. 마우스 이벤트는 canvas가 아닌 world-container div에서 이미 처리하므로 `pointer-events: none`을 적용해도 기능에 영향 없다. 단, `MouseConstraint`에 연결된 canvas 마우스 이벤트 리스너가 정상 동작하는지 검증이 필요하다.

## 담당자

- 플래너
- 게임 디자이너

## 할 일

### 플래너

- [ ] 본 플랜 작성 및 PR 생성

### 게임 디자이너

- [ ] `world-context.svelte.ts`의 `load()` 메서드에서 `Render.run()` 호출 후 canvas에 `position: absolute; top: 0; left: 0; z-index: 9999; pointer-events: none;` 스타일을 적용한다.
- [ ] canvas에 `pointer-events: none`을 적용한 뒤 기존 canvas 마우스 이벤트 리스너(`handleCanvasMouseDown` 등)가 동작하지 않게 되므로, 해당 리스너를 canvas 대신 world-container element에 바인딩하도록 변경한다.
- [ ] 디버그 모드 ON/OFF 시 엔티티 바디 윤곽선이 스프라이트 위에 정상 표시되는지 확인한다.
- [ ] 엔티티 드래그(MouseConstraint)가 정상 동작하는지 확인한다.

## 노트

### 2026-02-27

- DOM 구조: `world-container` > `카메라 레이어 div(absolute)` + `canvas(static)`. canvas가 static이라 absolute 레이어 아래로 밀림.
- 수정 대상 파일: `src/lib/components/app/world/context/world-context.svelte.ts`
- Matter.js `Mouse.create(canvas)`는 canvas에 이벤트 리스너를 바인딩하는데, `pointer-events: none` 적용 시 이벤트가 도달하지 않음. `Mouse.create` 후 `mouse.element`를 world-container element로 교체하거나, `MouseConstraint`의 마우스 소스를 element로 변경하는 방식을 검토해야 함.
- 대안: canvas를 카메라 레이어 내부로 이동시키는 방법도 있으나, Matter.js Render가 자체 viewport/bounds를 관리하므로 카메라 레이어의 CSS transform과 충돌할 수 있어 권장하지 않음.
