<script lang="ts">
	import {
		Dialog,
		DialogTrigger,
		DialogContent,
		DialogHeader,
		DialogTitle,
		DialogDescription,
		DialogFooter
	} from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { useQuest } from '$lib/hooks/use-quest.svelte';

	const { create } = useQuest();

	let open = $state(false);
	let title = $state('');
	let isSubmitting = $state(false);

	async function handleSubmit() {
		if (!title.trim() || isSubmitting) return;

		isSubmitting = true;

		try {
			await create({ title: title.trim() });
			title = '';
			open = false;
		} catch (error) {
			console.error('Failed to create quest:', error);
		} finally {
			isSubmitting = false;
		}
	}
</script>

<Dialog bind:open>
	<DialogTrigger>
		{#snippet child({ props })}
			<Button {...props} size="sm">새로운 퀘스트</Button>
		{/snippet}
	</DialogTrigger>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>새로운 퀘스트 만들기</DialogTitle>
			<DialogDescription>퀘스트의 기본 정보를 입력해주세요.</DialogDescription>
		</DialogHeader>
		<form
			onsubmit={(e) => {
				e.preventDefault();
				handleSubmit();
			}}
		>
			<div class="space-y-4">
				<div class="space-y-2">
					<Label for="quest-name">퀘스트 이름</Label>
					<Input id="quest-name" placeholder="퀘스트 이름을 입력하세요" bind:value={title} />
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
