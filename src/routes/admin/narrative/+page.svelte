<script lang="ts">
	import { onMount } from 'svelte';
	import { debounce } from 'radash';
	import type { Narrative } from '$lib/components/app/narrative/store';
	import {
		source as narrativeSource,
		open as openNarrative,
	} from '$lib/components/app/narrative/store';
	import NarrativeComponent from '$lib/components/app/narrative/narrative.svelte';
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
	import { NarrativeEditor } from '$lib/components/admin/narrative-editor';
	import IconDownload from '@tabler/icons-svelte/icons/download';
	import IconPlayerPlay from '@tabler/icons-svelte/icons/player-play';
	import Aside from './aside.svelte';

	interface NarrativeRoot {
		id: string;
		name: string;
		narratives: Record<string, Narrative>;
	}

	const LOCAL_STORAGE_KEY = 'narrative-roots';

	// Load from localStorage
	let narrativeRoots = $state<NarrativeRoot[]>([]);
	let selectedRootId = $state<string | null>(null);
	let filename = $state('');
	let isExportDialogOpen = $state(false);

	// Load from localStorage on mount
	onMount(() => {
		const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
		if (stored) {
			narrativeRoots = JSON.parse(stored);
			if (narrativeRoots.length > 0 && !selectedRootId) {
				selectedRootId = narrativeRoots[0].id;
			}
		}
	});

	// Save to localStorage
	function saveToLocalStorage() {
		if (narrativeRoots.length > 0) {
			localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(narrativeRoots));
		} else {
			localStorage.removeItem(LOCAL_STORAGE_KEY);
		}
	}

	const selectedRoot = $derived(narrativeRoots.find((root) => root.id === selectedRootId) || null);

	// Handle aside changes
	function handleAsideChange() {
		saveToLocalStorage();
	}

	// Export to JSON
	function exportToJSON() {
		if (!selectedRoot) return;

		const dataStr = JSON.stringify(selectedRoot.narratives, null, 2);
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
	const handleNarrativesChange = debounce({ delay: 300 }, () => {
		saveToLocalStorage();
	});

	// Play dialog nodes
	function playNarratives() {
		if (!selectedRoot) return;

		// Set the source to current dialog nodes
		narrativeSource.set(selectedRoot.narratives);

		// Find root node
		const rootNode = Object.values(selectedRoot.narratives).find((node) => node.root);
		if (!rootNode) {
			alert('최상위 대화를 찾을 수 없습니다.');
			return;
		}

		// Open the root node
		openNarrative(rootNode.id);
	}
</script>

<div class="flex h-screen">
	<!-- Aside -->
	<Aside bind:dialogRoots={narrativeRoots} bind:selectedRootId onChange={handleAsideChange} />

	<!-- Main: Editor -->
	<div class="flex flex-1 flex-col">
		{#if selectedRoot}
			<!-- Toolbar -->
			<div class="flex items-center gap-2 border-b p-4">
				<h1 class="text-2xl font-bold">{selectedRoot.name}</h1>
				<div class="ml-auto flex gap-2">
					<Button variant="outline" onclick={playNarratives}>
						<IconPlayerPlay class="size-4" />
						재생
					</Button>
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
				<NarrativeEditor
					bind:narratives={selectedRoot.narratives}
					onChange={handleNarrativesChange}
				/>
			</ScrollArea>
		{:else}
			<div class="flex flex-1 items-center justify-center text-neutral-400">
				대화를 생성하거나 선택하세요
			</div>
		{/if}
	</div>
</div>

<!-- Dialog Node Component -->
<NarrativeComponent />

<!-- Dice Roll Component -->
<DiceRollComponent />
