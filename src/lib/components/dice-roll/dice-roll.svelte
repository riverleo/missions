<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { diceRoll, diceRolled, roll, clear } from './store';
</script>

{#if $diceRoll && !$diceRoll.silent}
	<div
		class="fixed top-0 left-0 z-10 flex min-h-dvh w-full flex-col items-center justify-center bg-black/50 text-white"
	>
		{#if $diceRolled}
			<div>주사위 결과: {$diceRolled.rolled}</div>
			<div>행동 결과: {$diceRolled.success}</div>

			<Button onclick={clear}>계속 진행하기</Button>
		{:else}
			<Button onclick={() => roll()} variant="outline">주사위 굴리기</Button>
		{/if}
	</div>
{/if}
