<script lang="ts">
	import type { CharacterStateType } from '$lib/types';
	import { Item, ItemContent, ItemTitle, ItemHeader } from '$lib/components/ui/item';
	import { ButtonGroup, ButtonGroupText } from '$lib/components/ui/button-group';
	import {
		DropdownMenu,
		DropdownMenuTrigger,
		DropdownMenuContent,
		DropdownMenuRadioGroup,
		DropdownMenuRadioItem,
	} from '$lib/components/ui/dropdown-menu';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { AspectRatio } from '$lib/components/ui/aspect-ratio';
	import { atlases } from '$lib/components/app/sprite-animator';
	import { SpriteAnimator } from '$lib/components/app/sprite-animator/sprite-animator.svelte';
	import SpriteAnimatorRenderer from '$lib/components/app/sprite-animator/sprite-animator-renderer.svelte';
	import ItemFooter from '$lib/components/ui/item/item-footer.svelte';
	import { IconBodyScan, IconClock, IconTrash } from '@tabler/icons-svelte';
	import { useCharacter } from '$lib/hooks/use-character';
	import { Button } from '$lib/components/ui/button';

	interface Props {
		characterId: string;
		type: CharacterStateType;
	}

	let { characterId, type }: Props = $props();

	const { store, admin } = useCharacter();
	const atlasNames = Object.keys(atlases);
	const fpsOptions = [8, 16, 24, 30, 60];

	let animator = $state<SpriteAnimator | undefined>(undefined);

	const character = $derived($store.data[characterId]);
	const characterState = $derived(character?.character_states.find((s) => s.type === type));

	function getFrameCount(atlasName: string | undefined) {
		if (!atlasName) return 0;
		return atlases[atlasName]?.frameCount ?? 0;
	}

	function range(count: number) {
		return Array.from({ length: count }, (_, i) => i + 1);
	}

	// atlas_name이 변경되면 animator 재생성
	$effect(() => {
		const atlasName = characterState?.atlas_name;
		if (!atlasName) {
			animator?.stop();
			animator = undefined;
			return;
		}

		SpriteAnimator.create(atlasName).then((newAnimator) => {
			animator?.stop();
			newAnimator.init({
				name: type,
				from: characterState?.frame_from ?? undefined,
				to: characterState?.frame_to ?? undefined,
				fps: characterState?.fps ?? undefined,
			});
			newAnimator.play({ name: type, loop: 'loop' });
			animator = newAnimator;
		});

		return () => {
			animator?.stop();
		};
	});

	// frame_from, frame_to, fps가 변경되면 애니메이션 재시작
	$effect(() => {
		const frameFrom = characterState?.frame_from;
		const frameTo = characterState?.frame_to;
		const fps = characterState?.fps;

		if (animator && characterState?.atlas_name) {
			animator.init({
				name: type,
				from: frameFrom ?? undefined,
				to: frameTo ?? undefined,
				fps: fps ?? undefined,
			});
			animator.play({ name: type, loop: 'loop' });
		}
	});

	async function onAtlasChange(atlasName: string) {
		if (characterState) {
			await admin.updateCharacterState(characterState.id, characterId, { atlas_name: atlasName });
		} else {
			await admin.createCharacterState(characterId, { type, atlas_name: atlasName });
		}
	}

	async function onFrameFromChange(value: string) {
		if (characterState) {
			await admin.updateCharacterState(characterState.id, characterId, {
				frame_from: parseInt(value),
			});
		}
	}

	async function onFrameToChange(value: string) {
		if (characterState) {
			await admin.updateCharacterState(characterState.id, characterId, {
				frame_to: parseInt(value),
			});
		}
	}

	async function onFpsChange(value: string) {
		if (characterState) {
			await admin.updateCharacterState(characterState.id, characterId, {
				fps: parseInt(value),
			});
		}
	}

	async function onDelete() {
		if (characterState) {
			await admin.removeCharacterState(characterState.id, characterId);
		}
	}
</script>

