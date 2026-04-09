<script lang="ts">
	import CharacterBodyAside from '$lib/components/character-body/character-body-aside.svelte';

	let { children } = $props();
</script>

<div class="relative h-full">
	<CharacterBodyAside />
	{@render children()}
</div>
