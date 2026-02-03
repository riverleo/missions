<script lang="ts">
	import { useBuilding } from '$lib/hooks';
	import { Button } from '$lib/components/ui/button';
	import { ButtonGroup } from '$lib/components/ui/button-group';
	import { ToggleGroup, ToggleGroupItem } from '$lib/components/ui/toggle-group';
	import { Tooltip, TooltipContent, TooltipTrigger } from '$lib/components/ui/tooltip';
	import { IconInputSearch, IconPlus, IconEditCircle, IconTrash } from '@tabler/icons-svelte';
	import { page } from '$app/state';
	import type { ConditionId } from '$lib/types';
	import ConditionCommand from './condition-command.svelte';
	import ConditionCreateDialog from './condition-create-dialog.svelte';
	import ConditionUpdateDialog from './condition-update-dialog.svelte';
	import ConditionDeleteDialog from './condition-delete-dialog.svelte';

	const { openConditionDialog } = useBuilding();
	const currentConditionId = $derived(page.params.conditionId);

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
								onclick={() => openConditionDialog({ type: 'create' })}
							>
								<IconPlus class="size-4" />
							</Button>
						{/snippet}
					</TooltipTrigger>
					<TooltipContent>새로운 컨디션 생성</TooltipContent>
				</Tooltip>
				<Tooltip>
					<TooltipTrigger>
						{#snippet child({ props })}
							<Button
								{...props}
								variant="outline"
								size="icon"
								disabled={!currentConditionId}
								onclick={() =>
									currentConditionId &&
									openConditionDialog({
										type: 'update',
										conditionId: currentConditionId as ConditionId,
									})}
							>
								<IconEditCircle class="size-4" />
							</Button>
						{/snippet}
					</TooltipTrigger>
					<TooltipContent>컨디션 수정</TooltipContent>
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
							disabled={!currentConditionId}
							onclick={() =>
								currentConditionId &&
								openConditionDialog({
									type: 'delete',
									conditionId: currentConditionId as ConditionId,
								})}
						>
							<IconTrash class="size-4" />
						</Button>
					{/snippet}
				</TooltipTrigger>
				<TooltipContent>컨디션 삭제</TooltipContent>
			</Tooltip>
		</ButtonGroup>
	</ButtonGroup>

	{#if toggleValue.includes('list')}
		<ConditionCommand />
	{/if}
</aside>

<ConditionCreateDialog />
<ConditionUpdateDialog />
<ConditionDeleteDialog />
