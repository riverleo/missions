<script lang="ts">
	import type { Snippet } from 'svelte';
	import { ItemGroup } from '$lib/components/ui/item';

	interface Props {
		types: string[];
		item: Snippet<[string]>;
		class?: string;
	}

	let { types, item, class: className = 'grid w-full grid-cols-4 gap-4' }: Props = $props();
</script>

<ItemGroup class={className}>
	{#each types as type (type)}
		{@render item(type)}
	{/each}
</ItemGroup>
