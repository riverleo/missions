/**
 * Flow 노드 및 엣지의 ID를 생성/파싱하는 유틸리티 함수
 */

import type {
	Building,
	ConditionBehaviorAction,
	BuildingCondition,
	Character,
	CharacterNeed,
	Condition,
	ConditionEffect,
	ConditionFulfillment,
	ItemBehaviorAction,
	NarrativeDiceRoll,
	NarrativeNode,
	NarrativeNodeChoice,
	Need,
	NeedBehaviorAction,
	NeedFulfillment,
} from '$lib/types';

// Node IDs
export function createNarrativeNodeId(narrativeNode: NarrativeNode): string {
	return `narrative-node-${narrativeNode.id}`;
}

export function parseNarrativeNodeId(nodeId: string): string {
	return nodeId.replace('narrative-node-', '');
}

export function isNarrativeNodeId(nodeId: string): boolean {
	return nodeId.startsWith('narrative-node-');
}

export function createNarrativeDiceRollNodeId(narrativeDiceRoll: NarrativeDiceRoll): string {
	return `narrative-dice-roll-${narrativeDiceRoll.id}`;
}

export function parseNarrativeDiceRollNodeId(nodeId: string): string {
	return nodeId.replace('narrative-dice-roll-', '');
}

export function isNarrativeDiceRollNodeId(nodeId: string): boolean {
	return nodeId.startsWith('narrative-dice-roll-');
}

// Edge IDs
export function createNarrativeNodeToNarrativeDiceRollEdgeId(
	narrativeNode: NarrativeNode,
	narrativeDiceRoll: NarrativeDiceRoll
): string {
	return `${narrativeNode.id}-${createNarrativeDiceRollNodeId(narrativeDiceRoll)}`;
}

export function createNarrativeNodeChoiceToNarrativeDiceRollEdgeId(
	narrativeNodeChoice: NarrativeNodeChoice,
	narrativeDiceRoll: NarrativeDiceRoll
): string {
	return `narrative-node-choice-${narrativeNodeChoice.id}-${createNarrativeDiceRollNodeId(narrativeDiceRoll)}`;
}

export function createNarrativeDiceRollToSuccessEdgeId(
	narrativeDiceRoll: NarrativeDiceRoll,
	narrativeNode: NarrativeNode
): string {
	return `${createNarrativeDiceRollNodeId(narrativeDiceRoll)}-success-${narrativeNode.id}`;
}

export function createNarrativeDiceRollToFailureEdgeId(
	narrativeDiceRoll: NarrativeDiceRoll,
	narrativeNode: NarrativeNode
): string {
	return `${createNarrativeDiceRollNodeId(narrativeDiceRoll)}-failure-${narrativeNode.id}`;
}

// Edge ID parsers
export function parseNarrativeNodeToNarrativeDiceRollEdgeId(edgeId: string): {
	nodeId: string;
	narrativeDiceRollId: string;
} {
	const parts = edgeId.split('-narrative-dice-roll-');
	const nodeId = parts[0] ?? '';
	const narrativeDiceRollId = parts[1] ?? '';
	return { nodeId, narrativeDiceRollId };
}

export function parseNarrativeNodeChoiceToNarrativeDiceRollEdgeId(edgeId: string): {
	narrativeNodeChoiceId: string;
	narrativeDiceRollId: string;
} {
	const parts = edgeId.split('-narrative-dice-roll-');
	const narrativeNodeChoiceId = (parts[0] ?? '').replace('narrative-node-choice-', '');
	const narrativeDiceRollId = parts[1] ?? '';
	return { narrativeNodeChoiceId, narrativeDiceRollId };
}

export function parseNarrativeDiceRollToSuccessEdgeId(edgeId: string): {
	narrativeDiceRollId: string;
	nodeId: string;
} {
	const parts = edgeId.split('-success-');
	const narrativeDiceRollPart = parts[0] ?? '';
	const nodeId = parts[1] ?? '';
	const narrativeDiceRollId = parseNarrativeDiceRollNodeId(narrativeDiceRollPart);
	return { narrativeDiceRollId, nodeId };
}

export function parseNarrativeDiceRollToFailureEdgeId(edgeId: string): {
	narrativeDiceRollId: string;
	nodeId: string;
} {
	const parts = edgeId.split('-failure-');
	const narrativeDiceRollPart = parts[0] ?? '';
	const nodeId = parts[1] ?? '';
	const narrativeDiceRollId = parseNarrativeDiceRollNodeId(narrativeDiceRollPart);
	return { narrativeDiceRollId, nodeId };
}

// Edge type checkers
export function isNarrativeNodeToNarrativeDiceRollEdge(edgeId: string): boolean {
	return (
		edgeId.includes('-narrative-dice-roll-') &&
		!edgeId.startsWith('narrative-node-choice-') &&
		!edgeId.startsWith('narrative-dice-roll-')
	);
}

