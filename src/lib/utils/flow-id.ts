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
