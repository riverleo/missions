<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { ButtonGroup } from '$lib/components/ui/button-group';
	import { ToggleGroup, ToggleGroupItem } from '$lib/components/ui/toggle-group';
	import { Tooltip, TooltipContent, TooltipTrigger } from '$lib/components/ui/tooltip';
	import {
		IconEditCircle,
		IconInputSearch,
		IconPlus,
		IconTrash,
		IconEye,
		IconEyeClosed,
	} from '@tabler/icons-svelte';
	import { page } from '$app/state';
	import { useQuest } from '$lib/hooks/use-quest';
	import type { QuestId } from '$lib/types';
	import QuestCommand from './quest-command.svelte';
	import QuestCreateDialog from './quest-create-dialog.svelte';
	import QuestUpdateDialog from './quest-update-dialog.svelte';
	import QuestDeleteDialog from './quest-delete-dialog.svelte';
	import QuestPublishDialog from './quest-publish-dialog.svelte';

	const { questStore, openDialog } = useQuest();
	const currentQuestId = $derived(page.params.questId);
	const currentQuest = $derived(
		currentQuestId ? $questStore.data?.[currentQuestId as QuestId] : undefined
	);
	const isPublished = $derived(currentQuest?.status === 'published');

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
					<TooltipContent>새로운 퀘스트</TooltipContent>
				</Tooltip>
				<Tooltip>
					<TooltipTrigger>
						{#snippet child({ props })}
							<Button
								{...props}
								variant="outline"
								size="icon"
								disabled={!currentQuestId}
								onclick={() =>
									currentQuestId &&
									openDialog({ type: 'update', questId: currentQuestId as QuestId })}
							>
								<IconEditCircle class="size-4" />
							</Button>
						{/snippet}
					</TooltipTrigger>
					<TooltipContent>퀘스트 수정</TooltipContent>
				</Tooltip>
				<Tooltip>
					<TooltipTrigger>
						{#snippet child({ props })}
							<Button
								{...props}
								variant="outline"
								size="icon"
								disabled={!currentQuestId}
								onclick={() =>
									currentQuestId &&
									openDialog({ type: 'publish', questId: currentQuestId as QuestId })}
							>
								{#if isPublished}
									<IconEyeClosed class="size-4" />
								{:else}
									<IconEye class="size-4" />
								{/if}
							</Button>
						{/snippet}
					</TooltipTrigger>
					<TooltipContent>{isPublished ? '작업중으로 전환' : '공개로 전환'}</TooltipContent>
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
							disabled={!currentQuestId}
							onclick={() =>
								currentQuestId &&
								openDialog({ type: 'delete', questId: currentQuestId as QuestId })}
						>
							<IconTrash class="size-4" />
						</Button>
					{/snippet}
				</TooltipTrigger>
				<TooltipContent>퀘스트 삭제</TooltipContent>
			</Tooltip>
		</ButtonGroup>
	</ButtonGroup>

	{#if toggleValue.includes('list')}
		<QuestCommand />
	{/if}
</aside>

<QuestCreateDialog />
<QuestUpdateDialog />
<QuestDeleteDialog />
<QuestPublishDialog />
