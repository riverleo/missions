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
	import { useConditionBehavior } from '$lib/hooks/use-condition-behavior';
	import { useCondition } from '$lib/hooks/use-condition';
	import { useBuilding } from '$lib/hooks/use-building';
	import { useCharacter } from '$lib/hooks/use-character';
	import { getConditionBehaviorLabel } from '$lib/utils/state-label';
	import type { ConditionBehavior, BuildingId, CharacterId } from '$lib/types';

	interface Props {
		behavior: ConditionBehavior;
		href?: string;
		isSelected?: boolean;
		showActions?: boolean;
	}

	let { behavior, href, isSelected = false, showActions = true }: Props = $props();

	const { openDialog } = useConditionBehavior();
	const { conditionStore } = useCondition();
	const { store: buildingStore } = useBuilding();
	const { store: characterStore } = useCharacter();

	const label = $derived(() => {
		const building = $buildingStore.data[behavior.building_id as BuildingId];
		const condition = behavior.condition_id ? $conditionStore.data[behavior.condition_id] : undefined;
		const character = behavior.character_id
			? $characterStore.data[behavior.character_id as CharacterId]
			: undefined;

		return getConditionBehaviorLabel({
			behavior,
			buildingName: building?.name,
			conditionName: condition?.name,
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
						onclick={() => openDialog({ type: 'update', conditionBehaviorId: behavior.id })}
					>
						수정
					</DropdownMenuItem>
					<DropdownMenuItem
						onclick={() => openDialog({ type: 'delete', conditionBehaviorId: behavior.id })}
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
						onclick={() => openDialog({ type: 'update', conditionBehaviorId: behavior.id })}
					>
						수정
					</DropdownMenuItem>
					<DropdownMenuItem
						onclick={() => openDialog({ type: 'delete', conditionBehaviorId: behavior.id })}
					>
						삭제
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		{/if}
	</div>
{/if}
