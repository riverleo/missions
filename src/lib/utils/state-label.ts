import type {
	CharacterBodyStateType,
	CharacterFaceStateType,
	BuildingStateType,
	BuildingBehaviorType,
} from '$lib/types';

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

const buildingBehaviorTypeLabels: Record<BuildingBehaviorType, string> = {
	demolish: '철거',
	use: '사용',
	repair: '수리',
	refill: '보충',
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

export function getBuildingBehaviorTypeLabel(type: BuildingBehaviorType): string {
	return buildingBehaviorTypeLabels[type];
}
