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
	import { IconGridDots, IconGrid4x4, IconX } from '@tabler/icons-svelte';
	import { useBuilding } from '$lib/hooks/use-building';

	interface Props {
		building: Building;
	}

	let { building }: Props = $props();

	const { admin } = useBuilding();
	const { uiStore } = admin;

	let tileCols = $state(building.tile_cols === 0 ? '' : building.tile_cols.toString());
	let tileRows = $state(building.tile_rows === 0 ? '' : building.tile_rows.toString());
	let scale = $state(building.scale.toString());

	// building prop 변경 시 상태 동기화
	$effect(() => {
		tileCols = building.tile_cols === 0 ? '' : building.tile_cols.toString();
	});
	$effect(() => {
		tileRows = building.tile_rows === 0 ? '' : building.tile_rows.toString();
	});
	$effect(() => {
		scale = building.scale.toString();
	});

	async function updateTileSize() {
		const newCols = parseInt(tileCols) || 1;
		const newRows = parseInt(tileRows) || 1;
		if (newCols === building.tile_cols && newRows === building.tile_rows) return;
		await admin.update(building.id, { tile_cols: newCols, tile_rows: newRows });
	}

	function onkeydownTileSize(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			(e.target as HTMLInputElement).blur();
			updateTileSize();
		}
	}

	async function updateScale() {
		const newScale = parseFloat(scale) || 1.0;
		if (newScale === building.scale) return;
		await admin.update(building.id, { scale: newScale });
	}

	function onkeydownScale(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			(e.target as HTMLInputElement).blur();
			updateScale();
		}
	}

	function toggleShowBodyPreview() {
		admin.setShowBodyPreview(!$uiStore.showBodyPreview);
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
			class="w-16"
			onkeydown={onkeydownScale}
		/>
		<InputGroupAddon align="inline-end">
			<InputGroupText>배</InputGroupText>
		</InputGroupAddon>
	</InputGroup>
	<InputGroup>
		<InputGroupAddon>
			<InputGroupText>
				<IconGrid4x4 class="size-4" />
			</InputGroupText>
		</InputGroupAddon>
		<InputGroupInput
			bind:value={tileCols}
			type="number"
			min="1"
			class="w-16"
			placeholder="가로"
			onkeydown={onkeydownTileSize}
		/>
		<InputGroupText><IconX /></InputGroupText>
		<InputGroupInput
			bind:value={tileRows}
			type="number"
			min="1"
			class="w-16"
			placeholder="세로"
			onkeydown={onkeydownTileSize}
		/>
		<InputGroupAddon align="inline-end">
			<Tooltip>
				<TooltipTrigger>
					<InputGroupButton
						onclick={toggleShowBodyPreview}
						variant={$uiStore.showBodyPreview ? 'secondary' : 'ghost'}
					>
						<IconGridDots />
					</InputGroupButton>
				</TooltipTrigger>
				<TooltipContent>그리드 확인하기</TooltipContent>
			</Tooltip>
			<InputGroupButton onclick={updateTileSize} variant="ghost">저장</InputGroupButton>
		</InputGroupAddon>
	</InputGroup>
</div>
