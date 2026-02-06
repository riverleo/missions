<script lang="ts">
	import { useTerrain } from '$lib/hooks';
	import { Panel, useEdges } from '@xyflow/svelte';
	import type { TerrainTile } from '$lib/types';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
	import {
		InputGroup,
		InputGroupInput,
		InputGroupAddon,
		InputGroupText,
	} from '$lib/components/ui/input-group';
	import { createTerrainTileEdgeId } from '$lib/utils/flow-id';
	import { clone } from 'radash';
	import { getActionString } from '$lib/utils/state-label';

	interface Props {
		terrainTile: TerrainTile | undefined;
	}

	let { terrainTile }: Props = $props();

	const { terrainStore, tileStore, admin } = useTerrain();
	const flowEdges = useEdges();

	const terrain = $derived(terrainTile ? $terrainStore.data[terrainTile.terrain_id] : undefined);
	const tile = $derived(terrainTile ? $tileStore.data[terrainTile.tile_id] : undefined);

	let isUpdating = $state(false);
	let changes = $state<TerrainTile | undefined>(undefined);
	let currentTerrainTileId = $state<string | undefined>(undefined);

	$effect(() => {
		if (terrainTile && terrainTile.id !== currentTerrainTileId) {
			currentTerrainTileId = terrainTile.id;
			changes = clone(terrainTile);
		}
	});

	function onsubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!changes || isUpdating) return;

		const terrainTileId = changes.id;
		const edgeId = createTerrainTileEdgeId(changes);
		isUpdating = true;

		admin
			.updateTerrainTile(terrainTileId, {
				spawn_weight: changes.spawn_weight,
				min_cluster_size: changes.min_cluster_size,
				max_cluster_size: changes.max_cluster_size,
			})
			.then(() => {
				// 저장 성공
			})
			.catch((error: Error) => {
				console.error('Failed to update terrain tile:', error);
			})
			.finally(() => {
				isUpdating = false;
			});
	}

	function onclickCancel() {
		if (!terrainTile) return;

		const edgeId = createTerrainTileEdgeId(terrainTile);
		flowEdges.update((es) => es.map((e) => (e.id === edgeId ? { ...e, selected: false } : e)));
	}
</script>

<Panel position="top-right">
	<Card class="w-80 py-4">
		<CardContent class="px-4">
			{#if changes && terrain && tile}
				<form {onsubmit} class="space-y-4">
					<div class="space-y-2">
						<InputGroup>
							<InputGroupAddon align="inline-start">
								<InputGroupText>생성 가중치</InputGroupText>
							</InputGroupAddon>
							<InputGroupInput type="number" step="1" min="0" bind:value={changes.spawn_weight} />
						</InputGroup>

						<InputGroup>
							<InputGroupAddon align="inline-start">
								<InputGroupText>군집 크기</InputGroupText>
							</InputGroupAddon>
							<InputGroupInput
								type="number"
								step="1"
								min="1"
								placeholder="최소"
								bind:value={changes.min_cluster_size}
							/>
							<InputGroupText>~</InputGroupText>
							<InputGroupInput
								type="number"
								step="1"
								min="1"
								placeholder="최대"
								bind:value={changes.max_cluster_size}
							/>
							<InputGroupAddon align="inline-end">
								<InputGroupText>개</InputGroupText>
							</InputGroupAddon>
						</InputGroup>
					</div>

					<div class="flex justify-end gap-2">
						<Button type="button" variant="outline" onclick={onclickCancel} disabled={isUpdating}>
							취소
						</Button>
						<Button type="submit" disabled={isUpdating}>
							{isUpdating ? getActionString('saving') : getActionString('save')}
						</Button>
					</div>
				</form>
			{/if}
		</CardContent>
	</Card>
</Panel>
