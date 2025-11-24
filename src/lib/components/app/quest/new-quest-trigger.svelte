<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Kbd } from '$lib/components/ui/kbd';
	import { toggleOpen } from './store';
</script>

<Button
	size="sm"
	variant="outline"
	class="px-2 text-xs"
	data-keybinding="new-quest-toggle"
	onclick={toggleOpen}
>
	새로운 퀘스트
	<Kbd>Q</Kbd>
</Button>
