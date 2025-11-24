<script lang="ts">
	import type { DiceRoll } from '$lib/components/app/dice-roll/store';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Slider } from '$lib/components/ui/slider';
	import { Button } from '$lib/components/ui/button';
	import IconChevronDown from '@tabler/icons-svelte/icons/chevron-down';

	interface Props {
		diceRoll: DiceRoll;
		nodeIdOptions: { value: string; label: string }[];
		onUpdate: (diceRoll: DiceRoll) => void;
		size?: 'default' | 'sm';
	}

	let { diceRoll, nodeIdOptions, onUpdate, size = 'default' }: Props = $props();

	// Helper function to get node display text
	function getDisplayText(action: DiceRoll['success'] | DiceRoll['failure']): string {
		if (action.type === 'terminate') {
			return 'Terminate';
		}
		const option = nodeIdOptions.find((opt) => opt.value === action.dialogNodeId);
		return option?.label || action.dialogNodeId || 'Dialog Node';
	}
</script>

<div class="space-y-2">
	<Slider
		type="single"
		min={0}
		max={20}
		step={1}
		value={diceRoll.difficultyClass ?? 10}
		onValueChange={(value: number) => {
			onUpdate({ ...diceRoll, difficultyClass: value });
		}}
	/>

	<!-- Success Action -->
	<DropdownMenu.Root>
		<DropdownMenu.Trigger>
			{#snippet child({ props })}
				<Button
					{...props}
					variant="outline"
					class={size === 'sm'
						? 'h-8 w-full justify-between text-xs'
						: 'w-full justify-between'}
				>
					{getDisplayText(diceRoll.success)}
					<IconChevronDown class={size === 'sm' ? 'ml-2 size-3' : 'ml-2 size-4'} />
				</Button>
			{/snippet}
		</DropdownMenu.Trigger>
		<DropdownMenu.Content class={size === 'sm' ? 'w-48' : 'w-56'}>
			<DropdownMenu.Item
				onclick={() => {
					onUpdate({ ...diceRoll, success: { type: 'terminate' } });
				}}
			>
				Terminate
			</DropdownMenu.Item>
			<DropdownMenu.Sub>
				<DropdownMenu.SubTrigger>Dialog Node</DropdownMenu.SubTrigger>
				<DropdownMenu.SubContent>
					{#each nodeIdOptions as option (option.value)}
						<DropdownMenu.Item
							onclick={() => {
								onUpdate({
									...diceRoll,
									success: { type: 'dialogNode', dialogNodeId: option.value },
								});
							}}
						>
							{option.label}
						</DropdownMenu.Item>
					{/each}
				</DropdownMenu.SubContent>
			</DropdownMenu.Sub>
		</DropdownMenu.Content>
	</DropdownMenu.Root>

	<!-- Failure Action -->
	<DropdownMenu.Root>
		<DropdownMenu.Trigger>
			{#snippet child({ props })}
				<Button
					{...props}
					variant="outline"
					class={size === 'sm'
						? 'h-8 w-full justify-between text-xs'
						: 'w-full justify-between'}
				>
					{getDisplayText(diceRoll.failure)}
					<IconChevronDown class={size === 'sm' ? 'ml-2 size-3' : 'ml-2 size-4'} />
				</Button>
			{/snippet}
		</DropdownMenu.Trigger>
		<DropdownMenu.Content class={size === 'sm' ? 'w-48' : 'w-56'}>
			<DropdownMenu.Item
				onclick={() => {
					onUpdate({ ...diceRoll, failure: { type: 'terminate' } });
				}}
			>
				Terminate
			</DropdownMenu.Item>
			<DropdownMenu.Sub>
				<DropdownMenu.SubTrigger>Dialog Node</DropdownMenu.SubTrigger>
				<DropdownMenu.SubContent>
					{#each nodeIdOptions as option (option.value)}
						<DropdownMenu.Item
							onclick={() => {
								onUpdate({
									...diceRoll,
									failure: { type: 'dialogNode', dialogNodeId: option.value },
								});
							}}
						>
							{option.label}
						</DropdownMenu.Item>
					{/each}
				</DropdownMenu.SubContent>
			</DropdownMenu.Sub>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
</div>
