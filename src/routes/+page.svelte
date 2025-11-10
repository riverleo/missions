<script lang="ts">
	import EmptyMissions from '$lib/components/EmptyMissions.svelte';
	import Landing from '$lib/components/Landing.svelte';
	import LaunchInterface from '$lib/components/launch/LaunchInterface.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { wasLoggedIn, hasMissions } from '$lib/stores';
</script>

{#if $wasLoggedIn}
	<div class="p-4 pb-48">
		{#if $hasMissions}
			<div class="grid grid-cols-4 gap-4">
				<div class="h-72 p-4">
					<Badge>Active</Badge>
					<h1>mission 1</h1>
				</div>
				<div class="h-72 p-4">
					<Badge variant="outline">Inactive</Badge>
					<h1>mission 2</h1>
				</div>
				<div class="h-72 p-4">
					<Badge variant="outline">Inactive</Badge>
					<h1>mission 3</h1>
				</div>
				<div class="h-72 p-4">
					<Badge variant="outline">Inactive</Badge>
					<h1>mission 4</h1>
				</div>
			</div>
		{:else}
			<EmptyMissions />
		{/if}
	</div>
	<LaunchInterface />
{:else}
	<Landing />
{/if}
