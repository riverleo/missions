<script lang="ts">
	import { useCurrentUser } from '$lib/hooks/use-current-user';
	import { useServerPayload } from '$lib/hooks/use-server-payload.svelte';

	const { supabase } = useServerPayload();
	const { store: currentUser, createPlayer } = useCurrentUser();

	let isCreatingAnonymousUser = $state(false);

	async function createAnonymousUser() {
		isCreatingAnonymousUser = true;
		try {
			const { error } = await supabase.auth.signInAnonymously();
			if (error) throw error;

			// 플레이어 생성
			await createPlayer({ name: '모험가' });

			// 페이지 새로고침하여 새 유저 정보 로드
			window.location.reload();
		} catch (error) {
			console.error('Failed to create anonymous user:', error);
			alert('익명 유저 생성에 실패했습니다.');
		} finally {
			isCreatingAnonymousUser = false;
		}
	}
</script>

<div class="container mx-auto p-8">
	<h1 class="mb-4 text-2xl font-bold">Current User Test</h1>

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
		<div class="space-y-4">
			<p>No user found</p>
			<button
				onclick={createAnonymousUser}
				disabled={isCreatingAnonymousUser}
				class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
			>
				{isCreatingAnonymousUser ? '생성 중...' : '익명 유저 생성'}
			</button>
		</div>
	{/if}
</div>
