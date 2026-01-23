<script lang="ts">
	import { useWorldTest } from '$lib/hooks/use-world';
	import {
		Menubar,
		MenubarMenu,
		MenubarTrigger,
		MenubarContent,
		MenubarItem,
		MenubarCheckboxItem,
		MenubarShortcut,
		MenubarSeparator,
	} from '$lib/components/ui/menubar';
	import type { WorldContext } from '$lib/components/app/world/context';

	import { vectorUtils } from '$lib/utils/vector';

	interface Props {
		worldContext?: WorldContext;
	}

	let { worldContext }: Props = $props();

	const { store, setOpen, setModalScreenVector, setDebug, setOpenPanel, save, reset } =
		useWorldTest();

	let isDragging = $state(false);
	let dragStartX = $state(0);
	let dragStartY = $state(0);
	let modalStartX = $state(0);
	let modalStartY = $state(0);

	function onmousedown(e: MouseEvent) {
		isDragging = true;
		dragStartX = e.clientX;
		dragStartY = e.clientY;
		modalStartX = $store.modalScreenVector.x;
		modalStartY = $store.modalScreenVector.y;
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

		setModalScreenVector(vectorUtils.createScreenVector(newX, newY));
	}

	function onmouseup() {
		isDragging = false;
	}

	function onsave() {
		// 모든 엔티티 저장
		worldContext?.saveAllEntities();
		// 스토리지에 저장
		save();
	}

	function onreset() {
		reset(worldContext);
	}

	$effect(() => {
		window.addEventListener('mousemove', onmousemove);
		window.addEventListener('mouseup', onmouseup);
		return () => {
			window.removeEventListener('mousemove', onmousemove);
			window.removeEventListener('mouseup', onmouseup);
		};
	});

	function onkeydown(e: KeyboardEvent) {
		const key = e.key.toLowerCase();

		if (e.metaKey && e.shiftKey && key === 'p') {
			e.preventDefault();
			setOpen(false);
		} else if (e.metaKey && e.shiftKey && key === 's') {
			e.preventDefault();
			onsave();
		} else if (e.metaKey && e.shiftKey && key === 'd') {
			e.preventDefault();
			setDebug(!$store.debug);
		} else if (e.metaKey && key === 'b') {
			e.preventDefault();
			setOpenPanel(!$store.openPanel);
		}
	}
</script>

<svelte:window {onkeydown} />

<div class="border-b p-1">
	<Menubar class="border-0" {onmousedown}>
		<MenubarMenu>
			<MenubarTrigger><strong>테스트 월드</strong></MenubarTrigger>
			<MenubarContent>
				<MenubarItem onclick={() => setOpen(false)}>
					창 닫기
					<MenubarShortcut>⌘⇧P</MenubarShortcut>
				</MenubarItem>
			</MenubarContent>
		</MenubarMenu>
		<MenubarMenu>
			<MenubarTrigger>파일</MenubarTrigger>
			<MenubarContent>
				<MenubarItem onclick={onreset}>월드 초기화</MenubarItem>
				<MenubarSeparator />
				<MenubarItem onclick={onsave}>
					저장
					<MenubarShortcut>⌘⇧S</MenubarShortcut>
				</MenubarItem>
			</MenubarContent>
		</MenubarMenu>
		<MenubarMenu>
			<MenubarTrigger>보기</MenubarTrigger>
			<MenubarContent>
				<MenubarCheckboxItem
					checked={$store.openPanel}
					onCheckedChange={(checked: boolean) => setOpenPanel(checked)}
				>
					사이드바
					<MenubarShortcut>⌘B</MenubarShortcut>
				</MenubarCheckboxItem>
				<MenubarCheckboxItem
					checked={$store.debug}
					onCheckedChange={(checked: boolean) => setDebug(checked)}
				>
					디버그 모드
					<MenubarShortcut>⌘⇧D</MenubarShortcut>
				</MenubarCheckboxItem>
			</MenubarContent>
		</MenubarMenu>
	</Menubar>
</div>
