<script lang="ts">
	import { onMount } from 'svelte';
	import IconPlus from '@tabler/icons-svelte/icons/plus';
	import IconChevronRight from '@tabler/icons-svelte/icons/chevron-right';
	import IconTarget from '@tabler/icons-svelte/icons/target';
	import IconCircleCheck from '@tabler/icons-svelte/icons/circle-check';
	import { Button } from '$lib/components/ui/button';

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

	type Vision = {
		id: string;
		title: string;
		description: string;
		linkedTasks: string[];
	};

	type View = 'visions' | 'vision-detail' | 'task-detail' | 'action-detail';

	const STORAGE_KEYS = {
		visions: 'missions-visions',
		tasks: 'missions-tasks',
		actions: 'missions-actions',
	};

	let currentView = $state<View>('visions');
	let selectedVisionId = $state<string | null>(null);
	let selectedTaskId = $state<string | null>(null);
	let selectedActionId = $state<string | null>(null);

	let visions = $state<Vision[]>([]);
	let tasks = $state<Task[]>([]);
	let actions = $state<Action[]>([]);

	// Load from localStorage on mount
	onMount(() => {
		if (typeof window !== 'undefined') {
			const savedVisions = localStorage.getItem(STORAGE_KEYS.visions);
			const savedTasks = localStorage.getItem(STORAGE_KEYS.tasks);
			const savedActions = localStorage.getItem(STORAGE_KEYS.actions);

			if (savedVisions) visions = JSON.parse(savedVisions);
			if (savedTasks) tasks = JSON.parse(savedTasks);
			if (savedActions) actions = JSON.parse(savedActions);
		}
	});

	// Save to localStorage whenever data changes
	$effect(() => {
		if (typeof window !== 'undefined') {
			localStorage.setItem(STORAGE_KEYS.visions, JSON.stringify(visions));
		}
	});

	$effect(() => {
		if (typeof window !== 'undefined') {
			localStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(tasks));
		}
	});

	$effect(() => {
		if (typeof window !== 'undefined') {
			localStorage.setItem(STORAGE_KEYS.actions, JSON.stringify(actions));
		}
	});

	function addVision() {
		if (visions.length < 4) {
			const newVision: Vision = {
				id: crypto.randomUUID(),
				title: '',
				description: '',
				linkedTasks: [],
			};
			visions = [...visions, newVision];
			selectVision(newVision.id);
		}
	}

	function selectVision(id: string) {
		selectedVisionId = id;
		currentView = 'vision-detail';
	}

	function backToVisions() {
		currentView = 'visions';
		selectedVisionId = null;
	}

	function addTaskToVision(visionId: string) {
		const vision = visions.find((v) => v.id === visionId);
		if (!vision || vision.linkedTasks.length >= 4) return;

		const newTask: Task = {
			id: crypto.randomUUID(),
			title: '',
			linkedVisions: [visionId],
			linkedActions: [],
		};
		tasks = [...tasks, newTask];
		vision.linkedTasks = [...vision.linkedTasks, newTask.id];
	}

	function selectTask(id: string) {
		selectedTaskId = id;
		currentView = 'task-detail';
	}

	function backToVision() {
		currentView = 'vision-detail';
		selectedTaskId = null;
	}

	function addActionToTask(taskId: string) {
		const task = tasks.find((t) => t.id === taskId);
		if (!task || task.linkedActions.length >= 12) return;

		const newAction: Action = {
			id: crypto.randomUUID(),
			title: '',
			linkedTasks: [taskId],
		};
		actions = [...actions, newAction];
		task.linkedActions = [...task.linkedActions, newAction.id];
	}

	function selectAction(id: string) {
		selectedActionId = id;
		currentView = 'action-detail';
	}

	function backToTask() {
		currentView = 'task-detail';
		selectedActionId = null;
	}

	const selectedVision = $derived(
		selectedVisionId ? visions.find((v) => v.id === selectedVisionId) : null
	);
	const selectedTask = $derived(selectedTaskId ? tasks.find((t) => t.id === selectedTaskId) : null);
	const selectedAction = $derived(
		selectedActionId ? actions.find((a) => a.id === selectedActionId) : null
	);

	const canAddMoreVisions = $derived(visions.length < 4);
</script>

