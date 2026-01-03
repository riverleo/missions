<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Kbd, KbdGroup } from '$lib/components/ui/kbd';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import World from '$lib/components/app/world/world.svelte';
	import TestWorldCommandPanel from './test-world-command-panel.svelte';
	import TestWorldMarker from './test-world-marker.svelte';
	import TestWorldPopoverHeader from './test-world-popover-header.svelte';
	import TestWorldInspectorPanel from './test-world-inspector-panel.svelte';
	import { useWorldTest, TEST_WORLD_ID } from '$lib/hooks/use-world';
	import { useScenario } from '$lib/hooks/use-scenario';
	import { WORLD_WIDTH, WORLD_HEIGHT } from '$lib/components/app/world/constants';
	import type { WorldContext } from '$lib/components/app/world/context';

	const { store, setOpen, setModalPosition, init } = useWorldTest();
	const { fetchAllStatus } = useScenario();

	let worldContext = $state<WorldContext | undefined>(undefined);

	// fetchAll 완료 후 테스트 데이터 초기화
	$effect(() => {
		if ($fetchAllStatus === 'success') {
			init();
		}
	});

	let modalRef = $state<HTMLDivElement | undefined>(undefined);

	// 단축키: Ctrl/Cmd + Shift + P (열기/닫기), ESC (닫기)
	function onkeydown(e: KeyboardEvent) {
		if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'p') {
			e.preventDefault();
			setOpen(!$store.open);
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

	// 초기 마운트 시 모달이 중앙에 위치하도록 설정
	$effect(() => {
		if (modalRef && $store.modalX === 0 && $store.modalY === 0) {
			const modalRect = modalRef.getBoundingClientRect();
			const centerX = (window.innerWidth - modalRect.width) / 2;
			const centerY = (window.innerHeight - modalRect.height) / 2;
			setModalPosition(centerX, centerY);
		}
	});
</script>

<Button variant="outline" size="sm" {onclick}>
	테스트 월드
	<KbdGroup><Kbd>⌘</Kbd><Kbd>⇧</Kbd><Kbd>P</Kbd></KbdGroup>
</Button>

<div
	bind:this={modalRef}
	class="fixed z-50 flex-col gap-0 rounded-lg border bg-background shadow-lg"
	style="display: {$store.open ? 'flex' : 'none'}; left: {$store.modalX}px; top: {$store.modalY}px;"
>
	<!-- Header -->
	<TestWorldPopoverHeader />

	<!-- Content -->
	<div class="flex flex-1 gap-0">
		<!-- 좌측: 커맨드 목록 -->
		{#if $store.commandPanelOpen}
			<ScrollArea class="w-80 shrink-0 border-r" style="height: {WORLD_HEIGHT + 32}px;">
				<TestWorldCommandPanel />
			</ScrollArea>
		{/if}

		<!-- 중앙: 월드 -->
		<div class="relative flex flex-1 items-center justify-center p-4">
			{#if hasSelectedTerrain}
				<World class="border-0" worldId={TEST_WORLD_ID} debug={$store.debug} bind:worldContext>
					<TestWorldMarker />
				</World>
			{:else}
				<div
					class="flex items-center justify-center"
					style="width: {WORLD_WIDTH}px; height: {WORLD_HEIGHT}px;"
				>
					<p class="text-sm text-muted-foreground">지형을 선택해주세요</p>
				</div>
			{/if}
		</div>

		<!-- 우측: 인스펙터 패널 -->
		{#if $store.inspectorPanelOpen}
			<ScrollArea class="w-80 shrink-0 border-l" style="height: {WORLD_HEIGHT + 32}px;">
				<TestWorldInspectorPanel {worldContext} />
			</ScrollArea>
		{/if}
	</div>
</div>
