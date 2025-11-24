<script lang="ts">
	import { iris } from '$lib/effects/iris';
	import { open } from './store';
	import NewQuestStarfield from '$lib/components/app/quest/new-quest-starfield.svelte';
	import NewQuestItem from './new-quest-item.svelte';

	function handleKeydown(e: KeyboardEvent) {
		if ($open && e.code === 'Escape') $open = false;
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if $open}
	<div
		transition:iris={{ duration: 200 }}
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-md"
	>
		<NewQuestStarfield />

		<div class="relative z-10 flex flex-col gap-4">
			<NewQuestItem
				title="불타는 결의"
				description="연속 7일 출석하여 불굴의 의지를 증명하라"
				delay={0}
			/>
			<NewQuestItem
				title="어둠의 유혹"
				description="밤 12시 이후 접속을 3일간 참아내라"
				delay={100}
			/>
			<NewQuestItem
				title="방어의 기술"
				description="미루기 습관을 5회 막아내고 즉시 실행하라"
				delay={200}
			/>
			<NewQuestItem
				title="작은 기적"
				description="매일 10분씩 새로운 것을 배워 변화를 만들어라"
				delay={300}
			/>
		</div>
	</div>
{/if}
