import type {
	CharacterBodyStateType,
	CharacterFaceStateType,
	BuildingStateType,
	ItemStateType,
	TileStateType,
	ColliderType,
	NeedBehavior,
	ConditionBehavior,
	NeedBehaviorAction,
	ConditionBehaviorAction,
	OnceInteractionType,
	FulfillInteractionType,
	SystemInteractionType,
} from '$lib/types';
import { josa } from './josa';

const COLLIDER_TYPE_LABELS: Record<ColliderType, string> = {
	circle: '원형',
	rectangle: '사각형',
};

const CHARACTER_BODY_STATE_LABELS: Record<CharacterBodyStateType, string> = {
	idle: '기본',
	walk: '걷기',
	run: '달리기',
	jump: '점프',
	pick: '줍기',
};

const CHARACTER_FACE_STATE_LABELS: Record<CharacterFaceStateType, string> = {
	idle: '기본',
	happy: '행복',
	sad: '슬픔',
	angry: '화남',
};

const BUILDING_STATE_LABELS: Record<BuildingStateType, string> = {
	idle: '기본',
	damaged: '손상됨',
	planning: '계획 중',
	constructing: '건설 중',
};

const ONCE_INTERACTION_TYPE_LABELS: Record<OnceInteractionType, string> = {
	item_use: '아이템 사용',
	building_use: '건물 사용',
	building_construct: '건물 건설',
	building_demolish: '건물 철거',
};

const FULFILL_INTERACTION_TYPE_LABELS: Record<FulfillInteractionType, string> = {
	building_repair: '건물 수리',
	building_clean: '건물 청소',
	building_use: '건물 사용',
	character_hug: '캐릭터 포옹',
};

const SYSTEM_INTERACTION_TYPE_LABELS: Record<SystemInteractionType, string> = {
	item_pick: '아이템 줍기',
};

export function getColliderTypeLabel(type: ColliderType): string {
	return COLLIDER_TYPE_LABELS[type];
}

export function getCharacterBodyStateLabel(state: CharacterBodyStateType): string {
	return CHARACTER_BODY_STATE_LABELS[state];
}

export function getCharacterFaceStateLabel(state: CharacterFaceStateType): string {
	return CHARACTER_FACE_STATE_LABELS[state];
}

export function getBuildingStateLabel(state: BuildingStateType): string {
	return BUILDING_STATE_LABELS[state];
}

export function getOnceInteractionTypeLabel(type: OnceInteractionType): string {
	return ONCE_INTERACTION_TYPE_LABELS[type];
}

export function getOnceInteractionTypeOptions(): { value: OnceInteractionType; label: string }[] {
	return Object.entries(ONCE_INTERACTION_TYPE_LABELS).map(([value, label]) => ({
		value: value as OnceInteractionType,
		label,
	}));
}

export function getFulfillInteractionTypeLabel(type: FulfillInteractionType): string {
	return FULFILL_INTERACTION_TYPE_LABELS[type];
}

export function getFulfillInteractionTypeOptions(): {
	value: FulfillInteractionType;
	label: string;
}[] {
	return Object.entries(FULFILL_INTERACTION_TYPE_LABELS).map(([value, label]) => ({
		value: value as FulfillInteractionType,
		label,
	}));
}

export function getSystemInteractionTypeLabel(type: SystemInteractionType): string {
	return SYSTEM_INTERACTION_TYPE_LABELS[type];
}

export function getSystemInteractionTypeOptions(): {
	value: SystemInteractionType;
	label: string;
}[] {
	return Object.entries(SYSTEM_INTERACTION_TYPE_LABELS).map(([value, label]) => ({
		value: value as SystemInteractionType,
		label,
	}));
}

// Building interaction type options
export function getBuildingOnceInteractionTypeOptions(): {
	value: OnceInteractionType;
	label: string;
}[] {
	return [
		{ value: 'building_use', label: ONCE_INTERACTION_TYPE_LABELS.building_use },
		{ value: 'building_construct', label: ONCE_INTERACTION_TYPE_LABELS.building_construct },
		{ value: 'building_demolish', label: ONCE_INTERACTION_TYPE_LABELS.building_demolish },
	];
}

