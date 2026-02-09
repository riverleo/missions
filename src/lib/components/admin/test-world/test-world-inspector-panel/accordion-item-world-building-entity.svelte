<script lang="ts">
	import { useBuilding, useWorld } from '$lib/hooks';
	import type { WorldBuildingEntity } from '$lib/components/app/world/entities/world-building-entity';
	import type { WorldContext } from '$lib/components/app/world/context';
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

	const { getWorldBuilding } = useWorld();
	const { getOrUndefinedCondition } = useBuilding();

	const worldBuilding = $derived(getWorldBuilding(entity.instanceId));
	const building = $derived(entity.building);
	const conditions = $derived(Object.values(entity.worldBuildingConditions));
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
		{#each conditions as condition}
			{@const conditionData = getOrUndefinedCondition(condition.condition_id)}
			<AccordionContentItem label={conditionData?.name ?? condition.condition_id}>
				{condition.value} / {conditionData?.max_value ?? 100}
			</AccordionContentItem>
		{/each}
	</AccordionContent>
</AccordionItem>
