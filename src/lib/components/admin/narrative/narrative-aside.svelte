<script lang="ts">
	import {
		Command,
		CommandInput,
		CommandList,
		CommandEmpty,
		CommandGroup,
		CommandLinkItem,
	} from '$lib/components/ui/command';
	import { ButtonGroup } from '$lib/components/ui/button-group';
	import { IconCheck } from '@tabler/icons-svelte';
	import { useNarrative } from '$lib/hooks/use-narrative.svelte';
	import { page } from '$app/state';
	import { cn } from '$lib/utils';
	import NarrativeCreateButton from './narrative-create-button.svelte';
	import NarrativeUpdateButton from './narrative-update-button.svelte';
	import NarrativeDeleteButton from './narrative-delete-button.svelte';

	const { store } = useNarrative();
	const currentNarrativeId = $derived(page.params.narrativeId);
</script>

<aside class="absolute top-4 left-4 z-10 flex flex-col gap-2">
	<ButtonGroup>
		<ButtonGroup>
			<NarrativeCreateButton />
			<NarrativeUpdateButton
				variant="outline"
				size="icon"
				disabled={!currentNarrativeId}
				narrativeId={currentNarrativeId}
			/>
		</ButtonGroup>
		<ButtonGroup>
			<NarrativeDeleteButton
				variant="outline"
				size="icon"
				disabled={!currentNarrativeId}
				narrativeId={currentNarrativeId}
			/>
		</ButtonGroup>
	</ButtonGroup>

	<Command class="w-60 rounded-lg border shadow-md">
		<CommandInput placeholder="대화 또는 효과 검색..." />
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
