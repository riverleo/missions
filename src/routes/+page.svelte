<script lang="ts">
	import { wasLoggedIn } from '$lib/stores';
	import Landing from '$lib/components/LandingClaude.svelte';
</script>

{#if $wasLoggedIn}
	WIP
{:else}
	<Landing />
{/if}
