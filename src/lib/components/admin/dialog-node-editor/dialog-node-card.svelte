<script lang="ts">
	import type { DialogNode } from '$lib/components/app/dialog-node/store';
	import { Card, CardHeader, CardContent, CardFooter } from '$lib/components/ui/card';
	import { Textarea } from '$lib/components/ui/textarea';
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
	import { getChildrenDialogNodes, getParentDialogNode } from './index';
	import DialogNodeChoiceItem from './dialog-node-choice-item.svelte';
	import DialogNodeCardDetails from './dialog-node-card-details.svelte';
	import IconTrash from '@tabler/icons-svelte/icons/trash';
	import IconListNumbers from '@tabler/icons-svelte/icons/list-numbers';
	import IconPlus from '@tabler/icons-svelte/icons/plus';
	import IconFocus from '@tabler/icons-svelte/icons/focus';

	interface Props {
		nodeId: string;
	}

	let { nodeId: dialogNodeId }: Props = $props();

	const ctx = getContext();

	const node = $derived(ctx.dialogNodes[dialogNodeId]);
	const dialogNodeIdOptions = $derived(
		Object.values(ctx.dialogNodes).map((n) => ({
			value: n.id,
			label: n.text ? `${n.text} (${n.id})` : n.id,
		}))
	);
	const focused = $derived(ctx.focusedDialogNodeId === dialogNodeId);

	const highlighted = $derived.by(() => {
		if (!ctx.focusedDialogNodeId) return true;

		// Highlight if this is the focused node
		if (ctx.focusedDialogNodeId === dialogNodeId) return true;

		// Highlight if this is a child of the focused node
		const children = getChildrenDialogNodes(ctx.dialogNodes, ctx.focusedDialogNodeId);
		for (const child of children) {
			if (child.id === dialogNodeId) return true;
		}

		// Highlight if this is the parent of the focused node
		const parent = getParentDialogNode(ctx.dialogNodes, ctx.focusedDialogNodeId);
		if (parent?.id === dialogNodeId) return true;

		return false;
	});

	// Update node
	function updateNode(updates: Partial<DialogNode>) {
		ctx.dialogNodes = {
			...ctx.dialogNodes,
			[dialogNodeId]: { ...ctx.dialogNodes[dialogNodeId], ...updates } as DialogNode,
		};
	}

	// Delete node
	function deleteNode() {
		const newNodes = { ...ctx.dialogNodes };

		// Remove references to this node from all parent nodes
		Object.values(newNodes).forEach((node) => {
			if (node.type === 'narrative') {
				// Check and clear narrative success/failure actions
				if (
					node.diceRoll.success.type === 'dialogNode' &&
					node.diceRoll.success.dialogNodeId === dialogNodeId
				) {
					node.diceRoll.success = { type: 'terminate' };
				}
				if (
					node.diceRoll.failure.type === 'dialogNode' &&
					node.diceRoll.failure.dialogNodeId === dialogNodeId
				) {
					node.diceRoll.failure = { type: 'terminate' };
				}
			} else if (node.type === 'choice') {
				// Check and clear choice success/failure actions
				node.choices.forEach((choice) => {
					if (
						choice.diceRoll.success.type === 'dialogNode' &&
						choice.diceRoll.success.dialogNodeId === dialogNodeId
					) {
						choice.diceRoll.success = { type: 'terminate' };
					}
					if (
						choice.diceRoll.failure.type === 'dialogNode' &&
						choice.diceRoll.failure.dialogNodeId === dialogNodeId
					) {
						choice.diceRoll.failure = { type: 'terminate' };
					}
				});
			}
		});

		// Delete the node itself
		delete newNodes[dialogNodeId];
		ctx.dialogNodes = newNodes;
	}

	// Toggle type
	function toggleType(newType: 'narrative' | 'choice') {
		const node = ctx.dialogNodes[dialogNodeId];
		if (newType === 'narrative') {
			const { choices, ...rest } = node as any;
			updateNode({
				...rest,
				type: 'narrative',
				diceRoll: {
					difficultyClass: 10,
					silent: false,
					success: { type: 'terminate' },
					failure: { type: 'terminate' },
				},
			});
		} else {
			const { diceRoll, ...rest } = node as any;
			updateNode({
				...rest,
				type: 'choice',
				choices: [],
			});
		}
	}

	// Add choice
	function addChoice() {
		const node = ctx.dialogNodes[dialogNodeId];
		if (node.type !== 'choice') return;

		const choices = (node as any).choices || [];
		updateNode({
			choices: [
				...choices,
				{
					id: crypto.randomUUID(),
					text: '',
					diceRoll: {
						difficultyClass: 10,
						silent: false,
						success: { type: 'terminate' },
						failure: { type: 'terminate' },
					},
				},
			],
		});
	}

	// Toggle focus
	function toggleFocus() {
		if (ctx.focusedDialogNodeId === dialogNodeId) {
			ctx.focusedDialogNodeId = undefined;
		} else {
			ctx.focusedDialogNodeId = dialogNodeId;
		}
	}
</script>

<Card class="gap-4 py-4 transition-opacity" style="opacity: {highlighted ? 1 : 0.5}">
	<CardHeader class="flex-col gap-4 px-4">
		<DialogNodeCardDetails {dialogNodeId} />
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				<Select
					type="single"
					value={node.type}
					onValueChange={(value: string | undefined) => {
						if (value) toggleType(value as typeof node.type);
					}}
				>
					<SelectTrigger class="w-32">
						{node.type}
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="narrative" />
						<SelectItem value="choice" />
					</SelectContent>
				</Select>

				<!-- Narrative Type: DiceRollEditor with trigger -->
				{#if node.type === 'narrative'}
					<DiceRollEditor
						diceRoll={node.diceRoll!}
						{dialogNodeIdOptions}
						currentDialogNodeId={node.id}
						onUpdate={(diceRoll) => {
							updateNode({ diceRoll });
						}}
						onCreateNode={ctx.createDialogNode}
					/>
				{/if}

				<!-- Choice Type: Settings popover for managing choices -->
				{#if node.type === 'choice'}
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
								{#each (node as any).choices || [] as choice, index (choice.id)}
									<DialogNodeChoiceItem nodeId={dialogNodeId} choiceId={choice.id} {index} />
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
				<Button variant={focused ? 'default' : 'ghost'} size="icon" onclick={toggleFocus}>
					<IconFocus class="size-4" />
				</Button>
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
							<AlertDialogAction onclick={deleteNode}>삭제</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</div>
		</div>
	</CardHeader>

	<CardContent class="px-4">
		<Textarea
			value={node.text}
			placeholder="대사 내용을 입력하세요"
			oninput={(e) => {
				const target = e.target as HTMLTextAreaElement;
				updateNode({ text: target.value });
			}}
			class="h-12 resize-none"
		/>
	</CardContent>

	<CardFooter class="flex flex-col items-start gap-1 px-4">
		<span class="text-xs text-muted-foreground">{node.id}</span>
	</CardFooter>
</Card>
