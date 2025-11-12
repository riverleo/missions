<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import IconPlus from '@tabler/icons-svelte/icons/plus';
	import IconChevronRight from '@tabler/icons-svelte/icons/chevron-right';
	import IconTrash from '@tabler/icons-svelte/icons/trash';
	import { Button } from '$lib/components/ui/button';

	type Task = {
		id: string;
		title: string;
		linkedVisions: string[];
		linkedQuests: string[];
	};

	type Vision = {
		id: string;
		title: string;
		description: string;
		linkedFoundations: string[];
	};

	let visions = $state<Vision[]>([]);
	let tasks = $state<Task[]>([]);
	let vision = $state<Vision | null>(null);

	$effect(() => {
		const id = $page.params.id;
		vision = visions.find((v) => v.id === id) || null;
		if (!vision && visions.length > 0) {
			goto('/visions');
		}
	});

	onMount(() => {
		if (typeof window !== 'undefined') {
			const savedVisions = localStorage.getItem('missions-visions');
			const savedTasks = localStorage.getItem('missions-tasks');
			if (savedVisions) visions = JSON.parse(savedVisions);
			if (savedTasks) tasks = JSON.parse(savedTasks);
		}
	});

	function saveVision() {
		if (!vision) return;
		const currentVision = vision;
		if (typeof window !== 'undefined') {
			const index = visions.findIndex((v) => v.id === currentVision.id);
			if (index !== -1) {
				visions[index] = currentVision;
				localStorage.setItem('missions-visions', JSON.stringify(visions));
			}
		}
	}

	function addTask() {
		if (!vision || vision.linkedFoundations.length >= 8) return;

		const newTask: Task = {
			id: crypto.randomUUID(),
			title: '',
			linkedVisions: [vision.id],
			linkedQuests: [],
		};
		tasks = [...tasks, newTask];
		vision.linkedFoundations = [...vision.linkedFoundations, newTask.id];

		if (typeof window !== 'undefined') {
			localStorage.setItem('missions-tasks', JSON.stringify(tasks));
			localStorage.setItem('missions-visions', JSON.stringify(visions));
		}

		goto(`/tasks/${newTask.id}`);
	}

	function deleteVision() {
		if (!vision) return;

		const currentVision = vision;

		if (
			!confirm('Are you sure you want to delete this vision? All linked tasks will be unlinked.')
		) {
			return;
		}

		// Unlink from all tasks
		tasks.forEach((task) => {
			if (task.linkedVisions.includes(currentVision.id)) {
				task.linkedVisions = task.linkedVisions.filter((id) => id !== currentVision.id);
			}
		});

		// Remove vision
		visions = visions.filter((v) => v.id !== currentVision.id);

		if (typeof window !== 'undefined') {
			localStorage.setItem('missions-visions', JSON.stringify(visions));
			localStorage.setItem('missions-tasks', JSON.stringify(tasks));
		}

		goto('/visions');
	}
</script>

{#if vision}
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
				Back to Visions
			</a>
			<Button
				onclick={deleteVision}
				variant="ghost"
				size="sm"
				class="h-7 text-destructive hover:text-destructive"
			>
				<IconTrash class="h-3.5 w-3.5" />
			</Button>
		</div>

		<!-- Vision Editor -->
		<div class="space-y-4">
			<input
				bind:value={vision.title}
				onblur={saveVision}
				placeholder="Vision title..."
				class="w-full bg-transparent text-3xl font-bold text-foreground outline-none placeholder:text-muted-foreground/30"
			/>
			<textarea
				bind:value={vision.description}
				onblur={saveVision}
				placeholder="Add a description..."
				class="w-full resize-none bg-transparent text-base text-muted-foreground outline-none placeholder:text-muted-foreground/30"
				rows="3"
			></textarea>
		</div>

		<!-- Linked Tasks Section -->
		<div class="space-y-3 border-t border-border/50 pt-6">
			<div class="flex items-center justify-between">
				<h2 class="font-mono text-xs font-semibold tracking-wider text-foreground/60 uppercase">
					Linked Tasks ({vision.linkedFoundations.length}/8)
				</h2>
				<Button
					onclick={addTask}
					disabled={vision.linkedFoundations.length >= 8}
					variant="ghost"
					size="sm"
					class="h-7 font-mono text-xs"
				>
					<IconPlus class="mr-1 h-3 w-3" />
					Add Task
				</Button>
			</div>

			<div class="space-y-2">
				{#if vision.linkedFoundations.length === 0}
					<div class="rounded-lg border border-dashed border-border/50 py-8 text-center">
						<p class="font-mono text-xs text-muted-foreground/50">No linked tasks</p>
					</div>
				{:else}
					{#each vision.linkedFoundations as taskId (taskId)}
						{@const task = tasks.find((t) => t.id === taskId)}
						{#if task}
							<a
								href="/tasks/{task.id}"
								class="group block w-full rounded-md border border-transparent text-left transition-all hover:border-border/50 hover:bg-muted/30"
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
							</a>
						{/if}
					{/each}
				{/if}
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
