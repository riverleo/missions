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
	import { useNarrative } from '$lib/hooks/use-narrative.svelte';

	const { narrativeId }: { narrativeId: string } = $props();
	const { narratives, admin } = useNarrative();

	const currentNarrative = $derived($narratives.data?.find((n) => n.id === narrativeId));

	let open = $state(false);
	let title = $state('');
	let isSubmitting = $state(false);

	$effect(() => {
		if (open && currentNarrative) {
			title = currentNarrative.title;
		}
	});

	function onsubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!title.trim() || isSubmitting) return;

		isSubmitting = true;

		admin
			.update(narrativeId, { title: title.trim() })
			.then(() => {
				open = false;
			})
			.catch((error) => {
				console.error('Failed to update narrative:', error);
			})
			.finally(() => {
				isSubmitting = false;
			});
	}
</script>

<Dialog bind:open}>
	<DialogTrigger>
		{#snippet child({ props })}
			<Button {...props} variant="outline">수정</Button>
		{/snippet}
	</DialogTrigger>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>내러티브 수정</DialogTitle>
			<DialogDescription>내러티브 정보를 수정합니다.</DialogDescription>
		</DialogHeader>
		<form {onsubmit}>
			<div class="space-y-4">
				<div class="space-y-2">
					<Label for="narrative-title">내러티브 제목</Label>
					<Input id="narrative-title" bind:value={title} />
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
