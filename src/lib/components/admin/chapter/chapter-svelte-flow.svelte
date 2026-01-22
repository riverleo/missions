<script lang="ts">
	import {
		SvelteFlow,
		Controls,
		Background,
		BackgroundVariant,
		MiniMap,
		useNodes,
		useNodesInitialized,
		useSvelteFlow,
	} from '@xyflow/svelte';
	import type { Node, Edge, Connection, OnConnectEnd } from '@xyflow/svelte';
	import { mode } from 'mode-watcher';
	import type { Chapter, ChapterId } from '$lib/types';
	import ChapterNode from './chapter-node.svelte';
	import ChapterActionPanel from './chapter-action-panel.svelte';
	import ChapterNodePanel from './chapter-node-panel.svelte';
	import { useChapter } from '$lib/hooks/use-chapter';
	import { sort } from 'radash';
	import { applyElkLayout } from '$lib/utils/elk-layout';
	import { toTreeMap } from '$lib/utils';

	const { chapterStore, admin } = useChapter();
	const flowNodes = useNodes();
	const nodesInitialized = useNodesInitialized();
	const { screenToFlowPosition } = useSvelteFlow();

	// 레이아웃 적용 여부 추적
	let layoutApplied = $state(false);
	// 노드 생성 중 effect 건너뛰기 플래그
	let skipConvertEffect = $state(false);

	const nodeTypes = {
		chapter: ChapterNode,
	};

	const chapters = $derived(Object.values($chapterStore.data));

	let nodes = $state<Node[]>([]);
	let edges = $state<Edge[]>([]);

	// 선택된 노드 추적
	const selectedNode = $derived(flowNodes.current.find((n) => n.selected));
	const selectedChapter = $derived(
		selectedNode ? chapters.find((c: Chapter) => c.id === selectedNode.id) : undefined
	);

	function onupdateChapter(chapter: Chapter) {
		// 노드 레이블 업데이트
		const node = nodes.find((n) => n.id === chapter.id);
		if (node && node.data) {
			const data = node.data as { label: string; chapter: Chapter };
			data.label = chapter.title;
			data.chapter.title = chapter.title;
			data.chapter.display_order_in_scenario = chapter.display_order_in_scenario;
		}

		// 선택 해제
		flowNodes.update((ns) => ns.map((n) => (n.id === chapter.id ? { ...n, selected: false } : n)));
	}

	async function onconnect(connection: Connection) {
		try {
			// target이 연결되는 챕터 (자식), source가 부모 챕터
			const targetChapter = chapters.find((c: Chapter) => c.id === connection.target);
			if (!targetChapter) return;

			await admin.updateChapter(connection.target as ChapterId, {
				parent_chapter_id: connection.source,
			});

			// 엣지 추가
			edges = [
				...edges,
				{
					id: `${connection.source}-${connection.target}`,
					source: connection.source,
					target: connection.target,
					deletable: true,
				},
			];
		} catch (error) {
			console.error('Failed to connect chapter:', error);
		}
	}

	async function ondelete({
		nodes: nodesToDelete,
		edges: edgesToDelete,
	}: {
		nodes: Node[];
		edges: Edge[];
	}) {
		// 스토어 업데이트 중 effect 건너뛰기
		skipConvertEffect = true;

		try {
			// 엣지 삭제 처리
			for (const edge of edgesToDelete) {
				await admin.updateChapter(edge.target as ChapterId, {
					parent_chapter_id: null,
				});
			}

			// 노드 삭제 처리
			for (const node of nodesToDelete) {
				await admin.removeChapter(node.id as ChapterId);
			}

			// 모든 업데이트 완료 후 노드/엣지 재생성
			skipConvertEffect = false;
			convertToNodesAndEdges(chapters);
		} catch (error) {
			skipConvertEffect = false;
			console.error('Failed to delete:', error);
		}
	}

	function onlayout(layoutedNodes: Node[], layoutedEdges: Edge[]) {
		nodes = layoutedNodes;
		edges = layoutedEdges;
	}

	const onconnectend: OnConnectEnd = async (event, connectionState) => {
		// 유효한 연결이면 무시 (onconnect에서 처리)
		if (connectionState.isValid) return;

		const sourceNode = connectionState.fromNode;
		if (!sourceNode) return;

		// 마우스/터치 위치를 플로우 좌표로 변환
		const clientX =
			'changedTouches' in event ? (event.changedTouches[0]?.clientX ?? 0) : event.clientX;
		const clientY =
			'changedTouches' in event ? (event.changedTouches[0]?.clientY ?? 0) : event.clientY;
		const position = screenToFlowPosition({ x: clientX, y: clientY });

		// 스토어 업데이트 중 effect 건너뛰기
		skipConvertEffect = true;

		try {
			// 새 챕터 생성 (소스 노드를 부모로 설정)
			const newChapter = await admin.createChapter({
				parent_chapter_id: sourceNode.id,
			});

			// 모든 업데이트 완료 후 노드/엣지 재생성
			skipConvertEffect = false;
			convertToNodesAndEdges(chapters);

			// 새 노드의 위치를 드롭 위치로 설정
			if (newChapter) {
				nodes = nodes.map((n) => (n.id === newChapter.id ? { ...n, position } : n));
				// 레이아웃 재적용 방지
				layoutApplied = true;
			}
		} catch (error) {
			skipConvertEffect = false;
			console.error('Failed to create chapter on edge drop:', error);
		}
	};

	async function convertToNodesAndEdges(chapters: Chapter[]) {
		const newNodes: Node[] = [];
		const newEdges: Edge[] = [];

		// display_order_in_scenario로 정렬된 챕터 사용
		const sortedChapters = sort(chapters, (c) => c.display_order_in_scenario);

		// 트리 위치 계산
		const treeMap = toTreeMap(chapters, 'parent_chapter_id', 'display_order_in_scenario');

		// 노드 생성
		sortedChapters.forEach((chapter) => {
			const treeNode = treeMap.get(chapter.id as ChapterId);
			newNodes.push({
				id: chapter.id,
				type: 'chapter',
				data: {
					label: chapter.title,
					chapter,
					position: treeNode?.toString(),
				},
				position: { x: 0, y: 0 }, // elkjs가 계산할 예정
				deletable: true,
			});

			// 엣지 생성 (parent -> child)
			if (chapter.parent_chapter_id) {
				newEdges.push({
					id: `${chapter.parent_chapter_id}-${chapter.id}`,
					source: chapter.parent_chapter_id,
					target: chapter.id,
					deletable: true,
				});
			}
		});

		nodes = newNodes;
		edges = newEdges;
		layoutApplied = false;
	}

	// 데이터 변경 시 노드/엣지 생성
	$effect(() => {
		// 의존성 추적을 위해 여기서 접근
		chapters;

		if (skipConvertEffect) return;
		convertToNodesAndEdges(chapters);
	});

	// 노드 측정 완료 후 레이아웃 적용
	$effect(() => {
		if (nodesInitialized.current && !layoutApplied && nodes.length > 0) {
			const nodesWithMeasured = flowNodes.current;
			applyElkLayout(nodesWithMeasured, edges).then((layoutedNodes) => {
				nodes = layoutedNodes;
				layoutApplied = true;
			});
		}
	});
</script>

<SvelteFlow
	{nodes}
	{edges}
	{nodeTypes}
	colorMode={mode.current}
	{onconnect}
	{onconnectend}
	{ondelete}
	fitView
>
	<Controls />
	<Background variant={BackgroundVariant.Dots} />
	<MiniMap />

	{#if selectedChapter}
		<ChapterNodePanel chapter={selectedChapter} onupdate={onupdateChapter} />
	{:else}
		<ChapterActionPanel {onlayout} />
	{/if}
</SvelteFlow>
