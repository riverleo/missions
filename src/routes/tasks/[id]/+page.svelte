<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import IconPlus from '@tabler/icons-svelte/icons/plus';
	import IconChevronRight from '@tabler/icons-svelte/icons/chevron-right';
	import IconTarget from '@tabler/icons-svelte/icons/target';
	import IconTrash from '@tabler/icons-svelte/icons/trash';
	import { Button } from '$lib/components/ui/button';

	type Task = {
		id: string;
		title: string;
		linkedVisions: string[];
		linkedActions: string[];
	};

	type Vision = {
		id: string;
		title: string;
		description: string;
		linkedTasks: string[];
	};

	type Action = {
		id: string;
		title: string;
		linkedTasks: string[];
	};

	let tasks = $state<Task[]>([]);
	let visions = $state<Vision[]>([]);
	let actions = $state<Action[]>([]);
	let task = $state<Task | null>(null);

	$effect(() => {
		const id = $page.params.id;
		task = tasks.find((t) => t.id === id) || null;
		if (!task && tasks.length > 0) {
			goto('/visions');
		}
	});

	onMount(() => {
		if (typeof window !== 'undefined') {
			const savedTasks = localStorage.getItem('missions-tasks');
			const savedVisions = localStorage.getItem('missions-visions');
			const savedActions = localStorage.getItem('missions-actions');
			if (savedTasks) tasks = JSON.parse(savedTasks);
			if (savedVisions) visions = JSON.parse(savedVisions);
			if (savedActions) actions = JSON.parse(savedActions);
		}
	});

	function saveTask() {
		if (!task) return;
		const currentTask = task;
		if (typeof window !== 'undefined') {
			const index = tasks.findIndex((t) => t.id === currentTask.id);
			if (index !== -1) {
				tasks[index] = currentTask;
				localStorage.setItem('missions-tasks', JSON.stringify(tasks));
			}
		}
	}

	function toggleVisionLink(visionId: string) {
		if (!task) return;

		const currentTask = task;
		const isLinked = currentTask.linkedVisions.includes(visionId);

		if (isLinked) {
			// Remove link
			currentTask.linkedVisions = currentTask.linkedVisions.filter((id) => id !== visionId);
			const vision = visions.find((v) => v.id === visionId);
			if (vision) {
				vision.linkedTasks = vision.linkedTasks.filter((id) => id !== currentTask.id);
			}
		} else {
			// Add link
			currentTask.linkedVisions = [...currentTask.linkedVisions, visionId];
			const vision = visions.find((v) => v.id === visionId);
			if (vision) {
				vision.linkedTasks = [...vision.linkedTasks, currentTask.id];
			}
		}

		if (typeof window !== 'undefined') {
			localStorage.setItem('missions-tasks', JSON.stringify(tasks));
			localStorage.setItem('missions-visions', JSON.stringify(visions));
		}

		saveTask();
	}

	function addAction() {
		if (!task || task.linkedActions.length >= 16) return;

		const newAction: Action = {
			id: crypto.randomUUID(),
			title: '',
			linkedTasks: [task.id],
		};
		actions = [...actions, newAction];
		task.linkedActions = [...task.linkedActions, newAction.id];

		if (typeof window !== 'undefined') {
			localStorage.setItem('missions-actions', JSON.stringify(actions));
			localStorage.setItem('missions-tasks', JSON.stringify(tasks));
		}

		goto(`/actions/${newAction.id}`);
	}

	function deleteTask() {
		if (!task) return;

		const currentTask = task;

		if (
			!confirm(
				'Are you sure you want to delete this task? All linked visions and actions will be unlinked.'
			)
		) {
			return;
		}

		// Unlink from all visions
		visions.forEach((vision) => {
			if (vision.linkedTasks.includes(currentTask.id)) {
				vision.linkedTasks = vision.linkedTasks.filter((id) => id !== currentTask.id);
			}
		});

		// Unlink from all actions
		actions.forEach((action) => {
			if (action.linkedTasks.includes(currentTask.id)) {
				action.linkedTasks = action.linkedTasks.filter((id) => id !== currentTask.id);
			}
		});

		// Remove task
		tasks = tasks.filter((t) => t.id !== currentTask.id);

		if (typeof window !== 'undefined') {
			localStorage.setItem('missions-tasks', JSON.stringify(tasks));
			localStorage.setItem('missions-visions', JSON.stringify(visions));
			localStorage.setItem('missions-actions', JSON.stringify(actions));
		}

		goto('/visions');
	}
