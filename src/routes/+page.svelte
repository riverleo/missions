<script lang="ts">
	import Landing from '$lib/components/Landing.svelte';
	import { wasLoggedIn } from '$lib/stores';
</script>

{#if $wasLoggedIn}
	TODO
{:else}
	<Landing />
{/if}
