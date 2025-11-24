<script lang="ts">
	import type { DiceRoll } from '$lib/components/app/dice-roll/store';
	import { Popover, PopoverTrigger, PopoverContent } from '$lib/components/ui/popover';
	import { Button } from '$lib/components/ui/button';
	import DiceRollEditorContent from './dice-roll-editor-content.svelte';
	import IconDice5 from '@tabler/icons-svelte/icons/dice-5';
	import type { Snippet } from 'svelte';

	interface Props {
		diceRoll: DiceRoll;
		nodeIdOptions: { value: string; label: string }[];
		onUpdate: (diceRoll: DiceRoll) => void;
		children?: Snippet<[any]>;
	}

	let { diceRoll, nodeIdOptions, onUpdate, children }: Props = $props();
</script>

<Popover>
	<PopoverTrigger>
		{#snippet child({ props })}
			{#if children}
				{@render children(props)}
			{:else}
				<Button {...props} variant="ghost" size="icon">
					<IconDice5 />
				</Button>
			{/if}
		{/snippet}
	</PopoverTrigger>
	<PopoverContent>
		<DiceRollEditorContent {diceRoll} {nodeIdOptions} {onUpdate} />
	</PopoverContent>
</Popover>
