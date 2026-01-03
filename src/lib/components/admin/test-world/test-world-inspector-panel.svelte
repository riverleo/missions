<script lang="ts">
	import { useWorldTest } from '$lib/hooks/use-world';
	import {
		Accordion,
		AccordionContent,
		AccordionItem,
		AccordionTrigger,
	} from '$lib/components/ui/accordion';
	import {
		InputGroup,
		InputGroupAddon,
		InputGroupText,
		InputGroupInput,
		InputGroupButton,
	} from '$lib/components/ui/input-group';

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

<Accordion type="single" value="world" class="px-4">
	<AccordionItem value="world">
		<AccordionTrigger>월드 정보</AccordionTrigger>
		<AccordionContent>
			<InputGroup>
				<InputGroupAddon>
					<InputGroupText>틱</InputGroupText>
				</InputGroupAddon>
				<InputGroupInput type="number" value={currentTick} disabled />
				<InputGroupAddon align="inline-end">
					<InputGroupButton onclick={onResetTick}>초기화</InputGroupButton>
				</InputGroupAddon>
			</InputGroup>
		</AccordionContent>
	</AccordionItem>
</Accordion>
