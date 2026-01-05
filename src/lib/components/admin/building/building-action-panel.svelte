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
	import { IconGridDots, IconX, IconShape } from '@tabler/icons-svelte';
	import { useBuilding } from '$lib/hooks/use-building';

	interface Props {
		building: Building;
	}

	let { building }: Props = $props();

	const { admin } = useBuilding();
	const { uiStore } = admin;

	let tileCols = $state(building.tile_cols === 0 ? '' : building.tile_cols.toString());
	let tileRows = $state(building.tile_rows === 0 ? '' : building.tile_rows.toString());
	let colliderOffsetX = $state(building.collider_offset_x.toString());
	let colliderOffsetY = $state(building.collider_offset_y.toString());
	let scale = $state(building.scale.toString());

	// building prop 변경 시 상태 동기화
	$effect(() => {
		tileCols = building.tile_cols === 0 ? '' : building.tile_cols.toString();
	});
	$effect(() => {
		tileRows = building.tile_rows === 0 ? '' : building.tile_rows.toString();
	});
	$effect(() => {
		colliderOffsetX = building.collider_offset_x.toString();
	});
	$effect(() => {
		colliderOffsetY = building.collider_offset_y.toString();
	});
	$effect(() => {
		scale = building.scale.toString();
	});

	async function updateCollider() {
		const newTileCols = parseInt(tileCols) || 1;
		const newTileRows = parseInt(tileRows) || 1;
		const newColliderOffsetX = parseFloat(colliderOffsetX) || 0;
		const newColliderOffsetY = parseFloat(colliderOffsetY) || 0;

		if (
			newTileCols === building.tile_cols &&
			newTileRows === building.tile_rows &&
			newColliderOffsetX === building.collider_offset_x &&
			newColliderOffsetY === building.collider_offset_y
		)
			return;

		await admin.update(building.id, {
			tile_cols: newTileCols,
			tile_rows: newTileRows,
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
		<InputGroupInput
			bind:value={tileCols}
			type="number"
			min="1"
			class="w-16"
			placeholder="가로"
			onkeydown={onkeydownCollider}
		/>
		<InputGroupText><IconX /></InputGroupText>
		<InputGroupInput
			bind:value={tileRows}
			type="number"
			min="1"
			class="w-16"
			placeholder="세로"
			onkeydown={onkeydownCollider}
		/>
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
						<IconGridDots />
					</InputGroupButton>
				</TooltipTrigger>
				<TooltipContent>그리드 확인하기</TooltipContent>
			</Tooltip>
			<InputGroupButton onclick={updateCollider} variant="ghost">저장</InputGroupButton>
		</InputGroupAddon>
	</InputGroup>
</div>
