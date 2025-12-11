<script lang="ts">
	import type { Snippet } from 'svelte';
	import { createAdminContext } from '$lib/hooks/use-admin.svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();

	createAdminContext();
</script>

{@render children()}
