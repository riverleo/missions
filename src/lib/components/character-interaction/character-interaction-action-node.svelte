<script lang="ts">
	import type { CharacterInteractionAction } from '$lib/types';
	import { Handle, Position } from '@xyflow/svelte';
	import { IconCircleDashedNumber1 } from '@tabler/icons-svelte';
	import { getInteractionActionSummaryString } from '$lib/utils/label';

	interface Props {
		data: {
			action: CharacterInteractionAction;
			parentAction?: CharacterInteractionAction;
		};
		id: string;
		selected?: boolean;
	}

	const { data, id, selected = false }: Props = $props();
	const action = $derived(data.action);

	const summary = $derived(getInteractionActionSummaryString(action));
</script>

<div class="min-w-44 px-3 py-2">
	{#if !action.root}
		<Handle
			type="target"
			position={Position.Left}
			id="target"
			style="background-color: var(--color-neutral-500)"
		/>
	{/if}

	<div class="flex flex-col">
		<div class="flex items-center gap-1 text-sm font-medium">
			{#if action.root}
				<IconCircleDashedNumber1 class="size-3.5" />
			{/if}
			{summary}
		</div>
	</div>

	<Handle type="source" position={Position.Right} id="next" />
</div>
