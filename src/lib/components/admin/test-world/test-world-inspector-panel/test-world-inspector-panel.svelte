<script lang="ts">
	import { useWorld } from '$lib/hooks/use-world';
	import type { WorldContext } from '$lib/components/app/world/context';
	import type { WorldCharacterEntity } from '$lib/components/app/world/entities/world-character-entity';
	import type { WorldBuildingEntity } from '$lib/components/app/world/entities/world-building-entity';
	import type { WorldItemEntity } from '$lib/components/app/world/entities/world-item-entity';
	import type { WorldTileEntity } from '$lib/components/app/world/entities/world-tile-entity';
	import type { EntityId } from '$lib/types';
	import {
		Accordion,
		AccordionContent,
		AccordionItem,
		AccordionTrigger,
	} from '$lib/components/ui/accordion';
	import AccordionContentItem from './accordion-content-item.svelte';
	import WorldCharacterEntityAccordionItem from './accordion-item-world-character-entity.svelte';
	import WorldBuildingEntityAccordionItem from './accordion-item-world-building-entity.svelte';
	import WorldItemEntityAccordionItem from './accordion-item-world-item-entity.svelte';
	import WorldTileEntityAccordionItem from './accordion-item-world-tile-entity.svelte';

	interface Props {
		worldContext?: WorldContext;
	}

	let { worldContext }: Props = $props();

	const { selectedEntityIdStore, setSelectedEntityId } = useWorld();

	// TODO: 틱 시스템 구현 후 실제 틱 데이터 연결
	const currentTick = $derived(0);

	// WorldContext에서 실시간 엔티티 정보 가져오기
	const entities = $derived(worldContext ? Object.values(worldContext.entities) : []);

	// 아코디언 value (entityId 기반)
	const accordionValue = $derived.by(() => {
		const entityId = $selectedEntityIdStore.entityId;
		if (!entityId) return 'world';

		return entityId;
	});

	function onValueChange(value: string | undefined) {
		if (!value || value === 'world') {
			setSelectedEntityId(undefined);
		} else {
			// value는 EntityId 형태 ("character-{id}", "building-{id}", "item-{id}")
			setSelectedEntityId(value as EntityId);
		}
	}
</script>

<Accordion type="single" value={accordionValue} {onValueChange} class="px-3 py-1">
	<AccordionItem value="world">
		<AccordionTrigger class="py-3 text-xs">월드 정보</AccordionTrigger>
		<AccordionContent class="pb-3">
			<AccordionContentItem label="현재 틱">
				{currentTick} 틱
			</AccordionContentItem>
		</AccordionContent>
	</AccordionItem>

	{#each entities as entity (entity.id)}
		{#if entity.type === 'character'}
			<WorldCharacterEntityAccordionItem entity={entity as WorldCharacterEntity} {worldContext} />
		{:else if entity.type === 'building'}
			<WorldBuildingEntityAccordionItem entity={entity as WorldBuildingEntity} {worldContext} />
		{:else if entity.type === 'item'}
			<WorldItemEntityAccordionItem entity={entity as WorldItemEntity} {worldContext} />
		{:else if entity.type === 'tile'}
			<WorldTileEntityAccordionItem entity={entity as WorldTileEntity} {worldContext} />
		{/if}
	{/each}
</Accordion>
