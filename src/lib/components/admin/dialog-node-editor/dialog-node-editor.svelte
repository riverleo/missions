<script lang="ts">
	import type { DialogNode, DialogNodeChoice } from '$lib/components/app/dialog-node/store';
	import { Card, CardHeader, CardContent, CardFooter } from '$lib/components/ui/card';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Button } from '$lib/components/ui/button';
	import { Popover, PopoverTrigger, PopoverContent } from '$lib/components/ui/popover';
	import { Select, SelectTrigger, SelectContent, SelectItem } from '$lib/components/ui/select';
	import { DiceRollEditor } from '$lib/components/admin/dice-roll-editor';
	import DialogNodeChoiceItem from './dialog-node-choice-item.svelte';
	import IconBook from '@tabler/icons-svelte/icons/book';
	import IconList from '@tabler/icons-svelte/icons/list';
	import IconTrash from '@tabler/icons-svelte/icons/trash';
	import IconListNumbers from '@tabler/icons-svelte/icons/list-numbers';
	import IconPlus from '@tabler/icons-svelte/icons/plus';

	interface Props {
		node: DialogNode;
		dialogNodeIdOptions: { value: string; label: string }[];
		onUpdate: (updates: Partial<DialogNode>) => void;
		onDelete: () => void;
		onToggleType: (newType: DialogNode['type']) => void;
		onAddChoice: () => void;
		onRemoveChoice: (choiceId: string) => void;
		onUpdateChoice: (choiceId: string, updates: Partial<DialogNodeChoice>) => void;
	}

	let {
		node,
		dialogNodeIdOptions,
		onUpdate,
		onDelete,
		onToggleType,
		onAddChoice,
		onRemoveChoice,
		onUpdateChoice,
	}: Props = $props();
</script>

<Card class="gap-4 py-4">
	<CardHeader class="flex items-center justify-between px-4">
		<div class="flex items-center gap-2">
			<Select
				type="single"
				value={node.type}
				onValueChange={(value: string | undefined) => {
					if (value) onToggleType(value as DialogNode['type']);
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
						onUpdate({ diceRoll });
					}}
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
								<DialogNodeChoiceItem
									{choice}
									{index}
									{dialogNodeIdOptions}
									currentDialogNodeId={node.id}
									onUpdate={(updates) => {
										onUpdateChoice(choice.id, updates);
									}}
									onRemove={() => {
										onRemoveChoice(choice.id);
									}}
								/>
							{/each}

							<Button size="sm" onclick={onAddChoice} class="w-full">
								<IconPlus />새 선택지 추가
							</Button>
						</div>
					</PopoverContent>
				</Popover>
			{/if}
		</div>
		<Button variant="ghost" size="icon" onclick={onDelete}>
			<IconTrash class="size-4" />
		</Button>
	</CardHeader>

	<CardContent class="px-4">
		<Textarea
			value={node.text}
			placeholder="대사 내용을 입력하세요"
			oninput={(e) => {
				const target = e.target as HTMLTextAreaElement;
				onUpdate({ text: target.value });
			}}
			class="h-12 resize-none"
		/>
	</CardContent>

	<CardFooter class="px-4">
		<span class="text-xs text-neutral-400">{node.id}</span>
	</CardFooter>
</Card>
