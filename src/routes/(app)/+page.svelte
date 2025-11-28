<script lang="ts">
	import { onMount } from 'svelte';
	import Landing from '$lib/components/misc/LandingClaude.svelte';
	import { SpriteAnimator } from '$lib/components/app/sprite-animator/sprite-animator.svelte';
	import SpriteAnimatorRenderer from '$lib/components/app/sprite-animator/sprite-animator-renderer.svelte';
	import { Button } from '$lib/components/ui/button';

	let testAnimator: SpriteAnimator | undefined = $state();

	onMount(async () => {
		testAnimator = await SpriteAnimator.create('test');
		testAnimator.init({ name: 'idle', from: 1, to: 5, fps: 8 });
	});
</script>

<Landing />

{#if testAnimator}
	<div style="position: fixed; top: 20px; right: 20px; border: 2px solid red;">
		<Button onclick={() => testAnimator!.play({ name: 'idle', loop: 'loop' })}>Play</Button>
		<Button onclick={() => testAnimator!.stop()}>Stop</Button>
		<SpriteAnimatorRenderer spriteAnimator={testAnimator} />
	</div>
{/if}
