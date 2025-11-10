<script lang="ts">
	import EmptyMissions from '$lib/components/EmptyMissions.svelte';
	import Landing from '$lib/components/Landing.svelte';
	import LaunchInterface from '$lib/components/launch/LaunchInterface.svelte';
	import { wasLoggedIn, hasMissions } from '$lib/stores';
</script>

{#if $wasLoggedIn}
	<div class="p-4 pb-48">
		{#if $hasMissions}
			<div class="grid grid-cols-3 gap-4">
				<div class="h-72 border"></div>
				<div class="h-72 border"></div>
				<div class="h-72 border"></div>
			</div>
		{:else}
			<EmptyMissions />
		{/if}
	</div>
	<LaunchInterface />
{:else}
	<Landing />
{/if}
