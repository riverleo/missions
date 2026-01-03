<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		label: string;
		children: Snippet;
	}

	let { label, children }: Props = $props();
</script>

<div class="flex items-center justify-between text-xs">
	<div>{label}</div>
	<div class="font-bold">{@render children()}</div>
</div>
