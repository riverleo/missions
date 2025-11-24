<script lang="ts">
	import type { DialogNodeChoice } from '$lib/components/app/dialog-node/store';
	import {
		InputGroup,
		InputGroupAddon,
		InputGroupInput,
		InputGroupButton,
	} from '$lib/components/ui/input-group';
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
	import type { DiceRoll } from '$lib/components/app/dice-roll/store';
	import type { DialogNode } from '$lib/components/app/dialog-node/store';
	import { getContext } from './context';
	import IconDice5 from '@tabler/icons-svelte/icons/dice-5';
	import IconTrash from '@tabler/icons-svelte/icons/trash';

	interface Props {
		nodeId: string;
		choiceId: string;
		index: number;
	}

	let { nodeId, choiceId, index }: Props = $props();

	const ctx = getContext();

	const node = $derived(ctx.dialogNodes[nodeId]);
	const choice = $derived(
		node?.type === 'choice'
			? node.choices.find((c: DialogNodeChoice) => c.id === choiceId)
			: undefined
	);
	const dialogNodeIdOptions = $derived(
		Object.values(ctx.dialogNodes).map((n: DialogNode) => ({
			value: n.id,
			label: n.text ? `${n.text} (${n.id})` : n.id,
		}))
	);

	// Update choice
	function updateChoice(updates: Partial<DialogNodeChoice>) {
		const node = ctx.dialogNodes[nodeId];
		if (node.type !== 'choice') return;

		const choices = node.choices || [];
		ctx.dialogNodes = {
			...ctx.dialogNodes,
			[nodeId]: {
				...node,
				choices: choices.map((c: DialogNodeChoice) =>
					c.id === choiceId ? { ...c, ...updates } : c
				),
			},
		};
	}

	// Remove choice
	function removeChoice() {
		const node = ctx.dialogNodes[nodeId];
		if (node.type !== 'choice') return;

		const choices = node.choices || [];
		ctx.dialogNodes = {
			...ctx.dialogNodes,
			[nodeId]: {
				...node,
				choices: choices.filter((c: DialogNodeChoice) => c.id !== choiceId),
			},
		};
	}
</script>

{#if choice}
	<InputGroup>
		<InputGroupAddon>
			<span class="text-xs font-medium">{index + 1}</span>
		</InputGroupAddon>
		<InputGroupInput
			value={choice.text}
			placeholder="선택지"
			oninput={(e) => {
				const target = e.target as HTMLInputElement;
				updateChoice({ text: target.value });
			}}
		/>
		<InputGroupAddon align="inline-end">
			<DiceRollEditor
				diceRoll={choice.diceRoll}
				{dialogNodeIdOptions}
				currentDialogNodeId={nodeId}
				onUpdate={(diceRoll: DiceRoll) => {
					updateChoice({ diceRoll });
				}}
				onCreateNode={ctx.createDialogNode}
			>
				{#snippet children(props: any)}
					<InputGroupButton {...props}>
						<IconDice5 class="size-4" />
					</InputGroupButton>
				{/snippet}
			</DiceRollEditor>
			<AlertDialog>
				<AlertDialogTrigger>
					{#snippet child({ props })}
						<InputGroupButton {...props}>
							<IconTrash class="size-4" />
						</InputGroupButton>
					{/snippet}
				</AlertDialogTrigger>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>정말 삭제하시겠습니까?</AlertDialogTitle>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>취소</AlertDialogCancel>
						<AlertDialogAction onclick={removeChoice}>삭제</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</InputGroupAddon>
	</InputGroup>
{/if}
