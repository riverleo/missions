<script lang="ts">
	import type { Item, ColliderType } from '$lib/types';
	import {
		InputGroup,
		InputGroupAddon,
		InputGroupInput,
		InputGroupText,
		InputGroupButton,
	} from '$lib/components/ui/input-group';
	import {
		DropdownMenu,
		DropdownMenuTrigger,
		DropdownMenuContent,
		DropdownMenuRadioGroup,
		DropdownMenuRadioItem,
	} from '$lib/components/ui/dropdown-menu';
	import { Tooltip, TooltipContent, TooltipTrigger } from '$lib/components/ui/tooltip';
	import { useItem } from '$lib/hooks/use-item';
	import { IconEye, IconEyeOff, IconShape, IconX } from '@tabler/icons-svelte';
	import { getColliderTypeLabel } from '$lib/utils/state-label';

	interface Props {
		item: Item;
	}

	let { item }: Props = $props();

	const { admin } = useItem();
	const { uiStore } = admin;

	const colliderTypes: ColliderType[] = ['circle', 'rectangle'];
	let selectedColliderType = $state(item.collider_type);

	let scale = $state(item.scale.toString());
	let width = $state(item.collider_width.toString());
	let height = $state(item.collider_height.toString());

	// item prop 변경 시 상태 동기화
	$effect(() => {
		scale = item.scale.toString();
	});
	$effect(() => {
		width = item.collider_width.toString();
	});
	$effect(() => {
		height = item.collider_height.toString();
	});
	$effect(() => {
		selectedColliderType = item.collider_type;
	});

	async function updateScale() {
		const newScale = parseFloat(scale) || 1.0;
		if (newScale === item.scale) return;
		await admin.update(item.id, { scale: newScale });
	}

	function onkeydownScale(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			(e.target as HTMLInputElement).blur();
			updateScale();
		}
	}

	async function updateDimensions() {
		const newWidth = parseFloat(width) || 32.0;
		const newHeight = parseFloat(height) || 32.0;

		if (newWidth === item.collider_width && newHeight === item.collider_height) return;

		await admin.update(item.id, {
			collider_width: newWidth,
			collider_height: newHeight,
		});
	}

	function onkeydownDimensions(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			(e.target as HTMLInputElement).blur();
			updateDimensions();
		}
	}

	function toggleShowBodyPreview() {
		admin.setShowBodyPreview(!$uiStore.showBodyPreview);
	}

	$effect(() => {
		if (selectedColliderType !== item.collider_type) {
			admin.update(item.id, { collider_type: selectedColliderType });
		}
	});
</script>

<div class="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2">
	<InputGroup>
		<InputGroupAddon align="inline-start">
			<InputGroupText>스케일</InputGroupText>
		</InputGroupAddon>
		<InputGroupInput
			bind:value={scale}
			type="number"
			step="0.01"
			min="0"
			onkeydown={onkeydownScale}
		/>
		<InputGroupAddon align="inline-end">
			<InputGroupText>배</InputGroupText>
		</InputGroupAddon>
		<InputGroupAddon align="inline-end">
			<InputGroupButton onclick={updateScale} variant="ghost">저장</InputGroupButton>
		</InputGroupAddon>
	</InputGroup>
	<InputGroup>
		<InputGroupAddon>
			<InputGroupText>
				<IconShape />
			</InputGroupText>
		</InputGroupAddon>
		<InputGroupAddon>
			<DropdownMenu>
				<DropdownMenuTrigger>
					{#snippet child({ props })}
						<InputGroupButton {...props} variant="ghost">
							{getColliderTypeLabel(selectedColliderType)}
						</InputGroupButton>
					{/snippet}
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuRadioGroup bind:value={selectedColliderType}>
						{#each colliderTypes as type (type)}
							<DropdownMenuRadioItem value={type}>
								{getColliderTypeLabel(type)}
							</DropdownMenuRadioItem>
						{/each}
					</DropdownMenuRadioGroup>
				</DropdownMenuContent>
			</DropdownMenu>
		</InputGroupAddon>
		<InputGroupInput
			bind:value={width}
			type="number"
			step="0.01"
			min="0"
			class="w-16"
			placeholder={selectedColliderType === 'circle' ? '반지름' : '넓이'}
			onkeydown={onkeydownDimensions}
		/>
		{#if selectedColliderType === 'rectangle'}
			<InputGroupText><IconX /></InputGroupText>
			<InputGroupInput
				bind:value={height}
				type="number"
				step="0.01"
				min="0"
				class="w-16"
				placeholder="높이"
				onkeydown={onkeydownDimensions}
			/>
		{/if}
		<InputGroupAddon align="inline-end">
			<Tooltip>
				<TooltipTrigger>
					<InputGroupButton
						onclick={toggleShowBodyPreview}
						variant={$uiStore.showBodyPreview ? 'secondary' : 'ghost'}
					>
						{#if $uiStore.showBodyPreview}
							<IconEye />
						{:else}
							<IconEyeOff />
						{/if}
					</InputGroupButton>
				</TooltipTrigger>
				<TooltipContent>크기 확인하기</TooltipContent>
			</Tooltip>
			<InputGroupButton onclick={updateDimensions} variant="ghost">저장</InputGroupButton>
		</InputGroupAddon>
	</InputGroup>
</div>
