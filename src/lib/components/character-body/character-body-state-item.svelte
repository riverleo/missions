<script lang="ts">
	import { useCharacter } from '$lib/hooks';
	import type {
		CharacterBodyStateType,
		CharacterBodyId,
		CharacterBodyState,
		LoopType,
	} from '$lib/types';
	import SpriteStateItem, {
		type SpriteStateChange,
	} from '$lib/components/sprite-state-item.svelte';
	import { SpriteAnimator } from '$lib/components/app/sprite-animator/sprite-animator.svelte';
	import SpriteAnimatorRenderer from '$lib/components/app/sprite-animator/sprite-animator-renderer.svelte';
	import { atlases } from '$lib/components/app/sprite-animator';
	import { getCharacterBodyStateString } from '$lib/utils/label';

	interface Props {
		bodyId: CharacterBodyId;
		type: CharacterBodyStateType;
	}

	let { bodyId, type }: Props = $props();

	const { characterBodyStore, characterBodyStateStore, admin } = useCharacter();
	const { characterUiStore } = admin;

	const body = $derived($characterBodyStore.data[bodyId]);
	const bodyStates = $derived($characterBodyStateStore.data[bodyId] ?? []);
	const bodyState = $derived(bodyStates.find((s: CharacterBodyState) => s.type === type));

	let animator = $state<SpriteAnimator | undefined>(undefined);

	$effect(() => {
		const atlasName = bodyState?.atlas_name;
		if (!atlasName) return;

		SpriteAnimator.create(atlasName).then((newAnimator) => {
			animator?.stop();
			newAnimator.init({
				name: bodyState.type,
				from: bodyState.frame_from ?? undefined,
				to: bodyState.frame_to ?? undefined,
				fps: bodyState.fps ?? undefined,
			});
			newAnimator.play({
				name: bodyState.type,
				loop: (bodyState.loop as LoopType) ?? 'loop',
			});
			animator = newAnimator;
		});

		return () => {
			animator?.stop();
		};
	});

	async function onchange(change: SpriteStateChange) {
		if (bodyState) {
			await admin.updateCharacterBodyState(bodyState.id, bodyId, change);
		} else if (change.atlas_name) {
			await admin.createCharacterBodyState(bodyId, {
				type,
				atlas_name: change.atlas_name,
			});
		}

		// body의 width/height가 0이면 atlas frame 크기로 설정
		if (change.atlas_name && body && body.collider_width === 0 && body.collider_height === 0) {
			const metadata = atlases[change.atlas_name];
			if (metadata) {
				await admin.updateCharacterBody(bodyId, {
					collider_width: metadata.frameWidth / 2,
					collider_height: metadata.frameHeight / 2,
				});
			}
		}
	}

	async function ondelete() {
		if (bodyState) {
			await admin.removeCharacterBodyState(bodyState.id, bodyId);
		}
	}

</script>

<SpriteStateItem
	{type}
	label={getCharacterBodyStateString(type)}
	spriteState={bodyState}
	{onchange}
	{ondelete}
>
	{#snippet preview()}
		{#if animator}
			<div style:transform="scale({body?.scale ?? 1})">
				<SpriteAnimatorRenderer {animator} resolution={2} />
			</div>
		{/if}
	{/snippet}
	{#snippet collider()}
		{#if $characterUiStore.showBodyPreview && body && (body.collider_width > 0 || body.collider_height > 0)}
			<svg
				width={body.collider_width}
				height={body.collider_height}
				style="transform: translate({-body.collider_offset_x}px, {-body.collider_offset_y}px);"
			>
				{#if body.collider_type === 'circle'}
					<circle
						cx={body.collider_width / 2}
						cy={body.collider_height / 2}
						r={body.collider_width / 2}
						fill="rgba(0, 255, 0, 0.5)"
					/>
				{:else}
					<rect
						width={body.collider_width}
						height={body.collider_height}
						fill="rgba(0, 255, 0, 0.5)"
					/>
				{/if}
			</svg>
		{/if}
	{/snippet}
</SpriteStateItem>
