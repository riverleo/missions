<script lang="ts">
	import type { AppPayload } from '$lib/types';
	import type { Snippet } from 'svelte';
	import { setAppContext } from '$lib/hooks';
	import { init } from '$lib/hooks/init';

	const { data, children }: { data: AppPayload; children: Snippet } = $props();

	setAppContext(data);

	// 모든 훅의 싱글톤 생성 및 초기화 (context 설정 후)
	init();
</script>

{@render children()}
