<script lang="ts">
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import type { DialogNode, DialogNodeChoice } from '$lib/components/dialog-node/store';
	import { Card } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Button } from '$lib/components/ui/button';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import * as Popover from '$lib/components/ui/popover';
	import * as ToggleGroup from '$lib/components/ui/toggle-group';
	import DiceRollEditor from '$lib/components/dice-roll-editor.svelte';
	import IconBook from '@tabler/icons-svelte/icons/book';
	import IconList from '@tabler/icons-svelte/icons/list';
	import IconTrash from '@tabler/icons-svelte/icons/trash';
	import IconSettings from '@tabler/icons-svelte/icons/settings';

	// State
	const nodes = writable<Record<string, DialogNode>>({});

	// Initialize with one node if empty
	onMount(() => {
		const currentNodes = Object.keys($nodes);
		if (currentNodes.length === 0) {
			createNewNode();
		}
	});

	// Create new node
	function createNewNode() {
		const id = crypto.randomUUID();
		const newNode: DialogNode = {
			id,
			speaker: '',
			text: '',
			type: 'narrative',
			diceRoll: {
				difficultyClass: 10,
				silent: false,
				success: { type: 'terminate' },
				failure: { type: 'terminate' },
			},
		};

		nodes.update((n) => ({ ...n, [id]: newNode }));
	}

	// Update node
	function updateNode(id: string, updates: Partial<DialogNode>) {
		nodes.update((n) => ({
			...n,
			[id]: { ...n[id], ...updates } as DialogNode,
		}));
	}

	// Delete node
	function deleteNode(id: string) {
		nodes.update((n) => {
			const newNodes = { ...n };
			delete newNodes[id];
			return newNodes;
		});
	}

	// Toggle type and convert fields
	function toggleType(id: string, newType: 'narrative' | 'choice') {
		const node = $nodes[id];
		if (newType === 'narrative') {
			// Convert to narrative
			const { choices, ...rest } = node as any;
			updateNode(id, {
				...rest,
				type: 'narrative',
				diceRoll: {
					difficultyClass: 10,
					silent: false,
					success: { type: 'terminate' },
					failure: { type: 'terminate' },
				},
			});
		} else {
			// Convert to choice
			const { diceRoll, ...rest } = node as any;
			updateNode(id, {
				...rest,
				type: 'choice',
				choices: [],
			});
		}
	}

	// Add choice
	function addChoice(nodeId: string) {
		const node = $nodes[nodeId];
		if (node.type !== 'choice') return;

		const choices = (node as any).choices || [];
		updateNode(nodeId, {
			choices: [
				...choices,
				{
					id: crypto.randomUUID(),
					text: '',
					diceRoll: {
						difficultyClass: 10,
						silent: false,
						success: { type: 'terminate' },
						failure: { type: 'terminate' },
					},
				},
			],
		});
	}

	// Remove choice
	function removeChoice(nodeId: string, choiceId: string) {
		const node = $nodes[nodeId];
		if (node.type !== 'choice') return;

		const choices = (node as any).choices || [];
		updateNode(nodeId, {
			choices: choices.filter((c: DialogNodeChoice) => c.id !== choiceId),
		});
	}

	// Update choice
	function updateChoice(nodeId: string, choiceId: string, updates: Partial<DialogNodeChoice>) {
		const node = $nodes[nodeId];
		if (node.type !== 'choice') return;

		const choices = (node as any).choices || [];
		updateNode(nodeId, {
			choices: choices.map((c: DialogNodeChoice) => (c.id === choiceId ? { ...c, ...updates } : c)),
		});
	}

	// Export to JSON
	function exportToJSON() {
		const dataStr = JSON.stringify($nodes, null, 2);
		const dataBlob = new Blob([dataStr], { type: 'application/json' });
		const url = URL.createObjectURL(dataBlob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `dialog-nodes-${Date.now()}.json`;
		link.click();
		URL.revokeObjectURL(url);
	}

	// Get available node IDs for select
	const nodeIdOptions = $derived(
		Object.values($nodes).map((node) => ({
			value: node.id,
			label: node.text ? `${node.text} (${node.id})` : node.id,
		}))
	);

	// Keyboard shortcuts
	function handleKeydown(event: KeyboardEvent) {
		if (event.ctrlKey || event.metaKey) {
			switch (event.code) {
				case 'KeyN':
					event.preventDefault();
					createNewNode();
					break;
				case 'KeyS':
					event.preventDefault();
					exportToJSON();
					break;
			}
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="flex h-screen flex-col">
	<!-- Toolbar -->
	<div class="flex items-center gap-2 border-b p-4">
		<h1 class="text-2xl font-bold">DialogNode Source Generator</h1>
		<div class="ml-auto flex gap-2">
			<Button onclick={createNewNode}>
				새 노드 추가
				<span class="ml-2 text-xs opacity-60">Ctrl+N</span>
			</Button>
			<Button onclick={exportToJSON} variant="outline">
				JSON 다운로드
				<span class="ml-2 text-xs opacity-60">Ctrl+S</span>
			</Button>
		</div>
	</div>

	<!-- Node List -->
	<ScrollArea class="flex-1">
		<div class="grid grid-cols-4 gap-4 p-6">
			{#each Object.values($nodes) as node (node.id)}
				<Card class="p-6">
					<div class="space-y-4">
						<!-- Header: Node ID + Type + Settings + Delete -->
						<div class="flex items-center justify-between gap-2">
							<div class="truncate font-mono text-xs whitespace-nowrap text-muted-foreground">
								{node.id}
							</div>
							<div class="flex items-center gap-2">
								<ToggleGroup.Root
									type="single"
									value={node.type}
									onValueChange={(value) => {
										if (value) toggleType(node.id, value as 'narrative' | 'choice');
									}}
									variant="outline"
									size="sm"
								>
									<ToggleGroup.Item value="narrative" class="size-8 p-0">
										<IconBook class="size-4" />
									</ToggleGroup.Item>
									<ToggleGroup.Item value="choice" class="size-8 p-0">
										<IconList class="size-4" />
									</ToggleGroup.Item>
								</ToggleGroup.Root>
								<Popover.Root>
									<Popover.Trigger>
										{#snippet child({ props })}
											<Button {...props} variant="ghost" size="sm" class="size-8 p-0">
												<IconSettings class="size-4" />
											</Button>
										{/snippet}
									</Popover.Trigger>
									<Popover.Content class="w-80">
										<div class="space-y-4">
											<!-- Narrative Type Fields -->
											{#if node.type === 'narrative'}
												<div class="space-y-2">
													<div class="text-sm font-medium">주사위 굴림</div>
													<DiceRollEditor
														diceRoll={node.diceRoll!}
														{nodeIdOptions}
														size="sm"
														onUpdate={(diceRoll) => {
															updateNode(node.id, { diceRoll });
														}}
													/>
												</div>
											{/if}

											<!-- Choice Type Fields -->
											{#if node.type === 'choice'}
												<div class="space-y-4">
													<div class="flex items-center justify-between">
														<div class="text-sm font-medium">선택지</div>
														<Button size="sm" onclick={() => addChoice(node.id)}>추가</Button>
													</div>

													<div class="space-y-3">
														{#each (node as any).choices || [] as choice, index (choice.id)}
															<Card class="p-3">
																<div class="space-y-2">
																	<div class="flex items-center justify-between">
																		<div class="text-xs font-medium text-muted-foreground">
																			선택지 {index + 1}
																		</div>
																		<Button
																			size="sm"
																			variant="ghost"
																			class="h-6 px-2 text-xs"
																			onclick={() => removeChoice(node.id, choice.id)}
																		>
																			삭제
																		</Button>
																	</div>

																	<Input
																		value={choice.text}
																		placeholder="선택지"
																		oninput={(e) => {
																			const target = e.target as HTMLInputElement;
																			updateChoice(node.id, choice.id, { text: target.value });
																		}}
																		class="h-8 text-xs"
																	/>

																	<DiceRollEditor
																		diceRoll={choice.diceRoll}
																		{nodeIdOptions}
																		size="sm"
																		onUpdate={(diceRoll) => {
																			updateChoice(node.id, choice.id, { diceRoll });
																		}}
																	/>
																</div>
															</Card>
														{/each}
													</div>
												</div>
											{/if}
										</div>
									</Popover.Content>
								</Popover.Root>
								<Button
									variant="ghost"
									size="sm"
									class="size-8 p-0"
									onclick={() => deleteNode(node.id)}
								>
									<IconTrash class="size-4" />
								</Button>
							</div>
						</div>

						<!-- Text Content -->
						<Textarea
							value={node.text}
							placeholder="대사 내용을 입력하세요"
							oninput={(e) => {
								const target = e.target as HTMLTextAreaElement;
								updateNode(node.id, { text: target.value });
							}}
							rows={6}
							class="h-24 resize-none"
						/>
					</div>
				</Card>
			{:else}
				<div class="p-8 text-center text-muted-foreground">
					노드가 없습니다. Ctrl+N으로 추가하세요.
				</div>
			{/each}
		</div>
	</ScrollArea>
</div>
