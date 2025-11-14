<script lang="ts">
	import { getContext } from 'svelte';
	import type { NewQuestContext } from '.';
	import { Button } from '../ui/button';
	import { Kbd } from '../ui/kbd';

	const ctx = getContext<NewQuestContext>('new-quest-context');

	function handleClick() {
		ctx.open = true;
	}
</script>

<Button size="sm" variant="outline" class="px-2 text-xs" data-shortcut="q" onclick={handleClick}>
	새로운 퀘스트
	<Kbd>Q</Kbd>
</Button>
