import type {
	CharacterBodyStateType,
	CharacterFaceStateType,
	BuildingStateType,
	CharacterBehaviorType,
	ItemStateType,
} from '$lib/types';

const characterBodyStateLabels: Record<CharacterBodyStateType, string> = {
	idle: '대기',
	walk: '걷기',
	run: '달리기',
	jump: '점프',
};

const characterFaceStateLabels: Record<CharacterFaceStateType, string> = {
	idle: '평온',
	happy: '행복',
	sad: '슬픔',
	angry: '화남',
};

const buildingStateLabels: Record<BuildingStateType, string> = {
	idle: '대기',
	damaged: '손상됨',
	planning: '건설 중',
};

const characterBehaviorTypeLabels: Record<CharacterBehaviorType, string> = {
	demolish: '철거',
	use: '사용',
	repair: '수리',
	clean: '청소',
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

export function getCharacterBehaviorTypeLabel(type: CharacterBehaviorType): string {
	return characterBehaviorTypeLabels[type];
}

const itemStateLabels: Record<ItemStateType, string> = {
	idle: '정상',
	broken: '파손',
};

export function getItemStateLabel(state: ItemStateType): string {
	return itemStateLabels[state];
}
