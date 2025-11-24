<script lang="ts">
	import { onMount } from 'svelte';
	import { debounce } from 'radash';
	import type { DialogNode } from '$lib/components/app/dialog-node/store';
	import {
		source as dialogNodeSource,
		open as openDialogNode,
	} from '$lib/components/app/dialog-node/store';
	import DialogNodeComponent from '$lib/components/app/dialog-node/dialog-node.svelte';
	import DiceRollComponent from '$lib/components/app/dice-roll/dice-roll.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import {
		AlertDialog,
		AlertDialogTrigger,
		AlertDialogContent,
		AlertDialogHeader,
		AlertDialogTitle,
		AlertDialogFooter,
		AlertDialogAction,
		AlertDialogCancel,
	} from '$lib/components/ui/alert-dialog';
	import { DialogNodeEditor } from '$lib/components/admin/dialog-node-editor';
	import IconDownload from '@tabler/icons-svelte/icons/download';
	import IconPlayerPlay from '@tabler/icons-svelte/icons/player-play';
	import Aside from './aside.svelte';

	interface DialogRoot {
		id: string;
		name: string;
		dialogNodes: Record<string, DialogNode>;
	}

	const LOCAL_STORAGE_KEY = 'dialog-roots';

	// Load from localStorage
	let dialogRoots = $state<DialogRoot[]>([]);
	let selectedRootId = $state<string | null>(null);
	let filename = $state('');
	let isExportDialogOpen = $state(false);

	// Load from localStorage on mount
	onMount(() => {
		const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
		if (stored) {
			dialogRoots = JSON.parse(stored);
			if (dialogRoots.length > 0 && !selectedRootId) {
				selectedRootId = dialogRoots[0].id;
			}
		}
	});

	// Save to localStorage
	function saveToLocalStorage() {
		if (dialogRoots.length > 0) {
			localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dialogRoots));
		} else {
			localStorage.removeItem(LOCAL_STORAGE_KEY);
		}
	}

	const selectedRoot = $derived(dialogRoots.find((root) => root.id === selectedRootId) || null);

	// Handle aside changes
	function handleAsideChange() {
		saveToLocalStorage();
	}

	// Export to JSON
	function exportToJSON() {
		if (!selectedRoot) return;

		const dataStr = JSON.stringify(selectedRoot.dialogNodes, null, 2);
		const dataBlob = new Blob([dataStr], { type: 'application/json' });
		const url = URL.createObjectURL(dataBlob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `${filename || selectedRoot.name}.json`;
		link.click();
		URL.revokeObjectURL(url);
		filename = '';
		isExportDialogOpen = false;
	}

	// Handle dialog nodes change with debounce
	const handleDialogNodesChange = debounce({ delay: 300 }, () => {
		saveToLocalStorage();
	});

	// Play dialog nodes
	function playDialogNodes() {
		if (!selectedRoot) return;

		// Set the source to current dialog nodes
		dialogNodeSource.set(selectedRoot.dialogNodes);

		// Find root node
		const rootNode = Object.values(selectedRoot.dialogNodes).find((node) => node.root);
		if (!rootNode) {
			alert('루트 노드를 찾을 수 없습니다.');
			return;
		}

		// Open the root node
		openDialogNode(rootNode.id);
	}
</script>

<div class="flex h-screen">
	<!-- Aside -->
	<Aside bind:dialogRoots bind:selectedRootId onChange={handleAsideChange} />

	<!-- Main: Editor -->
	<div class="flex flex-1 flex-col">
		{#if selectedRoot}
			<!-- Toolbar -->
			<div class="flex items-center gap-2 border-b p-4">
				<Button variant="ghost" size="icon" onclick={playDialogNodes}>
					<IconPlayerPlay class="size-4" />
				</Button>
				<h1 class="text-2xl font-bold">{selectedRoot.name}</h1>
				<div class="ml-auto flex gap-2">
					<AlertDialog bind:open={isExportDialogOpen}>
						<AlertDialogTrigger>
							{#snippet child({ props })}
								<Button {...props} variant="outline">
									<IconDownload class="size-4" />
									JSON 다운로드
								</Button>
							{/snippet}
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>파일 이름 입력</AlertDialogTitle>
							</AlertDialogHeader>
							<Input
								bind:value={filename}
								placeholder={selectedRoot.name}
								onkeydown={(e) => {
									if (e.key === 'Enter') exportToJSON();
								}}
							/>
							<AlertDialogFooter>
								<AlertDialogCancel>취소</AlertDialogCancel>
								<AlertDialogAction onclick={exportToJSON}>다운로드</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</div>
			</div>

			<!-- Node List -->
			<ScrollArea class="flex-1">
				<DialogNodeEditor
					bind:dialogNodes={selectedRoot.dialogNodes}
					onChange={handleDialogNodesChange}
				/>
			</ScrollArea>
		{:else}
			<div class="flex flex-1 items-center justify-center text-neutral-400">
				다이얼로그를 생성하거나 선택하세요
			</div>
		{/if}
	</div>
</div>

<!-- Dialog Node Component -->
<DialogNodeComponent />

<!-- Dice Roll Component -->
<DiceRollComponent />
