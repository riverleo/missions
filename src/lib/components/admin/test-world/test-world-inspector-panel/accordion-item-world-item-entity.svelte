<script lang="ts">
	import { useCharacter, useWorld } from '$lib/hooks';
	import type { WorldItemEntity } from '$lib/components/app/world/entities/world-item-entity';
	import type { WorldContext } from '$lib/components/app/world/context';
	import { getNameWithId } from '$lib/utils/label';
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

	const { getOrUndefinedCharacter } = useCharacter();
	const { worldItemStore, getOrUndefinedWorldCharacter } = useWorld();

	const item = $derived(entity.item);
	const worldItem = $derived($worldItemStore.data[entity.instanceId]);
	const itemLabel = $derived(getNameWithId(item?.name, entity.instanceId, '아이템'));

	const holderCharacterLabel = $derived.by(() => {
		if (!worldItem?.world_character_id) return undefined;

		const worldCharacter = getOrUndefinedWorldCharacter(worldItem.world_character_id);
		if (!worldCharacter) {
			return getNameWithId(undefined, worldItem.world_character_id, '알 수 없음');
		}

		const characterName = getOrUndefinedCharacter(worldCharacter.character_id)?.name;
		return getNameWithId(characterName, worldItem.world_character_id, '알 수 없음');
	});
</script>

<AccordionItem value={entity.id}>
	<AccordionTrigger class="gap-3 py-3 text-xs">
		<div class="flex flex-1 items-center justify-between">
			<div>
				{itemLabel}
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
		<AccordionContentItem label="소유 캐릭터">
			{holderCharacterLabel ?? '없음'}
		</AccordionContentItem>
	</AccordionContent>
</AccordionItem>
