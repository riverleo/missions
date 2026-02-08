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
	BehaviorInteractionType,
	InteractionType,
	Label,
	BehaviorActionType,
	BuildingInteractionAction,
	ItemInteractionAction,
	CharacterInteractionAction,
} from '$lib/types';
import { josa } from './josa';
import { useCharacter, useBuilding, useItem, useInteraction } from '$lib/hooks';

// ============================================================
// Common Labels
// ============================================================

const ACTION_LABELS = {
	create: '생성',
	creating: '생성 중...',
	createAction: '생성하기',
	update: '수정',
	updating: '수정 중...',
	updateAction: '수정하기',
	save: '저장',
	saving: '저장 중...',
	saveAction: '저장하기',
	delete: '삭제',
	deleting: '삭제 중...',
	deleteAction: '삭제하기',
	cancel: '취소',
	confirm: '확인',
} as const;

const TOGGLE_LABELS = {
	show: '보기',
	hide: '숨기기',
	open: '열기',
	close: '닫기',
} as const;

const FORM_LABELS = {
	name: '이름',
	title: '제목',
	width: '가로',
	height: '세로',
	radius: '반지름',
	x: 'X',
	y: 'Y',
	min: '최소',
	max: '최대',
} as const;

const DOMAIN_LABELS = {
	building: '건물',
	character: '캐릭터',
	item: '아이템',
	quest: '퀘스트',
	chapter: '챕터',
	scenario: '시나리오',
	terrain: '지형',
	tile: '타일',
	need: '욕구',
	condition: '컨디션',
	behavior: '행동',
	interaction: '인터랙션',
	world: '월드',
	task: '할 일',
} as const;

const FALLBACK_LABELS = {
	untitled: '제목없음',
	unnamed: '이름없음',
	noChapter: '챕터 없음',
	noDurability: '최대 내구도 없음',
	all: '모두',
	allCharacters: '모든 캐릭터',
	select: '선택',
} as const;

// ============================================================
// Getter Functions
// ============================================================

export function getActionString(key: keyof typeof ACTION_LABELS): string {
	return ACTION_LABELS[key];
}

export function getToggleString(key: keyof typeof TOGGLE_LABELS): string {
	return TOGGLE_LABELS[key];
}

export function getFormString(key: keyof typeof FORM_LABELS): string {
	return FORM_LABELS[key];
}

export function getDomainString(key: keyof typeof DOMAIN_LABELS): string {
	return DOMAIN_LABELS[key];
}

export function getFallbackString(key: keyof typeof FALLBACK_LABELS): string {
	return FALLBACK_LABELS[key];
}

// ============================================================
// Fallback Helper Functions
// ============================================================

export function getUntitledWithId(id: string): string {
	const shortId = id.split('-')[0];
	return `${FALLBACK_LABELS.untitled} (${shortId})`;
}

export function getUnnamedWithId(id: string): string {
	const shortId = id.split('-')[0];
	return `${FALLBACK_LABELS.unnamed} (${shortId})`;
}

export function getDisplayTitle(title: string | undefined | null, id: string): string {
	return title || getUntitledWithId(id);
}

export function getDisplayName(name: string | undefined | null, id: string): string {
	return name || getUnnamedWithId(id);
}

// ============================================================
// State/Type Labels
// ============================================================

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

export function getColliderTypeString(type: ColliderType): string {
	return COLLIDER_TYPE_LABELS[type];
}

export function getCharacterBodyStateString(state: CharacterBodyStateType): string {
	return CHARACTER_BODY_STATE_LABELS[state];
}

export function getCharacterFaceStateString(state: CharacterFaceStateType): string {
	return CHARACTER_FACE_STATE_LABELS[state];
}

export function getBuildingStateString(state: BuildingStateType): string {
	return BUILDING_STATE_LABELS[state];
}


// Type guards for interaction types
export function isOnceInteractionType(
	type: BehaviorInteractionType
): type is OnceInteractionType {
	return type in ONCE_INTERACTION_TYPE_LABELS;
}

export function isFulfillInteractionType(
	type: BehaviorInteractionType
): type is FulfillInteractionType {
	return type in FULFILL_INTERACTION_TYPE_LABELS;
}

