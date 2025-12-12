<script lang="ts">
	import { Button, type ButtonProps } from '$lib/components/ui/button';
	import {
		Dialog,
		DialogTrigger,
		DialogContent,
		DialogFooter,
		DialogHeader,
		DialogTitle,
	} from '$lib/components/ui/dialog';
	import {
		InputGroup,
		Input as InputGroupInput,
		Addon as InputGroupAddon,
	} from '$lib/components/ui/input-group';
	import { IconEditCircle, IconHeading } from '@tabler/icons-svelte';
	import { useQuest } from '$lib/hooks/use-quest.svelte';
	import { Tooltip, TooltipContent, TooltipTrigger } from '$lib/components/ui/tooltip';

	let {
		questId,
		open = $bindable(false),
		showTrigger = true,
		...restProps
	}: ButtonProps & { questId?: string; open?: boolean; showTrigger?: boolean } = $props();
	const { store, admin } = useQuest();

	const currentQuest = $derived(questId ? $store.data?.find((q) => q.id === questId) : undefined);
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
	{#if showTrigger}
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
					<TooltipContent>퀘스트 수정</TooltipContent>
				</Tooltip>
			{/snippet}
		</DialogTrigger>
	{/if}
	<DialogContent>
		<DialogHeader>
			<DialogTitle>퀘스트 수정하기</DialogTitle>
		</DialogHeader>
		<form {onsubmit}>
			<InputGroup>
				<InputGroupAddon align="inline-start">
					<IconHeading class="size-4" />
				</InputGroupAddon>
				<InputGroupInput placeholder="제목" bind:value={title} />
				<InputGroupAddon align="inline-end">
					<span class="text-xs text-muted-foreground">{title.length}</span>
				</InputGroupAddon>
			</InputGroup>
			<DialogFooter class="mt-4">
				<Button type="submit" disabled={isSubmitting}>
					{isSubmitting ? '수정 중...' : '수정하기'}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>
