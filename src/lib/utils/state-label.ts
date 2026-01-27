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
	NeedBehaviorAction,
	ConditionBehaviorAction,
	BehaviorActionType,
	BehaviorTargetSelectionMethod,
} from '$lib/types';
import { josa } from './josa';

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
	} else if (action.target_selection_method === 'search_or_continue') {
		target = '기존 선택 대상';
	} else if (action.target_selection_method === 'explicit') {
		if (buildingName) {
			target = buildingName;
		} else if (itemName) {
			target = itemName;
		}
	}

	const behaviorLabel = getBehaviorInteractTypeLabel(action.behavior_interact_type);

	if (action.type === 'go') {
		if (behaviorLabel && target) {
			return `${josa(behaviorLabel, '을를')} 위해 ${josa(target, '으로로')} 이동`;
		}
		if (behaviorLabel) {
			return `${josa(behaviorLabel, '을를')} 위해 이동`;
		}
		return target ? `${josa(target, '으로로')} 이동` : '자동 이동';
	}

	if (action.type === 'interact') {
		const completionLabel =
			action.behavior_completion_type === 'fixed'
				? `${action.duration_ticks}틱 동안`
				: getBehaviorCompletionTypeLabel(action.behavior_completion_type);

		// target_selection_method에 따른 라벨인 경우 단순 조합
		if (
			behaviorLabel &&
			target &&
			(action.target_selection_method === 'search' ||
				action.target_selection_method === 'search_or_continue')
		) {
			return `${josa(target, '을를')} ${completionLabel} ${behaviorLabel}`;
		}
		// 명시적 대상이 지정된 경우
		if (behaviorLabel && target) {
			return `${josa(target, '을를')} ${completionLabel} ${behaviorLabel}`;
		}
		if (behaviorLabel) {
			return `${completionLabel} ${behaviorLabel}`;
		}
		return target ? `${josa(target, '와과')} 상호작용` : '자동 상호작용';
	}

	if (action.type === 'idle') {
		const completionLabel =
			action.behavior_completion_type === 'fixed'
				? `${action.duration_ticks}틱 동안`
				: getBehaviorCompletionTypeLabel(action.behavior_completion_type);
		return `${completionLabel} 대기`;
	}

	return action.type;
}

