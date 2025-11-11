<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import IconChevronRight from '@tabler/icons-svelte/icons/chevron-right';
	import IconCircleCheck from '@tabler/icons-svelte/icons/circle-check';
	import IconPlus from '@tabler/icons-svelte/icons/plus';
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

	let tasks = $state<Task[]>([]);
	let visions = $state<Vision[]>([]);

	onMount(() => {
		if (typeof window !== 'undefined') {
			const savedTasks = localStorage.getItem('missions-tasks');
			const savedVisions = localStorage.getItem('missions-visions');
			if (savedTasks) tasks = JSON.parse(savedTasks);
			if (savedVisions) visions = JSON.parse(savedVisions);
		}
	});

	function getLinkedVisionTitles(task: Task): string {
		return task.linkedVisions
			.map((vId) => visions.find((v) => v.id === vId)?.title || 'Untitled')
			.join(', ');
	}

	function createTask() {
		const newTask: Task = {
			id: crypto.randomUUID(),
			title: '',
			linkedVisions: [],
			linkedActions: [],
		};
		tasks = [...tasks, newTask];
		if (typeof window !== 'undefined') {
			localStorage.setItem('missions-tasks', JSON.stringify(tasks));
		}
		goto(`/tasks/${newTask.id}`);
	}
</script>

<div class="mx-auto w-full max-w-4xl space-y-6 p-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="font-mono text-sm font-semibold tracking-wider text-foreground/60 uppercase">
				Tasks
			</h1>
			<p class="mt-1 text-sm text-muted-foreground">All your tasks across visions</p>
		</div>
		<Button
			onclick={createTask}
			variant="outline"
			size="sm"
			class="font-mono text-xs tracking-wider uppercase"
		>
			<IconPlus class="mr-2 h-3.5 w-3.5" />
			New Task
		</Button>
	</div>

	<div class="space-y-2">
		{#if tasks.length === 0}
			<div class="rounded-lg border border-dashed border-border/50 py-16 text-center">
				<IconCircleCheck class="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
				<p class="font-mono text-sm text-muted-foreground/50">No tasks yet</p>
				<p class="mt-1 text-xs text-muted-foreground/40">
					Create tasks from your visions to get started
				</p>
			</div>
		{:else}
			{#each tasks as task (task.id)}
				<a
					href="/tasks/{task.id}"
					class="notion-item group block w-full rounded-md border border-transparent text-left transition-all hover:border-border/50 hover:bg-muted/30"
				>
					<div class="flex items-center gap-3 px-3 py-2">
						<IconCircleCheck class="h-4 w-4 flex-shrink-0 text-muted-foreground" />
						<div class="flex-1 overflow-hidden">
							<p class="truncate font-medium text-foreground">
								{task.title || 'Untitled Task'}
							</p>
							{#if task.linkedVisions.length > 0}
								<p class="truncate text-xs text-muted-foreground">
									{getLinkedVisionTitles(task)}
								</p>
							{/if}
						</div>
						{#if task.linkedActions.length > 0}
							<span class="font-mono text-xs text-muted-foreground/50">
								{task.linkedActions.length} action{task.linkedActions.length !== 1 ? 's' : ''}
							</span>
						{/if}
						<IconChevronRight
							class="h-4 w-4 text-muted-foreground/30 transition-transform group-hover:translate-x-1"
						/>
					</div>
				</a>
			{/each}
		{/if}
	</div>
</div>