export function isNarrativeNodeChoiceToNarrativeDiceRollEdge(edgeId: string): boolean {
	return edgeId.startsWith('narrative-node-choice-') && edgeId.includes('-narrative-dice-roll-');
}

export function isNarrativeDiceRollToSuccessEdge(edgeId: string): boolean {
	return edgeId.includes('-success-');
}

export function isNarrativeDiceRollToFailureEdge(edgeId: string): boolean {
	return edgeId.includes('-failure-');
}

// ============================================
// Need Flow Node/Edge IDs
// ============================================

// Character Node
export function createCharacterNodeId(character: Character): string {
	return `character-${character.id}`;
}

export function parseCharacterNodeId(nodeId: string): string {
	return nodeId.replace('character-', '');
}

export function isCharacterNodeId(nodeId: string): boolean {
	return nodeId.startsWith('character-');
}

// Need Node
export function createNeedNodeId(need: Need): string {
	return `need-${need.id}`;
}

export function parseNeedNodeId(nodeId: string): string {
	return nodeId.replace('need-', '');
}

export function isNeedNodeId(nodeId: string): boolean {
	return nodeId.startsWith('need-');
}

// Fulfillment Node
export function createFulfillmentNodeId(fulfillment: NeedFulfillment): string {
	return `fulfillment-${fulfillment.id}`;
}

export function parseFulfillmentNodeId(nodeId: string): string {
	return nodeId.replace('fulfillment-', '');
}

export function isFulfillmentNodeId(nodeId: string): boolean {
	return nodeId.startsWith('fulfillment-');
}

// Character-Need Edge
export function createCharacterNeedEdgeId(characterNeed: CharacterNeed): string {
	return `character-need-${characterNeed.character_id}-${characterNeed.need_id}`;
}

export function parseCharacterNeedEdgeId(edgeId: string): {
	characterId: string;
	needId: string;
} {
	const parts = edgeId.replace('character-need-', '').split('-');
	return { characterId: parts[0] ?? '', needId: parts[1] ?? '' };
}

export function isCharacterNeedEdgeId(edgeId: string): boolean {
	return edgeId.startsWith('character-need-');
}

// Need-Fulfillment Edge
export function createNeedFulfillmentEdgeId(fulfillment: NeedFulfillment): string {
	return `need-fulfillment-${fulfillment.need_id}-${fulfillment.id}`;
}

export function parseNeedFulfillmentEdgeId(edgeId: string): {
	needId: string;
	fulfillmentId: string;
} {
	const parts = edgeId.replace('need-fulfillment-', '').split('-');
	return { needId: parts[0] ?? '', fulfillmentId: parts[1] ?? '' };
}

export function isNeedFulfillmentEdgeId(edgeId: string): boolean {
	return edgeId.startsWith('need-fulfillment-');
}

// ============================================
// Need Behavior Flow Node/Edge IDs
// ============================================

// Action Node
export function createActionNodeId(action: NeedBehaviorAction): string {
	return `action-${action.id}`;
}

export function parseActionNodeId(nodeId: string): string {
	return nodeId.replace('action-', '');
}

export function isActionNodeId(nodeId: string): boolean {
	return nodeId.startsWith('action-');
}

// Action Success Edge
export function createActionSuccessEdgeId(
	sourceAction: NeedBehaviorAction,
	targetAction: NeedBehaviorAction
): string {
	return `action-${sourceAction.id}-success-action-${targetAction.id}`;
}

export function isActionSuccessEdgeId(edgeId: string): boolean {
	return edgeId.includes('-success-action-');
}

// Action Failure Edge
export function createActionFailureEdgeId(
	sourceAction: NeedBehaviorAction,
	targetAction: NeedBehaviorAction
): string {
	return `action-${sourceAction.id}-failure-action-${targetAction.id}`;
}

export function isActionFailureEdgeId(edgeId: string): boolean {
	return edgeId.includes('-failure-action-');
}

// ============================================
// Building Behavior Flow Node/Edge IDs
// ============================================

// Building Behavior Action Node
export function createConditionBehaviorActionNodeId(action: ConditionBehaviorAction): string {
	return `condition-behavior-action-${action.id}`;
}

export function parseConditionBehaviorActionNodeId(nodeId: string): string {
	return nodeId.replace('condition-behavior-action-', '');
}

export function isConditionBehaviorActionNodeId(nodeId: string): boolean {
	return nodeId.startsWith('condition-behavior-action-');
}

// Building Behavior Action Success Edge
export function createConditionBehaviorActionSuccessEdgeId(
	sourceAction: ConditionBehaviorAction,
	targetAction: ConditionBehaviorAction
): string {
	return `condition-behavior-action-${sourceAction.id}-success-condition-behavior-action-${targetAction.id}`;
}

export function isConditionBehaviorActionSuccessEdgeId(edgeId: string): boolean {
	return edgeId.includes('-success-');
}

