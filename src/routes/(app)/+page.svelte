<script lang="ts">
	import { useCurrent, usePlayer } from '$lib/hooks';
	import type { UserId } from '$lib/types';
	import { useApp } from '$lib/hooks';

	const { supabase } = useApp();
	const { userStore: user, roleStore: role } = useCurrent();
	const player = usePlayer();

	let isCreatingAnonymousUser = $state(false);

	async function createAnonymousUser() {
		isCreatingAnonymousUser = true;
		try {
			const { data, error } = await supabase.auth.signInAnonymously();
			if (error) throw error;

			if (data.user) {
				// 플레이어 생성
				await player.createPlayer({ user_id: data.user.id as UserId, name: '모험가' });
			}

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

	{#if $user}
		<div class="space-y-2">
			<p>
				<strong>User ID:</strong>
				{$user.id}
			</p>
			<p>
				<strong>Email:</strong>
				{$user.email ?? 'N/A'}
			</p>
			<p>
				<strong>Is Anonymous:</strong>
				{$user.is_anonymous ? 'Yes' : 'No'}
			</p>
			<p>
				<strong>Role Type:</strong>
				{$role?.type ?? 'No role (regular user)'}
			</p>
			{#if $role}
				<p>
					<strong>Role Created At:</strong>
					{new Date($role.created_at).toLocaleString()}
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
