export { default as NarrativeEditor } from './narrative-editor.svelte';
import type { Narrative } from '$lib/components/app/narrative/store';

/**
 * Get children dialog nodes from a node
 */
export function getChildrenNarratives(
	narratives: Record<string, Narrative>,
	targetNarrativeId: string
): Set<Narrative> {
	const narrative = narratives[targetNarrativeId];
	if (!narrative) return new Set();

	const children = new Set<Narrative>();

	if (narrative.type === 'text') {
		if (narrative.diceRoll.success.type === 'narrative') {
			const childNode = narratives[narrative.diceRoll.success.narrativeId];
			if (childNode) children.add(childNode);
		}
		if (narrative.diceRoll.failure.type === 'narrative') {
			const childNode = narratives[narrative.diceRoll.failure.narrativeId];
			if (childNode) children.add(childNode);
		}
	} else if (narrative.type === 'choice') {
		narrative.choices.forEach((choice) => {
			if (choice.diceRoll.success.type === 'narrative') {
				const childNode = narratives[choice.diceRoll.success.narrativeId];
				if (childNode) children.add(childNode);
			}
			if (choice.diceRoll.failure.type === 'narrative') {
				const childNode = narratives[choice.diceRoll.failure.narrativeId];
				if (childNode) children.add(childNode);
			}
		});
	}

	return children;
}

/**
 * Find all parent dialog nodes of a target node
 */
export function getParentNarratives(
	narratives: Record<string, Narrative>,
	targetNarrativeId: string
): Set<Narrative> {
	const parents = new Set<Narrative>();
	const nodes = Object.values(narratives);

	for (const node of nodes) {
		if (node.id === targetNarrativeId) continue;

		const children = getChildrenNarratives(narratives, node.id);
		for (const child of children) {
			if (child.id === targetNarrativeId) {
				parents.add(node);
				break;
			}
		}
	}

	return parents;
}
