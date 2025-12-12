<script lang="ts">
	import { Button, type ButtonProps } from '$lib/components/ui/button';
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
	import { IconEditCircle } from '@tabler/icons-svelte';
	import { useQuest } from '$lib/hooks/use-quest.svelte';
	import { Tooltip, TooltipContent, TooltipTrigger } from '$lib/components/ui/tooltip';

	const { questId, ...restProps }: ButtonProps & { questId?: string } = $props();
	const { store, admin } = useQuest();

	const currentQuest = $derived(questId ? $store.data?.find((q) => q.id === questId) : undefined);

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
		if (!questId || !title.trim() || isSubmitting) return;

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
		{#snippet child({ props: dialogTriggerProps })}
			<Tooltip>
				<TooltipTrigger>
					{#snippet child({ props })}
						<Button {...props} {...dialogTriggerProps} {...restProps}>
							<IconEditCircle class="h-4 w-4" />
							<span class="sr-only">Edit</span>
						</Button>
					{/snippet}
				</TooltipTrigger>
				<TooltipContent>퀘스트의 정보를 수정합니다</TooltipContent>
			</Tooltip>
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
