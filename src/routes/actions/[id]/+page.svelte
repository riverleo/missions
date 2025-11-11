<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import IconChevronRight from '@tabler/icons-svelte/icons/chevron-right';
	import IconCircleCheck from '@tabler/icons-svelte/icons/circle-check';
	import IconTrash from '@tabler/icons-svelte/icons/trash';
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

	let actions = $state<Action[]>([]);
	let tasks = $state<Task[]>([]);
	let action = $state<Action | null>(null);

	$effect(() => {
		const id = $page.params.id;
		action = actions.find((a) => a.id === id) || null;
		if (!action && actions.length > 0) {
			goto('/visions');
		}
	});

	onMount(() => {
		if (typeof window !== 'undefined') {
			const savedActions = localStorage.getItem('missions-actions');
			const savedTasks = localStorage.getItem('missions-tasks');
			if (savedActions) actions = JSON.parse(savedActions);
			if (savedTasks) tasks = JSON.parse(savedTasks);
		}
	});

	function saveAction() {
		if (!action) return;
		const currentAction = action;
		if (typeof window !== 'undefined') {
			const index = actions.findIndex((a) => a.id === currentAction.id);
			if (index !== -1) {
				actions[index] = currentAction;
				localStorage.setItem('missions-actions', JSON.stringify(actions));
			}
		}
	}

	function toggleTaskLink(taskId: string) {
		if (!action) return;

		const currentAction = action;
		const isLinked = currentAction.linkedTasks.includes(taskId);

		if (isLinked) {
			// Remove link
			currentAction.linkedTasks = currentAction.linkedTasks.filter((id) => id !== taskId);
			const task = tasks.find((t) => t.id === taskId);
			if (task) {
				task.linkedActions = task.linkedActions.filter((id) => id !== currentAction.id);
			}
		} else {
			// Add link
			currentAction.linkedTasks = [...currentAction.linkedTasks, taskId];
			const task = tasks.find((t) => t.id === taskId);
			if (task) {
				task.linkedActions = [...task.linkedActions, currentAction.id];
			}
		}

		if (typeof window !== 'undefined') {
			localStorage.setItem('missions-actions', JSON.stringify(actions));
			localStorage.setItem('missions-tasks', JSON.stringify(tasks));
		}

		saveAction();
	}

	function deleteAction() {
		if (!action) return;

		const currentAction = action;

		if (
			!confirm('Are you sure you want to delete this action? All linked tasks will be unlinked.')
		) {
			return;
		}

		// Unlink from all tasks
		tasks.forEach((task) => {
			if (task.linkedActions.includes(currentAction.id)) {
				task.linkedActions = task.linkedActions.filter((id) => id !== currentAction.id);
			}
		});

		// Remove action
		actions = actions.filter((a) => a.id !== currentAction.id);

		if (typeof window !== 'undefined') {
			localStorage.setItem('missions-actions', JSON.stringify(actions));
			localStorage.setItem('missions-tasks', JSON.stringify(tasks));
		}

		goto('/actions');
	}
</script>

{#if action}
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
				onclick={deleteAction}
				variant="ghost"
				size="sm"
				class="h-7 text-destructive hover:text-destructive"
			>
				<IconTrash class="h-3.5 w-3.5" />
			</Button>
		</div>

		<!-- Action Editor -->
		<div class="space-y-4">
			<input
				bind:value={action.title}
				onblur={saveAction}
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
				{#if tasks.length === 0}
					<div class="rounded-lg border border-dashed border-border/50 py-8 text-center">
						<p class="font-mono text-xs text-muted-foreground/50">No tasks available</p>
					</div>
				{:else}
					{#each tasks as task (task.id)}
						{@const isLinked = action.linkedTasks.includes(task.id)}
						<button
							onclick={() => toggleTaskLink(task.id)}
							class="group block w-full rounded-md border text-left transition-all {isLinked
								? 'border-primary/50 bg-primary/10'
								: 'border-transparent hover:border-border/50 hover:bg-muted/30'}"
						>
							<div class="flex items-center gap-2 px-3 py-2">
								<IconCircleCheck
									class="h-3.5 w-3.5 {isLinked ? 'text-primary' : 'text-muted-foreground/50'}"
								/>
								<p
									class="flex-1 truncate text-sm {isLinked
										? 'font-medium text-foreground'
										: 'text-foreground'}"
								>
									{task.title || 'Untitled Task'}
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
