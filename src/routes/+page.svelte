<script lang="ts">
	import Landing from '$lib/components/Landing.svelte';
	import Onboarding from '$lib/components/onboarding/Onboarding.svelte';
	import { wasLoggedIn } from '$lib/stores';
</script>

{#if $wasLoggedIn}
	<Onboarding />
{:else}
	<Landing />
{/if}
