<script lang="ts">
	import type { Building } from '$lib/types';
	import {
		InputGroup,
		InputGroupAddon,
		InputGroupButton,
		InputGroupInput,
		InputGroupText,
	} from '$lib/components/ui/input-group';
	import { Tooltip, TooltipContent, TooltipTrigger } from '$lib/components/ui/tooltip';
	import { IconEye, IconEyeOff, IconHeading, IconRuler2, IconX } from '@tabler/icons-svelte';
	import { useBuilding } from '$lib/hooks/use-building';

	interface Props {
		building: Building;
	}

	let { building }: Props = $props();

	const { admin } = useBuilding();
	const { uiStore } = admin;

	let name = $state(building.name ?? '');
	let width = $state(building.width === 0 ? '' : building.width.toString());
	let height = $state(building.height === 0 ? '' : building.height.toString());

	// building prop 변경 시 상태 동기화
	$effect(() => {
		width = building.width === 0 ? '' : building.width.toString();
	});
	$effect(() => {
		height = building.height === 0 ? '' : building.height.toString();
	});

	async function updateName() {
		const trimmed = name.trim();
		if (trimmed === (building.name ?? '')) return;
		await admin.update(building.id, { name: trimmed || undefined });
	}

	async function updateSize() {
		const newWidth = parseFloat(width) || 0;
		const newHeight = parseFloat(height) || 0;
		if (newWidth === building.width && newHeight === building.height) return;
		await admin.update(building.id, { width: newWidth, height: newHeight });
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

	function toggleShowBodyPreview() {
		admin.setShowBodyPreview(!$uiStore.showBodyPreview);
	}
</script>

<div class="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2">
	<InputGroup>
		<InputGroupAddon>
			<InputGroupText>
				<IconHeading class="size-4" />
			</InputGroupText>
		</InputGroupAddon>
		<InputGroupInput bind:value={name} placeholder="건물 이름" onkeydown={onkeydownName} />
		<InputGroupAddon align="inline-end">
			<InputGroupButton onclick={updateName} variant="ghost">저장</InputGroupButton>
		</InputGroupAddon>
	</InputGroup>
	<InputGroup>
		<InputGroupAddon>
			<InputGroupText>
				<IconRuler2 class="size-4" />
			</InputGroupText>
		</InputGroupAddon>
		<InputGroupInput
			bind:value={width}
			type="number"
			class="w-16"
			placeholder="넓이"
			onkeydown={onkeydownSize}
		/>
		<InputGroupText><IconX /></InputGroupText>
		<InputGroupInput
			bind:value={height}
			type="number"
			class="w-16"
			placeholder="높이"
			onkeydown={onkeydownSize}
		/>
		<InputGroupAddon align="inline-end">
			<Tooltip>
				<TooltipTrigger>
					<InputGroupButton onclick={toggleShowBodyPreview} variant={$uiStore.showBodyPreview ? 'secondary' : 'ghost'}>
						{#if $uiStore.showBodyPreview}
							<IconEye />
						{:else}
							<IconEyeOff />
						{/if}
					</InputGroupButton>
				</TooltipTrigger>
				<TooltipContent>바디 영역 미리보기</TooltipContent>
			</Tooltip>
			<InputGroupButton onclick={updateSize} variant="ghost">저장</InputGroupButton>
		</InputGroupAddon>
	</InputGroup>
</div>