// Building Behavior Action Failure Edge
export function createConditionBehaviorActionFailureEdgeId(
	sourceAction: ConditionBehaviorAction,
	targetAction: ConditionBehaviorAction
): string {
	return `condition-behavior-action-${sourceAction.id}-failure-condition-behavior-action-${targetAction.id}`;
}

export function isConditionBehaviorActionFailureEdgeId(edgeId: string): boolean {
	return edgeId.includes('-failure-');
}

// ============================================
// Item Behavior Flow Node/Edge IDs
// ============================================

// Item Behavior Action Node
export function createItemBehaviorActionNodeId(action: ItemBehaviorAction): string {
	return `item-behavior-action-${action.id}`;
}

export function parseItemBehaviorActionNodeId(nodeId: string): string {
	return nodeId.replace('item-behavior-action-', '');
}

export function isItemBehaviorActionNodeId(nodeId: string): boolean {
	return nodeId.startsWith('item-behavior-action-');
}

// Item Behavior Action Success Edge
export function createItemBehaviorActionSuccessEdgeId(
	sourceAction: ItemBehaviorAction,
	targetAction: ItemBehaviorAction
): string {
	return `item-behavior-action-${sourceAction.id}-success-item-behavior-action-${targetAction.id}`;
}

export function isItemBehaviorActionSuccessEdgeId(edgeId: string): boolean {
	return edgeId.includes('-success-');
}

// Item Behavior Action Failure Edge
export function createItemBehaviorActionFailureEdgeId(
	sourceAction: ItemBehaviorAction,
	targetAction: ItemBehaviorAction
): string {
	return `item-behavior-action-${sourceAction.id}-failure-item-behavior-action-${targetAction.id}`;
}

export function isItemBehaviorActionFailureEdgeId(edgeId: string): boolean {
	return edgeId.includes('-failure-');
}

// Condition Flow Node/Edge IDs

// Building Node
export function createBuildingNodeId(building: Building): string {
	return `building-${building.id}`;
}

export function parseBuildingNodeId(nodeId: string): string {
	return nodeId.replace('building-', '');
}

export function isBuildingNodeId(nodeId: string): boolean {
	return nodeId.startsWith('building-');
}

// Condition Node
export function createConditionNodeId(condition: Condition): string {
	return `condition-${condition.id}`;
}

export function parseConditionNodeId(nodeId: string): string {
	return nodeId.replace('condition-', '');
}

export function isConditionNodeId(nodeId: string): boolean {
	return nodeId.startsWith('condition-');
}

// Condition Fulfillment Node
export function createConditionFulfillmentNodeId(fulfillment: ConditionFulfillment): string {
	return `condition-fulfillment-${fulfillment.id}`;
}

// Building-Condition Edge
export function createBuildingConditionEdgeId(buildingCondition: BuildingCondition): string {
	return `building-condition-${buildingCondition.building_id}-${buildingCondition.condition_id}`;
}

export function parseBuildingConditionEdgeId(edgeId: string): {
	buildingId: string;
	conditionId: string;
} {
	const [, buildingId, conditionId] = edgeId.split('-');
	return { buildingId: buildingId ?? '', conditionId: conditionId ?? '' };
}

export function isBuildingConditionEdgeId(edgeId: string): boolean {
	return edgeId.startsWith('building-condition-');
}

// Condition-Fulfillment Edge
export function createConditionFulfillmentEdgeId(fulfillment: ConditionFulfillment): string {
	return `condition-fulfillment-${fulfillment.condition_id}-${fulfillment.id}`;
}

export function parseConditionFulfillmentEdgeId(edgeId: string): {
	conditionId: string;
	fulfillmentId: string;
} {
	const [, , conditionId, fulfillmentId] = edgeId.split('-');
	return { conditionId: conditionId ?? '', fulfillmentId: fulfillmentId ?? '' };
}

export function isConditionFulfillmentEdgeId(edgeId: string): boolean {
	return edgeId.startsWith('condition-fulfillment-');
}

// Condition Effect Node
export function createConditionEffectNodeId(effect: ConditionEffect): string {
	return `condition-effect-${effect.id}`;
}

export function parseConditionEffectNodeId(nodeId: string): string {
	return nodeId.replace('condition-effect-', '');
}

export function isConditionEffectNodeId(nodeId: string): boolean {
	return nodeId.startsWith('condition-effect-');
}

// Condition-Effect Edge
export function createConditionEffectEdgeId(effect: ConditionEffect): string {
	return `condition-effect-${effect.condition_id}-${effect.id}`;
}

export function parseConditionEffectEdgeId(edgeId: string): {
	conditionId: string;
	effectId: string;
} {
	const parts = edgeId.replace('condition-effect-', '').split('-');
	return { conditionId: parts[0] ?? '', effectId: parts[1] ?? '' };
}

export function isConditionEffectEdgeId(edgeId: string): boolean {
	return edgeId.startsWith('condition-effect-');
}
