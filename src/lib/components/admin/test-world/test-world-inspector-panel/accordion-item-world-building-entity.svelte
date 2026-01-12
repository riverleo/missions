<script lang="ts">
	import type { WorldBuildingEntity } from '$lib/components/app/world/entities/world-building-entity';
	import type { WorldContext } from '$lib/components/app/world/context';
	import { useWorld } from '$lib/hooks/use-world';
	import { useBuilding } from '$lib/hooks/use-building';
	import { AccordionItem, AccordionTrigger, AccordionContent } from '$lib/components/ui/accordion';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import { IconTrash } from '@tabler/icons-svelte';
	import AccordionContentItem from './accordion-content-item.svelte';

	interface Props {
		entity: WorldBuildingEntity;
		worldContext?: WorldContext;
	}

	let { entity, worldContext }: Props = $props();

	const { worldBuildingStore } = useWorld();
	const { store: buildingStore } = useBuilding();

	const worldBuilding = $derived($worldBuildingStore.data[entity.instanceId]);
	const building = $derived(
		worldBuilding ? $buildingStore.data[worldBuilding.building_id] : undefined
	);
</script>

<AccordionItem value={entity.id}>
	<AccordionTrigger class="gap-3 py-3 text-xs">
		<div class="flex flex-1 items-center justify-between">
			<div>
				{building?.name ?? '건물'} ({entity.id.split('-')[0]})
				<Badge variant="secondary">건물</Badge>
			</div>
			<Button
				size="icon-sm"
				variant="ghost"
				class="size-3"
				onclick={(e) => {
					e.stopPropagation();
					worldContext?.deleteWorldBuilding(entity.instanceId);
				}}
			>
				<IconTrash />
			</Button>
		</div>
	</AccordionTrigger>
	<AccordionContent class="flex flex-col gap-3 pb-3">
		<Separator />
		<AccordionContentItem label="셀 좌표">
			({worldBuilding?.cell_x ?? 0}, {worldBuilding?.cell_y ?? 0})
		</AccordionContentItem>
	</AccordionContent>
</AccordionItem>
