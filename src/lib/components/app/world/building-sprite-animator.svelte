<script lang="ts">
	import type { WorldBuilding } from '$lib/types';
	import { SpriteAnimator } from '$lib/components/app/sprite-animator/sprite-animator.svelte';
	import SpriteAnimatorRenderer from '$lib/components/app/sprite-animator/sprite-animator-renderer.svelte';
	import { useWorld } from '$lib/hooks/use-world.svelte';
	import { useBuilding } from '$lib/hooks/use-building';

	interface Props {
		worldBuilding: WorldBuilding;
	}

	let { worldBuilding }: Props = $props();

	const world = useWorld();
	const { store: buildingStore, stateStore: buildingStateStore } = useBuilding();

	let animator = $state<SpriteAnimator | undefined>(undefined);

	// 물리 바디에서 위치 가져오기
	const body = $derived(world.buildingBodies[worldBuilding.id]);
	const x = $derived(body?.position.x ?? 0);
	const y = $derived(body?.position.y ?? 0);
	const angle = $derived(body?.position.angle ?? 0);

	// 건물 -> 건물 상태 조회
	const building = $derived($buildingStore.data[worldBuilding.building_id]);
	const buildingStates = $derived(building ? ($buildingStateStore.data[building.id] ?? []) : []);
	const idleState = $derived(buildingStates.find((s) => s.type === 'idle'));

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
