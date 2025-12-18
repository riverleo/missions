<script lang="ts">
	import type { BuildingStateType, LoopMode } from '$lib/types';
	import { Item, ItemContent, ItemTitle, ItemHeader } from '$lib/components/ui/item';
	import { ButtonGroup } from '$lib/components/ui/button-group';
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
	import { IconTrash } from '@tabler/icons-svelte';
	import { useBuilding } from '$lib/hooks/use-building';
	import { DEBUG_BUILDING_FILL_STYLE } from '$lib/components/app/world/constants';
	import { Button } from '$lib/components/ui/button';

	interface Props {
		buildingId: string;
		type: BuildingStateType;
	}

	let { buildingId, type }: Props = $props();

	const { store, admin } = useBuilding();
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

	const building = $derived($store.data[buildingId]);
	const buildingState = $derived(building?.building_states.find((s) => s.type === type));

	function getFrameCount(atlasName: string | undefined) {
		if (!atlasName) return 0;
		return atlases[atlasName]?.frameCount ?? 0;
	}

	function range(count: number) {
		return Array.from({ length: count }, (_, i) => i + 1);
	}

	// atlas_name이 변경되면 animator 재생성
	$effect(() => {
		const atlasName = buildingState?.atlas_name;
		if (!atlasName) {
			animator?.stop();
			animator = undefined;
			return;
		}

		SpriteAnimator.create(atlasName).then((newAnimator) => {
			animator?.stop();
			newAnimator.init({
				name: type,
				from: buildingState?.frame_from ?? undefined,
				to: buildingState?.frame_to ?? undefined,
				fps: buildingState?.fps ?? undefined,
			});
			newAnimator.play({ name: type, loop: buildingState?.loop ?? 'loop' });
			animator = newAnimator;
		});

		return () => {
			animator?.stop();
		};
	});

	// frame_from, frame_to, fps, loop이 변경되면 애니메이션 재시작
	$effect(() => {
		const frameFrom = buildingState?.frame_from;
		const frameTo = buildingState?.frame_to;
		const fps = buildingState?.fps;
		const loop = buildingState?.loop;

		if (animator && buildingState?.atlas_name) {
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
		if (buildingState) {
			await admin.updateBuildingState(buildingState.id, buildingId, { atlas_name: atlasName });
		} else {
			await admin.createBuildingState(buildingId, { type, atlas_name: atlasName });
		}

		// 건물의 width/height가 0이면 atlas frame 크기로 설정
		if (building && building.width === 0 && building.height === 0) {
			const metadata = atlases[atlasName];
			if (metadata) {
				await admin.update(buildingId, {
					width: metadata.frameWidth / 2,
					height: metadata.frameHeight / 2,
				});
			}
		}
	}

	async function onFrameFromChange(value: string) {
		if (buildingState) {
			await admin.updateBuildingState(buildingState.id, buildingId, {
				frame_from: parseInt(value),
			});
		}
	}

	async function onFrameToChange(value: string) {
		if (buildingState) {
			await admin.updateBuildingState(buildingState.id, buildingId, {
				frame_to: parseInt(value),
			});
		}
	}

	async function onFpsChange(value: string) {
		if (buildingState) {
			await admin.updateBuildingState(buildingState.id, buildingId, {
				fps: parseInt(value),
			});
		}
	}

	async function onLoopChange(value: string) {
		if (buildingState) {
			await admin.updateBuildingState(buildingState.id, buildingId, {
				loop: value as LoopMode,
			});
		}
	}

	async function onDelete() {
		if (buildingState) {
			await admin.removeBuildingState(buildingState.id, buildingId);
		}
	}
</script>

<Item variant="muted">
	<ItemHeader>
		<ItemTitle class="uppercase">{type}</ItemTitle>
		<Button variant="ghost" size="icon-sm" disabled={!buildingState} onclick={onDelete}>
			<IconTrash />
		</Button>
	</ItemHeader>
	<ItemContent class="w-full">
		<AspectRatio ratio={4 / 3}>
			{#if animator}
				<div class="relative flex h-full w-full items-center justify-center overflow-hidden">
					<SpriteAnimatorRenderer {animator} resolution={2} />
					{#if $uiStore.showBodyPreview && building && (building.width > 0 || building.height > 0)}
						<svg class="pointer-events-none absolute inset-0 h-full w-full">
							<ellipse
								cx="50%"
								cy="50%"
								rx={building.width / 2}
								ry={building.height / 2}
								fill={DEBUG_BUILDING_FILL_STYLE}
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
		<ButtonGroup class="w-full">
			<DropdownMenu>
				<DropdownMenuTrigger class="flex-1">
					{#snippet child({ props })}
						<Button variant="outline" size="sm" class="w-full" {...props}>
							{buildingState?.atlas_name ?? '선택'}
						</Button>
					{/snippet}
				</DropdownMenuTrigger>
				<DropdownMenuContent>
					<DropdownMenuRadioGroup
						value={buildingState?.atlas_name ?? ''}
						onValueChange={onAtlasChange}
					>
						{#each atlasNames as name (name)}
							<DropdownMenuRadioItem value={name}>{name}</DropdownMenuRadioItem>
						{/each}
					</DropdownMenuRadioGroup>
				</DropdownMenuContent>
			</DropdownMenu>
			<DropdownMenu>
				<DropdownMenuTrigger class="flex-1" disabled={!buildingState}>
					{#snippet child({ props })}
						<Button variant="outline" size="sm" class="w-full" disabled={!buildingState} {...props}>
							{buildingState?.frame_from ?? '시작'}
						</Button>
					{/snippet}
				</DropdownMenuTrigger>
				<DropdownMenuContent>
					<DropdownMenuRadioGroup
						value={buildingState?.frame_from?.toString() ?? ''}
						onValueChange={onFrameFromChange}
					>
						{#each range(getFrameCount(buildingState?.atlas_name)) as frame (frame)}
							<DropdownMenuRadioItem value={frame.toString()}>{frame}</DropdownMenuRadioItem>
						{/each}
					</DropdownMenuRadioGroup>
				</DropdownMenuContent>
			</DropdownMenu>
			<DropdownMenu>
				<DropdownMenuTrigger class="flex-1" disabled={!buildingState}>
					{#snippet child({ props })}
						<Button variant="outline" size="sm" class="w-full" disabled={!buildingState} {...props}>
							{buildingState?.frame_to ?? '종료'}
						</Button>
					{/snippet}
				</DropdownMenuTrigger>
				<DropdownMenuContent>
					<DropdownMenuRadioGroup
						value={buildingState?.frame_to?.toString() ?? ''}
						onValueChange={onFrameToChange}
					>
						{#each range(getFrameCount(buildingState?.atlas_name)) as frame (frame)}
							<DropdownMenuRadioItem value={frame.toString()}>{frame}</DropdownMenuRadioItem>
						{/each}
					</DropdownMenuRadioGroup>
				</DropdownMenuContent>
			</DropdownMenu>
			<DropdownMenu>
				<DropdownMenuTrigger class="flex-1" disabled={!buildingState}>
					{#snippet child({ props })}
						<Button variant="outline" size="sm" class="w-full" disabled={!buildingState} {...props}>
							{buildingState?.fps ? `${buildingState.fps} 프레임` : '프레임'}
						</Button>
					{/snippet}
				</DropdownMenuTrigger>
				<DropdownMenuContent>
					<DropdownMenuRadioGroup
						value={buildingState?.fps?.toString() ?? ''}
						onValueChange={onFpsChange}
					>
						{#each fpsOptions as fps (fps)}
							<DropdownMenuRadioItem value={fps.toString()}>{fps} 프레임</DropdownMenuRadioItem>
						{/each}
					</DropdownMenuRadioGroup>
				</DropdownMenuContent>
			</DropdownMenu>
			<DropdownMenu>
				<DropdownMenuTrigger class="flex-1" disabled={!buildingState}>
					{#snippet child({ props })}
						<Button variant="outline" size="sm" class="w-full" disabled={!buildingState} {...props}>
							{loopOptions.find((o) => o.value === buildingState?.loop)?.label ?? '반복'}
						</Button>
					{/snippet}
				</DropdownMenuTrigger>
				<DropdownMenuContent>
					<DropdownMenuRadioGroup
						value={buildingState?.loop ?? 'loop'}
						onValueChange={onLoopChange}
					>
						{#each loopOptions as option (option.value)}
							<DropdownMenuRadioItem value={option.value}>{option.label}</DropdownMenuRadioItem>
						{/each}
					</DropdownMenuRadioGroup>
				</DropdownMenuContent>
			</DropdownMenu>
		</ButtonGroup>
	</ItemFooter>
</Item>
