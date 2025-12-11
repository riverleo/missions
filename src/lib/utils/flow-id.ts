/**
 * Flow 노드 및 엣지의 ID를 생성/파싱하는 유틸리티 함수
 */

import type { NarrativeDiceRoll, NarrativeNode, NarrativeNodeChoice } from '$lib/types';

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

export function createDiceRollNodeId(diceRoll: NarrativeDiceRoll): string {
	return `dice-roll-${diceRoll.id}`;
}

export function parseDiceRollNodeId(nodeId: string): string {
	return nodeId.replace('dice-roll-', '');
}

export function isDiceRollNodeId(nodeId: string): boolean {
	return nodeId.startsWith('dice-roll-');
}

// Edge IDs
export function createNarrativeNodeToDiceRollEdgeId(
	narrativeNode: NarrativeNode,
	diceRoll: NarrativeDiceRoll
): string {
	return `${narrativeNode.id}-${createDiceRollNodeId(diceRoll)}`;
}

export function createNarrativeNodeChoiceToDiceRollEdgeId(
	narrativeNodeChoice: NarrativeNodeChoice,
	diceRoll: NarrativeDiceRoll
): string {
	return `narrative-node-choice-${narrativeNodeChoice.id}-${createDiceRollNodeId(diceRoll)}`;
}

export function createDiceRollToSuccessEdgeId(
	diceRoll: NarrativeDiceRoll,
	narrativeNode: NarrativeNode
): string {
	return `${createDiceRollNodeId(diceRoll)}-success-${narrativeNode.id}`;
}

export function createDiceRollToFailureEdgeId(
	diceRoll: NarrativeDiceRoll,
	narrativeNode: NarrativeNode
): string {
	return `${createDiceRollNodeId(diceRoll)}-failure-${narrativeNode.id}`;
}

// Edge ID parsers
export function parseNarrativeNodeToDiceRollEdgeId(edgeId: string): {
	nodeId: string;
	diceRollId: string;
} {
	const [nodeId, diceRollPart] = edgeId.split('-dice-roll-');
	return { nodeId, diceRollId: diceRollPart };
}

export function parseNarrativeNodeChoiceToDiceRollEdgeId(edgeId: string): {
	narrativeNodeChoiceId: string;
	diceRollId: string;
} {
	const narrativeNodeChoiceId = edgeId
		.split('-dice-roll-')[0]
		.replace('narrative-node-choice-', '');
	const diceRollId = edgeId.split('-dice-roll-')[1];
	return { narrativeNodeChoiceId, diceRollId };
}

export function parseDiceRollToSuccessEdgeId(edgeId: string): {
	diceRollId: string;
	nodeId: string;
} {
	const [diceRollPart, nodeId] = edgeId.split('-success-');
	const diceRollId = parseDiceRollNodeId(diceRollPart);
	return { diceRollId, nodeId };
}

export function parseDiceRollToFailureEdgeId(edgeId: string): {
	diceRollId: string;
	nodeId: string;
} {
	const [diceRollPart, nodeId] = edgeId.split('-failure-');
	const diceRollId = parseDiceRollNodeId(diceRollPart);
	return { diceRollId, nodeId };
}

// Edge type checkers
export function isNarrativeNodeToDiceRollEdge(edgeId: string): boolean {
	return (
		edgeId.includes('-dice-roll-') &&
		!edgeId.startsWith('narrative-node-choice-') &&
		!edgeId.startsWith('dice-roll-')
	);
}

export function isNarrativeNodeChoiceToDiceRollEdge(edgeId: string): boolean {
	return edgeId.startsWith('narrative-node-choice-') && edgeId.includes('-dice-roll-');
}

export function isDiceRollToSuccessEdge(edgeId: string): boolean {
	return edgeId.includes('-success-');
}

export function isDiceRollToFailureEdge(edgeId: string): boolean {
	return edgeId.includes('-failure-');
}
