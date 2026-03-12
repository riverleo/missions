<script lang="ts">
	import { invalidate } from '$app/navigation';
	import { useCurrent, usePlayer } from '$lib/hooks';
	import { useApp } from '$lib/hooks';
	import {
		createFrontPageAnonymousUser,
		getFrontPageSummary,
		signInFrontPageWithPassword,
	} from './front-page-auth';

	const { supabase } = useApp();
	const current = useCurrent();
	const { userStore: user, roleStore: role } = current;
	const player = usePlayer();

	let identity = $state('');
	let password = $state('');
	let actionMessage = $state<string | undefined>(undefined);
	let actionMessageTone = $state<'success' | 'error'>('success');
	let isCreatingAnonymousUser = $state(false);
	let isPasswordSigningIn = $state(false);
	let frontPageSummary = $derived(getFrontPageSummary($user, $role));

	async function refreshFrontPageAuthState() {
		// layout의 auth 의존성을 다시 불러오고 현재 사용자/역할 스토어를 동기화한다.
		await invalidate('supabase:auth');
		return current.refreshUser();
	}

	async function createAnonymousUser() {
		isCreatingAnonymousUser = true;
		try {
			// 익명 세션 생성과 플레이어 생성 이후 현재 인증 상태를 다시 불러온다.
			const feedback = await createFrontPageAnonymousUser({
				signInAnonymously: () => supabase.auth.signInAnonymously(),
				createPlayer: player.createPlayer,
				refreshAuthState: refreshFrontPageAuthState,
			});
			actionMessage = feedback.message;
			actionMessageTone = feedback.isSuccess ? 'success' : 'error';
		} catch (error) {
			console.error('Failed to create anonymous user:', error);
			actionMessage = '익명 유저 생성에 실패했습니다.';
			actionMessageTone = 'error';
		} finally {
			isCreatingAnonymousUser = false;
		}
	}

	async function passwordLogin() {
		isPasswordSigningIn = true;
		try {
			// 비밀번호 로그인 후 세션/역할을 재동기화해 첫 페이지 상태를 즉시 갱신한다.
			const feedback = await signInFrontPageWithPassword({
				identity,
				password,
				signInWithPassword: (credentials) => supabase.auth.signInWithPassword(credentials),
				refreshAuthState: refreshFrontPageAuthState,
			});
			actionMessage = feedback.message;
			actionMessageTone = feedback.isSuccess ? 'success' : 'error';
			if (feedback.isSuccess) {
				password = '';
			}
		} catch (error) {
			console.error('Failed to sign in with password:', error);
			actionMessage = '로그인 처리 중 오류가 발생했습니다.';
			actionMessageTone = 'error';
		} finally {
			isPasswordSigningIn = false;
		}
	}
</script>

<div class="container mx-auto flex min-h-[calc(100vh-6rem)] max-w-5xl items-center p-8">
	<div class="grid w-full gap-6 lg:grid-cols-[1.2fr_0.8fr]">
		<section class="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
			<p class="text-sm font-medium tracking-[0.24em] text-slate-500 uppercase">Front Page</p>
			<h1 class="mt-4 text-3xl font-bold text-slate-950">아이디 / 비밀번호 로그인</h1>
			<p class="mt-4 text-sm leading-6 text-slate-600">{frontPageSummary.description}</p>

			{#if actionMessage}
				<p
					class={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
						actionMessageTone === 'success'
							? 'border-emerald-200 bg-emerald-50 text-emerald-700'
							: 'border-rose-200 bg-rose-50 text-rose-700'
					}`}
				>
					{actionMessage}
				</p>
			{/if}

			<div class="mt-6 grid gap-4 rounded-2xl bg-slate-50 p-5 text-sm text-slate-700">
				<p>
					<strong>User ID:</strong>
					{$user?.id ?? 'N/A'}
				</p>
				<p>
					<strong>Email:</strong>
					{$user?.email ?? 'N/A'}
				</p>
				<p>
					<strong>Is Anonymous:</strong>
					{$user ? ($user.is_anonymous ? 'Yes' : 'No') : 'N/A'}
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

			<div class="mt-6 flex flex-wrap gap-3">
				{#if frontPageSummary.canEnterAdmin}
					<a
						href="/admin"
						class="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
					>
						/admin 이동
					</a>
				{/if}

				{#if frontPageSummary.shouldShowAnonymousAction}
					<button
						onclick={createAnonymousUser}
						disabled={isCreatingAnonymousUser}
						class="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 disabled:opacity-50"
					>
						{isCreatingAnonymousUser ? '생성 중...' : '익명 유저 생성'}
					</button>
				{/if}
			</div>
		</section>

		<section class="rounded-3xl border border-slate-200 bg-slate-950 p-8 text-white shadow-sm">
			<h2 class="text-xl font-semibold">관리자 로그인</h2>
			<p class="mt-3 text-sm leading-6 text-slate-300">
				Supabase Auth의 이메일/비밀번호 계정으로 로그인합니다. 관리자 진입을 위해서는 해당 계정에
				`user_roles.type = admin` 레코드가 연결돼 있어야 합니다.
			</p>

			{#if frontPageSummary.shouldShowLoginForm}
				<form
					class="mt-6 grid gap-4"
					onsubmit={(event) => {
						event.preventDefault();
						void passwordLogin();
					}}
				>
					<div class="grid gap-2">
						<span class="text-sm font-medium text-slate-200">아이디</span>
						<input
							bind:value={identity}
							type="email"
							autocomplete="username"
							class="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white ring-0 outline-none placeholder:text-slate-500"
							placeholder="admin@example.com"
						/>
					</div>

					<div class="grid gap-2">
						<span class="text-sm font-medium text-slate-200">비밀번호</span>
						<input
							bind:value={password}
							type="password"
							autocomplete="current-password"
							class="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white ring-0 outline-none placeholder:text-slate-500"
							placeholder="••••••••"
						/>
					</div>

					<button
						type="submit"
						disabled={isPasswordSigningIn}
						class="mt-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 disabled:opacity-50"
					>
						{isPasswordSigningIn ? '로그인 중...' : '로그인'}
					</button>
				</form>
			{:else}
				<p
					class="mt-6 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200"
				>
					현재 세션은 관리자 권한입니다. 바로 `/admin`으로 이동하면 됩니다.
				</p>
			{/if}
		</section>
	</div>
</div>
