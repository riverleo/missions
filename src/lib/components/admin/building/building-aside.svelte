<script lang="ts">
	import { useBuilding } from '$lib/hooks';
	import type { BuildingId } from '$lib/types';
	import { Button } from '$lib/components/ui/button';
	import { ButtonGroup } from '$lib/components/ui/button-group';
	import { ToggleGroup, ToggleGroupItem } from '$lib/components/ui/toggle-group';
	import { Tooltip, TooltipContent, TooltipTrigger } from '$lib/components/ui/tooltip';
	import { IconInputSearch, IconPlus, IconEditCircle, IconTrash } from '@tabler/icons-svelte';
	import { page } from '$app/state';
	import BuildingCommand from './building-command.svelte';
	import BuildingCreateDialog from './building-create-dialog.svelte';
	import BuildingUpdateDialog from './building-update-dialog.svelte';
	import BuildingDeleteDialog from './building-delete-dialog.svelte';

	const { openBuildingDialog } = useBuilding();
	const currentBuildingId = $derived(page.params.buildingId);

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
								onclick={() => openBuildingDialog({ type: 'create' })}
							>
								<IconPlus class="size-4" />
							</Button>
						{/snippet}
					</TooltipTrigger>
					<TooltipContent>새로운 건물</TooltipContent>
				</Tooltip>
				<Tooltip>
					<TooltipTrigger>
						{#snippet child({ props })}
							<Button
								{...props}
								variant="outline"
								size="icon"
								disabled={!currentBuildingId}
								onclick={() =>
									currentBuildingId &&
									openBuildingDialog({
										type: 'update',
										buildingId: currentBuildingId as BuildingId,
									})}
							>
								<IconEditCircle class="size-4" />
							</Button>
						{/snippet}
					</TooltipTrigger>
					<TooltipContent>건물 수정</TooltipContent>
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
							disabled={!currentBuildingId}
							onclick={() =>
								currentBuildingId &&
								openBuildingDialog({ type: 'delete', buildingId: currentBuildingId as BuildingId })}
						>
							<IconTrash class="size-4" />
						</Button>
					{/snippet}
				</TooltipTrigger>
				<TooltipContent>건물 삭제</TooltipContent>
			</Tooltip>
		</ButtonGroup>
	</ButtonGroup>

	{#if toggleValue.includes('list')}
		<BuildingCommand />
	{/if}
</aside>

<BuildingCreateDialog />
<BuildingUpdateDialog />
<BuildingDeleteDialog />
