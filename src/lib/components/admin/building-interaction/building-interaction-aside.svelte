<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { ButtonGroup } from '$lib/components/ui/button-group';
	import { ToggleGroup, ToggleGroupItem } from '$lib/components/ui/toggle-group';
	import { Tooltip, TooltipContent, TooltipTrigger } from '$lib/components/ui/tooltip';
	import { IconInputSearch, IconEditCircle, IconPlus, IconTrash } from '@tabler/icons-svelte';
	import { page } from '$app/state';
	import { useBuilding } from '$lib/hooks/use-building';
	import type { BuildingInteractionId } from '$lib/types';
	import BuildingInteractionCommand from './building-interaction-command.svelte';
	import BuildingInteractionCreateDialog from './building-interaction-create-dialog.svelte';
	import BuildingInteractionUpdateDialog from './building-interaction-update-dialog.svelte';
	import BuildingInteractionDeleteDialog from './building-interaction-delete-dialog.svelte';

	const { openInteractionDialog } = useBuilding();
	const currentInteractionId = $derived(page.params.buildingInteractionId);

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
								onclick={() => openInteractionDialog({ type: 'create' })}
							>
								<IconPlus class="size-4" />
							</Button>
						{/snippet}
					</TooltipTrigger>
					<TooltipContent>새로운 건물 상호작용</TooltipContent>
				</Tooltip>
				<Tooltip>
					<TooltipTrigger>
						{#snippet child({ props })}
							<Button
								{...props}
								variant="outline"
								size="icon"
								disabled={!currentInteractionId}
								onclick={() =>
									currentInteractionId &&
									openInteractionDialog({
										type: 'update',
										interactionId: currentInteractionId as BuildingInteractionId,
									})}
							>
								<IconEditCircle class="size-4" />
							</Button>
						{/snippet}
					</TooltipTrigger>
					<TooltipContent>건물 상호작용 수정</TooltipContent>
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
							disabled={!currentInteractionId}
							onclick={() =>
								currentInteractionId &&
								openInteractionDialog({
									type: 'delete',
									interactionId: currentInteractionId as BuildingInteractionId,
								})}
						>
							<IconTrash class="size-4" />
						</Button>
					{/snippet}
				</TooltipTrigger>
				<TooltipContent>건물 상호작용 삭제</TooltipContent>
			</Tooltip>
		</ButtonGroup>
	</ButtonGroup>

	{#if toggleValue.includes('list')}
		<BuildingInteractionCommand />
	{/if}
</aside>

<BuildingInteractionCreateDialog />
<BuildingInteractionUpdateDialog />
<BuildingInteractionDeleteDialog />
