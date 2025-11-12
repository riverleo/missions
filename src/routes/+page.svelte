<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import IconTarget from '@tabler/icons-svelte/icons/target';
	import IconCircleCheck from '@tabler/icons-svelte/icons/circle-check';
	import IconRocket from '@tabler/icons-svelte/icons/rocket';
	import IconPlus from '@tabler/icons-svelte/icons/plus';
	import IconBulb from '@tabler/icons-svelte/icons/bulb';
	import { ResizablePaneGroup, ResizablePane, ResizableHandle } from '$lib/components/ui/resizable';
	import { wasLoggedIn } from '$lib/stores';
	import Landing from '$lib/components/LandingClaude.svelte';

	type Thought = {
		id: string;
		title: string;
	};

	type Vision = {
		id: string;
		title: string;
		description: string;
		linkedFoundations: string[];
	};

	type Foundation = {
		id: string;
		title: string;
		linkedVisions: string[];
		linkedActions: string[];
	};

	type Action = {
		id: string;
		title: string;
		linkedFoundations: string[];
	};

	let mission = $state<string>('');
	let thoughts = $state<Thought[]>([]);
	let visions = $state<Vision[]>([]);
	let foundations = $state<Foundation[]>([]);
	let actions = $state<Action[]>([]);

	onMount(() => {
		if (typeof window !== 'undefined') {
			const onboardingData = localStorage.getItem('missions-onboarding');
			if (onboardingData) {
				wasLoggedIn.set(true);
			}

			const savedMission = localStorage.getItem('missions-mission');
			const savedThoughts = localStorage.getItem('missions-thoughts');
			const savedVisions = localStorage.getItem('missions-visions');
			const savedFoundations = localStorage.getItem('missions-foundations');
			const savedActions = localStorage.getItem('missions-actions');

			if (savedMission) mission = savedMission;
			if (savedThoughts) thoughts = JSON.parse(savedThoughts);
			if (savedVisions) visions = JSON.parse(savedVisions);
			if (savedFoundations) foundations = JSON.parse(savedFoundations);
			if (savedActions) actions = JSON.parse(savedActions);
		}
	});

	function createVision() {
		if (visions.length >= 4) return;
		const newVision: Vision = {
			id: crypto.randomUUID(),
			title: '',
			description: '',
			linkedFoundations: [],
		};
		visions = [...visions, newVision];
		localStorage.setItem('missions-visions', JSON.stringify(visions));
		goto(`/visions/${newVision.id}`);
	}

	function createFoundation() {
		if (foundations.length >= 4) return;
		const newFoundation: Foundation = {
			id: crypto.randomUUID(),
			title: '',
			linkedVisions: [],
			linkedActions: [],
		};
		foundations = [...foundations, newFoundation];
		localStorage.setItem('missions-foundations', JSON.stringify(foundations));
		goto(`/foundations/${newFoundation.id}`);
	}

	function createAction() {
		if (actions.length >= 4) return;
		const newAction: Action = {
			id: crypto.randomUUID(),
			title: '',
			linkedFoundations: [],
		};
		actions = [...actions, newAction];
		localStorage.setItem('missions-actions', JSON.stringify(actions));
		goto(`/actions/${newAction.id}`);
	}

	function createThought() {
		const newThought: Thought = {
			id: crypto.randomUUID(),
			title: '',
		};
		thoughts = [...thoughts, newThought];
		localStorage.setItem('missions-thoughts', JSON.stringify(thoughts));
	}

	function deleteThought(id: string) {
		thoughts = thoughts.filter((t) => t.id !== id);
		localStorage.setItem('missions-thoughts', JSON.stringify(thoughts));
	}

	function updateThought(id: string, title: string) {
		const thought = thoughts.find((t) => t.id === id);
		if (thought) {
			thought.title = title;
			thoughts = [...thoughts];
			localStorage.setItem('missions-thoughts', JSON.stringify(thoughts));
		}
	}

	let draggedVision: Vision | null = null;
	let draggedFoundation: Foundation | null = null;
	let draggedAction: Action | null = null;

	function handleDropToVision() {
		// Placeholder for future implementation
	}

	function handleDropToFoundation() {
		// Placeholder for future implementation
	}

	function handleDropToAction() {
		// Placeholder for future implementation
	}

	function handleThoughtsAreaDrop(e: DragEvent) {
		e.preventDefault();
		handleDropToThoughts();
	}

	function handleDropToThoughts() {
		if (draggedVision) {
			const newThought: Thought = { id: draggedVision.id, title: draggedVision.title };
			thoughts = [...thoughts, newThought];
			visions = visions.filter((v) => v.id !== draggedVision!.id);
			localStorage.setItem('missions-thoughts', JSON.stringify(thoughts));
			localStorage.setItem('missions-visions', JSON.stringify(visions));
			draggedVision = null;
		} else if (draggedFoundation) {
			const newThought: Thought = { id: draggedFoundation.id, title: draggedFoundation.title };
			thoughts = [...thoughts, newThought];
			foundations = foundations.filter((f) => f.id !== draggedFoundation!.id);
			localStorage.setItem('missions-thoughts', JSON.stringify(thoughts));
			localStorage.setItem('missions-foundations', JSON.stringify(foundations));
			draggedFoundation = null;
		} else if (draggedAction) {
			const newThought: Thought = { id: draggedAction.id, title: draggedAction.title };
			thoughts = [...thoughts, newThought];
			actions = actions.filter((a) => a.id !== draggedAction!.id);
			localStorage.setItem('missions-thoughts', JSON.stringify(thoughts));
			localStorage.setItem('missions-actions', JSON.stringify(actions));
			draggedAction = null;
		}
	}
