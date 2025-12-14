<script lang="ts">
	import { throttle } from 'radash';
	import { useNarrative } from '$lib/hooks/use-narrative';
	import Message from './narrative-message.svelte';
	import NarrativeAction from './narrative-action.svelte';
	import { isArrowDown, isArrowUp, isArrowUpOrDown, isEnterOrSpace } from '$lib/shortcut/utils';
	import { bindLayerEvent, type LayerId } from '$lib/shortcut/store';

	const layerId: LayerId = 'narrative';

	const { narrativeNodeStore, narrativeNodeChoiceStore, play } = useNarrative();
	const playStore = play.store;

	const narrativeNode = $derived(
		$playStore.narrativeNodeId
			? $narrativeNodeStore.data?.[$playStore.narrativeNodeId]
			: undefined
	);

	const narrativeNodeChoices = $derived(
		narrativeNode
			? Object.values($narrativeNodeChoiceStore.data ?? {}).filter(
					(c) => c.narrative_node_id === narrativeNode.id
				)
			: []
	);

	const selectedNarrativeNodeChoice = $derived(
		$playStore.selectedNarrativeNodeChoiceId
			? $narrativeNodeChoiceStore.data?.[$playStore.selectedNarrativeNodeChoiceId]
			: undefined
	);

	bindLayerEvent({
		id: layerId,
		onkeyup: (event: KeyboardEvent) => {
			if (narrativeNode === undefined) return;

			const { type } = narrativeNode;

			if (isEnterOrSpace(event)) {
				switch (type) {
					case 'text':
						play.roll();
						break;
					case 'choice':
						// Enter or Space to select highlighted choice
						if (selectedNarrativeNodeChoice !== undefined) {
							play.select(selectedNarrativeNodeChoice);
						}
						break;
				}
			}
		},
		onkeydown: throttle({ interval: 100 }, (event: KeyboardEvent) => {
			if (narrativeNode === undefined) return;

			const { type } = narrativeNode;

			if (type !== 'choice') return;

			if (isArrowUpOrDown(event) && selectedNarrativeNodeChoice === undefined) {
				play.highlight(narrativeNodeChoices[0]);
			} else if (isArrowDown(event)) {
				const currentIndex = narrativeNodeChoices.findIndex(
					(c) => c.id === selectedNarrativeNodeChoice?.id
				);
				const nextIndex = (currentIndex + 1) % narrativeNodeChoices.length;
				play.highlight(narrativeNodeChoices[nextIndex]);
			} else if (isArrowUp(event)) {
				const currentIndex = narrativeNodeChoices.findIndex(
					(c) => c.id === selectedNarrativeNodeChoice?.id
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
	class:invisible={narrativeNode === undefined}
>
	<div class="absolute top-1/2 left-1/2 -translate-1/2">
		<Message />
	</div>
	<div class="absolute top-1/2 left-1/2 mt-10 -translate-1/2">
		<NarrativeAction />
	</div>
</div>
