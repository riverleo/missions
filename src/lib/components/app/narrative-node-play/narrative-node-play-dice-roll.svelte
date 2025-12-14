<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { useNarrative } from '$lib/hooks/use-narrative';
	import { bindStackEvent, activateStack, type StackId } from '$lib/shortcut/store';
	import { isEnterOrSpace } from '$lib/shortcut/utils';

	const stackId: StackId = 'dice-roll';

	const { play } = useNarrative();
	const playStore = play.store;

	onMount(() => {
		const cleanupStack = activateStack(stackId);
		const cleanupEvent = bindStackEvent({
			id: stackId,
			onkeyup: (event: KeyboardEvent) => {
				if (!isEnterOrSpace(event)) return;

				if ($playStore.playerRolledDice !== undefined) play.next();
				else play.roll();
			},
		});

		return () => {
			cleanupEvent();
			cleanupStack();
		};
	});
</script>

<div
	class="fixed top-0 left-0 z-10 flex min-h-dvh w-full flex-col items-center justify-center gap-8 bg-black/50 text-white"
>
	{#if $playStore.playerRolledDice !== undefined}
		<!-- 결과 표시 -->
		<div class="text-8xl font-bold">{$playStore.playerRolledDice.value}</div>
		<div>최소 눈금: {$playStore.narrativeDiceRoll?.difficulty_class}</div>

		<Button
			onclick={() => play.next()}
			data-shortcut-key="Space Enter"
			data-shortcut-effect="bounce"
			data-shortcut-stack={stackId}
		>
			계속 진행하기
		</Button>
	{:else}
		<!-- 주사위 애니메이션 -->
		<div class="dice-sprite"></div>

		<Button
			onclick={() => play.roll()}
			variant="ghost"
			data-shortcut-key="Space Enter"
			data-shortcut-effect="bounce"
			data-shortcut-stack={stackId}
		>
			주사위 굴리기
		</Button>
	{/if}
</div>

<style>
	.dice-sprite {
		width: 168px;
		height: 171px;
		background-image: url('/dice-roll-sprite-sheet.png');
		background-size: 840px 855px; /* 5x5 그리드 */
		animation: dice-shake 1s steps(20) infinite;
	}

	/* Shake 애니메이션 (0-19 프레임) */
	@keyframes dice-shake {
		0% {
			background-position: 0 0;
		}
		100% {
			background-position: -3360px 0; /* 20프레임 * 168px */
		}
	}

	@keyframes dice-throw {
		0% {
			background-position: 0 -684px; /* 4번째 줄 시작 */
		}
		100% {
			background-position: -840px -684px; /* 5프레임 * 168px */
		}
	}
</style>
