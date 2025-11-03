<script lang="ts">
	import { setLocale, type Locale } from '$lib/paraglide/runtime.js';

	let { data, children } = $props();

	// 언어와 국가 정보를 컨텍스트로 제공
	const { language } = data;

	// Paraglide 언어 설정
	$effect(() => {
		setLocale(language as Locale);
	});
</script>

{@render children()}
