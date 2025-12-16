<script lang="ts">
	import type { PlayerBuilding } from '$lib/types';
	import { VIEW_BOX_WIDTH, VIEW_BOX_HEIGHT } from './constants';
	import { SpriteAnimator } from '$lib/components/app/sprite-animator/sprite-animator.svelte';
	import SpriteAnimatorRenderer from '$lib/components/app/sprite-animator/sprite-animator-renderer.svelte';

	interface Props {
		playerBuilding: PlayerBuilding;
		x: number;
		y: number;
		angle?: number;
	}

	let { playerBuilding, x, y, angle = 0 }: Props = $props();

	let animator = $state<SpriteAnimator | undefined>(undefined);

	// idle 상태의 건물 스프라이트 가져오기
	const idleState = $derived(
		playerBuilding.building.building_states.find((s) => s.type === 'idle')
	);

	// 위치를 퍼센트로 변환
	const left = $derived(`${(x / VIEW_BOX_WIDTH) * 100}%`);
	const top = $derived(`${(y / VIEW_BOX_HEIGHT) * 100}%`);
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
			newAnimator.play({ name: 'idle', loop: idleState?.loop ?? 'loop' });
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
