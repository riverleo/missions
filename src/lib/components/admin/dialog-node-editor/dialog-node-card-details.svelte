<script lang="ts">
	import type { DialogNode } from '$lib/components/app/dialog-node/store';
	import { getContext } from './context';
	import { getParentDialogNode } from './index';

	interface Props {
		dialogNodeId: string;
	}

	let { dialogNodeId }: Props = $props();

	const ctx = getContext();

	const currentNode = $derived(ctx.dialogNodes[dialogNodeId]);

	/**
	 * Get parent node information with details about the relationship
	 */
	function getParentDialogNodeDetails(
		dialogNodes: Record<string, DialogNode>,
		targetDialogNodeId: string
	): string | undefined {
		const parentNode = getParentDialogNode(dialogNodes, targetDialogNodeId);

		if (!parentNode) return;

		// Check narrative type
		if (parentNode.type === 'narrative') {
			const isSuccess =
				parentNode.diceRoll.success.type === 'dialogNode' &&
				parentNode.diceRoll.success.dialogNodeId === targetDialogNodeId;
			const isFailure =
				parentNode.diceRoll.failure.type === 'dialogNode' &&
				parentNode.diceRoll.failure.dialogNodeId === targetDialogNodeId;

			if (isSuccess && isFailure) {
				return `${parentNode.text || parentNode.id} - 대화 성공 또는 실패`;
			}
			if (isSuccess) {
				return `${parentNode.text || parentNode.id} - 대화 성공`;
			}
			if (isFailure) {
				return `${parentNode.text || parentNode.id} - 대화 실패`;
			}
		}

		// Check choice type
		if (parentNode.type === 'choice') {
			for (let i = 0; i < parentNode.choices.length; i++) {
				const choice = parentNode.choices[i];
				const isSuccess =
					choice.diceRoll.success.type === 'dialogNode' &&
					choice.diceRoll.success.dialogNodeId === targetDialogNodeId;
				const isFailure =
					choice.diceRoll.failure.type === 'dialogNode' &&
					choice.diceRoll.failure.dialogNodeId === targetDialogNodeId;

				if (isSuccess && isFailure) {
					return `${parentNode.text || parentNode.id} - ${i + 1}번 성공 또는 실패`;
				}
				if (isSuccess) {
					return `${parentNode.text || parentNode.id} - ${i + 1}번 성공`;
				}
				if (isFailure) {
					return `${parentNode.text || parentNode.id} - ${i + 1}번 실패`;
				}
			}
		}

		return;
	}

	const details = $derived(getParentDialogNodeDetails(ctx.dialogNodes, dialogNodeId));
</script>

{#if details}
	<p class="truncate text-xs text-foreground">
		{details}
	</p>
{:else if currentNode?.root}
	<p class="text-xs text-foreground">최상위 노드</p>
{:else}
	<p class="text-xs text-foreground">부모 없음</p>
{/if}
