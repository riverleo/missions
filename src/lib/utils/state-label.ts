import type { CharacterBodyStateType, CharacterFaceStateType, BuildingStateType } from '$lib/types';

const characterBodyStateLabels: Record<CharacterBodyStateType, string> = {
	idle: '대기',
	walk: '걷기',
	jump: '점프',
	eating: '먹기',
	sleeping: '수면',
};

const characterFaceStateLabels: Record<CharacterFaceStateType, string> = {
	neutral: '무표정',
	happy: '행복',
	sad: '슬픔',
	angry: '화남',
};

const buildingStateLabels: Record<BuildingStateType, string> = {
	idle: '대기',
	damaged: '손상됨',
	planning: '건설 중',
};

export function getCharacterBodyStateLabel(state: CharacterBodyStateType): string {
	return characterBodyStateLabels[state];
}

export function getCharacterFaceStateLabel(state: CharacterFaceStateType): string {
	return characterFaceStateLabels[state];
}

export function getBuildingStateLabel(state: BuildingStateType): string {
	return buildingStateLabels[state];
}
