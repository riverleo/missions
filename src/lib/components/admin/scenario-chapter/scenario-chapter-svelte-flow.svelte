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
	import type { ScenarioChapter } from '$lib/types';
	import ScenarioChapterNode from './scenario-chapter-node.svelte';
	import ScenarioChapterFlowPanel from './scenario-chapter-flow-panel.svelte';
	import ScenarioChapterDetailPanel from './scenario-chapter-detail-panel.svelte';
	import { useScenarioChapter } from '$lib/hooks/use-scenario-chapter';
	import { sort } from 'radash';
	import { applyElkLayout } from '$lib/utils/elk-layout';
	import { toTreeMap } from '$lib/utils';

	const { store, admin } = useScenarioChapter();
	const flowNodes = useNodes();
	const nodesInitialized = useNodesInitialized();
	const { screenToFlowPosition } = useSvelteFlow();

	// 레이아웃 적용 여부 추적
	let layoutApplied = $state(false);
	// 노드 생성 중 effect 건너뛰기 플래그
	let skipConvertEffect = $state(false);

	const nodeTypes = {
		scenarioChapter: ScenarioChapterNode,
	};

	const scenarioChapters = $derived($store.data ?? []);

	let nodes = $state<Node[]>([]);
	let edges = $state<Edge[]>([]);

	// 선택된 노드 추적
	const selectedNode = $derived(flowNodes.current.find((n) => n.selected));
	const selectedScenarioChapter = $derived(
		selectedNode
			? scenarioChapters.find((c: ScenarioChapter) => c.id === selectedNode.id)
			: undefined
	);

	function onupdateScenarioChapter(scenarioChapter: ScenarioChapter) {
		// 노드 레이블 업데이트
		const node = nodes.find((n) => n.id === scenarioChapter.id);
		if (node && node.data) {
			const data = node.data as { label: string; scenarioChapter: ScenarioChapter };
			data.label = scenarioChapter.title;
			data.scenarioChapter.title = scenarioChapter.title;
			data.scenarioChapter.display_order_in_scenario = scenarioChapter.display_order_in_scenario;
		}

		// 선택 해제
		flowNodes.update((ns) =>
			ns.map((n) => (n.id === scenarioChapter.id ? { ...n, selected: false } : n))
		);
	}

	async function onconnect(connection: Connection) {
		try {
			// target이 연결되는 챕터 (자식), source가 부모 챕터
			const targetScenarioChapter = scenarioChapters.find(
				(c: ScenarioChapter) => c.id === connection.target
			);
			if (!targetScenarioChapter) return;

			await admin.update(connection.target, {
				parent_scenario_chapter_id: connection.source,
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
			console.error('Failed to connect scenario chapter:', error);
		}
	}

	async function ondelete({
		nodes: nodesToDelete,
		edges: edgesToDelete,
	}: {
		nodes: Node[];
		edges: Edge[];
	}) {
		try {
			// 엣지 삭제 처리
			for (const edge of edgesToDelete) {
				await admin.update(edge.target, {
					parent_scenario_chapter_id: null,
				});
			}

			// 노드 삭제 처리
			for (const node of nodesToDelete) {
				await admin.remove(node.id);
			}

			// 로컬 노드 제거
			nodes = nodes.filter((n) => !nodesToDelete.find((nd) => nd.id === n.id));

			// 로컬 엣지 제거 (명시적으로 삭제된 엣지 + 삭제된 노드와 연결된 엣지)
			edges = edges.filter(
				(e) =>
					!edgesToDelete.find((ed) => ed.id === e.id) &&
					!nodesToDelete.find((nd) => nd.id === e.source || nd.id === e.target)
			);
		} catch (error) {
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
		const { clientX, clientY } = 'changedTouches' in event ? event.changedTouches[0] : event;
		const position = screenToFlowPosition({ x: clientX, y: clientY });

		// 스토어 업데이트 중 effect 건너뛰기
		skipConvertEffect = true;

		try {
			// 새 챕터 생성 (소스 노드를 부모로 설정)
			const newScenarioChapter = await admin.create({
				parent_scenario_chapter_id: sourceNode.id,
			});

			// 모든 업데이트 완료 후 노드/엣지 재생성
			skipConvertEffect = false;
			convertToNodesAndEdges(scenarioChapters);

			// 새 노드의 위치를 드롭 위치로 설정
			if (newScenarioChapter) {
				nodes = nodes.map((n) => (n.id === newScenarioChapter.id ? { ...n, position } : n));
				// 레이아웃 재적용 방지
				layoutApplied = true;
			}
		} catch (error) {
			skipConvertEffect = false;
			console.error('Failed to create scenario chapter on edge drop:', error);
		}
	};

	async function convertToNodesAndEdges(scenarioChapters: ScenarioChapter[]) {
		const newNodes: Node[] = [];
		const newEdges: Edge[] = [];

		// display_order_in_scenario로 정렬된 챕터 사용
		const sortedScenarioChapters = sort(scenarioChapters, (c) => c.display_order_in_scenario);

		// 트리 위치 계산
		const treeMap = toTreeMap(
			scenarioChapters,
			'parent_scenario_chapter_id',
			'display_order_in_scenario'
		);

		// 노드 생성
		sortedScenarioChapters.forEach((scenarioChapter) => {
			const treeNode = treeMap.get(scenarioChapter.id);
			newNodes.push({
				id: scenarioChapter.id,
				type: 'scenarioChapter',
				data: {
					label: scenarioChapter.title,
					scenarioChapter,
					position: treeNode?.toString(),
				},
				position: { x: 0, y: 0 }, // elkjs가 계산할 예정
				deletable: true,
			});

			// 엣지 생성 (parent -> child)
			if (scenarioChapter.parent_scenario_chapter_id) {
				newEdges.push({
					id: `${scenarioChapter.parent_scenario_chapter_id}-${scenarioChapter.id}`,
					source: scenarioChapter.parent_scenario_chapter_id,
					target: scenarioChapter.id,
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
		scenarioChapters;

		if (skipConvertEffect) return;
		convertToNodesAndEdges(scenarioChapters);
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

	{#if selectedScenarioChapter}
		<ScenarioChapterDetailPanel
			scenarioChapter={selectedScenarioChapter}
			onupdate={onupdateScenarioChapter}
		/>
	{:else}
		<ScenarioChapterFlowPanel {onlayout} />
	{/if}
</SvelteFlow>
