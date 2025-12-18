<script lang="ts">
	import type { WorldCharacter } from '$lib/types';
	import { SpriteAnimator } from '$lib/components/app/sprite-animator/sprite-animator.svelte';
	import SpriteAnimatorRenderer from '$lib/components/app/sprite-animator/sprite-animator-renderer.svelte';
	import { useWorld } from '$lib/hooks/use-world.svelte';

	interface Props {
		worldCharacter: WorldCharacter;
		x: number;
		y: number;
		angle?: number;
	}

	let { worldCharacter, x, y, angle = 0 }: Props = $props();

	const world = useWorld();

	let animator = $state<SpriteAnimator | undefined>(undefined);

	// idle 상태의 캐릭터 스프라이트 가져오기
	const idleState = $derived(
		worldCharacter.character.character_states.find((s) => s.type === 'idle')
	);

	// 월드 좌표를 퍼센트로 변환 (부모 월드 레이어 기준)
	const left = $derived(`${(x / world.terrainBody.width) * 100}%`);
	const top = $derived(`${(y / world.terrainBody.height) * 100}%`);
	const rotation = $derived(`${angle}rad`);

	// idleState가 변경되면 animator 생성
	$effect(() => {
		const atlasName = idleState?.atlas_name;
		const frameFrom = idleState?.frame_from;
		const frameTo = idleState?.frame_to;
		const fps = idleState?.fps;
		const loop = idleState?.loop;

		if (!atlasName) {
			animator?.stop();
			animator = undefined;
			return;
		}

		SpriteAnimator.create(atlasName).then((newAnimator) => {
			animator?.stop();
			newAnimator.init({
				name: 'idle',
				from: frameFrom ?? undefined,
				to: frameTo ?? undefined,
				fps: fps ?? undefined,
			});
			newAnimator.play({ name: 'idle', loop: loop ?? 'loop' });
			animator = newAnimator;
		});

		return () => {
			animator?.stop();
		};
	});
</script>

<div
	class="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
	style="left: {left}; top: {top}; rotate: {rotation};"
>
	{#if animator}
		<SpriteAnimatorRenderer {animator} resolution={2} />
	{/if}
</div>
