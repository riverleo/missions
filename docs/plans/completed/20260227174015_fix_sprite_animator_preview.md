# 상호작용 액션 노드 패널 미리보기 수정

## 목표

스케일 분리(PR #17) 이후 캐릭터/건물/아이템 상호작용 액션 노드 패널의 스프라이트 미리보기가 정상 동작하지 않는 문제를 수정한다.

## 문제

1. **face/hand 오프셋 위치 불일치**: `faceTransform`/`handTransform`의 translate 값에 `bodyScale`이 반영되지 않아, bodyScale ≠ 1일 때 페이스·핸드 위치가 어긋남
2. **미리보기에서 캐릭터 크기가 작아 보이는 현상**: 조사 결과 월드와 동일한 값(`resolution=2`, `bodyScale`)을 사용하고 있으며, 월드에서는 카메라 줌(`camera.zoom`, 기본 1)이 적용되어 확대되지만 미리보기는 1:1로 표시하므로 정상 동작임

## 담당자

- 플래너
- 게임 디자이너

## 할 일

### 플래너

- [x] 본 플랜 작성 및 PR 생성

### 게임 디자이너

- [x] `character-sprite-animator.svelte`의 `faceTransform`에서 translate 값에 `bodyScale`을 곱하여 바디 스케일에 맞게 페이스 위치를 보정한다. (`faceOffset.x * bodyScale / resolution`)
- [x] `character-sprite-animator.svelte`의 `handTransform`에서 translate 값에 `bodyScale`을 곱하여 바디 스케일에 맞게 핸드(아이템) 위치를 보정한다. (`handOffset.x * bodyScale / resolution`)
- [x] 미리보기에서 캐릭터 크기가 작아 보이는 원인을 파악한다. → 월드와 동일한 값 사용 중, 정상
- [ ] 캐릭터 상호작용 액션 노드 패널(`character-interaction-action-node-panel.svelte`)에서 미리보기가 정상 표시되는지 확인한다.
- [ ] 건물 상호작용 액션 노드 패널(`building-interaction-action-node-panel.svelte`)에서 미리보기가 정상 표시되는지 확인한다.
- [ ] 아이템 상호작용 액션 노드 패널(`item-interaction-action-node-panel.svelte`)에서 미리보기가 정상 표시되는지 확인한다.

## 노트

### 2026-02-27

- 스케일 분리 전: 외부 div `scale(${character.scale})` → 바디·페이스·핸드·대상 캐릭터 전체 동시 스케일링
- 스케일 분리 후: 외부 div 스케일 없음, 바디만 `scale({bodyScale})`, 페이스 `scale({faceScale})`, 핸드 `scale({heldItemScale})`으로 각각 독립 스케일링
- `faceOffset`/`handOffset`은 atlas 메타데이터의 원본 픽셀 좌표 → bodyScale이 1이 아닐 때 위치 불일치
- 수정 대상 파일: `src/lib/components/app/sprite-animator/character-sprite-animator.svelte` (faceTransform, handTransform 2곳)
- 3개 패널 모두 `CharacterSpriteAnimator`를 사용하므로 한 파일 수정으로 3개 패널 동시 해결
- 미리보기 크기 조사: 월드(`resolution=2`, `bodyScale`, `camera.zoom` 기본 1)와 미리보기(`resolution=2`, `bodyScale`)가 동일한 파라미터 사용. 차이는 카메라 줌 유무뿐이며, 미리보기는 게임 1:1 스케일 기준으로 정상 표시
