<script lang="ts">
	import type { DiceRoll } from '$lib/components/app/dice-roll/store';
	import DiceRollActionSelector from './dice-roll-action-selector.svelte';
	import {
		InputGroup,
		InputGroupAddon,
		InputGroupInput,
		InputGroupButton,
	} from '$lib/components/ui/input-group';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import IconDice from '@tabler/icons-svelte/icons/dice';
	import IconPlus from '@tabler/icons-svelte/icons/plus';
	import IconMinus from '@tabler/icons-svelte/icons/minus';
	import IconCheck from '@tabler/icons-svelte/icons/check';
	import IconX from '@tabler/icons-svelte/icons/x';

	const {
		diceRoll,
		narrativeIdOptions,
		currentNarrativeId,
		onUpdate,
		onCreateNarrative,
	}: {
		diceRoll: DiceRoll;
		narrativeIdOptions: { value: string; label: string }[];
		currentNarrativeId?: string;
		onUpdate: (diceRoll: DiceRoll) => void;
		onCreateNarrative?: () => string;
	} = $props();
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
				<label class="flex cursor-pointer items-center gap-1 px-2 text-xs">
					<Checkbox
						checked={diceRoll.silent}
						onCheckedChange={(checked) => {
							onUpdate({ ...diceRoll, silent: checked === true });
						}}
					/>
					<span>무음</span>
				</label>
			</InputGroupAddon>
		</InputGroup>
	</div>

	<!-- Success Action -->
	<DiceRollActionSelector
		action={diceRoll.success}
		narrativeIdOptions={narrativeIdOptions}
		currentNarrativeId={currentNarrativeId}
		onCreateNode={onCreateNarrative}
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
		narrativeIdOptions={narrativeIdOptions}
		currentNarrativeId={currentNarrativeId}
		onCreateNode={onCreateNarrative}
		onUpdate={(action) => {
			onUpdate({ ...diceRoll, failure: action });
		}}
	>
		{#snippet icon()}
			<IconX />
		{/snippet}
	</DiceRollActionSelector>
</div>
