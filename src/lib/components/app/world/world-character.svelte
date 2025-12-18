<script lang="ts">
	import type { WorldCharacter } from '$lib/types';
	import { SpriteAnimator } from '$lib/components/app/sprite-animator/sprite-animator.svelte';
	import SpriteAnimatorRenderer from '$lib/components/app/sprite-animator/sprite-animator-renderer.svelte';

	interface Props {
		worldCharacter: WorldCharacter;
		x: number;
		y: number;
		angle?: number;
		worldWidth: number;
		worldHeight: number;
	}

	let { worldCharacter, x, y, angle = 0, worldWidth, worldHeight }: Props = $props();

	let animator = $state<SpriteAnimator | undefined>(undefined);

	// idle 상태의 캐릭터 스프라이트 가져오기
	const idleState = $derived(
		worldCharacter.character.character_states.find((s) => s.type === 'idle')
	);

	// 월드 좌표를 퍼센트로 변환 (부모 월드 레이어 기준)
	const left = $derived(`${(x / worldWidth) * 100}%`);
	const top = $derived(`${(y / worldHeight) * 100}%`);
	const rotation = $derived(`${angle}rad`);

	// atlas_name이 변경되면 animator 생성
	$effect(() => {
		const atlasName = idleState?.atlas_name;
		if (!atlasName) {
			animator?.stop();
			animator = undefined;
			return;
		}

		SpriteAnimator.create(atlasName).then((newAnimator) => {
			animator?.stop();
			newAnimator.init({
				name: 'idle',
				from: idleState?.frame_from ?? undefined,
				to: idleState?.frame_to ?? undefined,
				fps: idleState?.fps ?? undefined,
			});
			newAnimator.play({ name: 'idle', loop: 'loop' });
			animator = newAnimator;
		});

		return () => {
			animator?.stop();
		};
	});
</script>

<div
	class="pointer-events-none absolute -translate-x-1/2 -translate-y-full"
	style="left: {left}; top: {top}; rotate: {rotation};"
>
	{#if animator}
		<SpriteAnimatorRenderer {animator} resolution={2} />
	{/if}
</div>
