<script lang="ts">
	import type { WorldItemEntity } from '$lib/components/app/world/entities/world-item-entity';
	import { useWorldTest, useWorld } from '$lib/hooks/use-world';
	import { useItem } from '$lib/hooks/use-item';
	import { AccordionItem, AccordionTrigger, AccordionContent } from '$lib/components/ui/accordion';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import { IconTrash } from '@tabler/icons-svelte';
	import TestWorldInspectorItem from './test-world-inspector-item.svelte';

	interface Props {
		entity: WorldItemEntity;
	}

	let { entity }: Props = $props();

	const { removeWorldItem } = useWorldTest();
	const { worldItemStore } = useWorld();
	const { store: itemStore } = useItem();

	const worldItem = $derived($worldItemStore.data[entity.id]);
	const item = $derived(worldItem ? $itemStore.data[worldItem.item_id] : undefined);
</script>

<AccordionItem value={entity.toEntityId()}>
	<AccordionTrigger class="gap-3 py-3 text-xs">
		<div class="flex flex-1 items-center justify-between">
			<div>
				{item?.name ?? '아이템'} ({entity.id.split('-')[0]})
				<Badge variant="secondary">아이템</Badge>
			</div>
			<Button
				size="icon-sm"
				variant="ghost"
				class="size-3"
				onclick={(e) => {
					e.stopPropagation();
					removeWorldItem(entity.id);
				}}
			>
				<IconTrash />
			</Button>
		</div>
	</AccordionTrigger>
	<AccordionContent class="flex flex-col gap-3 pb-3">
		<Separator />
		<TestWorldInspectorItem label="좌표와 각도">
			({Math.round(entity.x)}, {Math.round(entity.y)}), {Math.round(
				(entity.angle * 180) / Math.PI
			)}°
		</TestWorldInspectorItem>
	</AccordionContent>
</AccordionItem>
