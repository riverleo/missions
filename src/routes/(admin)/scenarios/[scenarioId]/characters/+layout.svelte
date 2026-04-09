<script lang="ts">
	import CharacterAside from '$lib/components/character/character-aside.svelte';

	let { children } = $props();
</script>

<div class="relative h-full">
	<CharacterAside />
	{@render children()}
</div>
