<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import IconChevronRight from '@tabler/icons-svelte/icons/chevron-right';
	import IconCircleCheck from '@tabler/icons-svelte/icons/circle-check';
	import IconPlus from '@tabler/icons-svelte/icons/plus';
	import { Button } from '$lib/components/ui/button';

	type Foundation = {
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

	let foundations = $state<Foundation[]>([]);
	let visions = $state<Vision[]>([]);

	onMount(() => {
		if (typeof window !== 'undefined') {
			const savedFoundations = localStorage.getItem('missions-foundations');
			const savedVisions = localStorage.getItem('missions-visions');
			if (savedFoundations) foundations = JSON.parse(savedFoundations);
			if (savedVisions) visions = JSON.parse(savedVisions);
		}
	});

	function getLinkedVisionTitles(foundation: Foundation): string {
		return foundation.linkedVisions
			.map((vId) => visions.find((v) => v.id === vId)?.title || 'Untitled')
			.join(', ');
	}

	function createFoundation() {
		const newFoundation: Foundation = {
			id: crypto.randomUUID(),
			title: '',
			linkedVisions: [],
			linkedQuests: [],
		};
		foundations = [...foundations, newFoundation];
		if (typeof window !== 'undefined') {
			localStorage.setItem('missions-foundations', JSON.stringify(foundations));
		}
		goto(`/foundations/${newFoundation.id}`);
	}
</script>

<div class="mx-auto w-full max-w-4xl space-y-6 p-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="font-mono text-sm font-semibold tracking-wider text-foreground/60 uppercase">
				Foundations
			</h1>
			<p class="mt-1 text-sm text-muted-foreground">All your foundations across visions</p>
		</div>
		<Button
			onclick={createFoundation}
			variant="outline"
			size="sm"
			class="font-mono text-xs tracking-wider uppercase"
		>
			<IconPlus class="mr-2 h-3.5 w-3.5" />
			New Foundation
		</Button>
	</div>

	<div class="space-y-2">
		{#if foundations.length === 0}
			<div class="rounded-lg border border-dashed border-border/50 py-16 text-center">
				<IconCircleCheck class="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
				<p class="font-mono text-sm text-muted-foreground/50">No foundations yet</p>
				<p class="mt-1 text-xs text-muted-foreground/40">
					Create foundations from your visions to get started
				</p>
			</div>
		{:else}
			{#each foundations as foundation (foundation.id)}
				<a
					href="/foundations/{foundation.id}"
					class="notion-item group block w-full rounded-md border border-transparent text-left transition-all hover:border-border/50 hover:bg-muted/30"
				>
					<div class="flex items-center gap-3 px-3 py-2">
						<IconCircleCheck class="h-4 w-4 flex-shrink-0 text-muted-foreground" />
						<div class="flex-1 overflow-hidden">
							<p class="truncate font-medium text-foreground">
								{foundation.title || 'Untitled Foundation'}
							</p>
							{#if foundation.linkedVisions.length > 0}
								<p class="truncate text-xs text-muted-foreground">
									{getLinkedVisionTitles(foundation)}
								</p>
							{/if}
						</div>
						{#if foundation.linkedQuests.length > 0}
							<span class="font-mono text-xs text-muted-foreground/50">
								{foundation.linkedQuests.length} quest{foundation.linkedQuests.length !== 1 ? 's' : ''}
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
