<script lang="ts">
	import type { LayoutData } from './$types';
	import { setLocale } from '$lib/paraglide/runtime.js';

	let { data, children }: { data: LayoutData; children: any } = $props();

	// 언어와 국가 정보를 컨텍스트로 제공
	const { language, country, locale } = data;

	// Paraglide 언어 설정
	$effect(() => {
		setLocale(language as 'ko' | 'en' | 'ja' | 'zh');
	});
</script>

<svelte:head>
	<html lang={locale}></html>
</svelte:head>

{@render children()}
