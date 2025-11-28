<script lang="ts">
	import { onMount } from 'svelte';
	import Landing from '$lib/components/misc/LandingClaude.svelte';
	import { SpriteAnimator } from '$lib/components/app/sprite-animator/sprite-animator.svelte';
	import SpriteAnimatorRenderer from '$lib/components/app/sprite-animator/sprite-animator-renderer.svelte';
	import { Button } from '$lib/components/ui/button';
	import type { LoopMode } from '$lib/components/app/sprite-animator';

	let testAnimator: SpriteAnimator | undefined = $state();
	let selectedLoop = $state<LoopMode>('loop');
	let resolution = $state<1 | 2 | 3>(1);

	onMount(async () => {
		testAnimator = await SpriteAnimator.create('test');
		testAnimator.init({ name: 'idle', from: 1, to: 5 });
	});
</script>

<Landing />

{#if testAnimator}
	<div>..  
		<div style="margin-bottom: 10px;">
			<label>
				Loop Mode:
				<select bind:value={selectedLoop}>
					<option value="loop">loop</option>
					<option value="once">once</option>
					<option value="ping-pong">ping-pong</option>
					<option value="ping-pong-once">ping-pong-once</option>
				</select>
			</label>
		</div>
		<div style="margin-bottom: 10px;">
			<label>
				Resolution:
				<select bind:value={resolution}>
					<option value={1}>1x</option>
					<option value={2}>2x (Retina)</option>
					<option value={3}>3x</option>
				</select>
			</label>
		</div>
		<div style="margin-bottom: 10px;">
			<Button onclick={() => testAnimator!.play({ name: 'idle', loop: selectedLoop })}>
				Play
			</Button>
			<Button onclick={() => testAnimator!.stop()}>Stop</Button>
		</div>
		<SpriteAnimatorRenderer animator={testAnimator} {resolution} />
	</div>
{/if}
