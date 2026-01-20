import type {
	CharacterBodyStateType,
	CharacterFaceStateType,
	BuildingStateType,
	CharacterBehaviorType,
	ItemStateType,
	TileStateType,
	ColliderType,
	NeedBehavior,
	ConditionBehavior,
	ItemBehavior,
} from '$lib/types';

const colliderTypeLabels: Record<ColliderType, string> = {
	circle: '원형',
	rectangle: '사각형',
};

const characterBodyStateLabels: Record<CharacterBodyStateType, string> = {
	idle: '기본',
	walk: '걷기',
	run: '달리기',
	jump: '점프',
	pick: '줍기',
};

const characterFaceStateLabels: Record<CharacterFaceStateType, string> = {
	idle: '기본',
	happy: '행복',
	sad: '슬픔',
	angry: '화남',
};

const buildingStateLabels: Record<BuildingStateType, string> = {
	idle: '기본',
	damaged: '손상됨',
	planning: '계획 중',
	constructing: '건설 중',
};

const characterBehaviorTypeLabels: Record<CharacterBehaviorType, string> = {
	demolish: '철거',
	use: '사용',
	repair: '수리',
	clean: '청소',
	pick: '줍기',
};

export function getColliderTypeLabel(type: ColliderType): string {
	return colliderTypeLabels[type];
}

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
	idle: '기본',
	broken: '파손',
};

export function getItemStateLabel(state: ItemStateType): string {
	return itemStateLabels[state];
}

const tileStateLabels: Record<TileStateType, string> = {
	idle: '기본',
	damaged_1: '손상 1단계',
	damaged_2: '손상 2단계',
};

export function getTileStateLabel(state: TileStateType): string {
	return tileStateLabels[state];
}

// Behavior 라벨 생성 함수들
export function getNeedBehaviorLabel(params: {
	behavior: NeedBehavior;
	needName?: string;
	characterName?: string;
}): { title: string; description: string } {
	const { behavior, needName, characterName } = params;
	return {
		title: behavior.name || `이름없음 (${behavior.id.split('-')[0]})`,
		description: `${characterName ?? '모든 캐릭터'} (${needName ?? '욕구'} ${behavior.need_threshold} 이하)`,
	};
}

export function getConditionBehaviorLabel(params: {
	behavior: ConditionBehavior;
	buildingName?: string;
	conditionName?: string;
	characterName?: string;
}): { title: string; description: string } {
	const { behavior, buildingName, conditionName, characterName } = params;
	return {
		title: `${buildingName ?? '건물'} 행동`,
		description: `${characterName ?? '모든 캐릭터'} (${conditionName ?? '컨디션'} ${behavior.condition_threshold} 이하)`,
	};
}

export function getItemBehaviorLabel(params: {
	behavior: ItemBehavior;
	itemName?: string;
	characterName?: string;
}): { title: string; description: string } {
	const { behavior, itemName, characterName } = params;
	return {
		title: `${itemName ?? '아이템'} ${getCharacterBehaviorTypeLabel(behavior.character_behavior_type)}`,
		description: `${characterName ?? '모든 캐릭터'}${behavior.durability_threshold !== null ? ` (내구도 ${behavior.durability_threshold} 이하)` : ''}`,
	};
}
