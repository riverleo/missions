<script lang="ts">
	import type { Narrative } from '$lib/components/app/narrative/store';
	import { Card, CardHeader, CardContent, CardFooter } from '$lib/components/ui/card';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Popover, PopoverTrigger, PopoverContent } from '$lib/components/ui/popover';
	import { Select, SelectTrigger, SelectContent, SelectItem } from '$lib/components/ui/select';
	import {
		AlertDialog,
		AlertDialogTrigger,
		AlertDialogContent,
		AlertDialogHeader,
		AlertDialogTitle,
		AlertDialogFooter,
		AlertDialogAction,
		AlertDialogCancel,
	} from '$lib/components/ui/alert-dialog';
	import { DiceRollEditor } from '$lib/components/admin/dice-roll-editor';
	import { getContext } from './context';
	import { getChildrenNarratives, getParentNarratives } from './index';
	import NarrativeChoiceItem from './narrative-choice-item.svelte';
	import NarrativeCardDetails from './narrative-card-details.svelte';
	import IconTrash from '@tabler/icons-svelte/icons/trash';
	import IconListNumbers from '@tabler/icons-svelte/icons/list-numbers';
	import IconPlus from '@tabler/icons-svelte/icons/plus';

	let { narrativeId }: { narrativeId: string } = $props();

	const ctx = getContext();

	const narrative = $derived(ctx.narratives[narrativeId]);
	const narrativeIdOptions = $derived(
		Object.values(ctx.narratives).map((n) => ({
			value: n.id,
			label: n.message ? `${n.message} (${n.id})` : n.id,
		}))
	);

	const highlighted = $derived.by(() => {
		if (!ctx.focusedNarrativeId) return true;

		// Highlight if this is the focused node
		if (ctx.focusedNarrativeId === narrativeId) return true;

		// Highlight if this is a child of the focused node
		const children = getChildrenNarratives(ctx.narratives, ctx.focusedNarrativeId);
		for (const child of children) {
			if (child.id === narrativeId) return true;
		}

		const parents = getParentNarratives(ctx.narratives, ctx.focusedNarrativeId);
		for (const parent of parents) {
			if (parent.id === narrativeId) return true;
		}

		return false;
	});

	// Update node
	function updateNarrative(updates: Partial<Narrative>) {
		ctx.narratives = {
			...ctx.narratives,
			[narrativeId]: { ...ctx.narratives[narrativeId], ...updates } as Narrative,
		};
	}

	// Delete node
	function deleteNarrative() {
		const newNodes = { ...ctx.narratives };

		// Remove references to this node from all parent nodes
		Object.values(newNodes).forEach((node) => {
			if (node.type === 'text') {
				// Check and clear narrative success/failure actions
				if (
					node.diceRoll.success.type === 'narrative' &&
					node.diceRoll.success.narrativeId === narrativeId
				) {
					node.diceRoll.success = { type: 'terminate' };
				}
				if (
					node.diceRoll.failure.type === 'narrative' &&
					node.diceRoll.failure.narrativeId === narrativeId
				) {
					node.diceRoll.failure = { type: 'terminate' };
				}
			} else if (node.type === 'choice') {
				// Check and clear choice success/failure actions
				node.choices.forEach((choice) => {
					if (
						choice.diceRoll.success.type === 'narrative' &&
						choice.diceRoll.success.narrativeId === narrativeId
					) {
						choice.diceRoll.success = { type: 'terminate' };
					}
					if (
						choice.diceRoll.failure.type === 'narrative' &&
						choice.diceRoll.failure.narrativeId === narrativeId
					) {
						choice.diceRoll.failure = { type: 'terminate' };
					}
				});
			}
		});

		// Delete the node itself
		delete newNodes[narrativeId];
		ctx.narratives = newNodes;
	}

	// Toggle type
	function toggleType(newType: 'text' | 'choice') {
		const node = ctx.narratives[narrativeId];
		if (newType === 'text') {
			const { choices, ...rest } = node as any;
			updateNarrative({
				...rest,
				type: 'text',
				diceRoll: {
					difficultyClass: 0,
					silent: true,
					success: { type: 'terminate' },
					failure: { type: 'terminate' },
				},
			});
		} else {
			const { diceRoll, ...rest } = node as any;
			updateNarrative({
				...rest,
				type: 'choice',
				choices: [],
			});
		}
	}

	// Add choice
	function addChoice() {
		const node = ctx.narratives[narrativeId];
		if (node.type !== 'choice') return;

		const choices = (node as any).choices || [];
		updateNarrative({
			choices: [
				...choices,
				{
					id: crypto.randomUUID(),
					text: '',
					diceRoll: {
						difficultyClass: 0,
						silent: true,
						success: { type: 'terminate' },
						failure: { type: 'terminate' },
					},
				},
			],
		});
	}
