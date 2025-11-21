<script lang="ts">
	import { debounce } from 'radash';
	import { Button } from '$lib/components/ui/button';
	import { current, diceRolled, roll } from './store';
	import { next } from '$lib/components/dialog-node/store';
	import { register } from '$lib/shortcut/layers';

	const onkeyup = debounce({ delay: 100 }, (event: KeyboardEvent) => {
		if ($current === undefined || $current.silent) return;

		if (event.code === 'Enter' || event.code === 'Space') {
			if ($diceRolled) next();
			else roll();
		}
	});

	register({ id: 'dice-roll', onkeyup });
</script>

{#if $current && !$current.silent}
	<div
		class="fixed top-0 left-0 z-10 flex min-h-dvh w-full flex-col items-center justify-center bg-black/50 text-white"
	>
		{#if $diceRolled}
			<div>최소 눈금: {$diceRolled.diceRoll.difficultyClass}</div>
			<div>주사위 결과: {$diceRolled.value}</div>

			<Button onclick={() => next()}>계속 진행하기</Button>
		{:else}
			<Button onclick={() => roll()} variant="ghost">주사위 굴리기</Button>
		{/if}
	</div>
{/if}
