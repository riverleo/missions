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
	const [nodeId, narrativeDiceRollPart] = edgeId.split('-narrative-dice-roll-');
	return { nodeId, narrativeDiceRollId: narrativeDiceRollPart };
}

export function parseNarrativeNodeChoiceToNarrativeDiceRollEdgeId(edgeId: string): {
	narrativeNodeChoiceId: string;
	narrativeDiceRollId: string;
} {
	const narrativeNodeChoiceId = edgeId
		.split('-narrative-dice-roll-')[0]
		.replace('narrative-node-choice-', '');
	const narrativeDiceRollId = edgeId.split('-narrative-dice-roll-')[1];
	return { narrativeNodeChoiceId, narrativeDiceRollId };
}

export function parseNarrativeDiceRollToSuccessEdgeId(edgeId: string): {
	narrativeDiceRollId: string;
	nodeId: string;
} {
	const [narrativeDiceRollPart, nodeId] = edgeId.split('-success-');
	const narrativeDiceRollId = parseNarrativeDiceRollNodeId(narrativeDiceRollPart);
	return { narrativeDiceRollId, nodeId };
}

export function parseNarrativeDiceRollToFailureEdgeId(edgeId: string): {
	narrativeDiceRollId: string;
	nodeId: string;
} {
	const [narrativeDiceRollPart, nodeId] = edgeId.split('-failure-');
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
