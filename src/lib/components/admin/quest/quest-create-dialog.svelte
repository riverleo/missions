<script lang="ts">
	import type { QuestType } from '$lib/types';
	import { Button } from '$lib/components/ui/button';
	import {
		Dialog,
		DialogContent,
		DialogFooter,
		DialogHeader,
		DialogTitle,
	} from '$lib/components/ui/dialog';
	import {
		InputGroup,
		InputGroupInput,
		InputGroupAddon,
		InputGroupText,
		InputGroupButton,
	} from '$lib/components/ui/input-group';
	import { ButtonGroup, Text as ButtonGroupText } from '$lib/components/ui/button-group';
	import { Select, SelectTrigger, SelectContent, SelectItem } from '$lib/components/ui/select';
	import {
		DropdownMenu,
		DropdownMenuTrigger,
		DropdownMenuContent,
		DropdownMenuRadioGroup,
		DropdownMenuRadioItem,
		DropdownMenuSeparator,
	} from '$lib/components/ui/dropdown-menu';
	import {
		IconHeading,
		IconChevronDown,
		IconCategory,
		IconSortDescending,
	} from '@tabler/icons-svelte';
	import { useQuest } from '$lib/hooks/use-quest';
	import { useChapter } from '$lib/hooks/use-chapter';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import type { ChapterId, ScenarioId } from '$lib/types';

	const { admin, questDialogStore, closeQuestDialog } = useQuest();
	const scenarioId = $derived(page.params.scenarioId as ScenarioId);
	const { chapterStore } = useChapter();

	const open = $derived($questDialogStore?.type === 'create');
	const chapters = $derived(Object.values($chapterStore.data));

	let title = $state('');
	let type = $state<QuestType>('primary');
	let chapterId = $state('');
	let orderInChapter = $state(0);
	let isSubmitting = $state(false);

	$effect(() => {
		if (open) {
			title = '';
			type = 'primary';
			chapterId = '';
			orderInChapter = 0;
		}
	});

	function getChapterTitle(chapter: { id: string; title: string }) {
		return chapter.title || `제목없음 (${chapter.id.split('-')[0]})`;
	}

	const chapterLabel = $derived.by(() => {
		if (!chapterId) return '챕터 없음';
		const chapter = chapters.find((c) => c.id === chapterId);
		return chapter ? getChapterTitle(chapter) : '챕터 없음';
	});

	function getTypeLabel(questType: QuestType) {
		return questType === 'primary' ? '메인' : '보조';
	}

	function onOpenChange(value: boolean) {
		if (!value) {
			closeQuestDialog();
		}
	}

	function onsubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!title.trim() || isSubmitting) return;

		isSubmitting = true;

		admin
			.createQuest({
				title: title.trim(),
				type,
				chapter_id: (chapterId as ChapterId) || null,
				order_in_chapter: orderInChapter,
			})
			.then((quest) => {
				closeQuestDialog();
				goto(`/admin/scenarios/${scenarioId}/quests/${quest.id}`);
			})
			.catch((error) => {
				console.error('Failed to create quest:', error);
			})
			.finally(() => {
				isSubmitting = false;
			});
	}
</script>

<Dialog {open} {onOpenChange}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>새로운 퀘스트 생성</DialogTitle>
		</DialogHeader>
		<form {onsubmit} class="space-y-6">
			<div class="space-y-2">
				<InputGroup>
					<InputGroupAddon align="inline-start">
						<IconHeading class="size-4" />
					</InputGroupAddon>
					<InputGroupInput placeholder="제목" bind:value={title} />
					<InputGroupAddon align="inline-end">
						<DropdownMenu>
							<DropdownMenuTrigger>
								{#snippet child({ props })}
									<InputGroupButton {...props} variant="ghost">
										{chapterLabel}
										<IconChevronDown class="size-4" />
									</InputGroupButton>
								{/snippet}
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuRadioGroup bind:value={chapterId}>
									<DropdownMenuRadioItem value="">챕터 해제</DropdownMenuRadioItem>
									<DropdownMenuSeparator />
									{#each chapters as chapter (chapter.id)}
										<DropdownMenuRadioItem value={chapter.id}>
											{getChapterTitle(chapter)}
										</DropdownMenuRadioItem>
									{/each}
								</DropdownMenuRadioGroup>
							</DropdownMenuContent>
						</DropdownMenu>
					</InputGroupAddon>
				</InputGroup>

				<div class="grid grid-cols-2 gap-2">
					<ButtonGroup class="w-full">
						<ButtonGroupText>
							<IconCategory class="size-4" />
						</ButtonGroupText>
						<Select type="single" bind:value={type}>
							<SelectTrigger class="flex-1">
								{getTypeLabel(type)}
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="primary" label="메인 퀘스트">메인 퀘스트</SelectItem>
								<SelectItem value="secondary" label="보조 퀘스트">보조 퀘스트</SelectItem>
							</SelectContent>
						</Select>
					</ButtonGroup>

					<InputGroup>
						<InputGroupAddon>
							<InputGroupText>
								<IconSortDescending class="size-4" />
							</InputGroupText>
						</InputGroupAddon>
						<InputGroupInput type="number" bind:value={orderInChapter} min={0} />
					</InputGroup>
				</div>
			</div>
			<DialogFooter>
				<Button type="submit" disabled={isSubmitting}>
					{isSubmitting ? '생성 중...' : '생성하기'}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>
