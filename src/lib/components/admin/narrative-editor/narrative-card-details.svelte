<script lang="ts">
	import type { Narrative } from '$lib/components/app/narrative/store';
	import { Toggle } from '$lib/components/ui/toggle';
	import {
		Tooltip,
		TooltipTrigger,
		TooltipContent,
		TooltipProvider,
	} from '$lib/components/ui/tooltip';
	import { getParentNarratives } from '.';
	import { getContext } from './context';

	interface Props {
		narrativeId: string;
	}

	interface ParentDetail {
		parentNodeText: string;
		detail: string;
	}

	let { narrativeId }: Props = $props();

	const ctx = getContext();

	const currentNode = $derived(ctx.narratives[narrativeId]);
	const focused = $derived(ctx.focusedNarrativeId === narrativeId);

	// Toggle focus
	function toggleFocus() {
		ctx.focusedNarrativeId = focused ? undefined : narrativeId;
	}

	/**
	 * Get all parent node connections as a list
	 */
	function getAllParentDetails(
		narratives: Record<string, Narrative>,
		targetNarrativeId: string
	): ParentDetail[] {
		const details: ParentDetail[] = [];
		const parentNarratives = getParentNarratives(narratives, targetNarrativeId);

		for (const parentNarrative of parentNarratives) {
			// Check narrative type
			if (parentNarrative.type === 'text') {
				const isSuccess =
					parentNarrative.diceRoll.success.type === 'narrative' &&
					parentNarrative.diceRoll.success.narrativeId === targetNarrativeId;
				const isFailure =
					parentNarrative.diceRoll.failure.type === 'narrative' &&
					parentNarrative.diceRoll.failure.narrativeId === targetNarrativeId;

				if (isSuccess) {
					details.push({
						parentNodeText: parentNarrative.message || parentNarrative.id,
						detail: '대화 성공',
					});
				}
				if (isFailure) {
					details.push({
						parentNodeText: parentNarrative.message || parentNarrative.id,
						detail: '대화 실패',
					});
				}
			}

			// Check choice type
			if (parentNarrative.type === 'choice') {
				for (let i = 0; i < parentNarrative.choices.length; i++) {
					const choice = parentNarrative.choices[i];
					const isSuccess =
						choice.diceRoll.success.type === 'narrative' &&
						choice.diceRoll.success.narrativeId === targetNarrativeId;
					const isFailure =
						choice.diceRoll.failure.type === 'narrative' &&
						choice.diceRoll.failure.narrativeId === targetNarrativeId;

					if (isSuccess) {
						details.push({
							parentNodeText: parentNarrative.message || parentNarrative.id,
							detail: `${i + 1}번 성공`,
						});
					}
					if (isFailure) {
						details.push({
							parentNodeText: parentNarrative.message || parentNarrative.id,
							detail: `${i + 1}번 실패`,
						});
					}
				}
			}
		}

		return details;
	}

	const parentDetails = $derived(getAllParentDetails(ctx.narratives, narrativeId));
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
