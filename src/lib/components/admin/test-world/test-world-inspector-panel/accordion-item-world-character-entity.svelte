<script lang="ts">
	import type { WorldCharacterEntity } from '$lib/components/app/world/entities/world-character-entity';
	import { useWorldTest, useWorld } from '$lib/hooks/use-world';
	import { useCharacter } from '$lib/hooks/use-character';
	import { AccordionItem, AccordionTrigger, AccordionContent } from '$lib/components/ui/accordion';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import { IconTrash } from '@tabler/icons-svelte';
	import TestWorldInspectorItem from './test-world-inspector-item.svelte';

	interface Props {
		entity: WorldCharacterEntity;
	}

	let { entity }: Props = $props();

	const { removeWorldCharacter } = useWorldTest();
	const { worldCharacterStore } = useWorld();
	const { store: characterStore } = useCharacter();

	const worldCharacter = $derived($worldCharacterStore.data[entity.id]);
	const character = $derived(
		worldCharacter ? $characterStore.data[worldCharacter.character_id] : undefined
	);
</script>

<AccordionItem value={entity.toEntityId()}>
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
					removeWorldCharacter(entity.id);
				}}
			>
				<IconTrash />
			</Button>
		</div>
	</AccordionTrigger>
	<AccordionContent class="flex flex-col gap-3 pb-3">
		<Separator />
		<TestWorldInspectorItem label="좌표">
			({Math.round(entity.x)}, {Math.round(entity.y)})
		</TestWorldInspectorItem>
	</AccordionContent>
</AccordionItem>
