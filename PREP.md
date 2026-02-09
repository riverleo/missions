need-behavior-create-dialog, need-behavior-update-dialog의 faceStateOptions를 label.ts로 이동.
building-interaction-action-node-panel의 bodyStateTypes, faceStateTypes

character-action-panel -> bodyStateTypes. constraints로 이동.
character-create-dialog, character-update-dialog -> selectedBodyLabel label.ts로 이동.
character-face-state-item-group => stateTypes constraints로 이동.
character-body-action-panel -> colliderTypes. constaintts로 이동.
character-body-state-item -> faceStateOptions. constraints로 이동.
character-body-state-item-group -> stateTypes. constraints로 이동.

character-interaction-action-node-panel -> bodyStateTypes, faceStateTypes. label.ts로 이동.
  selectedBodyStateLabel, selectedFaceStateLabel, selectedTargetBodyStateLabel, selectedTargetFaceStateLabel는 label.ts에서 getXXString으로 리팩토링.

character-interaction-command -> getInteractionLabel 함수 label.ts로 이동.


character-interaction-command의 L56보면 타입 에러가 나는데 기존의 getOrUndefineXX 함수들이 전달인자를 string | null | undefined를 허용해주는 방식으로 개선.

condition-effect-node의 L27의 label을 label.ts로 이동.

condition-effect-node-panel의 selectedCharacterLabel, selectedNeedLabel을 label.ts로 이동

condition-fulfillment-node의 typeLabel을 label.ts로 이동.

condition-fulfillment-node-panel selectedTargetLabel을 label.ts로 이동.

위의 작업 내용을 바탕으로 condition-behavior, item, item-interaction, narrative, need, need-behavior, quest, sidebar, terrain, terrain-files, test-world, tile 등의 컴포넌트도 정리해주길 바람.

behavior-priority부터 condition까지는 내가 함.

주로 작업한 것은 store 참조하던 코드를 getter로 치환하고 변수의 네이밍을 올바르게 수정.
