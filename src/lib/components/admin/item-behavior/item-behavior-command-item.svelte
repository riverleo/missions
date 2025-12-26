<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { CommandLinkItem, CommandItem } from '$lib/components/ui/command';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuTrigger,
	} from '$lib/components/ui/dropdown-menu';
	import { IconCheck, IconDotsVertical } from '@tabler/icons-svelte';
	import { cn } from '$lib/utils';
	import { useItemBehavior } from '$lib/hooks/use-item-behavior';
	import { useItem } from '$lib/hooks/use-item';
	import { useCharacter } from '$lib/hooks/use-character';
	import { getItemBehaviorLabel } from '$lib/utils/state-label';
	import type { ItemBehavior, CharacterId } from '$lib/types';

	interface Props {
		behavior: ItemBehavior;
		href?: string;
		isSelected?: boolean;
		showActions?: boolean;
		onclick?: () => void;
	}

	let { behavior, href, isSelected = false, showActions = true, onclick }: Props = $props();

	const { openDialog } = useItemBehavior();
	const { store: itemStore } = useItem();
	const { store: characterStore } = useCharacter();

	const label = $derived(() => {
		const item = $itemStore.data[behavior.item_id];
		const character = behavior.character_id
			? $characterStore.data[behavior.character_id as CharacterId]
			: undefined;

		return getItemBehaviorLabel({
			behavior,
			itemName: item?.name,
			characterName: character?.name,
		});
	});

	const searchValue = $derived(`${label().title} ${label().description}`);
</script>

{#if href}
	<CommandLinkItem {href} class="group pr-1">
		<IconCheck class={cn('mr-2 size-4', isSelected ? 'opacity-100' : 'opacity-0')} />
		<div class="flex flex-1 flex-col truncate">
			<span class="truncate">{label().title}</span>
			<span class="truncate text-xs text-muted-foreground">{label().description}</span>
		</div>
		{#if showActions}
			<DropdownMenu>
				<DropdownMenuTrigger>
					{#snippet child({ props })}
						<Button
							{...props}
							variant="ghost"
							size="icon"
							class="size-6 group-hover:opacity-100"
							onclick={(e) => e.preventDefault()}
						>
							<IconDotsVertical class="size-4" />
						</Button>
					{/snippet}
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuItem
						onclick={() => openDialog({ type: 'update', itemBehaviorId: behavior.id })}
					>
						수정
					</DropdownMenuItem>
					<DropdownMenuItem
						onclick={() => openDialog({ type: 'delete', itemBehaviorId: behavior.id })}
					>
						삭제
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		{/if}
	</CommandLinkItem>
{:else}
	<CommandItem value={searchValue} {onclick} class="group pr-1">
		<IconCheck class={cn('mr-2 size-4', isSelected ? 'opacity-100' : 'opacity-0')} />
		<div class="flex flex-1 flex-col truncate">
			<span class="truncate">{label().title}</span>
			<span class="truncate text-xs text-muted-foreground">{label().description}</span>
		</div>
		{#if showActions}
			<DropdownMenu>
				<DropdownMenuTrigger>
					{#snippet child({ props })}
						<Button
							{...props}
							variant="ghost"
							size="icon"
							class="size-6 group-hover:opacity-100"
							onclick={(e) => e.preventDefault()}
						>
							<IconDotsVertical class="size-4" />
						</Button>
					{/snippet}
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuItem
						onclick={() => openDialog({ type: 'update', itemBehaviorId: behavior.id })}
					>
						수정
					</DropdownMenuItem>
					<DropdownMenuItem
						onclick={() => openDialog({ type: 'delete', itemBehaviorId: behavior.id })}
					>
						삭제
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		{/if}
	</CommandItem>
{/if}
