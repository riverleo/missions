<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		label: string;
		children: Snippet;
	}

	let { label, children }: Props = $props();
</script>

<div class="flex items-start justify-between text-xs">
	<div class="text-muted-foreground">{label}</div>
	<div class="flex items-center gap-2 font-medium">{@render children()}</div>
</div>
