<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		label: Snippet;
		value: Snippet;
	}

	let { label, value }: Props = $props();
</script>

<div class="flex items-center justify-between text-xs">
	<div>{@render label()}</div>
	<div class="font-bold">{@render value()}</div>
</div>