</script>

{#if $wasLoggedIn}
	<div class="relative">
		<ResizablePaneGroup direction="horizontal" class="h-[calc(100vh-4rem)] bg-background">
			<!-- Left Panel - Drop Zones -->
			<ResizablePane defaultSize={25} minSize={20} maxSize={40}>
				<div class="h-full space-y-6 overflow-y-auto p-4">
					<!-- Vision Cards -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div ondragover={(e) => e.preventDefault()} ondrop={handleDropToVision}>
						<div class="mb-2 flex items-center gap-2">
							<IconTarget class="h-4 w-4 text-primary" />
							<span class="font-mono text-xs tracking-wider text-primary uppercase">Visions</span>
						</div>
						<div class="grid grid-cols-4 gap-2">
							{#each visions as vision (vision.id)}
								<div
									draggable="true"
									ondragstart={() => {
										draggedVision = vision;
									}}
									ondragend={() => {
										draggedVision = null;
									}}
									class="group relative cursor-move"
								>
									<button
										onclick={() => goto(`/visions/${vision.id}`)}
										class="flex h-20 w-full flex-col items-center justify-center rounded-lg border border-border/50 bg-black p-2 transition-colors hover:bg-muted/10"
									>
										<p class="w-full truncate text-center text-xs font-medium text-foreground">
											{vision.title || 'Untitled'}
										</p>
										<span
											class="mt-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-muted text-[10px] font-medium"
										>
											{vision.linkedFoundations.length}
										</span>
									</button>
								</div>
							{/each}
							{#each Array(Math.max(0, 4 - visions.length)) as _}
								<button
									onclick={createVision}
									class="flex h-20 w-full flex-col items-center justify-center rounded-lg border border-dashed border-border/50 bg-black p-2 transition-colors hover:bg-muted/10 [&>svg]:hover:opacity-100"
								>
									<IconPlus class="h-5 w-5 text-muted-foreground opacity-0 transition-opacity" />
								</button>
							{/each}
						</div>
					</div>

					<!-- Foundation Cards -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div ondragover={(e) => e.preventDefault()} ondrop={handleDropToFoundation}>
						<div class="mb-2 flex items-center gap-2">
							<IconCircleCheck class="h-4 w-4 text-primary" />
							<span class="font-mono text-xs tracking-wider text-primary uppercase"
								>Foundations</span
							>
						</div>
						<div class="grid grid-cols-4 gap-2">
							{#each foundations as foundation (foundation.id)}
								<div
									draggable="true"
									ondragstart={() => {
										draggedFoundation = foundation;
									}}
									ondragend={() => {
										draggedFoundation = null;
									}}
									class="group relative cursor-move"
								>
									<button
										onclick={() => goto(`/foundations/${foundation.id}`)}
										class="flex h-20 w-full flex-col items-center justify-center rounded-lg border border-border/50 bg-black p-2 transition-colors hover:bg-muted/10"
									>
										<p class="w-full truncate text-center text-xs font-medium text-foreground">
											{foundation.title || 'Untitled'}
										</p>
										<span
											class="mt-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-muted text-[10px] font-medium"
										>
											{foundation.linkedActions.length}
										</span>
									</button>
								</div>
							{/each}
							{#each Array(Math.max(0, 4 - foundations.length)) as _}
								<button
									onclick={createFoundation}
									class="flex h-20 w-full flex-col items-center justify-center rounded-lg border border-dashed border-border/50 bg-black p-2 transition-colors hover:bg-muted/10 [&>svg]:hover:opacity-100"
								>
									<IconPlus class="h-5 w-5 text-muted-foreground opacity-0 transition-opacity" />
								</button>
							{/each}
						</div>
					</div>

					<!-- Action Cards -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div ondragover={(e) => e.preventDefault()} ondrop={handleDropToAction}>
						<div class="mb-2 flex items-center gap-2">
							<IconRocket class="h-4 w-4 text-primary" />
							<span class="font-mono text-xs tracking-wider text-primary uppercase">Actions</span>
						</div>
						<div class="grid grid-cols-4 gap-2">
							{#each actions as action (action.id)}
								<div
									draggable="true"
									ondragstart={() => {
										draggedAction = action;
									}}
									ondragend={() => {
										draggedAction = null;
									}}
									class="group relative cursor-move"
								>
									<button
										onclick={() => goto(`/actions/${action.id}`)}
										class="flex h-20 w-full flex-col items-center justify-center rounded-lg border border-border/50 bg-black p-2 transition-colors hover:bg-muted/10"
									>
										<p class="w-full truncate text-center text-xs font-medium text-foreground">
											{action.title || 'Untitled'}
										</p>
										<span
											class="mt-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-muted text-[10px] font-medium"
										>
											{action.linkedFoundations.length}
										</span>
									</button>
								</div>
							{/each}
							{#each Array(Math.max(0, 4 - actions.length)) as _}
								<button
									onclick={createAction}
									class="flex h-20 w-full flex-col items-center justify-center rounded-lg border border-dashed border-border/50 bg-black p-2 transition-colors hover:bg-muted/10 [&>svg]:hover:opacity-100"
								>
									<IconPlus class="h-5 w-5 text-muted-foreground opacity-0 transition-opacity" />
								</button>
							{/each}
						</div>
					</div>
				</div>
			</ResizablePane>

			<ResizableHandle withHandle />

			<!-- Right Grid Area - Thoughts -->
			<ResizablePane defaultSize={75}>
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					class="h-full overflow-y-auto p-6"
					ondragover={(e) => e.preventDefault()}
					ondrop={handleThoughtsAreaDrop}
				>
					<div class="mb-4 flex items-center justify-between">
						<h2 class="font-mono text-xs tracking-wider text-primary uppercase">Thoughts</h2>
						<button
							onclick={createThought}
							class="inline-flex items-center gap-1 rounded-md border border-dashed border-border/50 bg-black px-3 py-1.5 text-xs transition-colors hover:bg-muted/10"
						>
							<IconPlus class="h-3 w-3" />
							New Thought
						</button>
					</div>
					<div class="grid auto-rows-min grid-cols-4 gap-4">
						{#each thoughts as thought (thought.id)}
							<div
								class="group flex min-h-32 cursor-move flex-col items-center justify-center rounded-lg border border-border/50 bg-black p-4 transition-colors hover:bg-muted/10"
							>
								<IconBulb class="mb-2 h-6 w-6 text-muted-foreground" />
								<input
									type="text"
									value={thought.title}
									oninput={(e) => updateThought(thought.id, e.currentTarget.value)}
									placeholder="Enter thought..."
									class="w-full bg-transparent text-center text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground/50"
								/>
								<button
									onclick={() => deleteThought(thought.id)}
									class="mt-2 text-xs text-destructive opacity-0 transition-opacity group-hover:opacity-100"
								>
									Delete
								</button>
							</div>
						{/each}
					</div>
				</div>
			</ResizablePane>
		</ResizablePaneGroup>

		<!-- Bottom Status Bar -->
		<div
			class="absolute right-0 bottom-0 left-0 flex h-16 items-center justify-between border-t border-border/50 bg-background px-8"
		>
			<div class="flex items-center gap-8">
				<div class="flex items-center gap-2">
					<IconTarget class="h-4 w-4 text-muted-foreground" />
					<span class="font-mono text-xs text-muted-foreground">visions</span>
					<span class="font-mono text-sm font-medium">{visions.length}/4</span>
				</div>
				<div class="flex items-center gap-2">
					<IconCircleCheck class="h-4 w-4 text-muted-foreground" />
					<span class="font-mono text-xs text-muted-foreground">foundations</span>
					<span class="font-mono text-sm font-medium">{foundations.length}/4</span>
				</div>
				<div class="flex items-center gap-2">
					<IconRocket class="h-4 w-4 text-muted-foreground" />
					<span class="font-mono text-xs text-muted-foreground">actions</span>
					<span class="font-mono text-sm font-medium">{actions.length}/4</span>
				</div>
			</div>
		</div>
	</div>
{:else}
	<Landing />
{/if}
