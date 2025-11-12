<script lang="ts">
	import OnboardingWelcome from './OnboardingWelcomeClaude.svelte';
	import OnboardingCharacterSelect from './OnboardingCharacterSelectClaude.svelte';
	import { wasLoggedIn } from '$lib/stores';

	let step = $state(0);
	let selectedCharacter = $state<string | null>(null);
	let characterName = $state('');
	let mission = $state('');

	function goToNext() {
		step += 1;
	}

	function goToBack() {
		step -= 1;
	}

	function handleComplete() {
		// 온보딩 데이터 localStorage에 저장
		if (typeof window !== 'undefined') {
			const onboardingData = {
				selectedCharacter,
				characterName,
				mission,
				completedAt: new Date().toISOString(),
			};
			localStorage.setItem('missions-onboarding', JSON.stringify(onboardingData));
		}

		// 로그인 상태로 변경
		wasLoggedIn.set(true);
	}
</script>

{#if step === 0}
	<OnboardingWelcome onNext={goToNext} />
{:else if step === 1}
	<OnboardingCharacterSelect
		onBack={goToBack}
		onNext={handleComplete}
		bind:selectedCharacter
		bind:characterName
	/>
{/if}
