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
		linkedQuests: string[];
	};

	type Quest = {
		id: string;
		title: string;
		linkedFoundations: string[];
	};

	let quests = $state<Quest[]>([]);
	let tasks = $state<Task[]>([]);
	let quest = $state<Quest | null>(null);

	$effect(() => {
		const id = $page.params.id;
		quest = quests.find((a) => a.id === id) || null;
		if (!quest && quests.length > 0) {
			goto('/visions');
		}
	});

	onMount(() => {
		if (typeof window !== 'undefined') {
			const savedQuests = localStorage.getItem('missions-quests');
			const savedTasks = localStorage.getItem('missions-tasks');
			if (savedQuests) quests = JSON.parse(savedQuests);
			if (savedTasks) tasks = JSON.parse(savedTasks);
		}
	});

	function saveQuest() {
		if (!quest) return;
		const currentAction = quest;
		if (typeof window !== 'undefined') {
			const index = quests.findIndex((a) => a.id === currentAction.id);
			if (index !== -1) {
				quests[index] = currentAction;
				localStorage.setItem('missions-quests', JSON.stringify(quests));
			}
		}
	}

	function toggleTaskLink(taskId: string) {
		if (!quest) return;

		const currentAction = quest;
		const isLinked = currentAction.linkedFoundations.includes(taskId);

		if (isLinked) {
			// Remove link
			currentAction.linkedFoundations = currentAction.linkedFoundations.filter((id) => id !== taskId);
			const task = tasks.find((t) => t.id === taskId);
			if (task) {
				task.linkedQuests = task.linkedQuests.filter((id) => id !== currentAction.id);
			}
		} else {
			// Add link
			currentAction.linkedFoundations = [...currentAction.linkedFoundations, taskId];
			const task = tasks.find((t) => t.id === taskId);
			if (task) {
				task.linkedQuests = [...task.linkedQuests, currentAction.id];
			}
		}

		if (typeof window !== 'undefined') {
			localStorage.setItem('missions-quests', JSON.stringify(quests));
			localStorage.setItem('missions-tasks', JSON.stringify(tasks));
		}

		saveQuest();
	}

	function deleteQuest() {
		if (!quest) return;

		const currentAction = quest;

		if (
			!confirm('Are you sure you want to delete this action? All linked tasks will be unlinked.')
		) {
			return;
		}

		// Unlink from all tasks
		tasks.forEach((task) => {
			if (task.linkedQuests.includes(currentAction.id)) {
				task.linkedQuests = task.linkedQuests.filter((id) => id !== currentAction.id);
			}
		});

		// Remove action
		quests = quests.filter((a) => a.id !== currentAction.id);

		if (typeof window !== 'undefined') {
			localStorage.setItem('missions-quests', JSON.stringify(quests));
			localStorage.setItem('missions-tasks', JSON.stringify(tasks));
		}

		goto('/actions');
	}
</script>

{#if quest}
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
				onclick={deleteQuest}
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
				bind:value={quest.title}
				onblur={saveQuest}
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
						{@const isLinked = quest.linkedFoundations.includes(task.id)}
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
