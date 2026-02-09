import type {
	CharacterBodyStateType,
	CharacterFaceStateType,
	BuildingStateType,
	ItemStateType,
	TileStateType,
	ColliderType,
	NeedBehavior,
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
	BehaviorAction,
	NeedFulfillment,
	ConditionFulfillment,
	BuildingInteraction,
	ItemInteraction,
	CharacterInteraction,
	ScenarioId,
	ChapterId,
	QuestId,
	NarrativeId,
	TerrainId,
	CharacterId,
	CharacterBodyId,
	BuildingId,
	BuildingInteractionId,
	CharacterInteractionId,
	ItemInteractionId,
	ConditionId,
	ConditionBehaviorId,
	ItemId,
	NeedId,
	NeedBehaviorId,
} from '$lib/types';
import { get } from 'svelte/store';
import { josa } from './josa';
import {
	useCharacter,
	useBuilding,
	useItem,
	useInteraction,
	useScenario,
	useChapter,
	useQuest,
	useNarrative,
	useTerrain,
	useBehavior,
} from '$lib/hooks';

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

export function getColliderTypeLabels(): Label<ColliderType>[] {
	return Object.entries(COLLIDER_TYPE_LABELS).map(([value, label]) => ({
		value: value as ColliderType,
		label,
	}));
}

export function getCharacterBodyStateString(state: CharacterBodyStateType | undefined): string {
	if (!state) return '캐릭터 바디';
	return CHARACTER_BODY_STATE_LABELS[state];
}

export function getCharacterBodyStateLabels(): Label<CharacterBodyStateType>[] {
	return Object.entries(CHARACTER_BODY_STATE_LABELS).map(([value, label]) => ({
		value: value as CharacterBodyStateType,
		label,
	}));
}

export function getCharacterFaceStateString(state: CharacterFaceStateType | undefined): string {
	if (!state) return '캐릭터 표정';
	return CHARACTER_FACE_STATE_LABELS[state];
}

export function getCharacterFaceStateLabels(): Label<CharacterFaceStateType>[] {
	return Object.entries(CHARACTER_FACE_STATE_LABELS).map(([value, label]) => ({
		value: value as CharacterFaceStateType,
		label,
	}));
}

export function getBuildingStateString(state: BuildingStateType): string {
	return BUILDING_STATE_LABELS[state];
}

export function getBuildingStateTypeLabels(): Label<BuildingStateType>[] {
	return Object.entries(BUILDING_STATE_LABELS).map(([value, label]) => ({
		value: value as BuildingStateType,
		label,
	}));
}