<Item variant="muted">
	<ItemHeader>
		<ItemTitle class="uppercase">{type}</ItemTitle>
	</ItemHeader>
	<ItemContent class="w-full">
		<AspectRatio ratio={4 / 3}>
			{#if animator}
				<div class="flex h-full w-full items-center justify-center overflow-hidden">
					<SpriteAnimatorRenderer {animator} resolution={2} />
				</div>
			{:else}
				<Skeleton class="h-full w-full" />
			{/if}
		</AspectRatio>
	</ItemContent>
	<ItemFooter>
		<ButtonGroup>
			<DropdownMenu>
				<DropdownMenuTrigger>
					{#snippet child({ props })}
						<Button variant="outline" size="sm" class="w-16" {...props}>
							{characterState?.atlas_name ?? '선택'}
						</Button>
					{/snippet}
				</DropdownMenuTrigger>
				<DropdownMenuContent>
					<DropdownMenuRadioGroup
						value={characterState?.atlas_name ?? ''}
						onValueChange={onAtlasChange}
					>
						{#each atlasNames as name (name)}
							<DropdownMenuRadioItem value={name}>{name}</DropdownMenuRadioItem>
						{/each}
					</DropdownMenuRadioGroup>
				</DropdownMenuContent>
			</DropdownMenu>
			<DropdownMenu>
				<DropdownMenuTrigger disabled={!characterState}>
					{#snippet child({ props })}
						<Button variant="outline" size="sm" class="w-12" disabled={!characterState} {...props}>
							{characterState?.frame_from ?? '시작'}
						</Button>
					{/snippet}
				</DropdownMenuTrigger>
				<DropdownMenuContent>
					<DropdownMenuRadioGroup
						value={characterState?.frame_from?.toString() ?? ''}
						onValueChange={onFrameFromChange}
					>
						{#each range(getFrameCount(characterState?.atlas_name)) as frame (frame)}
							<DropdownMenuRadioItem value={frame.toString()}>{frame}</DropdownMenuRadioItem>
						{/each}
					</DropdownMenuRadioGroup>
				</DropdownMenuContent>
			</DropdownMenu>
			<DropdownMenu>
				<DropdownMenuTrigger disabled={!characterState}>
					{#snippet child({ props })}
						<Button variant="outline" size="sm" class="w-12" disabled={!characterState} {...props}>
							{characterState?.frame_to ?? '종료'}
						</Button>
					{/snippet}
				</DropdownMenuTrigger>
				<DropdownMenuContent>
					<DropdownMenuRadioGroup
						value={characterState?.frame_to?.toString() ?? ''}
						onValueChange={onFrameToChange}
					>
						{#each range(getFrameCount(characterState?.atlas_name)) as frame (frame)}
							<DropdownMenuRadioItem value={frame.toString()}>{frame}</DropdownMenuRadioItem>
						{/each}
					</DropdownMenuRadioGroup>
				</DropdownMenuContent>
			</DropdownMenu>
			<DropdownMenu>
				<DropdownMenuTrigger disabled={!characterState}>
					{#snippet child({ props })}
						<Button variant="outline" size="sm" class="w-20" disabled={!characterState} {...props}>
							{characterState?.fps ? `${characterState.fps} 프레임` : 'FPS'}
						</Button>
					{/snippet}
				</DropdownMenuTrigger>
				<DropdownMenuContent>
					<DropdownMenuRadioGroup
						value={characterState?.fps?.toString() ?? ''}
						onValueChange={onFpsChange}
					>
						{#each fpsOptions as fps (fps)}
							<DropdownMenuRadioItem value={fps.toString()}>{fps} 프레임</DropdownMenuRadioItem>
						{/each}
					</DropdownMenuRadioGroup>
				</DropdownMenuContent>
			</DropdownMenu>
		</ButtonGroup>
		<ButtonGroup>
			<Button variant="outline" size="icon-sm" disabled={!characterState} onclick={onDelete}>
				<IconTrash />
			</Button>
		</ButtonGroup>
	</ItemFooter>
</Item>
