<script lang="ts">
	import { wasLoggedIn } from '$lib/stores';
	import Landing from '$lib/components/LandingClaude.svelte';
	import SpriteAnimationDemo from '$lib/components/sprite-animation-demo.svelte';
</script>

{#if $wasLoggedIn}
	<div class="flex min-h-screen items-center justify-center"></div>
{:else}
	<SpriteAnimationDemo />
	<Landing />
{/if}
