<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { NewQuestTrigger, NewQuest } from '.';

	const { Story } = defineMeta({
		title: 'Components/Quest/NewQuest',
		tags: ['autodocs'],
	});
</script>

<Story name="Default">
	<div class="min-h-screen bg-linear-to-br from-blue-500 via-purple-500 to-pink-500 p-8">
		<div class="space-y-6">
			<h1 class="text-4xl font-bold text-white">미션 대시보드</h1>
			<div class="grid grid-cols-3 gap-4">
				{#each Array(9) as _, i}
					<div class="rounded-lg bg-white p-6 shadow-lg">
						<h3 class="mb-2 text-xl font-bold">카드 {i + 1}</h3>
						<p class="text-gray-600">
							블러 효과를 확인하기 위한 샘플 컨텐츠입니다. 배경이 흐릿하게 처리되는지 확인하세요.
						</p>
					</div>
				{/each}
			</div>
			<div class="mt-8">
				<NewQuestTrigger />
			</div>
		</div>
	</div>
	<NewQuest />
</Story>
