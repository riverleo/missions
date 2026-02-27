# 디버그 모드 물리 바디 미리보기 z-order 수정

## 목표

월드에서 디버그 모드 활성 시 엔티티의 물리 바디 미리보기(Matter.js canvas)가 terrain 배경 이미지에 가려지는 현상을 수정한다.

원인: 카메라 레이어 div에 `transform: scale() translate()`가 적용되어 있어 새로운 stacking context가 생성된다. CSS 규칙상 stacking context를 가진 요소는 그렇지 않은 요소(Matter.js canvas) 위에 쌓인다. terrain 이미지가 이 카메라 레이어 내부에서 전체 영역을 덮으므로 canvas의 디버그 바디가 보이지 않는다.

수정 방향: 디버그 모드 활성 시 terrain 이미지의 opacity를 낮춰 canvas의 바디 윤곽선이 투과되어 보이도록 한다. DOM 구조나 Matter.js 코드는 수정하지 않는다.

## 담당자

- 플래너
- 게임 디자이너

## 할 일

### 플래너

- [x] 본 플랜 작성 및 PR 생성

### 게임 디자이너

- [x] `world-renderer.svelte`에서 terrain `<img>`에 디버그 모드일 때 opacity를 낮추는 스타일을 적용한다. (`world.debug` 상태를 사용)
- [ ] 디버그 모드 ON/OFF 시 terrain 투명도가 변경되어 바디 윤곽선이 잘 보이는지 확인한다.

## 노트

### 2026-02-27

- 근본 원인: 카메라 레이어 div의 `transform: scale() translate()`가 stacking context를 생성하여 내부 요소(terrain img 포함) 전체가 canvas 위에 쌓임.
- 디버그 모드는 개발/테스트 용도이므로, 게임 주요 로직(DOM 구조, Matter.js 이벤트)을 수정하지 않고 terrain opacity 조절로 간단히 해결한다.
- 수정 대상 파일: `src/lib/components/app/world/world-renderer.svelte`