</script>

{#if task}
	<div class="mx-auto w-full max-w-4xl space-y-6 p-6">
		<!-- Breadcrumb & Delete -->
		<div class="flex items-center justify-between">
			<a
				href="/visions"
				class="group inline-flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-foreground"
			>
				<IconChevronRight
					class="h-3 w-3 rotate-180 transition-transform group-hover:-translate-x-1"
				/>
				Back
			</a>
			<Button
				onclick={deleteTask}
				variant="ghost"
				size="sm"
				class="h-7 text-destructive hover:text-destructive"
			>
				<IconTrash class="h-3.5 w-3.5" />
			</Button>
		</div>

		<!-- Task Editor -->
		<div class="space-y-4">
			<input
				bind:value={task.title}
				onblur={saveTask}
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
				{#if visions.length === 0}
					<div class="rounded-lg border border-dashed border-border/50 py-8 text-center">
						<p class="font-mono text-xs text-muted-foreground/50">No visions available</p>
					</div>
				{:else}
					{#each visions as vision (vision.id)}
						{@const isLinked = task.linkedVisions.includes(vision.id)}
						<button
							onclick={() => toggleVisionLink(vision.id)}
							class="group block w-full rounded-md border text-left transition-all {isLinked
								? 'border-primary/50 bg-primary/10'
								: 'border-transparent hover:border-border/50 hover:bg-muted/30'}"
						>
							<div class="flex items-center gap-2 px-3 py-2">
								<IconTarget
									class="h-3.5 w-3.5 {isLinked ? 'text-primary' : 'text-muted-foreground/50'}"
								/>
								<p
									class="flex-1 truncate text-sm {isLinked
										? 'font-medium text-foreground'
										: 'text-foreground'}"
								>
									{vision.title || 'Untitled Vision'}
								</p>
								{#if isLinked}
									<div class="h-2 w-2 rounded-full bg-primary"></div>
								{/if}
							</div>
						</button>
					{/each}
				{/if}
			</div>
		</div>

		<!-- Linked Actions Section -->
		<div class="space-y-3 border-t border-border/50 pt-6">
			<div class="flex items-center justify-between">
				<h2 class="font-mono text-xs font-semibold tracking-wider text-foreground/60 uppercase">
					Linked Actions ({task.linkedActions.length}/16)
				</h2>
				<Button
					onclick={addAction}
					disabled={task.linkedActions.length >= 16}
					variant="ghost"
					size="sm"
					class="h-7 font-mono text-xs"
				>
					<IconPlus class="mr-1 h-3 w-3" />
					Add Action
				</Button>
			</div>

			<div class="space-y-2">
				{#if task.linkedActions.length === 0}
					<div class="rounded-lg border border-dashed border-border/50 py-8 text-center">
						<p class="font-mono text-xs text-muted-foreground/50">No linked actions</p>
					</div>
				{:else}
					{#each task.linkedActions as actionId (actionId)}
						{@const action = actions.find((a) => a.id === actionId)}
						{#if action}
							<a
								href="/actions/{action.id}"
								class="group block w-full rounded-md border border-transparent text-left transition-all hover:border-border/50 hover:bg-muted/30"
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
							</a>
						{/if}
					{/each}
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	input {
		font-family:
			-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell',
			sans-serif;
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
	}
</style>
