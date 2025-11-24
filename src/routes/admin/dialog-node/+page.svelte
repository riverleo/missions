<script lang="ts">
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import type { DialogNode, DialogNodeChoice } from '$lib/components/app/dialog-node/store';
	import { Button } from '$lib/components/ui/button';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import { DialogNodeEditor } from '$lib/components/admin/dialog-node-editor';

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

	// Get available dialog node IDs for select
	const dialogNodeIdOptions = $derived(
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
	<div class="flex items-center gap-2 p-4">
		<h1 class="text-2xl font-bold">대화 생성 및 편집</h1>
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
		<div class="grid grid-cols-4 gap-4 p-4">
			{#each Object.values($nodes) as node (node.id)}
				<DialogNodeEditor
					{node}
					{dialogNodeIdOptions}
					onUpdate={(updates) => {
						updateNode(node.id, updates);
					}}
					onDelete={() => {
						deleteNode(node.id);
					}}
					onToggleType={(newType) => {
						toggleType(node.id, newType);
					}}
					onAddChoice={() => {
						addChoice(node.id);
					}}
					onRemoveChoice={(choiceId) => {
						removeChoice(node.id, choiceId);
					}}
					onUpdateChoice={(choiceId, updates) => {
						updateChoice(node.id, choiceId, updates);
					}}
				/>
			{:else}
				<div class="p-8 text-center text-muted-foreground">
					노드가 없습니다. Ctrl+N으로 추가하세요.
				</div>
			{/each}
		</div>
	</ScrollArea>
</div>
