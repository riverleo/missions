<script lang="ts">
	import Onboarding from '$lib/components/onboarding/Onboarding.svelte';
	import { wasLoggedIn } from '$lib/stores';
	import { goto } from '$app/navigation';

	$effect(() => {
		if ($wasLoggedIn) goto('/');
	});
</script>

<div class="flex min-h-screen w-full items-center justify-center p-4">
	<Onboarding />
</div>
