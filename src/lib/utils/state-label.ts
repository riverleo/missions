import type {
	CharacterBodyStateType,
	CharacterFaceStateType,
	BuildingStateType,
	BehaviorInteractType,
	BehaviorCompletionType,
	ItemStateType,
	TileStateType,
	ColliderType,
	NeedBehavior,
	ConditionBehavior,
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

const behaviorInteractTypeLabels: Record<BehaviorInteractType, string> = {
	building_execute: '건물 사용',
	building_demolish: '건물 철거',
	building_repair: '건물 수리',
	building_clean: '건물 청소',
	item_pick: '아이템 줍기',
	item_use: '아이템 사용',
};

const behaviorCompletionTypeLabels: Record<BehaviorCompletionType, string> = {
	fixed: '고정 시간',
	completion: '목표 달성까지',
	immediate: '즉시',
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

export function getBehaviorInteractTypeLabel(type: BehaviorInteractType): string {
	return behaviorInteractTypeLabels[type];
}

export function getBehaviorInteractTypeOptions(): { value: BehaviorInteractType; label: string }[] {
	return Object.entries(behaviorInteractTypeLabels).map(([value, label]) => ({
		value: value as BehaviorInteractType,
		label,
	}));
}

export function getBehaviorCompletionTypeLabel(type: BehaviorCompletionType): string {
	return behaviorCompletionTypeLabels[type];
}

export function getBehaviorCompletionTypeOptions(): {
	value: BehaviorCompletionType;
	label: string;
}[] {
	return Object.entries(behaviorCompletionTypeLabels).map(([value, label]) => ({
		value: value as BehaviorCompletionType,
		label,
	}));
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

