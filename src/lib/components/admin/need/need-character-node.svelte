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

<div class="w-36 rounded-md border border-neutral-700 bg-neutral-900">
	<div class="relative px-3 py-2">
		<div class="flex items-center gap-2">
			<IconUser class="size-4 text-blue-400" />
			<span class="flex-1 truncate text-sm font-medium text-white">
				{character.name}
			</span>
		</div>

		<Handle type="source" position={Position.Right} />
	</div>
</div>
