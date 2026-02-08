<script lang="ts">
	import { useBehavior } from '$lib/hooks';
	import { Button } from '$lib/components/ui/button';
	import { CommandLinkItem, CommandItem, CommandShortcut } from '$lib/components/ui/command';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuTrigger,
	} from '$lib/components/ui/dropdown-menu';
	import { IconCheck, IconDotsVertical } from '@tabler/icons-svelte';
	import { cn } from '$lib/utils';
	import type { NeedBehavior } from '$lib/types';
	import { getNeedBehaviorString } from '$lib/utils/label';

	interface Props {
		behavior: NeedBehavior;
		href?: string;
		isSelected?: boolean;
		showActions?: boolean;
		onclick?: () => void;
	}

	let { behavior, href, isSelected = false, showActions = true, onclick }: Props = $props();

	const { openNeedBehaviorDialog } = useBehavior();

	const label = $derived(getNeedBehaviorString(behavior));
	const shortId = $derived(behavior.id.split('-')[0]);
</script>

{#if href}
	<CommandLinkItem {href} class="group pr-1">
		<IconCheck class={cn('mr-2 size-4', isSelected ? 'opacity-100' : 'opacity-0')} />
		<span class="flex-1 truncate">{label}</span>
		<CommandShortcut>{shortId}</CommandShortcut>
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
	<CommandItem value={label} {onclick} class="group pr-1">
		<IconCheck class={cn('mr-2 size-4', isSelected ? 'opacity-100' : 'opacity-0')} />
		<span class="flex-1 truncate">{label}</span>
		<CommandShortcut>{shortId}</CommandShortcut>
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
