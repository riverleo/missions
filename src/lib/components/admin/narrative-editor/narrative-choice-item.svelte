<script lang="ts">
	import type { NarrativeChoice } from '$lib/components/app/narrative/store';
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
	import type { Narrative } from '$lib/components/app/narrative/store';
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

	const node = $derived(ctx.narratives[nodeId]);
	const choice = $derived(
		node?.type === 'choice'
			? node.choices.find((c: NarrativeChoice) => c.id === choiceId)
			: undefined
	);
	const narrativeIdOptions = $derived(
		Object.values(ctx.narratives).map((n: Narrative) => ({
			value: n.id,
			label: n.message ? `${n.message} (${n.id})` : n.id,
		}))
	);

	// Update choice
	function updateChoice(updates: Partial<NarrativeChoice>) {
		const node = ctx.narratives[nodeId];
		if (node.type !== 'choice') return;

		const choices = node.choices || [];
		ctx.narratives = {
			...ctx.narratives,
			[nodeId]: {
				...node,
				choices: choices.map((c: NarrativeChoice) =>
					c.id === choiceId ? { ...c, ...updates } : c
				),
			},
		};
	}

	// Remove choice
	function removeChoice() {
		const node = ctx.narratives[nodeId];
		if (node.type !== 'choice') return;

		const choices = node.choices || [];
		ctx.narratives = {
			...ctx.narratives,
			[nodeId]: {
				...node,
				choices: choices.filter((c: NarrativeChoice) => c.id !== choiceId),
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
				{narrativeIdOptions}
				currentNarrativeId={nodeId}
				onUpdate={(diceRoll: DiceRoll) => {
					updateChoice({ diceRoll });
				}}
				onCreateNarrative={ctx.createNarrative}
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
