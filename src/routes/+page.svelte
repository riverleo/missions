<script lang="ts">
	import LandingPage from '$lib/components/LandingPage.svelte';
	import { wasLoggedIn } from '$lib/stores';
</script>

{#if $wasLoggedIn}
	HAHAHAH
{:else}
	<LandingPage />
{/if}
