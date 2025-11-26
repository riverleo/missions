<script lang="ts">
	import type { DialogNode } from '$lib/components/app/dialog-node/store';
	import { Toggle } from '$lib/components/ui/toggle';
	import {
		Tooltip,
		TooltipTrigger,
		TooltipContent,
		TooltipProvider,
	} from '$lib/components/ui/tooltip';
	import { getParentDialogNodes } from '.';
	import { getContext } from './context';

	interface Props {
		dialogNodeId: string;
	}

	interface ParentDetail {
		parentNodeText: string;
		detail: string;
	}

	let { dialogNodeId }: Props = $props();

	const ctx = getContext();

	const currentNode = $derived(ctx.dialogNodes[dialogNodeId]);
	const focused = $derived(ctx.focusedDialogNodeId === dialogNodeId);

	// Toggle focus
	function toggleFocus() {
		ctx.focusedDialogNodeId = focused ? undefined : dialogNodeId;
	}

	/**
	 * Get all parent node connections as a list
	 */
	function getAllParentDetails(
		dialogNodes: Record<string, DialogNode>,
		targetDialogNodeId: string
	): ParentDetail[] {
		const details: ParentDetail[] = [];
		const parentNodes = getParentDialogNodes(dialogNodes, targetDialogNodeId);

		for (const parentNode of parentNodes) {
			// Check narrative type
			if (parentNode.type === 'narrative') {
				const isSuccess =
					parentNode.diceRoll.success.type === 'dialogNode' &&
					parentNode.diceRoll.success.dialogNodeId === targetDialogNodeId;
				const isFailure =
					parentNode.diceRoll.failure.type === 'dialogNode' &&
					parentNode.diceRoll.failure.dialogNodeId === targetDialogNodeId;

				if (isSuccess) {
					details.push({
						parentNodeText: parentNode.message || parentNode.id,
						detail: '대화 성공',
					});
				}
				if (isFailure) {
					details.push({
						parentNodeText: parentNode.message || parentNode.id,
						detail: '대화 실패',
					});
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

					if (isSuccess) {
						details.push({
							parentNodeText: parentNode.message || parentNode.id,
							detail: `${i + 1}번 성공`,
						});
					}
					if (isFailure) {
						details.push({
							parentNodeText: parentNode.message || parentNode.id,
							detail: `${i + 1}번 실패`,
						});
					}
				}
			}
		}

		return details;
	}

	const parentDetails = $derived(getAllParentDetails(ctx.dialogNodes, dialogNodeId));
</script>

{#if currentNode?.root}
	<Toggle
		pressed={focused}
		onPressedChange={toggleFocus}
		class="h-auto justify-start px-2 py-1.5 text-xs text-foreground"
	>
		처음
	</Toggle>
{:else if parentDetails.length > 0}
	{#if parentDetails.length === 1}
		<Toggle
			pressed={focused}
			onPressedChange={toggleFocus}
			class="h-auto justify-start px-2 py-1.5 text-xs text-foreground"
		>
			{parentDetails[0].parentNodeText} - {parentDetails[0].detail}
		</Toggle>
	{:else}
		<TooltipProvider>
			<Tooltip delayDuration={0}>
				<TooltipTrigger>
					{#snippet child({ props })}
						<Toggle
							{...props}
							pressed={focused}
							onPressedChange={toggleFocus}
							class="h-auto justify-start px-2 py-1.5 text-xs text-foreground"
						>
							{parentDetails[0].parentNodeText} - {parentDetails[0].detail}
							<span class="text-muted-foreground">외 {parentDetails.length - 1}개</span>
						</Toggle>
					{/snippet}
				</TooltipTrigger>
				<TooltipContent>
					<ul class="space-y-0.5 text-xs">
						{#each parentDetails as detail}
							<li>{detail.parentNodeText} - {detail.detail}</li>
						{/each}
					</ul>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	{/if}
{:else}
	<Toggle
		pressed={focused}
		onPressedChange={toggleFocus}
		class="h-auto justify-start px-2 py-1.5 text-xs text-foreground"
	>
		부모 없음
	</Toggle>
{/if}
