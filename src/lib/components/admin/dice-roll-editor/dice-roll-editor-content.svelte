<script lang="ts">
	import type { DiceRoll } from '$lib/components/app/dice-roll/store';
	import DiceRollActionSelector from './dice-roll-action-selector.svelte';
	import {
		InputGroup,
		InputGroupAddon,
		InputGroupInput,
		InputGroupButton,
	} from '$lib/components/ui/input-group';
	import IconDice from '@tabler/icons-svelte/icons/dice';
	import IconPlus from '@tabler/icons-svelte/icons/plus';
	import IconMinus from '@tabler/icons-svelte/icons/minus';
	import IconCheck from '@tabler/icons-svelte/icons/check';
	import IconX from '@tabler/icons-svelte/icons/x';

	interface Props {
		diceRoll: DiceRoll;
		nodeIdOptions: { value: string; label: string }[];
		onUpdate: (diceRoll: DiceRoll) => void;
	}

	let { diceRoll, nodeIdOptions, onUpdate }: Props = $props();
</script>

<div class="space-y-2">
	<div class="space-y-1">
		<InputGroup>
			<InputGroupAddon>
				<IconDice />
			</InputGroupAddon>
			<InputGroupInput
				type="number"
				min={0}
				max={20}
				value={diceRoll.difficultyClass ?? 10}
				oninput={(e) => {
					const target = e.target as HTMLInputElement;
					const value = parseInt(target.value, 10);
					if (!isNaN(value)) {
						onUpdate({ ...diceRoll, difficultyClass: value });
					}
				}}
			/>
			<InputGroupAddon align="inline-end">
				<InputGroupButton
					onclick={() => {
						const current = diceRoll.difficultyClass ?? 10;
						if (current < 20) {
							onUpdate({ ...diceRoll, difficultyClass: current + 1 });
						}
					}}
				>
					<IconPlus />
				</InputGroupButton>
				<InputGroupButton
					onclick={() => {
						const current = diceRoll.difficultyClass ?? 10;
						if (current > 0) {
							onUpdate({ ...diceRoll, difficultyClass: current - 1 });
						}
					}}
				>
					<IconMinus />
				</InputGroupButton>
			</InputGroupAddon>
		</InputGroup>
	</div>

	<!-- Success Action -->
	<DiceRollActionSelector
		action={diceRoll.success}
		{nodeIdOptions}
		onUpdate={(action) => {
			onUpdate({ ...diceRoll, success: action });
		}}
	>
		{#snippet icon()}
			<IconCheck />
		{/snippet}
	</DiceRollActionSelector>

	<!-- Failure Action -->
	<DiceRollActionSelector
		action={diceRoll.failure}
		{nodeIdOptions}
		onUpdate={(action) => {
			onUpdate({ ...diceRoll, failure: action });
		}}
	>
		{#snippet icon()}
			<IconX />
		{/snippet}
	</DiceRollActionSelector>
</div>
