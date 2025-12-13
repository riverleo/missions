<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { ButtonGroup } from '$lib/components/ui/button-group';
	import { ToggleGroup, ToggleGroupItem } from '$lib/components/ui/toggle-group';
	import { Tooltip, TooltipContent, TooltipTrigger } from '$lib/components/ui/tooltip';
	import { IconEditCircle, IconInputSearch, IconTrash } from '@tabler/icons-svelte';
	import { page } from '$app/state';
	import { useQuest } from '$lib/hooks/use-quest.svelte';
	import QuestCommand from './quest-command.svelte';
	import QuestCreateButton from './quest-create-button.svelte';
	import QuestUpdateDialog from './quest-update-dialog.svelte';
	import QuestDeleteDialog from './quest-delete-dialog.svelte';

	const { openUpdateDialog, openDeleteDialog } = useQuest();
	const currentQuestId = $derived(page.params.questId);

	let toggleValue = $state<string[]>(['list']);

	function onUpdateClick() {
		if (currentQuestId) {
			openUpdateDialog(currentQuestId);
		}
	}

	function onDeleteClick() {
		if (currentQuestId) {
			openDeleteDialog(currentQuestId);
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
					<TooltipContent>목록 {toggleValue.includes('list') ? '숨기기' : '보기'}</TooltipContent>
				</Tooltip>
			</ToggleGroup>
			<QuestCreateButton />
			<Tooltip>
				<TooltipTrigger>
					{#snippet child({ props })}
						<Button
							{...props}
							variant="outline"
							size="icon"
							disabled={!currentQuestId}
							onclick={onUpdateClick}
						>
							<IconEditCircle class="size-4" />
						</Button>
					{/snippet}
				</TooltipTrigger>
				<TooltipContent>퀘스트 수정</TooltipContent>
			</Tooltip>
		</ButtonGroup>
		<Tooltip>
			<TooltipTrigger>
				{#snippet child({ props })}
					<Button
						{...props}
						variant="outline"
						size="icon"
						disabled={!currentQuestId}
						onclick={onDeleteClick}
					>
						<IconTrash class="size-4" />
					</Button>
				{/snippet}
			</TooltipTrigger>
			<TooltipContent>퀘스트 삭제</TooltipContent>
		</Tooltip>
	</div>

	{#if toggleValue.includes('list')}
		<QuestCommand />
	{/if}
</aside>

<QuestUpdateDialog />
<QuestDeleteDialog />
