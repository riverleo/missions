<script lang="ts">
	import {
		Dialog,
		DialogTrigger,
		DialogContent,
		DialogFooter,
		DialogHeader,
		DialogTitle,
	} from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import {
		InputGroup,
		Input as InputGroupInput,
		Addon as InputGroupAddon,
	} from '$lib/components/ui/input-group';
	import { IconPlus, IconHeading } from '@tabler/icons-svelte';
	import { useQuest } from '$lib/hooks/use-quest.svelte';
	import Tooltip from '$lib/components/ui/tooltip/tooltip.svelte';
	import { TooltipContent, TooltipTrigger } from '$lib/components/ui/tooltip';

	const { admin } = useQuest();

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
				console.error('Failed to create quest:', error);
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
						<Button {...props} {...dialogTriggerProps} size="icon" variant="outline">
							<IconPlus />
						</Button>
					{/snippet}
				</TooltipTrigger>
				<TooltipContent>새로운 퀘스트</TooltipContent>
			</Tooltip>
		{/snippet}
	</DialogTrigger>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>새로운 퀘스트 만들기</DialogTitle>
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
					{isSubmitting ? '생성 중...' : '생성하기'}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>
