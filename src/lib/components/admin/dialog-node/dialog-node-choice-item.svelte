<script lang="ts">
	import type { DialogNodeChoice } from '$lib/components/app/dialog-node/store';
	import {
		InputGroup,
		InputGroupAddon,
		InputGroupInput,
		InputGroupButton,
	} from '$lib/components/ui/input-group';
	import { DiceRollEditor } from '$lib/components/admin/dice-roll-editor';
	import IconTrash from '@tabler/icons-svelte/icons/trash';
	import IconDice5 from '@tabler/icons-svelte/icons/dice-5';

	interface Props {
		choice: DialogNodeChoice;
		index: number;
		nodeIdOptions: { value: string; label: string }[];
		onUpdate: (updates: Partial<DialogNodeChoice>) => void;
		onRemove: () => void;
	}

	let { choice, index, nodeIdOptions, onUpdate, onRemove }: Props = $props();
</script>

<InputGroup>
	<InputGroupAddon>
		<span class="text-xs font-medium">{index + 1}</span>
	</InputGroupAddon>
	<InputGroupInput
		value={choice.text}
		placeholder="선택지"
		oninput={(e) => {
			const target = e.target as HTMLInputElement;
			onUpdate({ text: target.value });
		}}
	/>
	<InputGroupAddon align="inline-end">
		<DiceRollEditor
			diceRoll={choice.diceRoll}
			{nodeIdOptions}
			onUpdate={(diceRoll) => {
				onUpdate({ diceRoll });
			}}
		>
			{#snippet children(props)}
				<InputGroupButton {...props}>
					<IconDice5 class="size-4" />
				</InputGroupButton>
			{/snippet}
		</DiceRollEditor>
		<InputGroupButton onclick={onRemove}>
			<IconTrash class="size-4" />
		</InputGroupButton>
	</InputGroupAddon>
</InputGroup>
