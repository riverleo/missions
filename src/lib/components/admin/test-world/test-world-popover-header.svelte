<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { IconBug, IconX, IconLayoutSidebar } from '@tabler/icons-svelte';
	import { useWorldTest } from '$lib/hooks/use-world';
	import { ButtonGroup } from '$lib/components/ui/button-group';
	import { ToggleGroup, ToggleGroupItem } from '$lib/components/ui/toggle-group';

	const { store, setOpen, setModalPosition, setDebug, setPanelsOpen } = useWorldTest();

	const panelsOpen = $derived($store.commandPanelOpen && $store.inspectorPanelOpen);

	let isDragging = $state(false);
	let dragStartX = $state(0);
	let dragStartY = $state(0);
	let modalStartX = $state(0);
	let modalStartY = $state(0);

	function onmousedown(e: MouseEvent) {
		isDragging = true;
		dragStartX = e.clientX;
		dragStartY = e.clientY;
		modalStartX = $store.modalX;
		modalStartY = $store.modalY;
	}

	function onclick() {
		setOpen(false);
	}

	function onmousemove(e: MouseEvent) {
		if (!isDragging) return;

		const deltaX = e.clientX - dragStartX;
		const deltaY = e.clientY - dragStartY;

		const newX = Math.max(0, modalStartX + deltaX);
		const newY = Math.max(0, modalStartY + deltaY);

		setModalPosition(newX, newY);
	}

	function onmouseup() {
		isDragging = false;
	}

	$effect(() => {
		window.addEventListener('mousemove', onmousemove);
		window.addEventListener('mouseup', onmouseup);
		return () => {
			window.removeEventListener('mousemove', onmousemove);
			window.removeEventListener('mouseup', onmouseup);
		};
	});
</script>

<div class="relative flex shrink-0 items-center justify-between border-b p-2">
	<div class="flex items-center gap-2">
		<Button variant="ghost" size="sm" class="cursor-move" {onmousedown}>테스트 월드</Button>
	</div>
	<div class="flex items-center gap-2">
		<ToggleGroup
			size="sm"
			type="multiple"
			value={[...(panelsOpen ? ['panels'] : []), ...($store.debug ? ['debug'] : [])]}
			onValueChange={(values) => {
				setPanelsOpen(values.includes('panels'));
				setDebug(values.includes('debug'));
			}}
		>
			<ToggleGroupItem value="panels" size="sm">
				<IconLayoutSidebar />
			</ToggleGroupItem>
			<ToggleGroupItem value="debug" size="sm">
				<IconBug />
			</ToggleGroupItem>
		</ToggleGroup>
		<ButtonGroup>
			<Button variant="ghost" size="icon-sm" {onclick}>
				<IconX />
			</Button>
		</ButtonGroup>
	</div>
</div>