export function isSystemInteractionType(
	type: BehaviorInteractionType
): type is SystemInteractionType {
	return type in SYSTEM_INTERACTION_TYPE_LABELS;
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

// Get interaction type labels by domain
export function getBehaviorInteractionTypeLabels(
	interactionType: InteractionType
): Label<BehaviorInteractionType>[] {
	switch (interactionType) {
		case 'building':
			return [
				{ value: 'building_use', label: ONCE_INTERACTION_TYPE_LABELS.building_use },
				{ value: 'building_construct', label: ONCE_INTERACTION_TYPE_LABELS.building_construct },
				{ value: 'building_demolish', label: ONCE_INTERACTION_TYPE_LABELS.building_demolish },
				{ value: 'building_repair', label: FULFILL_INTERACTION_TYPE_LABELS.building_repair },
				{ value: 'building_clean', label: FULFILL_INTERACTION_TYPE_LABELS.building_clean },
			];
		case 'item':
			return [
				{ value: 'item_use', label: ONCE_INTERACTION_TYPE_LABELS.item_use },
				{ value: 'item_pick', label: SYSTEM_INTERACTION_TYPE_LABELS.item_pick },
			];
		case 'character':
			return [{ value: 'character_hug', label: FULFILL_INTERACTION_TYPE_LABELS.character_hug }];
	}
}

// Backward compatibility - 구버전 함수명 유지 (once/fulfill/system 모두 합쳐서 반환)
export function getBehaviorInteractTypeString(type: BehaviorInteractionType): string {
	if (type in ONCE_INTERACTION_TYPE_LABELS) {
		return ONCE_INTERACTION_TYPE_LABELS[type as OnceInteractionType];
	}
	if (type in SYSTEM_INTERACTION_TYPE_LABELS) {
		return SYSTEM_INTERACTION_TYPE_LABELS[type as SystemInteractionType];
	}
	return FULFILL_INTERACTION_TYPE_LABELS[type as FulfillInteractionType];
}

const ITEM_STATE_LABELS: Record<ItemStateType, string> = {
	idle: '기본',
	broken: '파손',
};

export function getItemStateString(state: ItemStateType): string {
	return ITEM_STATE_LABELS[state];
}

const TILE_STATE_LABELS: Record<TileStateType, string> = {
	idle: '기본',
	damaged_1: '손상 1단계',
	damaged_2: '손상 2단계',
};

export function getTileStateString(state: TileStateType): string {
	return TILE_STATE_LABELS[state];
}

const BEHAVIOR_ACTION_TYPE_LABELS: Record<BehaviorActionType, string> = {
	once: '한번 실행',
	fulfill: '반복 실행',
	idle: '대기',
};

export function getBehaviorActionTypeString(type: BehaviorActionType): string {
	return BEHAVIOR_ACTION_TYPE_LABELS[type];
}

const NEED_FULFILLMENT_TASK_CONDITION_LABELS: Record<string, string> = {
	completed: '완료',
	created: '생성',
};

export function getNeedFulfillmentTaskConditionString(condition: string): string {
	return NEED_FULFILLMENT_TASK_CONDITION_LABELS[condition] ?? condition;
}

// Behavior 라벨 생성 함수들
export function getNeedBehaviorString(behavior: NeedBehavior): string {
	const { getNeed, getCharacter } = useCharacter();
	const name = getUnnamedWithId(behavior.id);
	const need = behavior.need_id ? getNeed(behavior.need_id).name : '욕구';
	const character = behavior.character_id
		? getCharacter(behavior.character_id).name
		: getFallbackString('allCharacters');
	return `${behavior.name || name} - ${character} (${need} ${behavior.need_threshold} 이하)`;
}

// Behavior Action 라벨 생성
export function getBehaviorActionString(
	action: NeedBehaviorAction | ConditionBehaviorAction
): string {
	const { getBuilding } = useBuilding();
	const { getItem } = useItem();
	const { getCharacter } = useCharacter();
	const { getBuildingInteraction, getItemInteraction, getCharacterInteraction } =
		useInteraction();

	// target 결정
	let target: string | undefined;
	if (action.target_selection_method === 'search') {
		target = '새로운 탐색 대상';
	} else if (action.target_selection_method === 'explicit') {
		if (action.building_interaction_id) {
			const interaction = getBuildingInteraction(action.building_interaction_id);
			if (interaction) target = getBuilding(interaction.building_id).name;
		} else if (action.item_interaction_id) {
			const interaction = getItemInteraction(action.item_interaction_id);
			if (interaction) target = getItem(interaction.item_id).name;
		} else if (action.character_interaction_id) {
			const interaction = getCharacterInteraction(action.character_interaction_id);
			if (interaction) target = getCharacter(interaction.target_character_id).name;
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

// ============================================================
// Interaction Helper Functions
// ============================================================

export function getInteractionTargetNameString(
	action: NeedBehaviorAction | ConditionBehaviorAction
): string | undefined {
	const { getBuilding } = useBuilding();
	const { getItem } = useItem();
	const { getCharacter } = useCharacter();
	const { getBuildingInteraction, getItemInteraction, getCharacterInteraction } =
		useInteraction();

	if (action.building_interaction_id) {
		const interaction = getBuildingInteraction(action.building_interaction_id);
		if (!interaction) return undefined;
		const building = getBuilding(interaction.building_id);
		return `"${building.name ?? '건물'}" 건물`;
	}

	if (action.item_interaction_id) {
		const interaction = getItemInteraction(action.item_interaction_id);
		if (!interaction) return undefined;
		const item = getItem(interaction.item_id);
		return `"${item.name ?? '아이템'}" 아이템`;
	}

	if (action.character_interaction_id) {
		const interaction = getCharacterInteraction(action.character_interaction_id);
		if (!interaction) return undefined;
		const character = getCharacter(interaction.target_character_id);
		return `"${character.name ?? '캐릭터'}" 캐릭터`;
	}

	return undefined;
}

export function getInteractionBehaviorLabelString(
	action: NeedBehaviorAction | ConditionBehaviorAction
): string | undefined {
	const { getBuildingInteraction, getItemInteraction, getCharacterInteraction } =
		useInteraction();

	if (action.building_interaction_id) {
		const interaction = getBuildingInteraction(action.building_interaction_id);
		if (!interaction) return undefined;
		const interactionType =
			interaction.once_interaction_type || interaction.fulfill_interaction_type;
		if (!interactionType) return undefined;
		return getBehaviorInteractTypeString(interactionType);
	}

	if (action.item_interaction_id) {
		const interaction = getItemInteraction(action.item_interaction_id);
		if (!interaction) return undefined;
		const interactionType =
			interaction.once_interaction_type || interaction.fulfill_interaction_type;
		if (!interactionType) return undefined;
		return getBehaviorInteractTypeString(interactionType);
	}

	if (action.character_interaction_id) {
		const interaction = getCharacterInteraction(action.character_interaction_id);
		if (!interaction) return undefined;
		const interactionType =
			interaction.once_interaction_type || interaction.fulfill_interaction_type;
		if (!interactionType) return undefined;
		return getBehaviorInteractTypeString(interactionType);
	}

	return undefined;
}

export function getTargetSelectionMethodLabelString(
	action: NeedBehaviorAction | ConditionBehaviorAction
): string {
	if (!action.target_selection_method) return '타깃 결정 방법';

	if (action.target_selection_method === 'search') {
		return '새로운 탐색 대상';
	}

	if (action.target_selection_method === 'explicit') {
		const { getBuilding } = useBuilding();
		const { getItem } = useItem();
		const { getCharacter } = useCharacter();
		const { getBuildingInteraction, getItemInteraction, getCharacterInteraction } =
			useInteraction();

		if (action.building_interaction_id) {
			const interaction = getBuildingInteraction(action.building_interaction_id);
			if (interaction) {
				const building = getBuilding(interaction.building_id);
				const interactionType =
					interaction.once_interaction_type || interaction.fulfill_interaction_type;
				if (interactionType) {
					return `${building.name ?? '건물'} - ${getBehaviorInteractTypeString(interactionType)}`;
				}
			}
		}

		if (action.item_interaction_id) {
			const interaction = getItemInteraction(action.item_interaction_id);
			if (interaction) {
				const item = getItem(interaction.item_id);
				const interactionType =
					interaction.once_interaction_type || interaction.fulfill_interaction_type;
				if (interactionType) {
					return `${item.name ?? '아이템'} - ${getBehaviorInteractTypeString(interactionType)}`;
				}
			}
		}

		if (action.character_interaction_id) {
			const interaction = getCharacterInteraction(action.character_interaction_id);
			if (interaction) {
				const character = getCharacter(interaction.target_character_id);
				const interactionType =
					interaction.once_interaction_type || interaction.fulfill_interaction_type;
				if (interactionType) {
					return `${character.name ?? '캐릭터'} - ${getBehaviorInteractTypeString(interactionType)}`;
				}
			}
		}

		return '지정된 대상';
	}

	return '타깃 결정 방법';
}

export function getInteractionActionSummaryString(
	action: BuildingInteractionAction | ItemInteractionAction | CharacterInteractionAction
): string {
	const duration = action.duration_ticks > 0 ? `${action.duration_ticks}틱 동안 ` : '';
	const face = `"${getCharacterFaceStateString(action.character_face_state_type)}" 표정으로 `;
	const body = `"${getCharacterBodyStateString(action.character_body_state_type)}"`;

	return `${duration}${face}${body}`;
}
