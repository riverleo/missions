<script lang="ts">
	import { onMount } from 'svelte';
	import Landing from '$lib/components/misc/LandingClaude.svelte';
	import { SpriteAnimator } from '$lib/components/app/sprite-animator/sprite-animator.svelte';
	import SpriteAnimatorRenderer from '$lib/components/app/sprite-animator/sprite-animator-renderer.svelte';
	import { Button } from '$lib/components/ui/button';
	import type { LoopMode } from '$lib/components/app/sprite-animator';

	let testAnimator: SpriteAnimator | undefined = $state();
	let selectedLoop = $state<LoopMode>('loop');

	onMount(async () => {
		testAnimator = await SpriteAnimator.create('test');
		testAnimator.init({ name: 'idle', from: 1, to: 5, fps: 8 });
	});
</script>

<Landing />

{#if testAnimator}
	<div
		style="position: fixed; top: 20px; right: 20px; border: 2px solid red; padding: 10px; background: white;"
	>
		<div style="margin-bottom: 10px;">
			<select bind:value={selectedLoop}>
				<option value="loop">loop</option>
				<option value="once">once</option>
				<option value="ping-pong">ping-pong</option>
				<option value="ping-pong-once">ping-pong-once</option>
			</select>
		</div>
		<div style="margin-bottom: 10px;">
			<Button onclick={() => testAnimator!.play({ name: 'idle', loop: selectedLoop })}>
				Play
			</Button>
			<Button onclick={() => testAnimator!.stop()}>Stop</Button>
		</div>
		<SpriteAnimatorRenderer spriteAnimator={testAnimator} />
	</div>
{/if}
