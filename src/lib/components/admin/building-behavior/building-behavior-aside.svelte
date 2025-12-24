<script lang="ts">
	import type { BuildingBehaviorId } from '$lib/types';
	import { Button } from '$lib/components/ui/button';
	import { ButtonGroup } from '$lib/components/ui/button-group';
	import { ToggleGroup, ToggleGroupItem } from '$lib/components/ui/toggle-group';
	import { Tooltip, TooltipContent, TooltipTrigger } from '$lib/components/ui/tooltip';
	import { IconInputSearch, IconPlus, IconEditCircle, IconTrash } from '@tabler/icons-svelte';
	import { page } from '$app/state';
	import { useBuildingBehavior } from '$lib/hooks/use-building-behavior';
	import BuildingBehaviorCommand from './building-behavior-command.svelte';
	import BuildingBehaviorCreateDialog from './building-behavior-create-dialog.svelte';
	import BuildingBehaviorUpdateDialog from './building-behavior-update-dialog.svelte';
	import BuildingBehaviorDeleteDialog from './building-behavior-delete-dialog.svelte';

	const { openDialog } = useBuildingBehavior();
	const currentBehaviorId = $derived(page.params.behaviorId);

	let toggleValue = $state<string[]>(['list']);
</script>

<aside class="absolute top-4 left-4 z-10 flex w-80 flex-col gap-2">
	<ButtonGroup class="w-full justify-between">
		<ButtonGroup>
			<ToggleGroup type="multiple" variant="outline" bind:value={toggleValue}>
				<Tooltip>
					<TooltipTrigger>
						{#snippet child({ props })}
							<ToggleGroupItem {...props} value="list" class="size-9 px-0">
								<IconInputSearch class="size-4" />
							</ToggleGroupItem>
						{/snippet}
					</TooltipTrigger>
					<TooltipContent>목록 {toggleValue.includes('list') ? '숨기기' : '보기'}</TooltipContent>
				</Tooltip>
			</ToggleGroup>
			<ButtonGroup>
				<Tooltip>
					<TooltipTrigger>
						{#snippet child({ props })}
							<Button
								{...props}
								variant="outline"
								size="icon"
								onclick={() => openDialog({ type: 'create' })}
							>
								<IconPlus class="size-4" />
							</Button>
						{/snippet}
					</TooltipTrigger>
					<TooltipContent>새로운 건물 행동 생성</TooltipContent>
				</Tooltip>
				<Tooltip>
					<TooltipTrigger>
						{#snippet child({ props })}
							<Button
								{...props}
								variant="outline"
								size="icon"
								disabled={!currentBehaviorId}
								onclick={() =>
									currentBehaviorId &&
									openDialog({
										type: 'update',
										behaviorId: currentBehaviorId as BuildingBehaviorId,
									})}
							>
								<IconEditCircle class="size-4" />
							</Button>
						{/snippet}
					</TooltipTrigger>
					<TooltipContent>건물 행동 수정</TooltipContent>
				</Tooltip>
			</ButtonGroup>
		</ButtonGroup>
		<ButtonGroup>
			<Tooltip>
				<TooltipTrigger>
					{#snippet child({ props })}
						<Button
							{...props}
							variant="outline"
							size="icon"
							disabled={!currentBehaviorId}
							onclick={() =>
								currentBehaviorId &&
								openDialog({ type: 'delete', behaviorId: currentBehaviorId as BuildingBehaviorId })}
						>
							<IconTrash class="size-4" />
						</Button>
					{/snippet}
				</TooltipTrigger>
				<TooltipContent>건물 행동 삭제</TooltipContent>
			</Tooltip>
		</ButtonGroup>
	</ButtonGroup>

	{#if toggleValue.includes('list')}
		<BuildingBehaviorCommand />
	{/if}
</aside>

<BuildingBehaviorCreateDialog />
<BuildingBehaviorUpdateDialog />
<BuildingBehaviorDeleteDialog />
