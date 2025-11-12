<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import IconChevronRight from '@tabler/icons-svelte/icons/chevron-right';
	import IconRocket from '@tabler/icons-svelte/icons/rocket';
	import IconPlus from '@tabler/icons-svelte/icons/plus';
	import { Button } from '$lib/components/ui/button';

	type Quest = {
		id: string;
		title: string;
		linkedFoundations: string[];
	};

	type Foundation = {
		id: string;
		title: string;
		linkedVisions: string[];
		linkedQuests: string[];
	};

	let quests = $state<Quest[]>([]);
	let foundations = $state<Foundation[]>([]);

	onMount(() => {
		if (typeof window !== 'undefined') {
			const savedQuests = localStorage.getItem('missions-quests');
			const savedFoundations = localStorage.getItem('missions-foundations');
			if (savedQuests) quests = JSON.parse(savedQuests);
			if (savedFoundations) foundations = JSON.parse(savedFoundations);
		}
	});

	function getLinkedFoundationTitles(quest: Quest): string {
		return quest.linkedFoundations
			.map((fId) => foundations.find((f) => f.id === fId)?.title || 'Untitled')
			.join(', ');
	}

	function createQuest() {
		const newQuest: Quest = {
			id: crypto.randomUUID(),
			title: '',
			linkedFoundations: [],
		};
		quests = [...quests, newQuest];
		if (typeof window !== 'undefined') {
			localStorage.setItem('missions-quests', JSON.stringify(quests));
		}
		goto(`/quests/${newQuest.id}`);
	}
</script>

<div class="mx-auto w-full max-w-4xl space-y-6 p-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="font-mono text-sm font-semibold tracking-wider text-foreground/60 uppercase">
				Actions
			</h1>
			<p class="mt-1 text-sm text-muted-foreground">All your actions across foundations</p>
		</div>
		<Button
			onclick={createQuest}
			variant="outline"
			size="sm"
			class="font-mono text-xs tracking-wider uppercase"
		>
			<IconPlus class="mr-2 h-3.5 w-3.5" />
			New Action
		</Button>
	</div>

	<div class="space-y-2">
		{#if quests.length === 0}
			<div class="rounded-lg border border-dashed border-border/50 py-16 text-center">
				<IconRocket class="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
				<p class="font-mono text-sm text-muted-foreground/50">No actions yet</p>
				<p class="mt-1 text-xs text-muted-foreground/40">
					Create actions from your foundations to get started
				</p>
			</div>
		{:else}
			{#each quests as quest (quest.id)}
				<a
					href="/quests/{quest.id}"
					class="notion-item group block w-full rounded-md border border-transparent text-left transition-all hover:border-border/50 hover:bg-muted/30"
				>
					<div class="flex items-center gap-3 px-3 py-2">
						<IconRocket class="h-4 w-4 flex-shrink-0 text-muted-foreground" />
						<div class="flex-1 overflow-hidden">
							<p class="truncate font-medium text-foreground">
								{quest.title || 'Untitled Action'}
							</p>
							{#if quest.linkedFoundations.length > 0}
								<p class="truncate text-xs text-muted-foreground">
									{getLinkedFoundationTitles(quest)}
								</p>
							{/if}
						</div>
						<IconChevronRight
							class="h-4 w-4 text-muted-foreground/30 transition-transform group-hover:translate-x-1"
						/>
					</div>
				</a>
			{/each}
		{/if}
	</div>
</div>
