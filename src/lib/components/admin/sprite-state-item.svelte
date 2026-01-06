<script lang="ts">
	import type { LoopMode } from '$lib/types';
	import type { Snippet } from 'svelte';
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
	import ItemFooter from '$lib/components/ui/item/item-footer.svelte';
	import { IconAdjustmentsHorizontal } from '@tabler/icons-svelte';
	import { Button } from '$lib/components/ui/button';

	export interface SpriteState {
		id: string;
		atlas_name: string;
		frame_from: number | null;
		frame_to: number | null;
		fps: number | null;
		loop: LoopMode;
	}

	export interface SpriteStateChange {
		atlas_name?: string;
		frame_from?: number;
		frame_to?: number;
		fps?: number;
		loop?: LoopMode;
	}

	interface Props {
		type: string;
		label?: string;
		spriteState: SpriteState | undefined;
		onchange: (change: SpriteStateChange) => void;
		ondelete?: () => void;
		preview?: Snippet;
		collider?: Snippet;
		action?: Snippet;
	}

	let { type, label, spriteState, onchange, ondelete, preview, collider, action }: Props = $props();

	const atlasNames = Object.keys(atlases);
	const fpsOptions = [8, 16, 24, 30, 60];
	const loopOptions: { value: LoopMode; label: string }[] = [
		{ value: 'loop', label: '반복' },
		{ value: 'once', label: '1회' },
		{ value: 'ping-pong', label: '핑퐁' },
		{ value: 'ping-pong-once', label: '핑퐁 1회' },
	];

	function getFrameCount(atlasName: string | undefined) {
		if (!atlasName) return 0;
		return atlases[atlasName]?.frameCount ?? 0;
	}

	function range(count: number) {
		return Array.from({ length: count }, (_, i) => i + 1);
	}

	function onAtlasChange(atlasName: string) {
		onchange({ atlas_name: atlasName });
	}

	function onFrameFromChange(value: string) {
		onchange({ frame_from: parseInt(value) });
	}

	function onFrameToChange(value: string) {
		onchange({ frame_to: parseInt(value) });
	}

	function onFpsChange(value: string) {
		onchange({ fps: parseInt(value) });
	}

	function onLoopChange(value: string) {
		onchange({ loop: value as LoopMode });
	}
</script>

<Item variant="muted">
	<ItemHeader>
		<ItemTitle>{label ?? type}</ItemTitle>
		{#if action}
			<div class="flex items-center gap-2">
				{@render action()}
			</div>
		{/if}
	</ItemHeader>
	<ItemContent class="w-full overflow-hidden">
		<AspectRatio ratio={4 / 3}>
			<div class="relative flex h-full w-full items-center justify-center overflow-hidden">
				{#if preview}
					{@render preview()}
				{:else}
					<Skeleton class="h-full w-full" />
				{/if}
				{#if collider}
					<div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
						{@render collider()}
					</div>
				{/if}
			</div>
		</AspectRatio>
	</ItemContent>
	<ItemFooter>
		<div class="flex w-full justify-between">
			<DropdownMenu>
				<DropdownMenuTrigger>
					{#snippet child({ props })}
						<Button variant="ghost" size="sm" class="justify-start truncate" {...props}>
							{spriteState?.atlas_name ?? '스프라이트 선택'}
						</Button>
					{/snippet}
				</DropdownMenuTrigger>
				<DropdownMenuContent>
					<DropdownMenuRadioGroup
						value={spriteState?.atlas_name ?? ''}
						onValueChange={onAtlasChange}
					>
						{#each atlasNames as name (name)}
							<DropdownMenuRadioItem value={name}>{name}</DropdownMenuRadioItem>
						{/each}
					</DropdownMenuRadioGroup>
				</DropdownMenuContent>
			</DropdownMenu>
			<DropdownMenu>
				<DropdownMenuTrigger disabled={!spriteState}>
					{#snippet child({ props })}
						<Button variant="ghost" size="icon-sm" disabled={!spriteState} {...props}>
							<IconAdjustmentsHorizontal class="size-4" />
						</Button>
					{/snippet}
				</DropdownMenuTrigger>
				<DropdownMenuContent>
					<DropdownMenuSub>
						<DropdownMenuSubTrigger>
							시작 프레임 ({spriteState?.frame_from ?? DEFAULT_FRAME_FROM})
						</DropdownMenuSubTrigger>
						<DropdownMenuSubContent>
							<DropdownMenuRadioGroup
								value={spriteState?.frame_from?.toString() ?? ''}
								onValueChange={onFrameFromChange}
							>
								{#each range(getFrameCount(spriteState?.atlas_name)) as frame (frame)}
									<DropdownMenuRadioItem value={frame.toString()}>{frame}</DropdownMenuRadioItem>
								{/each}
							</DropdownMenuRadioGroup>
						</DropdownMenuSubContent>
					</DropdownMenuSub>
					<DropdownMenuSub>
						<DropdownMenuSubTrigger>
							종료 프레임 ({spriteState?.frame_to ?? getFrameCount(spriteState?.atlas_name)})
						</DropdownMenuSubTrigger>
						<DropdownMenuSubContent>
							<DropdownMenuRadioGroup
								value={spriteState?.frame_to?.toString() ?? ''}
								onValueChange={onFrameToChange}
							>
								{#each range(getFrameCount(spriteState?.atlas_name)) as frame (frame)}
									<DropdownMenuRadioItem value={frame.toString()}>{frame}</DropdownMenuRadioItem>
								{/each}
							</DropdownMenuRadioGroup>
						</DropdownMenuSubContent>
					</DropdownMenuSub>
					<DropdownMenuSub>
						<DropdownMenuSubTrigger>
							FPS ({spriteState?.fps ?? DEFAULT_FPS})
						</DropdownMenuSubTrigger>
						<DropdownMenuSubContent>
							<DropdownMenuRadioGroup
								value={spriteState?.fps?.toString() ?? ''}
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
							동작 흐름 ({loopOptions.find((o) => o.value === (spriteState?.loop ?? 'loop'))
								?.label})
						</DropdownMenuSubTrigger>
						<DropdownMenuSubContent>
							<DropdownMenuRadioGroup
								value={spriteState?.loop ?? 'loop'}
								onValueChange={onLoopChange}
							>
								{#each loopOptions as option (option.value)}
									<DropdownMenuRadioItem value={option.value}>{option.label}</DropdownMenuRadioItem>
								{/each}
							</DropdownMenuRadioGroup>
						</DropdownMenuSubContent>
					</DropdownMenuSub>
					{#if ondelete}
						<DropdownMenuSeparator />
						<DropdownMenuItem onclick={ondelete}>초기화</DropdownMenuItem>
					{/if}
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	</ItemFooter>
</Item>
