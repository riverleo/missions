<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import IconPlus from '@tabler/icons-svelte/icons/plus';
	import IconChevronRight from '@tabler/icons-svelte/icons/chevron-right';
	import IconTarget from '@tabler/icons-svelte/icons/target';
	import { Button } from '$lib/components/ui/button';

	type Vision = {
		id: string;
		title: string;
		description: string;
		linkedTasks: string[];
	};

	let visions = $state<Vision[]>([]);

	onMount(() => {
		if (typeof window !== 'undefined') {
			const savedVisions = localStorage.getItem('missions-visions');
			if (savedVisions) visions = JSON.parse(savedVisions);
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
			localStorage.setItem('missions-visions', JSON.stringify(visions));
			goto(`/visions/${newVision.id}`);
		}
	}

	const canAddMoreVisions = $derived(visions.length < 4);
</script>

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
				<a
					href="/visions/{vision.id}"
					class="group block w-full rounded-md border border-transparent text-left transition-all hover:border-border/50 hover:bg-muted/30"
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
				</a>
			{/each}
		{/if}
	</div>
</div>
