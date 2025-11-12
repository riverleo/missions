<script lang="ts">
	import * as Empty from '$lib/components/ui/empty/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import WorldExclamationIcon from '@tabler/icons-svelte/icons/world-exclamation';
	import { supabase } from '$lib/supabase/client';

	let { onNext }: { onNext: () => void } = $props();
	let isLoading = $state(false);
	let error = $state<string | null>(null);

	async function handleStart() {
		isLoading = true;
		error = null;

		try {
			// 먼저 현재 세션 확인
			const {
				data: { session },
			} = await supabase.auth.getSession();

			if (session?.user) {
				// 이미 로그인된 상태면 바로 다음 단계로
				console.log('Already logged in:', session.user.id);
				onNext();
				return;
			}

			// 로그인되지 않은 상태면 익명 유저 생성
			const { data, error: authError } = await supabase.auth.signInAnonymously();

			if (authError) {
				throw authError;
			}

			if (data.user) {
				console.log('Anonymous user created:', data.user.id);
				onNext();
			}
		} catch (err) {
			console.error('Error creating anonymous user:', err);
			error = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
		} finally {
			isLoading = false;
		}
	}
</script>

<Empty.Root>
	<Empty.Header>
		<Empty.Media variant="icon">
			<WorldExclamationIcon />
		</Empty.Media>
		<Empty.Title>세상을 놀라게 할 준비가 되셨습니까?</Empty.Title>
		<Empty.Description>
			여기에 뭔가 설득력 있는 문장을 넣어서 읽는 사람을 감동시키자.
		</Empty.Description>
	</Empty.Header>
	<Empty.Content>
		<div class="flex flex-col items-center gap-2">
			<Button variant="outline" size="sm" onclick={handleStart} disabled={isLoading}>
				{isLoading ? '준비 중...' : '클릭해서 세상 놀라게 하기'}
			</Button>
			{#if error}
				<p class="text-sm text-destructive">{error}</p>
			{/if}
		</div>
	</Empty.Content>
</Empty.Root>