// Type guards for interaction types
export function isOnceInteractionType(type: BehaviorInteractionType): type is OnceInteractionType {
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

export function getBehaviorActionTypeLabelByType(type: BehaviorActionType | undefined): string {
	if (!type) return '액션 타입';
	return BEHAVIOR_ACTION_TYPE_LABELS[type];
}

export function getBehaviorActionTypeString(
	behaviorAction: NeedBehaviorAction | ConditionBehaviorAction | undefined
): string {
	if (!behaviorAction) return '액션 타입';

	return BEHAVIOR_ACTION_TYPE_LABELS[behaviorAction.type];
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

// Behavior Priority 라벨 생성 함수들
export function getNeedBehaviorPriorityLabel(needBehaviorId: NeedBehaviorId): string | null {
	const { getOrUndefinedNeedBehavior } = useBehavior();
	const behavior = getOrUndefinedNeedBehavior(needBehaviorId);
	if (!behavior) return null;
	return getNeedBehaviorString(behavior);
}

export function getConditionBehaviorPriorityLabel(
	conditionBehaviorId: ConditionBehaviorId
): string | null {
	const { getOrUndefinedConditionBehavior } = useBehavior();
	const { getOrUndefinedCondition } = useBuilding();
	const { getOrUndefinedCharacter } = useCharacter();

	const behavior = getOrUndefinedConditionBehavior(conditionBehaviorId);
	if (!behavior) return null;

	const condition = getOrUndefinedCondition(behavior.condition_id);
	const character = getOrUndefinedCharacter(behavior.character_id);

	const name = getUnnamedWithId(behavior.id);
	const char = character?.name ?? getFallbackString('allCharacters');
	const cond = condition?.name ?? '컨디션';
	return `${behavior.name || name} - ${char} (${cond} ${behavior.condition_threshold} 이하)`;
}

// Behavior Action 라벨 생성
export function getBehaviorActionString(
	action: NeedBehaviorAction | ConditionBehaviorAction
): string {
	const { getBuilding, getBuildingCondition, getOrUndefinedConditionFulfillment } = useBuilding();
	const { getItem } = useItem();
	const { getCharacter, getOrUndefinedNeedFulfillment } = useCharacter();
	const { getBuildingInteraction, getItemInteraction, getCharacterInteraction } = useInteraction();

	// target 결정
	const targetNameString = getInteractionTargetNameString(action);
	const targetLabel = targetNameString || (action.target_selection_method === 'search' ? '새로운 탐색 대상' : undefined);

	// behavior 결정
	const behaviorLabel = getInteractionBehaviorLabelString(action);

	if (action.type === 'once') {
		if (behaviorLabel && targetLabel) {
			return `${josa(targetLabel, '을를')} ${behaviorLabel}`;
		}
		if (behaviorLabel) {
			return behaviorLabel;
		}
		return targetLabel ? `${josa(targetLabel, '와과')} 상호작용` : '자동 상호작용';
	}

	if (action.type === 'fulfill') {
		// fulfillment 대상 결정
		let fulfillment;
		if ('need_fulfillment_id' in action && action.need_fulfillment_id) {
			fulfillment = getOrUndefinedNeedFulfillment(action.need_fulfillment_id);
		} else if ('condition_fulfillment_id' in action && action.condition_fulfillment_id) {
			fulfillment = getOrUndefinedConditionFulfillment(action.condition_fulfillment_id);
		}

		let fulfillmentLabel = '자동';
		if (fulfillment) {
			if (fulfillment.building_interaction_id) {
				const interaction = getBuildingInteraction(fulfillment.building_interaction_id);
				if (interaction) {
					const building = getBuilding(interaction.building_id);
					fulfillmentLabel = building.name ?? '건물';
				}
			} else if (fulfillment.item_interaction_id) {
				const interaction = getItemInteraction(fulfillment.item_interaction_id);
				if (interaction) {
					const item = getItem(interaction.item_id);
					fulfillmentLabel = item.name ?? '아이템';
				}
			} else if (fulfillment.character_interaction_id) {
				const interaction = getCharacterInteraction(fulfillment.character_interaction_id);
				if (interaction) {
					const character = getCharacter(interaction.target_character_id);
					fulfillmentLabel = character.name ?? '캐릭터';
				}
			}
		}
		return `${fulfillmentLabel}으로 욕구 충족`;
	}

	if (action.type === 'idle') {
		const durationLabel = action.idle_duration_ticks
			? `${action.idle_duration_ticks}틱 동안`
			: '무한히';
		return `${durationLabel} 대기`;
	}

	return action.type;
}

// ============================================================
// Interaction Helper Functions
// ============================================================

export function getInteractionTargetNameString(
	action: NeedBehaviorAction | ConditionBehaviorAction | undefined
): string {
	if (!action) return '대상 없음';

	const { getBuilding } = useBuilding();
	const { getItem } = useItem();
	const { getCharacter } = useCharacter();
	const { getBuildingInteraction, getItemInteraction, getCharacterInteraction } = useInteraction();

	if (action.building_interaction_id) {
		const interaction = getBuildingInteraction(action.building_interaction_id);
		if (!interaction) return '대상 없음';
		const building = getBuilding(interaction.building_id);
		return `"${building.name ?? '건물'}" 건물`;
	}

	if (action.item_interaction_id) {
		const interaction = getItemInteraction(action.item_interaction_id);
		if (!interaction) return '대상 없음';
		const item = getItem(interaction.item_id);
		return `"${item.name ?? '아이템'}" 아이템`;
	}

	if (action.character_interaction_id) {
		const interaction = getCharacterInteraction(action.character_interaction_id);
		if (!interaction) return '대상 없음';
		const character = getCharacter(interaction.target_character_id);
		return `"${character.name ?? '캐릭터'}" 캐릭터`;
	}

	return '대상 없음';
}

export function getInteractionBehaviorLabelString(
	action: NeedBehaviorAction | ConditionBehaviorAction | undefined
): string {
	if (!action) return '상호작용';

	const { getBuildingInteraction, getItemInteraction, getCharacterInteraction } = useInteraction();

	if (action.building_interaction_id) {
		const interaction = getBuildingInteraction(action.building_interaction_id);
		if (!interaction) return '상호작용';
		const interactionType =
			interaction.once_interaction_type || interaction.fulfill_interaction_type;
		if (!interactionType) return '상호작용';
		return getBehaviorInteractTypeString(interactionType);
	}

	if (action.item_interaction_id) {
		const interaction = getItemInteraction(action.item_interaction_id);
		if (!interaction) return '상호작용';
		const interactionType =
			interaction.once_interaction_type || interaction.fulfill_interaction_type;
		if (!interactionType) return '상호작용';
		return getBehaviorInteractTypeString(interactionType);
	}

	if (action.character_interaction_id) {
		const characterInteraction = getCharacterInteraction(action.character_interaction_id);
		if (!characterInteraction) return '상호작용';
		const behaviorInteractionType =
			characterInteraction.once_interaction_type || characterInteraction.fulfill_interaction_type;
		if (!behaviorInteractionType) return '상호작용';
		return getBehaviorInteractTypeString(behaviorInteractionType);
	}

	return '상호작용';
}

export function getTargetSelectionMethodLabelString(
	action: ConditionBehaviorAction | NeedBehaviorAction | undefined
): string {
	if (!action || !action.target_selection_method) return '타깃 결정 방법';

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
	action: BuildingInteractionAction | ItemInteractionAction | CharacterInteractionAction | undefined
): string {
	if (!action) return '액션 정보 없음';

	const duration = action.duration_ticks > 0 ? `${action.duration_ticks}틱 동안 ` : '';
	const face = `"${getCharacterFaceStateString(action.character_face_state_type)}" 표정으로 `;
	const body = `"${getCharacterBodyStateString(action.character_body_state_type)}"`;

	return `${duration}${face}${body}`;
}

// ============================================================
// Additional Label Functions
// ============================================================

export function getQuestTypeString(type: 'primary' | 'secondary' | undefined): string {
	if (!type) return '퀘스트 타입';
	return type === 'primary' ? '메인' : '보조';
}

export function getNarrativeNodeTypeString(
	type: 'text' | 'choice' | undefined
): string {
	if (!type) return '노드 타입';
	return type === 'text' ? '텍스트' : '선택지';
}

export function getFulfillmentTargetLabelString(
	fulfillment: NeedFulfillment | ConditionFulfillment | undefined
): string {
	if (!fulfillment) return '상호작용 선택...';

	const { getBuilding } = useBuilding();
	const { getCharacter, getOrUndefinedCharacter } = useCharacter();
	const { getItem } = useItem();
	const {
		getOrUndefinedBuildingInteraction,
		getOrUndefinedItemInteraction,
		getOrUndefinedCharacterInteraction,
	} = useInteraction();

	try {
		// Building interaction
		if (fulfillment.fulfillment_type === 'building') {
			const interaction = getOrUndefinedBuildingInteraction(fulfillment.building_interaction_id);
			if (interaction) {
				const building = getBuilding(interaction.building_id);
				const character = getOrUndefinedCharacter(interaction.character_id);
				const interactionType =
					interaction.once_interaction_type || interaction.fulfill_interaction_type;
				const behaviorLabel = interactionType
					? getBehaviorInteractTypeString(interactionType)
					: '';
				const characterName = character ? character.name : getFallbackString('allCharacters');
				return `${building.name ?? '건물'} - ${characterName} ${behaviorLabel}`;
			}
		}

		// Character interaction (only in NeedFulfillment)
		if ('character_interaction_id' in fulfillment && fulfillment.fulfillment_type === 'character') {
			const interaction = getOrUndefinedCharacterInteraction(
				fulfillment.character_interaction_id
			);
			if (interaction) {
				const targetCharacter = getCharacter(interaction.target_character_id);
				const character = getOrUndefinedCharacter(interaction.character_id);
				const interactionType =
					interaction.once_interaction_type || interaction.fulfill_interaction_type;
				const behaviorLabel = interactionType
					? getBehaviorInteractTypeString(interactionType)
					: '';
				const characterName = character ? character.name : getFallbackString('allCharacters');
				return `${targetCharacter.name ?? '캐릭터'} - ${characterName} ${behaviorLabel}`;
			}
		}

		// Item interaction (only in NeedFulfillment)
		if ('item_interaction_id' in fulfillment && fulfillment.fulfillment_type === 'item') {
			const interaction = getOrUndefinedItemInteraction(fulfillment.item_interaction_id);
			if (interaction) {
				const item = getItem(interaction.item_id);
				const character = getOrUndefinedCharacter(interaction.character_id);
				const interactionType =
					interaction.once_interaction_type || interaction.fulfill_interaction_type;
				const behaviorLabel = interactionType
					? getBehaviorInteractTypeString(interactionType)
					: '';
				const characterName = character ? character.name : getFallbackString('allCharacters');
				return `${item.name ?? '아이템'} - ${characterName} ${behaviorLabel}`;
			}
		}
	} catch (error) {
		// If any data is missing, return fallback
		return '상호작용 선택...';
	}

	return '상호작용 선택...';
}

export function getInteractionLabelString(
	interaction: BuildingInteraction | ItemInteraction | CharacterInteraction | undefined
): string {
	if (!interaction) return '상호작용 선택...';

	const { getOrUndefinedCharacter } = useCharacter();
	const character = getOrUndefinedCharacter(interaction.character_id);
	const interactionType =
		interaction.once_interaction_type ||
		interaction.fulfill_interaction_type ||
		interaction.system_interaction_type;
	const behaviorLabel = interactionType ? getBehaviorInteractTypeString(interactionType) : '';
	const characterName = character ? character.name : getFallbackString('allCharacters');
	return `${characterName} ${behaviorLabel}`;
}

export function getBreadcrumbTitleString(
	id: string | undefined,
	prevSegment: string | undefined
): string | undefined {
	if (!id) return undefined;

	// Use getter functions or stores where getters aren't available yet
	if (prevSegment === 'scenarios') {
		const { scenarioStore } = useScenario();
		return get(scenarioStore).data?.[id as ScenarioId]?.title;
	}
	if (prevSegment === 'chapters') {
		const { chapterStore } = useChapter();
		return get(chapterStore).data?.[id as ChapterId]?.title;
	}
	if (prevSegment === 'quests') {
		const { questStore } = useQuest();
		return get(questStore).data?.[id as QuestId]?.title;
	}
	if (prevSegment === 'narratives') {
		const { narrativeStore } = useNarrative();
		return get(narrativeStore).data?.[id as NarrativeId]?.title;
	}
	if (prevSegment === 'terrains') {
		const { terrainStore } = useTerrain();
		return get(terrainStore).data?.[id as TerrainId]?.title;
	}
	if (prevSegment === 'characters') {
		const { getOrUndefinedCharacter } = useCharacter();
		return getOrUndefinedCharacter(id as CharacterId)?.name;
	}
	if (prevSegment === 'character-bodies') {
		const { getOrUndefinedCharacterBody } = useCharacter();
		return getOrUndefinedCharacterBody(id as CharacterBodyId)?.name;
	}
	if (prevSegment === 'buildings') {
		const { getOrUndefinedBuilding } = useBuilding();
		return getOrUndefinedBuilding(id as BuildingId)?.name;
	}
	if (prevSegment === 'building-interactions') {
		const { getOrUndefinedBuildingInteraction } = useInteraction();
		const { getOrUndefinedBuilding } = useBuilding();
		const interaction = getOrUndefinedBuildingInteraction(id as BuildingInteractionId);
		if (!interaction) return undefined;
		const building = getOrUndefinedBuilding(interaction.building_id);
		const label = getInteractionLabelString(interaction);
		return `${building?.name ?? '건물'} - ${label}`;
	}
	if (prevSegment === 'character-interactions') {
		const { getOrUndefinedCharacterInteraction } = useInteraction();
		const { getOrUndefinedCharacter } = useCharacter();
		const interaction = getOrUndefinedCharacterInteraction(id as CharacterInteractionId);
		if (!interaction) return undefined;
		const targetCharacter = getOrUndefinedCharacter(interaction.target_character_id);
		const label = getInteractionLabelString(interaction);
		return `${targetCharacter?.name ?? '캐릭터'} - ${label}`;
	}
	if (prevSegment === 'item-interactions') {
		const { getOrUndefinedItemInteraction } = useInteraction();
		const { getOrUndefinedItem } = useItem();
		const interaction = getOrUndefinedItemInteraction(id as ItemInteractionId);
		if (!interaction) return undefined;
		const item = getOrUndefinedItem(interaction.item_id);
		const label = getInteractionLabelString(interaction);
		return `${item?.name ?? '아이템'} - ${label}`;
	}
	if (prevSegment === 'conditions') {
		const { getOrUndefinedCondition } = useBuilding();
		return getOrUndefinedCondition(id as ConditionId)?.name;
	}
	if (prevSegment === 'condition-behaviors') {
		const { conditionBehaviorStore } = useBehavior();
		return get(conditionBehaviorStore).data?.[id as ConditionBehaviorId]?.name;
	}
	if (prevSegment === 'items') {
		const { getOrUndefinedItem } = useItem();
		return getOrUndefinedItem(id as ItemId)?.name;
	}
	if (prevSegment === 'needs') {
		const { getOrUndefinedNeed } = useCharacter();
		return getOrUndefinedNeed(id as NeedId)?.name;
	}
	if (prevSegment === 'need-behaviors') {
		const { needBehaviorStore } = useBehavior();
		return get(needBehaviorStore).data?.[id as NeedBehaviorId]?.name;
	}
	return undefined;
}
