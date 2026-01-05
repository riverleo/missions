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
	import {
		IconEye,
		IconEyeOff,
		IconHeading,
		IconRuler2,
		IconX,
		IconShape,
		IconArrowsMove,
	} from '@tabler/icons-svelte';
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
	let width = $state(body.collider_width === 0 ? '' : body.collider_width.toString());
	let height = $state(body.collider_height === 0 ? '' : body.collider_height.toString());
	let offsetX = $state(body.collider_offset_x.toString());
	let offsetY = $state(body.collider_offset_y.toString());

	// body prop 변경 시 상태 동기화
	$effect(() => {
		width = body.collider_width === 0 ? '' : body.collider_width.toString();
	});
	$effect(() => {
		height = body.collider_height === 0 ? '' : body.collider_height.toString();
	});
	$effect(() => {
		selectedColliderType = body.collider_type;
	});

	async function updateName() {
		const trimmed = name.trim();
		if (trimmed === (body.name ?? '')) return;
		await admin.update(body.id, { name: trimmed || undefined });
	}

	async function updateSize() {
		const newWidth = parseFloat(width) || 0;
		const newHeight = parseFloat(height) || 0;
		if (newWidth === body.collider_width && newHeight === body.collider_height) return;
		await admin.update(body.id, { collider_width: newWidth, collider_height: newHeight });
	}

	function onkeydownName(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			(e.target as HTMLInputElement).blur();
			updateName();
		}
	}

	function onkeydownSize(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			(e.target as HTMLInputElement).blur();
			updateSize();
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
			bind:value={width}
			type="number"
			class="w-16"
			placeholder={selectedColliderType === 'circle' ? '반지름' : '넓이'}
			onkeydown={onkeydownSize}
		/>
		{#if selectedColliderType === 'rectangle'}
			<InputGroupText><IconX /></InputGroupText>
			<InputGroupInput
				bind:value={height}
				type="number"
				class="w-16"
				placeholder="높이"
				onkeydown={onkeydownSize}
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
			<InputGroupButton onclick={updateSize} variant="ghost">저장</InputGroupButton>
		</InputGroupAddon>
	</InputGroup>
</div>
