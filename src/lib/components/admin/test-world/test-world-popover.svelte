<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Kbd, KbdGroup } from '$lib/components/ui/kbd';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import World from '$lib/components/app/world/world.svelte';
	import TestWorldCommandPanel from './test-world-command-panel.svelte';
	import TestWorldMarker from './test-world-marker.svelte';
	import TestWorldPopoverHeader from './test-world-popover-header.svelte';
	import TestWorldInspectorPanel from './test-world-inspector-panel';
	import { useWorldTest } from '$lib/hooks/use-world';
	import { useScenario } from '$lib/hooks/use-scenario';
	import { vectorUtils } from '$lib/utils/vector';
	import { WORLD_WIDTH, WORLD_HEIGHT, TEST_WORLD_ID } from '$lib/constants';
	import type { WorldContext } from '$lib/components/app/world/context';

	const { store, setOpen, setModalScreenVector, init } = useWorldTest();
	const { fetchAllStatus } = useScenario();

	let worldContext = $state<WorldContext | undefined>(undefined);

	// fetchAll 완료 후 테스트 데이터 초기화
	$effect(() => {
		if ($fetchAllStatus === 'success') {
			init();
		}
	});

	let modalRef = $state<HTMLDivElement | undefined>(undefined);
	const hasSelectedTerrain = $derived($store.selectedTerrainId !== undefined);

	function onclick() {
		setOpen(true);
	}

	// 초기 마운트 시 모달이 중앙에 위치하도록 설정
	$effect(() => {
		if (modalRef && $store.modalScreenVector.x === 0 && $store.modalScreenVector.y === 0) {
			const modalRect = modalRef.getBoundingClientRect();
			const centerX = (window.innerWidth - modalRect.width) / 2;
			const centerY = (window.innerHeight - modalRect.height) / 2;
			setModalScreenVector(vectorUtils.createScreenVector(centerX, centerY));
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
	style="display: {$store.open ? 'flex' : 'none'}; left: {$store.modalScreenVector
		.x}px; top: {$store.modalScreenVector.y}px;"
>
	<!-- Header -->
	<TestWorldPopoverHeader {worldContext} />

	<!-- Content -->
	<div class="flex flex-1 gap-0">
		<!-- 좌측: 커맨드 목록 -->
		{#if $store.openPanel}
			<ScrollArea class="w-80 shrink-0 border-r" style="height: {WORLD_HEIGHT + 32}px;">
				<TestWorldCommandPanel {worldContext} />
			</ScrollArea>
		{/if}

		<!-- 중앙: 월드 -->
		<div class="relative flex flex-1 items-center justify-center p-4">
			{#if hasSelectedTerrain}
				<World class="border-0" worldId={TEST_WORLD_ID} debug={$store.debug} bind:worldContext>
					<TestWorldMarker {worldContext} />
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
		{#if $store.openPanel}
			<ScrollArea class="w-80 shrink-0 border-l" style="height: {WORLD_HEIGHT + 32}px;">
				<TestWorldInspectorPanel {worldContext} />
			</ScrollArea>
		{/if}
	</div>
</div>
