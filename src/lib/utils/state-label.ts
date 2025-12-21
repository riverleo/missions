import type { CharacterStateType, BuildingStateType } from '$lib/types';

const characterStateLabels: Record<CharacterStateType, string> = {
	idle: '대기',
	walk: '걷기',
	jump: '점프',
	eating: '먹기',
	sleeping: '수면',
	angry: '화남',
	sad: '슬픔',
	happy: '행복',
};

const buildingStateLabels: Record<BuildingStateType, string> = {
	idle: '대기',
	damaged: '손상됨',
	planning: '계획됨',
};

export function getCharacterStateLabel(state: CharacterStateType): string {
	return characterStateLabels[state];
}

export function getBuildingStateLabel(state: BuildingStateType): string {
	return buildingStateLabels[state];
}
