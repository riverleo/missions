<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Kbd } from '$lib/components/ui/kbd';
	import { toggleOpen } from './store';

	function handleKeydown(e: KeyboardEvent) {
		if (e.code === 'KeyQ') toggleOpen();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<Button size="sm" variant="outline" class="px-2 text-xs" data-shortcut="KeyQ" onclick={toggleOpen}>
	새로운 퀘스트
	<Kbd>Q</Kbd>
</Button>
