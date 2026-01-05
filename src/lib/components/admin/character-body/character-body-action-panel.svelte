<script lang="ts">
	import type { CharacterBody, ColliderType } from '$lib/types';
	import {
		InputGroup,
		InputGroupAddon,
		InputGroupButton,
		InputGroupInput,
		InputGroupText,
	} from '$lib/components/ui/input-group';
	import {
		DropdownMenu,
		DropdownMenuTrigger,
		DropdownMenuContent,
		DropdownMenuRadioGroup,
		DropdownMenuRadioItem,
	} from '$lib/components/ui/dropdown-menu';
	import { Tooltip, TooltipContent, TooltipTrigger } from '$lib/components/ui/tooltip';
	import { IconEye, IconEyeOff, IconHeading, IconX, IconShape } from '@tabler/icons-svelte';
	import { useCharacterBody } from '$lib/hooks/use-character-body';
	import { getColliderTypeLabel } from '$lib/utils/state-label';

	interface Props {
		body: CharacterBody;
	}

	let { body }: Props = $props();

	const { admin } = useCharacterBody();
	const { uiStore } = admin;

	const colliderTypes: ColliderType[] = ['circle', 'rectangle'];
	let selectedColliderType = $state(body.collider_type);

	let name = $state(body.name ?? '');
	let colliderWidth = $state(body.collider_width === 0 ? '' : body.collider_width.toString());
	let colliderHeight = $state(body.collider_height === 0 ? '' : body.collider_height.toString());
	let colliderOffsetX = $state(body.collider_offset_x.toString());
	let colliderOffsetY = $state(body.collider_offset_y.toString());

	// body prop 변경 시 상태 동기화
	$effect(() => {
		colliderWidth = body.collider_width === 0 ? '' : body.collider_width.toString();
	});
	$effect(() => {
		colliderHeight = body.collider_height === 0 ? '' : body.collider_height.toString();
	});
	$effect(() => {
		colliderOffsetX = body.collider_offset_x.toString();
	});
	$effect(() => {
		colliderOffsetY = body.collider_offset_y.toString();
	});
	$effect(() => {
		selectedColliderType = body.collider_type;
	});

	async function updateName() {
		const trimmed = name.trim();
		if (trimmed === (body.name ?? '')) return;
		await admin.update(body.id, { name: trimmed || undefined });
	}

	async function updateCollider() {
		const newColliderWidth = parseFloat(colliderWidth) || 0;
		const newColliderHeight = parseFloat(colliderHeight) || 0;
		const newColliderOffsetX = parseFloat(colliderOffsetX) || 0;
		const newColliderOffsetY = parseFloat(colliderOffsetY) || 0;

		if (
			newColliderWidth === body.collider_width &&
			newColliderHeight === body.collider_height &&
			newColliderOffsetX === body.collider_offset_x &&
			newColliderOffsetY === body.collider_offset_y
		)
			return;

		await admin.update(body.id, {
			collider_width: newColliderWidth,
			collider_height: newColliderHeight,
			collider_offset_x: newColliderOffsetX,
			collider_offset_y: newColliderOffsetY,
		});
	}

	function onkeydownName(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			(e.target as HTMLInputElement).blur();
			updateName();
		}
	}

	function onkeydownCollider(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			(e.target as HTMLInputElement).blur();
			updateCollider();
		}
	}

	$effect(() => {
		if (selectedColliderType !== body.collider_type) {
			admin.update(body.id, { collider_type: selectedColliderType });
		}
	});

	function toggleShowBodyPreview() {
		admin.setShowBodyPreview(!$uiStore.showBodyPreview);
	}
</script>

<div class="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2">
	<InputGroup>
		<InputGroupAddon>
			<InputGroupText>
				<IconHeading />
			</InputGroupText>
		</InputGroupAddon>
		<InputGroupInput bind:value={name} placeholder="바디 이름" onkeydown={onkeydownName} />
		<InputGroupAddon align="inline-end">
			<InputGroupButton onclick={updateName} variant="ghost">저장</InputGroupButton>
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
			<InputGroupButton onclick={updateCollider} variant="ghost">저장</InputGroupButton>
		</InputGroupAddon>
	</InputGroup>
</div>
