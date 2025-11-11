<script lang="ts">
	import OnboardingWelcome from './OnboardingWelcome.svelte';
	import OnboardingMissionStage from './OnboardingMissionStage.svelte';
	import OnboardingCharacterSelect from './OnboardingCharacterSelect.svelte';
	import OnboardingMissionInput from './OnboardingMissionInput.svelte';
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
	<OnboardingMissionStage onBack={goToBack} onNext={goToNext} />
{:else if step === 2}
	<OnboardingCharacterSelect
		onBack={goToBack}
		onNext={goToNext}
		bind:selectedCharacter
		bind:characterName
	/>
{:else if step === 3}
	<OnboardingMissionInput onBack={goToBack} onComplete={handleComplete} bind:mission />
{/if}
