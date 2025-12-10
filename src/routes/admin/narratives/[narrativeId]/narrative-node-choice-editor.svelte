<script lang="ts">
	import type { NarrativeNodeChoice } from '$lib/types';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { useNarrative } from '$lib/hooks/use-narrative.svelte';
	import { IconTrash, IconPlus } from '@tabler/icons-svelte';

	interface Props {
		narrativeNodeId: string;
		choices: NarrativeNodeChoice[];
	}

	let { narrativeNodeId, choices }: Props = $props();

	const { admin } = useNarrative();

	let isCreating = $state(false);
	let updatingChoiceIds = $state<Set<string>>(new Set());
	let deletingChoiceIds = $state<Set<string>>(new Set());

	async function onclickAddChoice(e: MouseEvent) {
		e.stopImmediatePropagation();
		e.preventDefault();
		if (isCreating) return;

		isCreating = true;

		try {
			await admin.createChoice({
				narrative_node_id: narrativeNodeId,
				title: '새로운 선택지',
			});
		} catch (error) {
			console.error('Failed to create choice:', error);
		} finally {
			isCreating = false;
		}
	}

	async function onchangeChoiceTitle(choice: NarrativeNodeChoice, newTitle: string) {
		if (updatingChoiceIds.has(choice.id)) return;

		updatingChoiceIds.add(choice.id);
		updatingChoiceIds = new Set(updatingChoiceIds);

		try {
			await admin.updateChoice(choice.id, { title: newTitle });
		} catch (error) {
			console.error('Failed to update choice:', error);
		} finally {
			updatingChoiceIds.delete(choice.id);
			updatingChoiceIds = new Set(updatingChoiceIds);
		}
	}

	async function onclickDeleteChoice(e: MouseEvent, choice: NarrativeNodeChoice) {
		e.preventDefault();
		e.stopImmediatePropagation();

		if (deletingChoiceIds.has(choice.id)) return;

		deletingChoiceIds.add(choice.id);
		deletingChoiceIds = new Set(deletingChoiceIds);

		try {
			await admin.removeChoice(choice.id);
		} catch (error) {
			console.error('Failed to delete choice:', error);
			deletingChoiceIds.delete(choice.id);
			deletingChoiceIds = new Set(deletingChoiceIds);
		}
	}
</script>

<div class="space-y-3">
	<div class="flex items-center justify-between">
		<Label>선택지</Label>
		<Button
			type="button"
			size="sm"
			variant="ghost"
			onclick={onclickAddChoice}
			disabled={isCreating}
		>
			<IconPlus class="h-4 w-4" />
		</Button>
	</div>

	<div class="space-y-2">
		{#each choices as choice (choice.id)}
			<div class="flex items-center gap-2">
				<Input
					value={choice.title || ''}
					onchange={(e) => onchangeChoiceTitle(choice, e.currentTarget.value)}
					disabled={updatingChoiceIds.has(choice.id)}
					class="flex-1"
				/>
				<Button
					type="button"
					size="sm"
					variant="ghost"
					onclick={(e) => onclickDeleteChoice(e, choice)}
					disabled={deletingChoiceIds.has(choice.id)}
				>
					<IconTrash class="h-4 w-4 text-destructive" />
				</Button>
			</div>
		{/each}

		{#if choices.length === 0}
			<p class="text-sm text-muted-foreground">선택지가 없습니다. 추가해주세요.</p>
		{/if}
	</div>
</div>
