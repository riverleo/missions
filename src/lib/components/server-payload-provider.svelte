<script lang="ts">
	import type { ServerPayload } from '$lib/types';
	import type { Snippet } from 'svelte';
	import { setServerPayloadContext } from '$lib/hooks/use-server-payload.svelte';
	import { init } from '$lib/hooks/init';

	const { data, children }: { data: ServerPayload; children: Snippet } = $props();

	setServerPayloadContext(data);

	// 모든 훅의 싱글톤 생성 및 초기화 (context 설정 후)
	init();
</script>

{@render children()}