</script>

<Card class="gap-4 py-4 transition-opacity" style="opacity: {highlighted ? 1 : 0.5}">
	<CardHeader class="flex-col gap-4 px-4">
		<NarrativeCardDetails {narrativeId} />
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				<Select
					type="single"
					value={narrative.type}
					onValueChange={(value: string | undefined) => {
						if (value) toggleType(value as typeof narrative.type);
					}}
				>
					<SelectTrigger class="w-32">
						{narrative.type}
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="text" />
						<SelectItem value="choice" />
					</SelectContent>
				</Select>

				<!-- Narrative Type: DiceRollEditor with trigger -->
				{#if narrative.type === 'text'}
					<DiceRollEditor
						diceRoll={narrative.diceRoll!}
						{narrativeIdOptions}
						currentNarrativeId={narrative.id}
						onUpdate={(diceRoll) => {
							updateNarrative({ diceRoll });
						}}
						onCreateNarrative={ctx.createNarrative}
					/>
				{/if}

				<!-- Choice Type: Settings popover for managing choices -->
				{#if narrative.type === 'choice'}
					<Popover>
						<PopoverTrigger>
							{#snippet child({ props })}
								<Button {...props} variant="ghost" size="icon">
									<IconListNumbers />
								</Button>
							{/snippet}
						</PopoverTrigger>
						<PopoverContent class="w-80">
							<div class="space-y-3">
								{#each (narrative as any).choices || [] as choice, index (choice.id)}
									<NarrativeChoiceItem nodeId={narrativeId} choiceId={choice.id} {index} />
								{/each}

								<Button size="sm" onclick={addChoice} class="w-full">
									<IconPlus />새 선택지 추가
								</Button>
							</div>
						</PopoverContent>
					</Popover>
				{/if}
			</div>
			<div class="flex items-center gap-1">
				<AlertDialog>
					<AlertDialogTrigger>
						{#snippet child({ props })}
							<Button {...props} variant="ghost" size="icon">
								<IconTrash class="size-4" />
							</Button>
						{/snippet}
					</AlertDialogTrigger>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>정말 삭제하시겠습니까?</AlertDialogTitle>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>취소</AlertDialogCancel>
							<AlertDialogAction onclick={deleteNarrative}>삭제</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</div>
		</div>
	</CardHeader>

	<CardContent class="flex flex-col gap-2 px-4">
		<Input
			value={narrative.message}
			placeholder="메시지"
			oninput={(e) => {
				const target = e.target as HTMLInputElement;
				updateNarrative({ message: target.value });
			}}
		/>
		<Textarea
			value={narrative.description || ''}
			placeholder="설명 (선택사항)"
			oninput={(e) => {
				const target = e.target as HTMLTextAreaElement;
				updateNarrative({ description: target.value || undefined });
			}}
			class="h-24 resize-none"
		/>
	</CardContent>

	<CardFooter class="flex flex-col items-start gap-1 px-4">
		<span class="text-xs text-muted-foreground">{narrative.id}</span>
	</CardFooter>
</Card>
