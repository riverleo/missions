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
	const { itemUiStore } = admin;

	const colliderTypes: ColliderType[] = ['circle', 'rectangle'];
	let selectedColliderType = $state(item.collider_type);

	let scale = $state(item.scale.toString());
	let colliderWidth = $state(item.collider_width.toString());
	let colliderHeight = $state(item.collider_height.toString());
	let colliderOffsetX = $state(item.collider_offset_x.toString());
	let colliderOffsetY = $state(item.collider_offset_y.toString());

	// item prop 변경 시 상태 동기화
	$effect(() => {
		scale = item.scale.toString();
	});
	$effect(() => {
		colliderWidth = item.collider_width.toString();
	});
	$effect(() => {
		colliderHeight = item.collider_height.toString();
	});
	$effect(() => {
		colliderOffsetX = item.collider_offset_x.toString();
	});
	$effect(() => {
		colliderOffsetY = item.collider_offset_y.toString();
	});
	$effect(() => {
		selectedColliderType = item.collider_type;
	});

	async function updateScale() {
		const newScale = parseFloat(scale) || 1.0;
		if (newScale === item.scale) return;
		await admin.updateItem(item.id, { scale: newScale });
	}

	function onkeydownScale(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			(e.target as HTMLInputElement).blur();
			updateScale();
		}
	}

	async function updateCollider() {
		const newColliderWidth = parseFloat(colliderWidth) || 0;
		const newColliderHeight = parseFloat(colliderHeight) || 0;
		const newColliderOffsetX = parseFloat(colliderOffsetX) || 0;
		const newColliderOffsetY = parseFloat(colliderOffsetY) || 0;

		if (
			newColliderWidth === item.collider_width &&
			newColliderHeight === item.collider_height &&
			newColliderOffsetX === item.collider_offset_x &&
			newColliderOffsetY === item.collider_offset_y
		)
			return;

		await admin.updateItem(item.id, {
			collider_width: newColliderWidth,
			collider_height: newColliderHeight,
			collider_offset_x: newColliderOffsetX,
			collider_offset_y: newColliderOffsetY,
		});
	}

	function onkeydownCollider(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			(e.target as HTMLInputElement).blur();
			updateCollider();
		}
	}

	function toggleShowBodyPreview() {
		admin.setShowBodyPreview(!$itemUiStore.showBodyPreview);
	}

	$effect(() => {
		if (selectedColliderType !== item.collider_type) {
			admin.updateItem(item.id, { collider_type: selectedColliderType });
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
			bind:value={colliderWidth}
			type="number"
			class="w-16"
			placeholder={selectedColliderType === 'circle' ? '반지름' : '넓이'}
			onkeydown={onkeydownCollider}
		/>
		{#if selectedColliderType === 'rectangle'}
			<InputGroupText><IconX /></InputGroupText>
			<InputGroupInput
				bind:value={colliderHeight}
				type="number"
				class="w-16"
				placeholder="높이"
				onkeydown={onkeydownCollider}
			/>
		{/if}
		<InputGroupText>오프셋</InputGroupText>
		<InputGroupInput
			bind:value={colliderOffsetX}
			type="number"
			class="w-16"
			placeholder="X"
			onkeydown={onkeydownCollider}
		/>
		<InputGroupText><IconX /></InputGroupText>
		<InputGroupInput
			bind:value={colliderOffsetY}
			type="number"
			class="w-16"
			placeholder="Y"
			onkeydown={onkeydownCollider}
		/>
		<InputGroupAddon align="inline-end">
			<Tooltip>
				<TooltipTrigger>
					<InputGroupButton
						onclick={toggleShowBodyPreview}
						variant={$itemUiStore.showBodyPreview ? 'secondary' : 'ghost'}
					>
						{#if $itemUiStore.showBodyPreview}
							<IconEye />
						{:else}
							<IconEyeOff />
						{/if}
					</InputGroupButton>
				</TooltipTrigger>
				<TooltipContent>크기 확인하기</TooltipContent>
			</Tooltip>
			<InputGroupButton onclick={updateCollider} variant="ghost">저장</InputGroupButton>
		</InputGroupAddon>
	</InputGroup>
</div>