<!-- Visions List View -->
{#if currentView === 'visions'}
	<div class="mx-auto w-full max-w-4xl space-y-6 p-6">
		<div class="flex items-center justify-between">
			<div>
				<h1 class="font-mono text-sm font-semibold tracking-wider text-foreground/60 uppercase">
					Visions
				</h1>
				<p class="mt-1 text-sm text-muted-foreground">Define what you want to achieve (max 4)</p>
			</div>
			<Button
				onclick={addVision}
				disabled={!canAddMoreVisions}
				variant="outline"
				size="sm"
				class="font-mono text-xs tracking-wider uppercase"
			>
				<IconPlus class="mr-2 h-3.5 w-3.5" />
				New Vision
			</Button>
		</div>

		<div class="space-y-2">
			{#if visions.length === 0}
				<div class="rounded-lg border border-dashed border-border/50 py-16 text-center">
					<IconTarget class="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
					<p class="font-mono text-sm text-muted-foreground/50">No visions yet</p>
					<p class="mt-1 text-xs text-muted-foreground/40">Click "New Vision" to get started</p>
				</div>
			{:else}
				{#each visions as vision (vision.id)}
					<button
						onclick={() => selectVision(vision.id)}
						class="notion-item group w-full text-left"
					>
						<div class="flex items-center gap-3 px-3 py-2">
							<IconTarget class="h-4 w-4 flex-shrink-0 text-muted-foreground" />
							<div class="flex-1 overflow-hidden">
								<p class="truncate font-medium text-foreground">
									{vision.title || 'Untitled Vision'}
								</p>
								{#if vision.description}
									<p class="truncate text-xs text-muted-foreground">{vision.description}</p>
								{/if}
							</div>
							{#if vision.linkedTasks.length > 0}
								<span class="font-mono text-xs text-muted-foreground/50">
									{vision.linkedTasks.length} task{vision.linkedTasks.length !== 1 ? 's' : ''}
								</span>
							{/if}
							<IconChevronRight
								class="h-4 w-4 text-muted-foreground/30 transition-transform group-hover:translate-x-1"
							/>
						</div>
					</button>
				{/each}
			{/if}
		</div>
	</div>
{/if}

<!-- Vision Detail View -->
{#if currentView === 'vision-detail' && selectedVision}
	<div class="mx-auto w-full max-w-4xl space-y-6 p-6">
		<!-- Breadcrumb -->
		<button
			onclick={backToVisions}
			class="group flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-foreground"
		>
			<IconChevronRight
				class="h-3 w-3 rotate-180 transition-transform group-hover:-translate-x-1"
			/>
			Back to Visions
		</button>

		<!-- Vision Editor -->
		<div class="space-y-4">
			<input
				bind:value={selectedVision.title}
				placeholder="Vision title..."
				class="w-full bg-transparent text-3xl font-bold text-foreground outline-none placeholder:text-muted-foreground/30"
			/>
			<textarea
				bind:value={selectedVision.description}
				placeholder="Add a description..."
				class="w-full resize-none bg-transparent text-base text-muted-foreground outline-none placeholder:text-muted-foreground/30"
				rows="3"
			></textarea>
		</div>

		<!-- Linked Tasks Section -->
		<div class="space-y-3 border-t border-border/50 pt-6">
			<div class="flex items-center justify-between">
				<h2 class="font-mono text-xs font-semibold tracking-wider text-foreground/60 uppercase">
					Linked Tasks ({selectedVision.linkedTasks.length}/4)
				</h2>
				<Button
					onclick={() => addTaskToVision(selectedVision.id)}
					disabled={selectedVision.linkedTasks.length >= 4}
					variant="ghost"
					size="sm"
					class="h-7 font-mono text-xs"
				>
					<IconPlus class="mr-1 h-3 w-3" />
					Add Task
				</Button>
			</div>

			<div class="space-y-2">
				{#if selectedVision.linkedTasks.length === 0}
					<div class="rounded-lg border border-dashed border-border/50 py-8 text-center">
						<p class="font-mono text-xs text-muted-foreground/50">No linked tasks</p>
					</div>
				{:else}
					{#each selectedVision.linkedTasks as taskId (taskId)}
						{@const task = tasks.find((t) => t.id === taskId)}
						{#if task}
							<button
								onclick={() => selectTask(task.id)}
								class="notion-item group w-full text-left"
							>
								<div class="flex items-center gap-2 px-3 py-2">
									<div class="h-1.5 w-1.5 rounded-full bg-muted-foreground/50"></div>
									<p class="flex-1 truncate text-sm text-foreground">
										{task.title || 'Untitled Task'}
									</p>
									<IconChevronRight
										class="h-3.5 w-3.5 text-muted-foreground/30 transition-transform group-hover:translate-x-1"
									/>
								</div>
							</button>
						{/if}
					{/each}
				{/if}
			</div>
		</div>
	</div>
{/if}

<!-- Task Detail View -->
{#if currentView === 'task-detail' && selectedTask}
	<div class="mx-auto w-full max-w-4xl space-y-6 p-6">
		<!-- Breadcrumb -->
		<button
			onclick={backToVision}
			class="group flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-foreground"
		>
			<IconChevronRight
				class="h-3 w-3 rotate-180 transition-transform group-hover:-translate-x-1"
			/>
			Back
		</button>

		<!-- Task Editor -->
		<div class="space-y-4">
			<input
				bind:value={selectedTask.title}
				placeholder="Task title..."
				class="w-full bg-transparent text-3xl font-bold text-foreground outline-none placeholder:text-muted-foreground/30"
			/>
		</div>

		<!-- Linked Visions -->
		<div class="space-y-3 border-t border-border/50 pt-6">
			<h2 class="font-mono text-xs font-semibold tracking-wider text-foreground/60 uppercase">
				Linked Visions
			</h2>
			<div class="space-y-2">
				{#each selectedTask.linkedVisions as visionId (visionId)}
					{@const vision = visions.find((v) => v.id === visionId)}
					{#if vision}
						<button
							onclick={() => selectVision(vision.id)}
							class="notion-item group w-full text-left"
						>
							<div class="flex items-center gap-2 px-3 py-2">
								<IconTarget class="h-3.5 w-3.5 text-muted-foreground/50" />
								<p class="flex-1 truncate text-sm text-foreground">
									{vision.title || 'Untitled Vision'}
								</p>
							</div>
						</button>
					{/if}
				{/each}
			</div>
		</div>

		<!-- Linked Actions Section -->
		<div class="space-y-3 border-t border-border/50 pt-6">
			<div class="flex items-center justify-between">
				<h2 class="font-mono text-xs font-semibold tracking-wider text-foreground/60 uppercase">
					Linked Actions ({selectedTask.linkedActions.length}/12)
				</h2>
				<Button
					onclick={() => addActionToTask(selectedTask.id)}
					disabled={selectedTask.linkedActions.length >= 12}
					variant="ghost"
					size="sm"
					class="h-7 font-mono text-xs"
				>
					<IconPlus class="mr-1 h-3 w-3" />
					Add Action
				</Button>
			</div>

			<div class="space-y-2">
				{#if selectedTask.linkedActions.length === 0}
					<div class="rounded-lg border border-dashed border-border/50 py-8 text-center">
						<p class="font-mono text-xs text-muted-foreground/50">No linked actions</p>
					</div>
				{:else}
					{#each selectedTask.linkedActions as actionId (actionId)}
						{@const action = actions.find((a) => a.id === actionId)}
						{#if action}
							<button
								onclick={() => selectAction(action.id)}
								class="notion-item group w-full text-left"
							>
								<div class="flex items-center gap-2 px-3 py-2">
									<div class="h-1.5 w-1.5 rounded-full bg-muted-foreground/50"></div>
									<p class="flex-1 truncate text-sm text-foreground">
										{action.title || 'Untitled Action'}
									</p>
									<IconChevronRight
										class="h-3.5 w-3.5 text-muted-foreground/30 transition-transform group-hover:translate-x-1"
									/>
								</div>
							</button>
						{/if}
					{/each}
				{/if}
			</div>
		</div>
	</div>
{/if}

<!-- Action Detail View -->
{#if currentView === 'action-detail' && selectedAction}
	<div class="mx-auto w-full max-w-4xl space-y-6 p-6">
		<!-- Breadcrumb -->
		<button
			onclick={backToTask}
			class="group flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-foreground"
		>
			<IconChevronRight
				class="h-3 w-3 rotate-180 transition-transform group-hover:-translate-x-1"
			/>
			Back
		</button>

		<!-- Action Editor -->
		<div class="space-y-4">
			<input
				bind:value={selectedAction.title}
				placeholder="Action title..."
				class="w-full bg-transparent text-3xl font-bold text-foreground outline-none placeholder:text-muted-foreground/30"
			/>
		</div>

		<!-- Linked Tasks -->
		<div class="space-y-3 border-t border-border/50 pt-6">
			<h2 class="font-mono text-xs font-semibold tracking-wider text-foreground/60 uppercase">
				Linked Tasks
			</h2>
			<div class="space-y-2">
				{#each selectedAction.linkedTasks as taskId (taskId)}
					{@const task = tasks.find((t) => t.id === taskId)}
					{#if task}
						<button onclick={() => selectTask(task.id)} class="notion-item group w-full text-left">
							<div class="flex items-center gap-2 px-3 py-2">
								<IconCircleCheck class="h-3.5 w-3.5 text-muted-foreground/50" />
								<p class="flex-1 truncate text-sm text-foreground">
									{task.title || 'Untitled Task'}
								</p>
							</div>
						</button>
					{/if}
				{/each}
			</div>
		</div>
	</div>
{/if}

<style>
	input,
	textarea {
		font-family:
			-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell',
			sans-serif;
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
	}
</style>
