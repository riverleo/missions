<script lang="ts">
	import { useBehavior } from '$lib/hooks';
	import type { ConditionBehaviorId } from '$lib/types';
	import { Button } from '$lib/components/ui/button';
	import { ButtonGroup } from '$lib/components/ui/button-group';
	import { ToggleGroup, ToggleGroupItem } from '$lib/components/ui/toggle-group';
	import { Tooltip, TooltipContent, TooltipTrigger } from '$lib/components/ui/tooltip';
	import { IconInputSearch, IconPlus, IconEditCircle, IconTrash } from '@tabler/icons-svelte';
	import { page } from '$app/state';
	import ConditionBehaviorCommand from './condition-behavior-command.svelte';
	import ConditionBehaviorCreateDialog from './condition-behavior-create-dialog.svelte';
	import ConditionBehaviorUpdateDialog from './condition-behavior-update-dialog.svelte';
	import ConditionBehaviorDeleteDialog from './condition-behavior-delete-dialog.svelte';

	const { openConditionBehaviorDialog } = useBehavior();
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
								onclick={() => openConditionBehaviorDialog({ type: 'create' })}
							>
								<IconPlus class="size-4" />
							</Button>
						{/snippet}
					</TooltipTrigger>
					<TooltipContent>새로운 컨디션 행동 생성</TooltipContent>
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
									openConditionBehaviorDialog({
										type: 'update',
										conditionBehaviorId: currentBehaviorId as ConditionBehaviorId,
									})}
							>
								<IconEditCircle class="size-4" />
							</Button>
						{/snippet}
					</TooltipTrigger>
					<TooltipContent>컨디션 행동 수정</TooltipContent>
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
								openConditionBehaviorDialog({
									type: 'delete',
									conditionBehaviorId: currentBehaviorId as ConditionBehaviorId,
								})}
						>
							<IconTrash class="size-4" />
						</Button>
					{/snippet}
				</TooltipTrigger>
				<TooltipContent>컨디션 행동 삭제</TooltipContent>
			</Tooltip>
		</ButtonGroup>
	</ButtonGroup>

	{#if toggleValue.includes('list')}
		<ConditionBehaviorCommand />
	{/if}
</aside>

<ConditionBehaviorCreateDialog />
<ConditionBehaviorUpdateDialog />
<ConditionBehaviorDeleteDialog />
