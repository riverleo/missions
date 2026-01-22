<script lang="ts">
	import type { WorldCharacterEntity } from '$lib/components/app/world/entities/world-character-entity';
	import type { WorldContext } from '$lib/components/app/world/context';
	import { useWorld } from '$lib/hooks/use-world';
	import { useCharacter } from '$lib/hooks/use-character';
	import { AccordionItem, AccordionTrigger, AccordionContent } from '$lib/components/ui/accordion';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import { IconTrash } from '@tabler/icons-svelte';
	import AccordionContentItem from './accordion-content-item.svelte';

	interface Props {
		entity: WorldCharacterEntity;
		worldContext?: WorldContext;
	}

	let { entity, worldContext }: Props = $props();

	const { worldCharacterStore } = useWorld();
	const { characterStore, needStore } = useCharacter();

	const worldCharacter = $derived($worldCharacterStore.data[entity.instanceId]);
	const character = $derived(
		worldCharacter ? $characterStore.data[worldCharacter.character_id] : undefined
	);
	const needs = $derived(Object.values(entity.worldCharacterNeeds));
</script>

<AccordionItem value={entity.id}>
	<AccordionTrigger class="gap-3 py-3 text-xs">
		<div class="flex flex-1 items-center justify-between">
			<div>
				{character?.name ?? '캐릭터'} ({entity.id.split('-')[0]})
				<Badge variant="secondary">캐릭터</Badge>
			</div>
			<Button
				size="icon-sm"
				variant="ghost"
				class="size-3"
				onclick={(e) => {
					e.stopPropagation();
					worldContext?.deleteWorldCharacter(entity.instanceId);
				}}
			>
				<IconTrash />
			</Button>
		</div>
	</AccordionTrigger>
	<AccordionContent class="flex flex-col gap-3 pb-3">
		<Separator />
		<AccordionContentItem label="좌표">
			({Math.round(entity.x)}, {Math.round(entity.y)})
		</AccordionContentItem>
		{#each needs as need}
			{@const needData = $needStore.data[need.need_id]}
			<AccordionContentItem label={needData?.name ?? need.need_id}>
				{need.value} / {needData?.max_value ?? 100}
			</AccordionContentItem>
		{/each}
	</AccordionContent>
</AccordionItem>
