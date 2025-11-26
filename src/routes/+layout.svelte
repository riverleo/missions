<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { onkeydown, onkeyup, onmousedown, onmouseup, onmouseover } from '$lib/shortcut/events';

	const { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<svelte:window {onkeydown} {onkeyup} {onmousedown} {onmouseup} {onmouseover} />

{@render children()}
