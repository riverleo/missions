<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { CommandLinkItem } from '$lib/components/ui/command';
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
	}

	let { behavior, href, isSelected = false, showActions = true }: Props = $props();

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

	const itemClass = "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled=true]:pointer-events-none data-[selected='true']:bg-accent data-[selected=true]:text-accent-foreground data-[disabled=true]:opacity-50 group pr-1";
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
	<div class={itemClass}>
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
	</div>
{/if}
