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
		nodeIdOptions: { value: string; label: string }[];
		onUpdate: (action: DiceRollAction) => void;
	}

	let { action, icon, nodeIdOptions, onUpdate }: Props = $props();

	// Helper function to get node display text
	function getDisplayText(action: DiceRollAction): string {
		if (action.type === 'terminate') return '종료';

		const option = nodeIdOptions.find((opt) => opt.value === action.dialogNodeId);
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
				<IconChevronDown class="size-4 shrink-0" />
			</Button>
		{/snippet}
	</DropdownMenuTrigger>
	<DropdownMenuContent>
		<DropdownMenuSub>
			<DropdownMenuSubTrigger>다음 선택</DropdownMenuSubTrigger>
			<DropdownMenuSubContent>
				{#each nodeIdOptions as option (option.value)}
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
