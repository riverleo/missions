<script lang="ts">
	import OnboardingWelcome from './OnboardingWelcome.svelte';
	import OnboardingMissionStage from './OnboardingMissionStage.svelte';
	import OnboardingCharacterSelect from './OnboardingCharacterSelect.svelte';
	import OnboardingMissionInput from './OnboardingMissionInput.svelte';
	import { wasLoggedIn } from '$lib/stores';

	let step = $state(0);

	function goToNext() {
		step += 1;
	}

	function goToBack() {
		step -= 1;
	}

	function handleComplete() {
		// 온보딩 완료 - 로그인 상태로 변경
		wasLoggedIn.set(true);
	}
</script>

{#if step === 0}
	<OnboardingWelcome onNext={goToNext} />
{:else if step === 1}
	<OnboardingMissionStage onBack={goToBack} onNext={goToNext} />
{:else if step === 2}
	<OnboardingCharacterSelect onBack={goToBack} onNext={goToNext} />
{:else if step === 3}
	<OnboardingMissionInput onBack={goToBack} onComplete={handleComplete} />
{/if}
