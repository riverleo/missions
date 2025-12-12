<script lang="ts">
	import {
		Command,
		CommandInput,
		CommandList,
		CommandEmpty,
		CommandGroup,
		CommandLinkItem,
	} from '$lib/components/ui/command';
	import { IconCheck } from '@tabler/icons-svelte';
	import { useNarrative } from '$lib/hooks/use-narrative.svelte';
	import { page } from '$app/state';
	import { cn } from '$lib/utils';

	const { store } = useNarrative();
	const currentNarrativeId = $derived(page.params.narrativeId);
</script>

<aside class="absolute left-4 top-4 z-10 w-60">
	<Command class="rounded-lg border shadow-md">
		<CommandInput placeholder="내러티브 검색..." />
		<CommandList>
			<CommandEmpty>검색 결과가 없습니다.</CommandEmpty>
			<CommandGroup>
				{#each $store.data ?? [] as narrative (narrative.id)}
					<CommandLinkItem href={`/admin/narratives/${narrative.id}`}>
						<IconCheck
							class={cn(
								'mr-2 size-4',
								narrative.id === currentNarrativeId ? 'opacity-100' : 'opacity-0'
							)}
						/>
						{narrative.title || '(제목 없음)'}
					</CommandLinkItem>
				{/each}
			</CommandGroup>
		</CommandList>
	</Command>
</aside>
