<script lang="ts">
	import { getContext } from 'svelte';
	import type { NewQuestContext } from '.';

	const ctx = getContext<NewQuestContext>('new-quest-context');
</script>

{#if ctx.open}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
		<div class="text-white">
			<h1 class="text-4xl font-bold">New Quest</h1>
		</div>
	</div>
{/if}
