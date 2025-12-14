<script lang="ts">
	import { useNarrative } from '$lib/hooks/use-narrative';
	import NarrativePlayMessage from './narrative-play-message.svelte';
	import NarrativePlayAction from './narrative-play-action.svelte';
	import { isEnterOrSpace } from '$lib/shortcut/utils';
	import { bindLayerEvent, type LayerId } from '$lib/shortcut/store';

	const layerId: LayerId = 'narrative';

	const { play } = useNarrative();
	const playStore = play.store;

	bindLayerEvent({
		id: layerId,
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
>
	<div class="absolute top-1/2 left-1/2 -translate-1/2">
		<NarrativePlayMessage />
	</div>
	<div class="absolute top-1/2 left-1/2 mt-10 -translate-1/2">
		<NarrativePlayAction />
	</div>
</div>
