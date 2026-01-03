<script lang="ts">
	import { useWorldTest } from '$lib/hooks/use-world';
	import {
		Accordion,
		AccordionContent,
		AccordionItem,
		AccordionTrigger,
	} from '$lib/components/ui/accordion';
	import { Button } from '$lib/components/ui/button';
	import { ItemGroup, Item, ItemContent, ItemActions } from '$lib/components/ui/item';

	const { store } = useWorldTest();

	// TODO: 틱 시스템 구현 후 실제 틱 데이터 연결
	const currentTick = $derived(0);

	// TODO: 캐릭터 행동 목록 시스템 구현 후 실제 데이터 연결
	const characterActions = $derived<Array<{ characterId: string; action: string }>>([]);

	function onResetTick() {
		// TODO: 틱 초기화 로직
		console.log('Reset tick');
	}
</script>

<div class="flex flex-col p-4">
	<Accordion type="single" value="world">
		<AccordionItem value="world2">
			<AccordionTrigger>월드</AccordionTrigger>
			<AccordionContent>
				<ItemGroup>
					<Item size="sm" class="p-0">
						<ItemContent>틱: {currentTick}</ItemContent>
						<ItemActions>
							<Button variant="ghost" size="sm" onclick={onResetTick}>초기화</Button>
						</ItemActions>
					</Item>
				</ItemGroup>
			</AccordionContent>
		</AccordionItem>
	</Accordion>
</div>
