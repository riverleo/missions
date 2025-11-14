<script lang="ts">
	import { shortcut } from '@svelte-put/shortcut';
	import { fade } from 'svelte/transition';
	import { open, toggleOpen } from './store';
</script>

<svelte:window use:shortcut={{ trigger: { key: 'Escape', callback: toggleOpen } }} />

{#if $open}
	<div
		transition:fade={{ duration: 100 }}
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md"
	>
		<div class="text-white">
			<h1 class="text-4xl font-bold">New Quest</h1>
		</div>
	</div>
{/if}
