<script lang="ts">
	import { useInteraction } from '$lib/hooks';
	import { Button } from '$lib/components/ui/button';
	import { ButtonGroup } from '$lib/components/ui/button-group';
	import { ToggleGroup, ToggleGroupItem } from '$lib/components/ui/toggle-group';
	import { Tooltip, TooltipContent, TooltipTrigger } from '$lib/components/ui/tooltip';
	import { IconInputSearch, IconEditCircle, IconPlus, IconTrash } from '@tabler/icons-svelte';
	import { page } from '$app/state';
	import type { ItemInteractionId } from '$lib/types';
	import ItemInteractionCommand from './item-interaction-command.svelte';
	import ItemInteractionCreateDialog from './item-interaction-create-dialog.svelte';
	import ItemInteractionUpdateDialog from './item-interaction-update-dialog.svelte';
	import ItemInteractionDeleteDialog from './item-interaction-delete-dialog.svelte';

	const { openItemInteractionDialog } = useInteraction();
	const currentInteractionId = $derived(page.params.itemInteractionId);

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
								onclick={() => openItemInteractionDialog({ type: 'create' })}
							>
								<IconPlus class="size-4" />
							</Button>
						{/snippet}
					</TooltipTrigger>
					<TooltipContent>새로운 아이템 상호작용</TooltipContent>
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
									openItemInteractionDialog({
										type: 'update',
										itemInteractionId: currentInteractionId as ItemInteractionId,
									})}
							>
								<IconEditCircle class="size-4" />
							</Button>
						{/snippet}
					</TooltipTrigger>
					<TooltipContent>아이템 상호작용 수정</TooltipContent>
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
								openItemInteractionDialog({
									type: 'delete',
									itemInteractionId: currentInteractionId as ItemInteractionId,
								})}
						>
							<IconTrash class="size-4" />
						</Button>
					{/snippet}
				</TooltipTrigger>
				<TooltipContent>아이템 상호작용 삭제</TooltipContent>
			</Tooltip>
		</ButtonGroup>
	</ButtonGroup>

	{#if toggleValue.includes('list')}
		<ItemInteractionCommand />
	{/if}
</aside>

<ItemInteractionCreateDialog />
<ItemInteractionUpdateDialog />
<ItemInteractionDeleteDialog />
