<script lang="ts">
	import Aside from '$lib/components/admin/quest/quest-aside.svelte';
	import type { Snippet } from 'svelte';

	const { children }: { children: Snippet } = $props();
</script>

<div class="flex h-screen">
	<Aside />
	<div class="flex flex-1 flex-col">
		{@render children()}
	</div>
</div>
