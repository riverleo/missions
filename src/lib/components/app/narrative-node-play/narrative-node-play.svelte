<script lang="ts">
	import { useNarrative } from '$lib/hooks/use-narrative';
	import NarrativeNodePlayMessage from './narrative-node-play-message.svelte';
	import NarrativeNodePlayAction from './narrative-node-play-action.svelte';
	import { isEnterOrSpace } from '$lib/shortcut/utils';
	import {
		bindStackEvent,
		activateStack,
		deactivateStack,
		type StackId,
	} from '$lib/shortcut/store';

	const stackId: StackId = 'narrative';

	const { play } = useNarrative();
	const playStore = play.store;

	$effect(() => {
		if ($playStore.narrativeNode) {
			activateStack(stackId);
		} else {
			deactivateStack(stackId);
		}
	});

	bindStackEvent({
		id: stackId,
		onkeyup: (event: KeyboardEvent) => {
			const narrativeNode = $playStore.narrativeNode;
			if (narrativeNode === undefined) return;

			if (isEnterOrSpace(event)) {
				switch (narrativeNode.type) {
					case 'text':
						play.roll();
						break;
					case 'choice':
						// Enter or Space to select highlighted choice
						const selectedChoice = $playStore.selectedNarrativeNodeChoice;
						if (selectedChoice !== undefined) {
							play.select(selectedChoice.id);
						}
						break;
				}
			}
		},
	});
</script>

<div
	class="fixed top-0 right-0 bottom-0 left-0 z-0 min-h-lvh items-center justify-center bg-black/10 backdrop-blur-sm"
	class:invisible={$playStore.narrativeNode === undefined}
	data-shortcut-stack={stackId}
>
	<div class="absolute top-1/2 left-1/2 -translate-1/2">
		<NarrativeNodePlayMessage />
	</div>
	<div class="absolute top-1/2 left-1/2 mt-10 -translate-1/2">
		<NarrativeNodePlayAction />
	</div>
</div>
