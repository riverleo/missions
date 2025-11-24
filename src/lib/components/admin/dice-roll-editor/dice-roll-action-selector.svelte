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
	import type { Snippet } from 'svelte';

	interface Props {
		action: DiceRollAction;
		icon: Snippet;
		dialogNodeIdOptions: { value: string; label: string }[];
		currentDialogNodeId?: string;
		onUpdate: (action: DiceRollAction) => void;
	}

	let { action, icon, dialogNodeIdOptions, currentDialogNodeId, onUpdate }: Props = $props();

	// Filter out current node to prevent infinite loops
	const filteredDialogNodeIdOptions = $derived(
		currentDialogNodeId
			? dialogNodeIdOptions.filter((opt) => opt.value !== currentDialogNodeId)
			: dialogNodeIdOptions
	);

	// Helper function to get node display text
	function getDisplayText(action: DiceRollAction): string {
		if (action.type === 'terminate') return '종료';

		const option = dialogNodeIdOptions.find((opt) => opt.value === action.dialogNodeId);
		return option?.label || action.dialogNodeId;
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
			<DropdownMenuSubTrigger disabled={filteredDialogNodeIdOptions.length === 0}>
				다음
			</DropdownMenuSubTrigger>
			<DropdownMenuSubContent>
				{#each filteredDialogNodeIdOptions as option (option.value)}
					<DropdownMenuItem
						onclick={() => {
							onUpdate({ type: 'dialogNode', dialogNodeId: option.value });
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
