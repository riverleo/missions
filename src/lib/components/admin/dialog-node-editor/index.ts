export { default as DialogNodeEditor } from './dialog-node-editor.svelte';
import type { DialogNode } from '$lib/components/app/dialog-node/store';

/**
 * Get children dialog nodes from a node
 */
export function getChildrenDialogNodes(
	dialogNodes: Record<string, DialogNode>,
	targetDialogNodeId: string
): Set<DialogNode> {
	const dialogNode = dialogNodes[targetDialogNodeId];
	if (!dialogNode) return new Set();

	const children = new Set<DialogNode>();

	if (dialogNode.type === 'narrative') {
		if (dialogNode.diceRoll.success.type === 'dialogNode') {
			const childNode = dialogNodes[dialogNode.diceRoll.success.dialogNodeId];
			if (childNode) children.add(childNode);
		}
		if (dialogNode.diceRoll.failure.type === 'dialogNode') {
			const childNode = dialogNodes[dialogNode.diceRoll.failure.dialogNodeId];
			if (childNode) children.add(childNode);
		}
	} else if (dialogNode.type === 'choice') {
		dialogNode.choices.forEach((choice) => {
			if (choice.diceRoll.success.type === 'dialogNode') {
				const childNode = dialogNodes[choice.diceRoll.success.dialogNodeId];
				if (childNode) children.add(childNode);
			}
			if (choice.diceRoll.failure.type === 'dialogNode') {
				const childNode = dialogNodes[choice.diceRoll.failure.dialogNodeId];
				if (childNode) children.add(childNode);
			}
		});
	}

	return children;
}

/**
 * Find parent dialog node of a target node
 */
export function getParentDialogNode(
	dialogNodes: Record<string, DialogNode>,
	targetDialogNodeId: string
): DialogNode | undefined {
	const nodes = Object.values(dialogNodes);

	for (const node of nodes) {
		if (node.id === targetDialogNodeId) continue;

		const children = getChildrenDialogNodes(dialogNodes, node.id);
		for (const child of children) {
			if (child.id === targetDialogNodeId) {
				return node;
			}
		}
	}

	return undefined;
}
