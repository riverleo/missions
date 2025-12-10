<script lang="ts">
	import {
		Dialog,
		DialogTrigger,
		DialogContent,
		DialogHeader,
		DialogTitle,
		DialogDescription,
		DialogFooter,
	} from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { useNarrative } from '$lib/hooks/use-narrative.svelte';

	const { admin } = useNarrative();

	let open = $state(false);
	let title = $state('');
	let isSubmitting = $state(false);

	function onsubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!title.trim() || isSubmitting) return;

		isSubmitting = true;

		admin
			.create({ title: title.trim() })
			.then(() => {
				title = '';
				open = false;
			})
			.catch((error) => {
				console.error('Failed to create narrative:', error);
			})
			.finally(() => {
				isSubmitting = false;
			});
	}
</script>

<Dialog bind:open>
	<DialogTrigger>
		{#snippet child({ props })}
			<Button {...props} size="sm">새로운 내러티브</Button>
		{/snippet}
	</DialogTrigger>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>새로운 내러티브 만들기</DialogTitle>
			<DialogDescription>내러티브의 기본 정보를 입력해주세요.</DialogDescription>
		</DialogHeader>
		<form {onsubmit}>
			<div class="space-y-4">
				<div class="space-y-2">
					<Label for="narrative-title">내러티브 제목</Label>
					<Input id="narrative-title" placeholder="내러티브 제목을 입력하세요" bind:value={title} />
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
