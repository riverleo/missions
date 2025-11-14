<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Kbd } from '$lib/components/ui/kbd';
	import { shortcut } from '@svelte-put/shortcut';
	import { open, toggleOpen } from './store';
</script>

<svelte:window use:shortcut={{ trigger: { key: 'KeyQ', modifier: false, callback: toggleOpen } }} />

<Button size="sm" variant="outline" class="px-2 text-xs" data-shortcut="q" onclick={toggleOpen}>
	새로운 퀘스트
	<Kbd>Q</Kbd>
</Button>
