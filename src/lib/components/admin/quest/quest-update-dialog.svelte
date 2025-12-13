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
		Input as InputGroupInput,
		Addon as InputGroupAddon,
		Text as InputGroupText,
	} from '$lib/components/ui/input-group';
	import { ButtonGroup, Text as ButtonGroupText } from '$lib/components/ui/button-group';
	import { Select, SelectTrigger, SelectContent, SelectItem } from '$lib/components/ui/select';
	import { IconHeading } from '@tabler/icons-svelte';
	import { useQuest } from '$lib/hooks/use-quest.svelte';

	const { store, admin, dialogStore, closeDialog } = useQuest();

	const open = $derived($dialogStore?.type === 'update');
	const questId = $derived($dialogStore?.type === 'update' ? $dialogStore.questId : undefined);
	const currentQuest = $derived(questId ? $store.data?.find((q) => q.id === questId) : undefined);

	let title = $state('');
	let type = $state<QuestType>('primary');
	let orderInChapter = $state(0);
	let isSubmitting = $state(false);

	$effect(() => {
		if (open && currentQuest) {
			title = currentQuest.title;
			type = currentQuest.type;
			orderInChapter = currentQuest.order_in_chapter;
		}
	});

	function getTypeLabel(questType: QuestType) {
		return questType === 'primary' ? '메인 퀘스트' : '서브 퀘스트';
	}

	function onOpenChange(value: boolean) {
		if (!value) {
			closeDialog();
		}
	}

	function onsubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!questId || !title.trim() || isSubmitting) return;

		isSubmitting = true;

		admin
			.update(questId, {
				title: title.trim(),
				type,
				order_in_chapter: orderInChapter,
			})
			.then(() => {
				closeDialog();
			})
			.catch((error) => {
				console.error('Failed to update quest:', error);
			})
			.finally(() => {
				isSubmitting = false;
			});
	}
</script>

<Dialog {open} {onOpenChange}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>퀘스트 수정하기</DialogTitle>
		</DialogHeader>
		<form {onsubmit} class="space-y-4">
			<InputGroup>
				<InputGroupAddon align="inline-start">
					<IconHeading class="size-4" />
				</InputGroupAddon>
				<InputGroupInput placeholder="제목" bind:value={title} />
				<InputGroupAddon align="inline-end">
					<span class="text-xs text-muted-foreground">{title.length}</span>
				</InputGroupAddon>
			</InputGroup>

			<div class="grid grid-cols-2 gap-4">
				<ButtonGroup class="w-full">
					<ButtonGroupText>타입</ButtonGroupText>
					<Select type="single" bind:value={type}>
						<SelectTrigger class="flex-1">
							{getTypeLabel(type)}
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="primary" label="메인 퀘스트">메인 퀘스트</SelectItem>
							<SelectItem value="secondary" label="서브 퀘스트">서브 퀘스트</SelectItem>
						</SelectContent>
					</Select>
				</ButtonGroup>

				<InputGroup>
					<InputGroupAddon>
						<InputGroupText>순서</InputGroupText>
					</InputGroupAddon>
					<InputGroupInput type="number" bind:value={orderInChapter} min={0} />
				</InputGroup>
			</div>

			<DialogFooter>
				<Button type="submit" disabled={isSubmitting}>
					{isSubmitting ? '수정 중...' : '수정하기'}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>
