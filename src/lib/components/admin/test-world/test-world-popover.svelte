<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Kbd, KbdGroup } from '$lib/components/ui/kbd';
	import { IconX } from '@tabler/icons-svelte';
	import World from '$lib/components/app/world/world.svelte';
	import TestWorldCommand from './test-world-command.svelte';
	import TestWorldMarker from './test-world-marker.svelte';
	import TestWorldPanel from './test-world-panel.svelte';
	import { useWorldTest, TEST_WORLD_ID } from '$lib/hooks/use-world';
	import { useScenario } from '$lib/hooks/use-scenario';

	const { store, toggleOpen, setOpen, setModalPosition, init } = useWorldTest();
	const { fetchAllStatus } = useScenario();

	// fetchAll 완료 후 테스트 데이터 초기화
	$effect(() => {
		if ($fetchAllStatus === 'success') {
			init();
		}
	});

	let modalRef = $state<HTMLDivElement | undefined>(undefined);
	let isDragging = $state(false);
	let dragStartX = $state(0);
	let dragStartY = $state(0);
	let modalStartX = $state(0);
	let modalStartY = $state(0);

	// 단축키: Ctrl/Cmd + Shift + P (열기/닫기), ESC (닫기)
	function onkeydown(e: KeyboardEvent) {
		if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'p') {
			e.preventDefault();
			toggleOpen();
		} else if (e.key === 'Escape' && $store.open) {
			e.preventDefault();
			setOpen(false);
		}
	}

	$effect(() => {
		window.addEventListener('keydown', onkeydown);
		return () => window.removeEventListener('keydown', onkeydown);
	});

	// 지형이 선택되었는지 확인
	const hasSelectedTerrain = $derived($store.selectedTerrainId !== undefined);

	function onclick() {
		setOpen(true);
	}

	function onclickClose() {
		setOpen(false);
	}

	// 초기 마운트 시 모달이 중앙에 위치하도록 설정
	$effect(() => {
		if (modalRef && $store.modalX === 0 && $store.modalY === 0) {
			const modalRect = modalRef.getBoundingClientRect();
			const centerX = (window.innerWidth - modalRect.width) / 2;
			const centerY = (window.innerHeight - modalRect.height) / 2;
			setModalPosition(centerX, centerY);
		}
	});

	// 헤더 드래그 시작
	function onmousedownHeader(e: MouseEvent) {
		isDragging = true;
		dragStartX = e.clientX;
		dragStartY = e.clientY;
		modalStartX = $store.modalX;
		modalStartY = $store.modalY;
	}

	// 드래그 중 마우스 이동
	function onmousemove(e: MouseEvent) {
		if (!isDragging || !modalRef) return;

		const deltaX = e.clientX - dragStartX;
		const deltaY = e.clientY - dragStartY;

		let newX = modalStartX + deltaX;
		let newY = modalStartY + deltaY;

		// 화면 경계 제한
		const modalRect = modalRef.getBoundingClientRect();
		const maxX = window.innerWidth - modalRect.width;
		const maxY = window.innerHeight - modalRect.height;

		newX = Math.max(0, Math.min(newX, maxX));
		newY = Math.max(0, Math.min(newY, maxY));

		setModalPosition(newX, newY);
	}

	// 드래그 종료
	function onmouseup() {
		isDragging = false;
	}

	// window에 mousemove, mouseup 이벤트 리스너 등록
	$effect(() => {
		window.addEventListener('mousemove', onmousemove);
		window.addEventListener('mouseup', onmouseup);
		return () => {
			window.removeEventListener('mousemove', onmousemove);
			window.removeEventListener('mouseup', onmouseup);
		};
	});
</script>

<Button variant="outline" size="sm" {onclick}>
	테스트 월드
	<KbdGroup><Kbd>⌘</Kbd><Kbd>⇧</Kbd><Kbd>P</Kbd></KbdGroup>
</Button>

<!-- Modal -->
<div
	bind:this={modalRef}
	class="fixed z-50 flex-col gap-0 rounded-lg border bg-background shadow-lg"
	style="display: {$store.open ? 'flex' : 'none'}; left: {$store.modalX}px; top: {$store.modalY}px;"
>
	<!-- Header -->
	<div class="relative flex shrink-0 items-center justify-between border-b p-2">
		<Button variant="ghost" size="sm" class="cursor-move" onmousedown={onmousedownHeader}>
			테스트 월드
		</Button>
		<Button
			variant="ghost"
			size="icon-sm"
			onclick={onclickClose}
			class="absolute top-1/2 right-2 -translate-y-1/2"
		>
			<IconX class="size-4" />
		</Button>
	</div>

	<!-- Content -->
	<div class="flex flex-1 gap-0">
		<!-- 좌측: 커맨드 목록 -->
		<div class="w-80 shrink-0 border-r">
			<TestWorldCommand />
		</div>

		<!-- 우측: 월드 -->
		<div class="relative flex flex-1 items-center justify-center p-4">
			{#if hasSelectedTerrain}
				<World class="border-0" worldId={TEST_WORLD_ID} debug={$store.debug}>
					<TestWorldMarker />
				</World>
				<TestWorldPanel />
			{:else}
				<p class="text-sm text-muted-foreground">지형을 선택해주세요</p>
			{/if}
		</div>
	</div>
</div>
