<script lang="ts">
	import CharacterInteractionAside from '$lib/components/admin/character-interaction/character-interaction-aside.svelte';

	let { children } = $props();
</script>

<div class="relative h-full">
	<CharacterInteractionAside />
	{@render children()}
</div>
