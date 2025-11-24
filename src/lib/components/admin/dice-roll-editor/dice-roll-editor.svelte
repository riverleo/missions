<script lang="ts">
	import type { DiceRoll } from '$lib/components/app/dice-roll/store';
	import { Popover, PopoverTrigger, PopoverContent } from '$lib/components/ui/popover';
	import { Button } from '$lib/components/ui/button';
	import DiceRollEditorContent from './dice-roll-editor-content.svelte';
	import IconDice5 from '@tabler/icons-svelte/icons/dice-5';
	import type { Snippet } from 'svelte';

	interface Props {
		diceRoll: DiceRoll;
		dialogNodeIdOptions: { value: string; label: string }[];
		currentDialogNodeId?: string;
		onUpdate: (diceRoll: DiceRoll) => void;
		onCreateNode?: () => string;
		children?: Snippet<[any]>;
	}

	let { diceRoll, dialogNodeIdOptions, currentDialogNodeId, onUpdate, onCreateNode, children }: Props =
		$props();
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
		<DiceRollEditorContent
			{diceRoll}
			{dialogNodeIdOptions}
			{currentDialogNodeId}
			{onUpdate}
			{onCreateNode}
		/>
	</PopoverContent>
</Popover>
