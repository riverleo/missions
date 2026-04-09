<script lang="ts">
	import { useTerrain, useWorld } from '$lib/hooks';
	import type { WorldTileEntity } from '$lib/components/app/world/entities/world-tile-entity';
	import type { WorldContext } from '$lib/components/app/world/context';
	import { getNameWithId } from '$lib/utils/label';
	import { AccordionItem, AccordionTrigger, AccordionContent } from '$lib/components/ui/accordion';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import { IconTrash } from '@tabler/icons-svelte';
	import AccordionContentItem from './accordion-content-item.svelte';

	interface Props {
		entity: WorldTileEntity;
		worldContext?: WorldContext;
	}

	let { entity, worldContext }: Props = $props();

	const { getWorldTileMap } = useWorld();
	const { tileStore } = useTerrain();

	const worldTileMap = $derived(getWorldTileMap(entity.worldId));
	const tileData = $derived(worldTileMap?.data[entity.instanceId]);
	const tile = $derived(tileData ? $tileStore.data[tileData.tile_id] : undefined);
	const tileLabel = $derived(getNameWithId(tile?.name, entity.instanceId, '타일'));

	// 타일 좌표 파싱
	const coords = $derived(entity.instanceId.split(',').map(Number));
	const tileX = $derived(coords[0] ?? 0);
	const tileY = $derived(coords[1] ?? 0);
</script>

<AccordionItem value={entity.id}>
	<AccordionTrigger class="gap-3 py-3 text-xs">
		<div class="flex flex-1 items-center justify-between">
			<div>
				{tileLabel}
				<Badge variant="secondary">타일</Badge>
			</div>
			<Button
				size="icon-sm"
				variant="ghost"
				class="size-3"
				onclick={(e) => {
					e.stopPropagation();
					worldContext?.deleteTileFromWorldTileMap(entity.instanceId);
				}}
			>
				<IconTrash />
			</Button>
		</div>
	</AccordionTrigger>
	<AccordionContent class="flex flex-col gap-3 pb-3">
		<Separator />
		<AccordionContentItem label="타일 좌표">
			({tileX}, {tileY})
		</AccordionContentItem>
	</AccordionContent>
</AccordionItem>
