<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import {
		Dialog,
		DialogTrigger,
		DialogContent,
		DialogHeader,
		DialogTitle,
		DialogDescription,
		DialogFooter,
	} from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { useQuest } from '$lib/hooks/use-quest.svelte';

	const { questId }: { questId: string } = $props();
	const { quests, admin } = useQuest();

	const currentQuest = $derived($quests.data?.find((q) => q.id === questId));

	let open = $state(false);
	let title = $state('');
	let isSubmitting = $state(false);

	$effect(() => {
		if (open && currentQuest) {
			title = currentQuest.title;
		}
	});

	function onsubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!title.trim() || isSubmitting) return;

		isSubmitting = true;

		admin
			.update(questId, { title: title.trim() })
			.then(() => {
				open = false;
			})
			.catch((error) => {
				console.error('Failed to update quest:', error);
			})
			.finally(() => {
				isSubmitting = false;
			});
	}
</script>

<Dialog bind:open>
	<DialogTrigger>
		{#snippet child({ props })}
			<Button {...props} variant="outline">수정</Button>
		{/snippet}
	</DialogTrigger>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>퀘스트 수정</DialogTitle>
			<DialogDescription>퀘스트 정보를 수정합니다.</DialogDescription>
		</DialogHeader>
		<form {onsubmit}>
			<div class="space-y-4">
				<div class="space-y-2">
					<Label for="quest-title">퀘스트 이름</Label>
					<Input id="quest-title" bind:value={title} />
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
