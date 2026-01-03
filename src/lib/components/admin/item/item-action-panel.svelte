<script lang="ts">
	import type { Item } from '$lib/types';
	import {
		InputGroup,
		InputGroupAddon,
		InputGroupInput,
		InputGroupText,
		InputGroupButton,
	} from '$lib/components/ui/input-group';
	import { useItem } from '$lib/hooks/use-item';
	import { IconRuler2, IconX } from '@tabler/icons-svelte';

	interface Props {
		item: Item;
	}

	let { item }: Props = $props();

	const { admin } = useItem();

	let scale = $state(item.scale.toString());
	let width = $state(item.width.toString());
	let height = $state(item.height.toString());

	// item prop 변경 시 상태 동기화
	$effect(() => {
		scale = item.scale.toString();
	});
	$effect(() => {
		width = item.width.toString();
	});
	$effect(() => {
		height = item.height.toString();
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

		if (newWidth === item.width && newHeight === item.height) return;

		await admin.update(item.id, {
			width: newWidth,
			height: newHeight,
		});
	}

	function onkeydownDimensions(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			(e.target as HTMLInputElement).blur();
			updateDimensions();
		}
	}
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
				<IconRuler2 class="size-4" />
			</InputGroupText>
		</InputGroupAddon>
		<InputGroupInput
			bind:value={width}
			type="number"
			step="0.01"
			min="0"
			class="w-16"
			placeholder="넓이"
			onkeydown={onkeydownDimensions}
		/>
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
		<InputGroupAddon align="inline-end">
			<InputGroupButton onclick={updateDimensions} variant="ghost">저장</InputGroupButton>
		</InputGroupAddon>
	</InputGroup>
</div>
