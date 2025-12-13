<script lang="ts">
	import type { ScenarioQuestType } from '$lib/types';
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
	import { useScenarioQuest } from '$lib/hooks/use-scenario-quest.svelte';

	const { store, admin, dialogStore, closeDialog } = useScenarioQuest();

	const open = $derived($dialogStore?.type === 'update');
	const scenarioQuestId = $derived(
		$dialogStore?.type === 'update' ? $dialogStore.scenarioQuestId : undefined
	);
	const currentScenarioQuest = $derived(
		scenarioQuestId ? $store.data?.find((q) => q.id === scenarioQuestId) : undefined
	);

	let title = $state('');
	let type = $state<ScenarioQuestType>('primary');
	let orderInChapter = $state(0);
	let isSubmitting = $state(false);

	$effect(() => {
		if (open && currentScenarioQuest) {
			title = currentScenarioQuest.title;
			type = currentScenarioQuest.type;
			orderInChapter = currentScenarioQuest.order_in_chapter;
		}
	});

	function getTypeLabel(scenarioQuestType: ScenarioQuestType) {
		return scenarioQuestType === 'primary' ? '메인' : '보조';
	}

	function onOpenChange(value: boolean) {
		if (!value) {
			closeDialog();
		}
	}

	function onsubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!scenarioQuestId || !title.trim() || isSubmitting) return;

		isSubmitting = true;

		admin
			.update(scenarioQuestId, {
				title: title.trim(),
				type,
				order_in_chapter: orderInChapter,
			})
			.then(() => {
				closeDialog();
			})
			.catch((error) => {
				console.error('Failed to update scenario quest:', error);
			})
			.finally(() => {
				isSubmitting = false;
			});
	}
</script>

<Dialog {open} {onOpenChange}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>퀘스트 수정</DialogTitle>
		</DialogHeader>
		<form {onsubmit} class="space-y-6">
			<div class="space-y-2">
				<InputGroup>
					<InputGroupAddon align="inline-start">
						<IconHeading class="size-4" />
					</InputGroupAddon>
					<InputGroupInput placeholder="제목" bind:value={title} />
					<InputGroupAddon align="inline-end">
						<span class="text-xs text-muted-foreground">{title.length}</span>
					</InputGroupAddon>
				</InputGroup>

				<div class="grid grid-cols-2 gap-2">
					<ButtonGroup class="w-full">
						<ButtonGroupText>타입</ButtonGroupText>
						<Select type="single" bind:value={type}>
							<SelectTrigger class="flex-1">
								{getTypeLabel(type)}
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="primary" label="메인">메인</SelectItem>
								<SelectItem value="secondary" label="보조">보조</SelectItem>
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
			</div>

			<DialogFooter>
				<Button type="submit" disabled={isSubmitting}>
					{isSubmitting ? '수정 중...' : '수정하기'}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>
