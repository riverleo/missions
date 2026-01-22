<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import {
		Command,
		CommandInput,
		CommandList,
		CommandEmpty,
		CommandGroup,
		CommandLinkItem,
	} from '$lib/components/ui/command';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuTrigger,
	} from '$lib/components/ui/dropdown-menu';
	import { IconCheck, IconDotsVertical } from '@tabler/icons-svelte';
	import { cn } from '$lib/utils';
	import { useBehavior } from '$lib/hooks/use-behavior';
	import { useCondition } from '$lib/hooks/use-condition';
	import { useCharacter } from '$lib/hooks/use-character';
	import { page } from '$app/state';
	import { alphabetical, group } from 'radash';
	import type { ScenarioId, CharacterId } from '$lib/types';

	const { conditionBehaviorStore, openConditionBehaviorDialog } = useBehavior();
	const { conditionStore } = useCondition();
	const { characterStore } = useCharacter();
	const scenarioId = $derived(page.params.scenarioId as ScenarioId);
	const currentBehaviorId = $derived(page.params.behaviorId);

	const behaviorsGroupedByCondition = $derived(() => {
		const behaviors = Object.values($conditionBehaviorStore.data);
		const grouped = group(behaviors, (b) => b.condition_id);
		const conditions = Object.values($conditionStore.data);
		const sortedConditions = alphabetical(conditions, (b) => b.name);

		return sortedConditions
			.map((condition) => ({
				condition,
				behaviors: alphabetical(grouped[condition.id] ?? [], (b) => b.name),
			}))
			.filter((g) => g.behaviors.length > 0);
	});
</script>

<Command class="w-full rounded-lg border shadow-md">
	<CommandInput placeholder="컨디션 행동 검색..." />
	{#if behaviorsGroupedByCondition().length > 0}
		<CommandList class="max-h-80">
			<CommandEmpty />
			{#each behaviorsGroupedByCondition() as { condition, behaviors } (condition.id)}
				<CommandGroup heading={condition.name}>
					{#each behaviors as behavior (behavior.id)}
						{@const character = behavior.character_id
							? $characterStore.data[behavior.character_id as CharacterId]
							: undefined}
						<CommandLinkItem
							href={`/admin/scenarios/${scenarioId}/condition-behaviors/${behavior.id}`}
							class="group pr-1"
						>
							<IconCheck
								class={cn(
									'mr-2 size-4',
									behavior.id === currentBehaviorId ? 'opacity-100' : 'opacity-0'
								)}
							/>
							<div class="flex flex-1 flex-col truncate">
								<span class="truncate">
									{behavior.name}
								</span>
								<span class="truncate text-xs text-muted-foreground">
									{character?.name ?? '모든 캐릭터'} ({condition.name}
									{behavior.condition_threshold} 이하)
								</span>
							</div>
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
										onclick={() => openConditionBehaviorDialog({ type: 'update', conditionBehaviorId: behavior.id })}
									>
										수정
									</DropdownMenuItem>
									<DropdownMenuItem
										onclick={() => openConditionBehaviorDialog({ type: 'delete', conditionBehaviorId: behavior.id })}
									>
										삭제
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</CommandLinkItem>
					{/each}
				</CommandGroup>
			{/each}
		</CommandList>
	{/if}
</Command>
