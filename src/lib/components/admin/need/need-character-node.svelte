<script lang="ts">
	import type { Character } from '$lib/types';
	import { Handle, Position } from '@xyflow/svelte';
	import { IconUser } from '@tabler/icons-svelte';

	interface Props {
		data: {
			character: Character;
		};
		id: string;
		selected?: boolean;
	}

	const { data, id, selected = false }: Props = $props();
	const character = $derived(data.character);
</script>

<div class="px-3 py-2">
	<span class="flex-1 truncate text-sm font-medium text-white">
		{character.name}
	</span>

	<Handle type="source" position={Position.Right} />
</div>
