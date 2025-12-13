<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { ButtonGroup } from '$lib/components/ui/button-group';
	import { ToggleGroup, ToggleGroupItem } from '$lib/components/ui/toggle-group';
	import { Tooltip, TooltipContent, TooltipTrigger } from '$lib/components/ui/tooltip';
	import { IconEditCircle, IconInputSearch, IconTrash } from '@tabler/icons-svelte';
	import { page } from '$app/state';
	import { useNarrative } from '$lib/hooks/use-narrative.svelte';
	import NarrativeCommand from './narrative-command.svelte';
	import NarrativeCreateButton from './narrative-create-button.svelte';
	import NarrativeUpdateDialog from './narrative-update-dialog.svelte';
	import NarrativeDeleteDialog from './narrative-delete-dialog.svelte';

	const { openUpdateDialog, openDeleteDialog } = useNarrative();
	const currentNarrativeId = $derived(page.params.narrativeId);

	let toggleValue = $state<string[]>(['list']);

	function onUpdateClick() {
		if (currentNarrativeId) {
			openUpdateDialog(currentNarrativeId);
		}
	}

	function onDeleteClick() {
		if (currentNarrativeId) {
			openDeleteDialog(currentNarrativeId);
		}
	}
</script>

<aside class="absolute top-4 left-4 z-10 flex w-80 flex-col gap-2">
	<div class="flex justify-between">
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
					<TooltipContent>검색창 {toggleValue.includes('list') ? '숨기기' : '보기'}</TooltipContent>
				</Tooltip>
			</ToggleGroup>
			<NarrativeCreateButton />
			<Tooltip>
				<TooltipTrigger>
					{#snippet child({ props })}
						<Button
							{...props}
							variant="outline"
							size="icon"
							disabled={!currentNarrativeId}
							onclick={onUpdateClick}
						>
							<IconEditCircle class="size-4" />
						</Button>
					{/snippet}
				</TooltipTrigger>
				<TooltipContent>대화 수정</TooltipContent>
			</Tooltip>
		</ButtonGroup>
		<Tooltip>
			<TooltipTrigger>
				{#snippet child({ props })}
					<Button
						{...props}
						variant="outline"
						size="icon"
						disabled={!currentNarrativeId}
						onclick={onDeleteClick}
					>
						<IconTrash class="size-4" />
					</Button>
				{/snippet}
			</TooltipTrigger>
			<TooltipContent>대화 삭제</TooltipContent>
		</Tooltip>
	</div>

	{#if toggleValue.includes('list')}
		<NarrativeCommand />
	{/if}
</aside>

<NarrativeUpdateDialog />
<NarrativeDeleteDialog />
