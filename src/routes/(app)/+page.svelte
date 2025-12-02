<script lang="ts">
	import { useCurrentUser } from '$lib/hooks/use-current-user.svelte';

	const { data } = $props();

	const currentUser = useCurrentUser(data);
</script>

<div class="container mx-auto p-8">
	<h1 class="mb-4 text-2xl font-bold">Current User Test</h1>

	{$currentUser.status}
	{#if $currentUser.status === 'loading'}
		<p>Loading user...</p>
	{:else if $currentUser.error}
		<p class="text-red-500">Error: {$currentUser.error.message}</p>
	{:else if $currentUser.data?.user}
		<div class="space-y-2">
			<p>
				<strong>User ID:</strong>
				{$currentUser.data.user.id}
			</p>
			<p>
				<strong>Email:</strong>
				{$currentUser.data.user.email ?? 'N/A'}
			</p>
			<p>
				<strong>Is Anonymous:</strong>
				{$currentUser.data.user.is_anonymous ? 'Yes' : 'No'}
			</p>
			<p>
				<strong>Role Type:</strong>
				{$currentUser.data.role?.type ?? 'No role (regular user)'}
			</p>
			{#if $currentUser.data.role}
				<p>
					<strong>Role Created At:</strong>
					{new Date($currentUser.data.role.created_at).toLocaleString()}
				</p>
			{/if}
		</div>
	{:else}
		<p>No user found</p>
	{/if}
</div>
