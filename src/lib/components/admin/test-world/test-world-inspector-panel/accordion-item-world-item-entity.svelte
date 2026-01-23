<script lang="ts">
	import type { WorldItemEntity } from '$lib/components/app/world/entities/world-item-entity';
	import type { WorldContext } from '$lib/components/app/world/context';
	import { AccordionItem, AccordionTrigger, AccordionContent } from '$lib/components/ui/accordion';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import { IconTrash } from '@tabler/icons-svelte';
	import AccordionContentItem from './accordion-content-item.svelte';

	interface Props {
		entity: WorldItemEntity;
		worldContext?: WorldContext;
	}

	let { entity, worldContext }: Props = $props();

	const item = $derived(entity.item);
</script>

<AccordionItem value={entity.id}>
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
					worldContext?.deleteWorldItem(entity.instanceId);
				}}
			>
				<IconTrash />
			</Button>
		</div>
	</AccordionTrigger>
	<AccordionContent class="flex flex-col gap-3 pb-3">
		<Separator />
		<AccordionContentItem label="월드 좌표">
			{Math.round(entity.x)}, {Math.round(entity.y)}
		</AccordionContentItem>
		<AccordionContentItem label="각도">
			{Math.round((entity.angle * 180) / Math.PI)}°
		</AccordionContentItem>
		<AccordionContentItem label="내구도">
			{#if entity.durabilityTicks !== undefined}
				{entity.durabilityTicks} / {item?.max_durability_ticks ?? 0}
			{:else}
				영구적
			{/if}
		</AccordionContentItem>
	</AccordionContent>
</AccordionItem>
