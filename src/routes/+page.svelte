<script lang="ts">
	import Button from "$lib/components/ui/button/button.svelte";
	import { toggleMode } from 'mode-watcher';
	import DndExample from '$lib/components/dnd-example.svelte';
</script>

<div class="flex flex-col gap-4 p-8">
	<h1 class="text-4xl font-bold">Welcome to SvelteKit</h1>
	<p>Visit <a href="https://svelte.dev/docs/kit" class="text-primary underline">svelte.dev/docs/kit</a> to read the documentation</p>

	<div class="flex gap-4">
		<Button variant="outline">Button</Button>
		<Button href="#" onclick={toggleMode}>다크 모드 토글</Button>
	</div>

	<div class="mt-8 border-t pt-8">
		<DndExample />
	</div>
</div>