export function getBuildingFulfillInteractionTypeOptions(): {
	value: FulfillInteractionType;
	label: string;
}[] {
	return [
		{ value: 'building_repair', label: FULFILL_INTERACTION_TYPE_LABELS.building_repair },
		{ value: 'building_clean', label: FULFILL_INTERACTION_TYPE_LABELS.building_clean },
	];
}

export function getBuildingSystemInteractionTypeOptions(): {
	value: SystemInteractionType;
	label: string;
}[] {
	return [];
}

// Item interaction type options
export function getItemOnceInteractionTypeOptions(): {
	value: OnceInteractionType;
	label: string;
}[] {
	return [{ value: 'item_use', label: ONCE_INTERACTION_TYPE_LABELS.item_use }];
}

export function getItemFulfillInteractionTypeOptions(): {
	value: FulfillInteractionType;
	label: string;
}[] {
	return [];
}

export function getItemSystemInteractionTypeOptions(): {
	value: SystemInteractionType;
	label: string;
}[] {
	return [{ value: 'item_pick', label: SYSTEM_INTERACTION_TYPE_LABELS.item_pick }];
}

// Character interaction type options
export function getCharacterOnceInteractionTypeOptions(): {
	value: OnceInteractionType;
	label: string;
}[] {
	return [];
}

export function getCharacterFulfillInteractionTypeOptions(): {
	value: FulfillInteractionType;
	label: string;
}[] {
	return [{ value: 'character_hug', label: FULFILL_INTERACTION_TYPE_LABELS.character_hug }];
}

export function getCharacterSystemInteractionTypeOptions(): {
	value: SystemInteractionType;
	label: string;
}[] {
	return [];
}

// Backward compatibility - 구버전 함수명 유지 (once/fulfill/system 모두 합쳐서 반환)
export function getBehaviorInteractTypeLabel(
	type: OnceInteractionType | FulfillInteractionType | SystemInteractionType
): string {
	if (type in ONCE_INTERACTION_TYPE_LABELS) {
		return ONCE_INTERACTION_TYPE_LABELS[type as OnceInteractionType];
	}
	if (type in SYSTEM_INTERACTION_TYPE_LABELS) {
		return SYSTEM_INTERACTION_TYPE_LABELS[type as SystemInteractionType];
	}
	return FULFILL_INTERACTION_TYPE_LABELS[type as FulfillInteractionType];
}

export function getBehaviorInteractTypeOptions(): {
	value: OnceInteractionType | FulfillInteractionType;
	label: string;
}[] {
	return [...getOnceInteractionTypeOptions(), ...getFulfillInteractionTypeOptions()];
}

const ITEM_STATE_LABELS: Record<ItemStateType, string> = {
	idle: '기본',
	broken: '파손',
};

export function getItemStateLabel(state: ItemStateType): string {
	return ITEM_STATE_LABELS[state];
}

const TILE_STATE_LABELS: Record<TileStateType, string> = {
	idle: '기본',
	damaged_1: '손상 1단계',
	damaged_2: '손상 2단계',
};

export function getTileStateLabel(state: TileStateType): string {
	return TILE_STATE_LABELS[state];
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

// Behavior Action 라벨 생성
export function getBehaviorActionLabel(params: {
	action: NeedBehaviorAction | ConditionBehaviorAction;
	buildingName?: string;
	itemName?: string;
}): string {
	const { action, buildingName, itemName } = params;

	// target 결정
	let target: string | undefined;
	if (action.target_selection_method === 'search') {
		target = '새로운 탐색 대상';
	} else if (action.target_selection_method === 'explicit') {
		if (buildingName) {
			target = buildingName;
		} else if (itemName) {
			target = itemName;
		}
	}

	if (action.type === 'once') {
		return target ? `${josa(target, '와과')} 상호작용` : '상호작용';
	}

	if (action.type === 'fulfill') {
		return target ? `${target}에서 욕구 충족` : '욕구 충족';
	}

	if (action.type === 'idle') {
		return `${action.idle_duration_ticks}틱 동안 대기`;
	}

	return action.type;
}
