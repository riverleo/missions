<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { NewQuest } from '.';

	const { Story } = defineMeta({
		title: 'Components/Quest/NewQuest',
		component: NewQuest,
		tags: ['autodocs'],
	});
</script>

<Story name="Default">
	<div class="p-8">
		<p class="mb-4">버튼을 클릭하여 오버레이를 여세요</p>
		<NewQuest />
	</div>
</Story>
