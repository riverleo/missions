<script lang="ts">
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
	import { useBehavior } from '$lib/hooks/use-behavior';
	import { useBuilding } from '$lib/hooks/use-building';
	import { useCharacter } from '$lib/hooks/use-character';
	import type { ConditionBehavior, CharacterId } from '$lib/types';

	interface Props {
		behavior: ConditionBehavior;
		href?: string;
		isSelected?: boolean;
		showActions?: boolean;
		onclick?: () => void;
	}

	let { behavior, href, isSelected = false, showActions = true, onclick }: Props = $props();

	const { openConditionBehaviorDialog } = useBehavior();
	const { conditionStore } = useBuilding();
	const { characterStore } = useCharacter();

	const description = $derived.by(() => {
		const condition = behavior.condition_id
			? $conditionStore.data[behavior.condition_id]
			: undefined;
		const character = behavior.character_id
			? $characterStore.data[behavior.character_id as CharacterId]
			: undefined;

		const parts = [];
		if (character) parts.push(character.name);
		if (condition) parts.push(`${condition.name} ${behavior.condition_threshold} 이하`);

		return parts.join(' · ');
	});

	const searchValue = $derived(`${behavior.name} ${description}`);
	const shortId = $derived(behavior.id.split('-')[0]);
</script>

{#if href}
	<CommandLinkItem {href} class="group pr-1">
		<IconCheck class={cn('mr-2 size-4', isSelected ? 'opacity-100' : 'opacity-0')} />
		<div class="flex flex-1 flex-col truncate">
			<span class="truncate">{behavior.name}</span>
			<span class="truncate text-xs text-muted-foreground">{description}</span>
		</div>
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
						onclick={() =>
							openConditionBehaviorDialog({ type: 'update', conditionBehaviorId: behavior.id })}
					>
						수정
					</DropdownMenuItem>
					<DropdownMenuItem
						onclick={() =>
							openConditionBehaviorDialog({ type: 'delete', conditionBehaviorId: behavior.id })}
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
			<span class="truncate">{behavior.name}</span>
			<span class="truncate text-xs text-muted-foreground">{description}</span>
		</div>
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
						onclick={() =>
							openConditionBehaviorDialog({ type: 'update', conditionBehaviorId: behavior.id })}
					>
						수정
					</DropdownMenuItem>
					<DropdownMenuItem
						onclick={() =>
							openConditionBehaviorDialog({ type: 'delete', conditionBehaviorId: behavior.id })}
					>
						삭제
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		{/if}
	</CommandItem>
{/if}
