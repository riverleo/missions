<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { IconBug, IconEraser, IconX } from '@tabler/icons-svelte';
	import { useWorldTest } from '$lib/hooks/use-world';
	import { ButtonGroup } from '$lib/components/ui/button-group';
	import { ToggleGroup } from '$lib/components/ui/toggle-group';
	import { Toggle } from '$lib/components/ui/toggle';

	const { store, setOpen, setModalPosition, setDebug, setEraser } = useWorldTest();

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
	<Button variant="ghost" size="sm" class="cursor-move" {onmousedown}>테스트 월드</Button>
	<ButtonGroup>
		<ToggleGroup type="multiple">
			<Toggle size="sm" pressed={$store.debug} onPressedChange={(pressed) => setDebug(pressed)}>
				<IconBug />
			</Toggle>
			<Toggle size="sm" pressed={$store.eraser} onPressedChange={(pressed) => setEraser(pressed)}>
				<IconEraser />
			</Toggle>
		</ToggleGroup>
		<ButtonGroup>
			<Button variant="ghost" size="icon-sm" {onclick}>
				<IconX class="size-4" />
			</Button>
		</ButtonGroup>
	</ButtonGroup>
</div>
