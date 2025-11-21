<script lang="ts" context="module">
	import { defineMeta } from '@storybook/addon-svelte-csf';

	const { Story } = defineMeta({
		title: 'Components/DiceRoll',
		tags: ['autodocs'],
	});
</script>

<script lang="ts">
	import DiceRoll from './dice-roll.svelte';
	import Button from '../ui/button/button.svelte';
	import { current } from './store';

	function setupDiceRoll(difficultyClass: number) {
		current.set({
			difficultyClass,
			silent: false,
			success: {
				type: 'dialogNode',
				dialogNodeId: 'success-node',
			},
			failure: {
				type: 'dialogNode',
				dialogNodeId: 'failure-node',
			},
		});
	}
</script>

<Story name="기본 (난이도 10)">
	<Button onclick={() => setupDiceRoll(10)}>주사위 게임 초기화</Button>

	<DiceRoll />
</Story>

<Story name="쉬운 난이도 (난이도 5)">
	<Button onclick={() => setupDiceRoll(5)}>주사위 게임 초기화</Button>

	<DiceRoll />
</Story>

<Story name="어려운 난이도 (난이도 18)">
	<Button onclick={() => setupDiceRoll(18)}>주사위 게임 초기화</Button>

	<DiceRoll />
</Story>
