<script lang="ts">
	import type { CharacterStateType, LoopMode } from '$lib/types';
	import { Item, ItemContent, ItemTitle, ItemHeader } from '$lib/components/ui/item';
	import {
		DropdownMenu,
		DropdownMenuTrigger,
		DropdownMenuContent,
		DropdownMenuRadioGroup,
		DropdownMenuRadioItem,
		DropdownMenuSub,
		DropdownMenuSubTrigger,
		DropdownMenuSubContent,
		DropdownMenuItem,
		DropdownMenuSeparator,
	} from '$lib/components/ui/dropdown-menu';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { AspectRatio } from '$lib/components/ui/aspect-ratio';
	import { atlases, DEFAULT_FPS, DEFAULT_FRAME_FROM } from '$lib/components/app/sprite-animator';
	import { SpriteAnimator } from '$lib/components/app/sprite-animator/sprite-animator.svelte';
	import SpriteAnimatorRenderer from '$lib/components/app/sprite-animator/sprite-animator-renderer.svelte';
	import ItemFooter from '$lib/components/ui/item/item-footer.svelte';
	import { IconAdjustmentsHorizontal } from '@tabler/icons-svelte';
	import { useCharacter } from '$lib/hooks/use-character';
	import { DEBUG_CHARACTER_FILL_STYLE } from '$lib/components/app/world/constants';
	import { Button } from '$lib/components/ui/button';

	interface Props {
		characterId: string;
		type: CharacterStateType;
	}

	let { characterId, type }: Props = $props();

	const { store, admin } = useCharacter();
	const { uiStore } = admin;
	const atlasNames = Object.keys(atlases);
	const fpsOptions = [8, 16, 24, 30, 60];
	const loopOptions: { value: LoopMode; label: string }[] = [
		{ value: 'loop', label: '반복' },
		{ value: 'once', label: '1회' },
		{ value: 'ping-pong', label: '핑퐁' },
		{ value: 'ping-pong-once', label: '핑퐁 1회' },
	];

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
			newAnimator.play({ name: type, loop: characterState?.loop ?? 'loop' });
			animator = newAnimator;
		});

		return () => {
			animator?.stop();
		};
	});

	// frame_from, frame_to, fps, loop이 변경되면 애니메이션 재시작
	$effect(() => {
		const frameFrom = characterState?.frame_from;
		const frameTo = characterState?.frame_to;
		const fps = characterState?.fps;
		const loop = characterState?.loop;

		if (animator && characterState?.atlas_name) {
			animator.init({
				name: type,
				from: frameFrom ?? undefined,
				to: frameTo ?? undefined,
				fps: fps ?? undefined,
			});
			animator.play({ name: type, loop: loop ?? 'loop' });
		}
	});

	async function onAtlasChange(atlasName: string) {
		if (characterState) {
			await admin.updateCharacterState(characterState.id, characterId, { atlas_name: atlasName });
		} else {
			await admin.createCharacterState(characterId, { type, atlas_name: atlasName });
		}

		// 캐릭터의 width/height가 0이면 atlas frame 크기로 설정
		if (character && character.width === 0 && character.height === 0) {
			const metadata = atlases[atlasName];
			if (metadata) {
				await admin.update(characterId, {
					width: metadata.frameWidth / 2,
					height: metadata.frameHeight / 2,
				});
			}
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

	async function onLoopChange(value: string) {
		if (characterState) {
			await admin.updateCharacterState(characterState.id, characterId, {
				loop: value as LoopMode,
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
				<div class="relative flex h-full w-full items-center justify-center overflow-hidden">
					<SpriteAnimatorRenderer {animator} resolution={2} />
					{#if $uiStore.showBodyPreview && character && (character.width > 0 || character.height > 0)}
						<svg class="pointer-events-none absolute inset-0 h-full w-full">
							<ellipse
								cx="50%"
								cy="50%"
								rx={character.width / 2}
								ry={character.height / 2}
								fill={DEBUG_CHARACTER_FILL_STYLE}
							/>
						</svg>
					{/if}
				</div>
			{:else}
				<Skeleton class="h-full w-full" />
			{/if}
		</AspectRatio>
	</ItemContent>
	<ItemFooter>
		<div class="flex w-full justify-between">
			<DropdownMenu>
				<DropdownMenuTrigger>
					{#snippet child({ props })}
						<Button variant="ghost" size="sm" {...props}>
							{characterState?.atlas_name ?? '애니메이션 선택'}
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
						<Button variant="ghost" size="icon-sm" disabled={!characterState} {...props}>
							<IconAdjustmentsHorizontal class="size-4" />
						</Button>
					{/snippet}
				</DropdownMenuTrigger>
				<DropdownMenuContent>
					<DropdownMenuSub>
						<DropdownMenuSubTrigger>
							시작 프레임 ({characterState?.frame_from ?? DEFAULT_FRAME_FROM})
						</DropdownMenuSubTrigger>
						<DropdownMenuSubContent>
							<DropdownMenuRadioGroup
								value={characterState?.frame_from?.toString() ?? ''}
								onValueChange={onFrameFromChange}
							>
								{#each range(getFrameCount(characterState?.atlas_name)) as frame (frame)}
									<DropdownMenuRadioItem value={frame.toString()}>{frame}</DropdownMenuRadioItem>
								{/each}
							</DropdownMenuRadioGroup>
						</DropdownMenuSubContent>
					</DropdownMenuSub>
					<DropdownMenuSub>
						<DropdownMenuSubTrigger>
							종료 프레임 ({characterState?.frame_to ?? getFrameCount(characterState?.atlas_name)})
						</DropdownMenuSubTrigger>
						<DropdownMenuSubContent>
							<DropdownMenuRadioGroup
								value={characterState?.frame_to?.toString() ?? ''}
								onValueChange={onFrameToChange}
							>
								{#each range(getFrameCount(characterState?.atlas_name)) as frame (frame)}
									<DropdownMenuRadioItem value={frame.toString()}>{frame}</DropdownMenuRadioItem>
								{/each}
							</DropdownMenuRadioGroup>
						</DropdownMenuSubContent>
					</DropdownMenuSub>
					<DropdownMenuSub>
						<DropdownMenuSubTrigger>
							FPS ({characterState?.fps ?? DEFAULT_FPS})
						</DropdownMenuSubTrigger>
						<DropdownMenuSubContent>
							<DropdownMenuRadioGroup
								value={characterState?.fps?.toString() ?? ''}
								onValueChange={onFpsChange}
							>
								{#each fpsOptions as fps (fps)}
									<DropdownMenuRadioItem value={fps.toString()}>{fps} fps</DropdownMenuRadioItem>
								{/each}
							</DropdownMenuRadioGroup>
						</DropdownMenuSubContent>
					</DropdownMenuSub>
					<DropdownMenuSub>
						<DropdownMenuSubTrigger>
							동작 흐름 ({loopOptions.find((o) => o.value === (characterState?.loop ?? 'loop'))
								?.label})
						</DropdownMenuSubTrigger>
						<DropdownMenuSubContent>
							<DropdownMenuRadioGroup
								value={characterState?.loop ?? 'loop'}
								onValueChange={onLoopChange}
							>
								{#each loopOptions as option (option.value)}
									<DropdownMenuRadioItem value={option.value}>{option.label}</DropdownMenuRadioItem>
								{/each}
							</DropdownMenuRadioGroup>
						</DropdownMenuSubContent>
					</DropdownMenuSub>
					<DropdownMenuSeparator />
					<DropdownMenuItem onclick={onDelete}>초기화</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	</ItemFooter>
</Item>
