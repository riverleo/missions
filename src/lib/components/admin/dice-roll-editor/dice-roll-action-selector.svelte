<script lang="ts">
	import type { DiceRollAction } from '$lib/components/app/dice-roll/store';
	import {
		DropdownMenu,
		DropdownMenuTrigger,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuSub,
		DropdownMenuSubTrigger,
		DropdownMenuSubContent,
	} from '$lib/components/ui/dropdown-menu';
	import { Button } from '$lib/components/ui/button';
	import IconChevronDown from '@tabler/icons-svelte/icons/chevron-down';
	import IconPlus from '@tabler/icons-svelte/icons/plus';
	import type { Snippet } from 'svelte';

	interface Props {
		action: DiceRollAction;
		icon: Snippet;
		narrativeIdOptions: { value: string; label: string }[];
		currentNarrativeId?: string;
		onUpdate: (action: DiceRollAction) => void;
		onCreateNode?: () => string; // Returns new node ID
	}

	let { action, icon, narrativeIdOptions, currentNarrativeId, onUpdate, onCreateNode }: Props =
		$props();

	// Filter out current node to prevent infinite loops
	const filteredDialogNodeIdOptions = $derived(
		currentNarrativeId
			? narrativeIdOptions.filter((opt) => opt.value !== currentNarrativeId)
			: narrativeIdOptions
	);

	// Helper function to get node display text
	function getDisplayText(action: DiceRollAction): string {
		if (action.type === 'terminate') return '종료';

		const option = narrativeIdOptions.find((opt) => opt.value === action.narrativeId);
		return option?.label || action.narrativeId;
	}
</script>

<DropdownMenu>
	<DropdownMenuTrigger>
		{#snippet child({ props })}
			<Button {...props} variant="outline" class="w-full justify-between">
				<span class="flex items-center gap-2 truncate">
					{@render icon()}
					<span class="truncate">{getDisplayText(action)}</span>
				</span>
				<IconChevronDown />
			</Button>
		{/snippet}
	</DropdownMenuTrigger>
	<DropdownMenuContent>
		<DropdownMenuSub>
			<DropdownMenuSubTrigger>다음</DropdownMenuSubTrigger>
			<DropdownMenuSubContent>
				{#if onCreateNode}
					<DropdownMenuItem
						onclick={() => {
							const newNodeId = onCreateNode();
							onUpdate({ type: 'narrative', narrativeId: newNodeId });
						}}
					>
						<IconPlus class="size-4" />
						새 노드 추가
					</DropdownMenuItem>
				{/if}
				{#each filteredDialogNodeIdOptions as option (option.value)}
					<DropdownMenuItem
						onclick={() => {
							onUpdate({ type: 'narrative', narrativeId: option.value });
						}}
					>
						{option.label}
					</DropdownMenuItem>
				{/each}
			</DropdownMenuSubContent>
		</DropdownMenuSub>
		<DropdownMenuItem
			onclick={() => {
				onUpdate({ type: 'terminate' });
			}}
		>
			종료
		</DropdownMenuItem>
	</DropdownMenuContent>
</DropdownMenu>
