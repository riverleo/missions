<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import Landing from '$lib/components/Landing.svelte';
	import { wasLoggedIn } from '$lib/stores';

	// localStorage에서 온보딩 데이터 확인하여 자동 로그인 및 리다이렉트
	onMount(() => {
		if (typeof window !== 'undefined') {
			const onboardingData = localStorage.getItem('missions-onboarding');
			if (onboardingData) {
				wasLoggedIn.set(true);
				goto('/visions');
			}
		}
	});
</script>

{#if $wasLoggedIn}
	<!-- Redirecting to /visions -->
{:else}
	<Landing />
{/if}
