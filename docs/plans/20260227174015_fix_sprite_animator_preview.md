# 상호작용 액션 노드 패널 미리보기 수정

## 목표

캐릭터/건물/아이템 상호작용 액션 노드 패널의 스프라이트 미리보기가 스케일 분리(PR #17) 이후 정상 동작하지 않는 문제를 수정한다.

원인: `CharacterSpriteAnimator`에서 기존에는 외부 div에 `scale(${character.scale})`을 적용하여 바디·페이스·핸드를 함께 스케일링했으나, 스케일 분리 후 바디만 `scale({bodyScale})`로 감싸고 페이스·핸드는 독립적으로 배치하게 변경됨. `faceOffset`과 `handOffset`은 atlas 메타데이터의 원본 픽셀 좌표인데, `bodyScale`이 반영되지 않아 바디 크기가 변할 때 페이스·핸드 위치가 어긋남.

## 담당자

- 플래너
- 게임 디자이너

## 할 일

### 플래너

- [ ] 본 플랜 작성 및 PR 생성

### 게임 디자이너

- [ ] `character-sprite-animator.svelte`의 `faceTransform`에서 translate 값에 `bodyScale`을 곱하여 바디 스케일에 맞게 페이스 위치를 보정한다. (`faceOffset.x * bodyScale / resolution`)
- [ ] `character-sprite-animator.svelte`의 `handTransform`에서 translate 값에 `bodyScale`을 곱하여 바디 스케일에 맞게 핸드(아이템) 위치를 보정한다. (`handOffset.x * bodyScale / resolution`)
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
