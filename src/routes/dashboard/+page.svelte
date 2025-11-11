<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import IconTarget from '@tabler/icons-svelte/icons/target';
	import IconCircleCheck from '@tabler/icons-svelte/icons/circle-check';
	import IconRocket from '@tabler/icons-svelte/icons/rocket';
	import IconPlus from '@tabler/icons-svelte/icons/plus';
	import IconBulb from '@tabler/icons-svelte/icons/bulb';
	import { ResizablePaneGroup, ResizablePane, ResizableHandle } from '$lib/components/ui/resizable';

	type Thought = {
		id: string;
		title: string;
	};

	type Vision = {
		id: string;
		title: string;
		description: string;
		linkedTasks: string[];
	};

	type Task = {
		id: string;
		title: string;
		linkedVisions: string[];
		linkedActions: string[];
	};

	type Action = {
		id: string;
		title: string;
		linkedTasks: string[];
	};

	let mission = $state<string>('');
	let thoughts = $state<Thought[]>([]);
	let visions = $state<Vision[]>([]);
	let tasks = $state<Task[]>([]);
	let actions = $state<Action[]>([]);

	onMount(() => {
		if (typeof window !== 'undefined') {
			const savedMission = localStorage.getItem('missions-mission');
			const savedThoughts = localStorage.getItem('missions-thoughts');
			const savedVisions = localStorage.getItem('missions-visions');
			const savedTasks = localStorage.getItem('missions-tasks');
			const savedActions = localStorage.getItem('missions-actions');

			if (savedMission) mission = savedMission;
			if (savedThoughts) thoughts = JSON.parse(savedThoughts);
			if (savedVisions) visions = JSON.parse(savedVisions);
			if (savedTasks) tasks = JSON.parse(savedTasks);
			if (savedActions) actions = JSON.parse(savedActions);
		}
	});

	function createVision() {
		if (visions.length >= 4) return;
		const newVision: Vision = {
			id: crypto.randomUUID(),
			title: '',
			description: '',
			linkedTasks: [],
		};
		visions = [...visions, newVision];
		localStorage.setItem('missions-visions', JSON.stringify(visions));
		goto(`/visions/${newVision.id}`);
	}

	function createTask() {
		if (tasks.length >= 4) return;
		const newTask: Task = {
			id: crypto.randomUUID(),
			title: '',
			linkedVisions: [],
			linkedActions: [],
		};
		tasks = [...tasks, newTask];
		localStorage.setItem('missions-tasks', JSON.stringify(tasks));
		goto(`/tasks/${newTask.id}`);
	}

	function createAction() {
		if (actions.length >= 4) return;
		const newAction: Action = {
			id: crypto.randomUUID(),
			title: '',
			linkedTasks: [],
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

	let draggedThought: Thought | null = null;
	let draggedVision: Vision | null = null;
	let draggedTask: Task | null = null;
	let draggedAction: Action | null = null;

	function handleDragStart(thought: Thought) {
		draggedThought = thought;
	}

	function handleDragEnd() {
		draggedThought = null;
	}

	function handleDropToVision() {
		if (!draggedThought || visions.length >= 4) return;

		const newVision: Vision = {
			id: draggedThought.id,
			title: draggedThought.title,
			description: '',
			linkedTasks: [],
		};

		visions = [...visions, newVision];
		thoughts = thoughts.filter((t) => t.id !== draggedThought!.id);

		localStorage.setItem('missions-visions', JSON.stringify(visions));
		localStorage.setItem('missions-thoughts', JSON.stringify(thoughts));

		draggedThought = null;
	}

	function handleDropToTask() {
		if (!draggedThought || tasks.length >= 4) return;

		const newTask: Task = {
			id: draggedThought.id,
			title: draggedThought.title,
			linkedVisions: [],
			linkedActions: [],
		};

		tasks = [...tasks, newTask];
		thoughts = thoughts.filter((t) => t.id !== draggedThought!.id);

		localStorage.setItem('missions-tasks', JSON.stringify(tasks));
		localStorage.setItem('missions-thoughts', JSON.stringify(thoughts));

		draggedThought = null;
	}

	function handleDropToAction() {
		if (!draggedThought || actions.length >= 4) return;

		const newAction: Action = {
			id: draggedThought.id,
			title: draggedThought.title,
			linkedTasks: [],
		};

		actions = [...actions, newAction];
		thoughts = thoughts.filter((t) => t.id !== draggedThought!.id);

		localStorage.setItem('missions-actions', JSON.stringify(actions));
		localStorage.setItem('missions-thoughts', JSON.stringify(thoughts));

		draggedThought = null;
	}

	function handleDropToThoughts() {
		if (draggedVision) {
			const newThought: Thought = { id: draggedVision.id, title: draggedVision.title };
			thoughts = [...thoughts, newThought];
			visions = visions.filter((v) => v.id !== draggedVision!.id);
			localStorage.setItem('missions-thoughts', JSON.stringify(thoughts));
			localStorage.setItem('missions-visions', JSON.stringify(visions));
			draggedVision = null;
		} else if (draggedTask) {
			const newThought: Thought = { id: draggedTask.id, title: draggedTask.title };
			thoughts = [...thoughts, newThought];
			tasks = tasks.filter((t) => t.id !== draggedTask!.id);
			localStorage.setItem('missions-thoughts', JSON.stringify(thoughts));
			localStorage.setItem('missions-tasks', JSON.stringify(tasks));
			draggedTask = null;
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

<div class="relative">
	<ResizablePaneGroup direction="horizontal" class="h-[calc(100vh-4rem)] bg-background">
		<!-- Left Panel - Drop Zones -->
		<ResizablePane defaultSize={25} minSize={20} maxSize={40}>
			<div class="space-y-6 overflow-y-auto p-4 h-full">
			<!-- Vision Cards -->
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
									{vision.linkedTasks.length}
								</span>
							</button>
						</div>
					{/each}
					{#each Array(4 - visions.length) as _}
						<button
							onclick={createVision}
							class="flex h-20 w-full flex-col items-center justify-center rounded-lg border border-dashed border-border/50 bg-black p-2 transition-colors hover:bg-muted/10 [&>svg]:hover:opacity-100"
						>
							<IconPlus class="h-5 w-5 text-muted-foreground opacity-0 transition-opacity" />
						</button>
					{/each}
				</div>
			</div>

			<!-- Task Cards -->
			<div ondragover={(e) => e.preventDefault()} ondrop={handleDropToTask}>
				<div class="mb-2 flex items-center gap-2">
					<IconCircleCheck class="h-4 w-4 text-primary" />
					<span class="font-mono text-xs tracking-wider text-primary uppercase">Tasks</span>
				</div>
				<div class="grid grid-cols-4 gap-2">
					{#each tasks as task (task.id)}
						<div
							draggable="true"
							ondragstart={() => {
								draggedTask = task;
							}}
							ondragend={() => {
								draggedTask = null;
							}}
							class="group relative cursor-move"
						>
							<button
								onclick={() => goto(`/tasks/${task.id}`)}
								class="flex h-20 w-full flex-col items-center justify-center rounded-lg border border-border/50 bg-black p-2 transition-colors hover:bg-muted/10"
							>
								<p class="w-full truncate text-center text-xs font-medium text-foreground">
									{task.title || 'Untitled'}
								</p>
								<span
									class="mt-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-muted text-[10px] font-medium"
								>
									{task.linkedActions.length}
								</span>
							</button>
						</div>
					{/each}
					{#each Array(4 - tasks.length) as _}
						<button
							onclick={createTask}
							class="flex h-20 w-full flex-col items-center justify-center rounded-lg border border-dashed border-border/50 bg-black p-2 transition-colors hover:bg-muted/10 [&>svg]:hover:opacity-100"
						>
							<IconPlus class="h-5 w-5 text-muted-foreground opacity-0 transition-opacity" />
						</button>
					{/each}
				</div>
			</div>

			<!-- Action Cards -->
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
									{action.linkedTasks.length}
								</span>
							</button>
						</div>
					{/each}
					{#each Array(4 - actions.length) as _}
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
			<div
				class="overflow-y-auto p-6 h-full"
				ondragover={(e) => e.preventDefault()}
				ondrop={handleDropToThoughts}
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
						draggable="true"
						ondragstart={() => handleDragStart(thought)}
						ondragend={handleDragEnd}
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
				<span class="font-mono text-xs text-muted-foreground">tasks</span>
				<span class="font-mono text-sm font-medium">{tasks.length}/4</span>
			</div>
			<div class="flex items-center gap-2">
				<IconRocket class="h-4 w-4 text-muted-foreground" />
				<span class="font-mono text-xs text-muted-foreground">actions</span>
				<span class="font-mono text-sm font-medium">{actions.length}/4</span>
			</div>
		</div>
	</div>
</div>
