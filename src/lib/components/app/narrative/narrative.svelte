<script lang="ts">
	import { throttle } from 'radash';
	import { useNarrative } from '$lib/hooks/use-narrative';
	import Message from './narrative-message.svelte';
	import NarrativeAction from './narrative-action.svelte';
	import { isArrowDown, isArrowUp, isArrowUpOrDown, isEnterOrSpace } from '$lib/shortcut/utils';
	import { bindLayerEvent, type LayerId } from '$lib/shortcut/store';

	const layerId: LayerId = 'narrative';

	const { play } = useNarrative();
	const playStore = play.store;

	bindLayerEvent({
		id: layerId,
		onkeyup: (event: KeyboardEvent) => {
			const currentNarrativeNode = $playStore.narrativeNode;
			if (currentNarrativeNode === undefined) return;

			const { type } = currentNarrativeNode;

			if (isEnterOrSpace(event)) {
				switch (type) {
					case 'text':
						play.roll();
						break;
					case 'choice':
						// Enter or Space to select highlighted choice
						if ($playStore.selectedNarrativeNodeChoice !== undefined) {
							play.select($playStore.selectedNarrativeNodeChoice);
						}
						break;
				}
			}
		},
		onkeydown: throttle({ interval: 100 }, (event: KeyboardEvent) => {
			const currentNarrativeNode = $playStore.narrativeNode;

			if (currentNarrativeNode === undefined) return;

			const { type } = currentNarrativeNode;

			if (type !== 'choice') return;

			const narrativeNodeChoices = currentNarrativeNode.narrative_node_choices ?? [];

			if (isArrowUpOrDown(event) && $playStore.selectedNarrativeNodeChoice === undefined) {
				play.highlight(narrativeNodeChoices[0]);
			} else if (isArrowDown(event)) {
				const currentIndex = narrativeNodeChoices.findIndex(
					(c) => c.id === $playStore.selectedNarrativeNodeChoice?.id
				);
				const nextIndex = (currentIndex + 1) % narrativeNodeChoices.length;
				play.highlight(narrativeNodeChoices[nextIndex]);
			} else if (isArrowUp(event)) {
				const currentIndex = narrativeNodeChoices.findIndex(
					(c) => c.id === $playStore.selectedNarrativeNodeChoice?.id
				);
				const prevIndex =
					(currentIndex - 1 + narrativeNodeChoices.length) % narrativeNodeChoices.length;
				play.highlight(narrativeNodeChoices[prevIndex]);
			}
		}),
	});
</script>

<div
	class="fixed top-0 right-0 bottom-0 left-0 z-0 min-h-lvh items-center justify-center bg-black/10 backdrop-blur-sm"
	class:invisible={$playStore.narrativeNode === undefined}
>
	<div class="absolute top-1/2 left-1/2 -translate-1/2">
		<Message />
	</div>
	<div class="absolute top-1/2 left-1/2 mt-10 -translate-1/2">
		<NarrativeAction />
	</div>
</div>
