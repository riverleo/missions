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
	import { useNarrative } from '$lib/hooks/use-narrative.svelte';
	import { Tooltip, TooltipContent, TooltipTrigger } from '$lib/components/ui/tooltip';

	const { narrativeId, ...restProps }: ButtonProps & { narrativeId?: string } = $props();
	const { store, admin } = useNarrative();

	const currentNarrative = $derived(narrativeId ? $store.data?.find((n) => n.id === narrativeId) : undefined);

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
		if (!narrativeId || !title.trim() || isSubmitting) return;

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
				<TooltipContent>대화 또는 효과의 정보를 수정합니다</TooltipContent>
			</Tooltip>
		{/snippet}
	</DialogTrigger>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>대화 또는 효과 수정</DialogTitle>
			<DialogDescription>대화 또는 효과 정보를 수정합니다.</DialogDescription>
		</DialogHeader>
		<form {onsubmit}>
			<div class="space-y-4">
				<div class="space-y-2">
					<Label for="narrative-title">대화 또는 효과 제목</Label>
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
