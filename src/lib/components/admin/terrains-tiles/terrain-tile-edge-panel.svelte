<script lang="ts">
	import { Panel, useEdges } from '@xyflow/svelte';
	import type { TerrainTile } from '$lib/types';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { useTerrain } from '$lib/hooks/use-terrain';
	import { createTerrainTileEdgeId } from '$lib/utils/flow-id';

	interface Props {
		terrainTile: TerrainTile | undefined;
	}

	let { terrainTile }: Props = $props();

	const { store: terrainStore, tileStore } = useTerrain();
	const flowEdges = useEdges();

	const terrain = $derived(terrainTile ? $terrainStore.data[terrainTile.terrain_id] : undefined);
	const tile = $derived(terrainTile ? $tileStore.data[terrainTile.tile_id] : undefined);

	function onclickClose() {
		if (!terrainTile) return;

		const edgeId = createTerrainTileEdgeId(terrainTile);
		flowEdges.update((es) => es.map((e) => (e.id === edgeId ? { ...e, selected: false } : e)));
	}
</script>

<Panel position="top-right">
	<Card class="w-80 py-4">
		<CardContent class="px-4">
			{#if terrainTile && terrain && tile}
				<div class="space-y-4">
					<div class="space-y-2">
						<div class="text-sm font-medium">지형과 타일 연결</div>
						<div class="text-sm text-muted-foreground">
							<div>지형: {terrain.title}</div>
							<div>타일: {tile.name}</div>
						</div>
					</div>
					<div class="text-xs text-muted-foreground">
						추후 빈도(frequency) 등의 속성을 추가할 수 있습니다.
					</div>
					<div class="flex justify-end">
						<Button type="button" variant="outline" onclick={onclickClose}>닫기</Button>
					</div>
				</div>
			{/if}
		</CardContent>
	</Card>
</Panel>
