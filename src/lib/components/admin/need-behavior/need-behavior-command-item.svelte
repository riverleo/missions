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
	import { useBehavior } from '$lib/hooks/use-behavior';
	import { useCharacter } from '$lib/hooks/use-character';
	import type { NeedBehavior, CharacterId } from '$lib/types';
	import { getNeedBehaviorLabel } from '$lib/utils/state-label';

	interface Props {
		behavior: NeedBehavior;
		href?: string;
		isSelected?: boolean;
		showActions?: boolean;
		onclick?: () => void;
	}

	let { behavior, href, isSelected = false, showActions = true, onclick }: Props = $props();

	const { openNeedBehaviorDialog } = useBehavior();
	const { needStore } = useCharacter();
	const { characterStore } = useCharacter();

	const label = $derived(() => {
		const need = behavior.need_id ? $needStore.data[behavior.need_id] : undefined;
		const character = behavior.character_id
			? $characterStore.data[behavior.character_id as CharacterId]
			: undefined;

		return getNeedBehaviorLabel({
			behavior,
			needName: need?.name,
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
						onclick={() => openNeedBehaviorDialog({ type: 'update', needBehaviorId: behavior.id })}
					>
						수정
					</DropdownMenuItem>
					<DropdownMenuItem
						onclick={() => openNeedBehaviorDialog({ type: 'delete', needBehaviorId: behavior.id })}
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
						onclick={() => openNeedBehaviorDialog({ type: 'update', needBehaviorId: behavior.id })}
					>
						수정
					</DropdownMenuItem>
					<DropdownMenuItem
						onclick={() => openNeedBehaviorDialog({ type: 'delete', needBehaviorId: behavior.id })}
					>
						삭제
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		{/if}
	</CommandItem>
{/if}
