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
	import { page } from '$app/state';
	import type { ScenarioQuestBranch } from '$lib/types';
	import ScenarioQuestBranchNode from './scenario-quest-branch-node.svelte';
	import ScenarioQuestPanel from './scenario-quest-panel.svelte';
	import ScenarioQuestBranchPanel from './scenario-quest-branch-panel.svelte';
	import { useScenarioQuest } from '$lib/hooks/use-scenario-quest';
	import { sort } from 'radash';
	import { applyElkLayout } from '$lib/utils/elk-layout';
	import { toTreeMap } from '$lib/utils';

	const scenarioQuestId = $derived(page.params.scenarioQuestId);
	const { scenarioQuestBranchStore, admin } = useScenarioQuest();
	const flowNodes = useNodes();
	const nodesInitialized = useNodesInitialized();
	const { screenToFlowPosition } = useSvelteFlow();

	// 레이아웃 적용 여부 추적
	let layoutApplied = $state(false);
	// 노드 생성 중 effect 건너뛰기 플래그
	let skipConvertEffect = $state(false);

	const nodeTypes = {
		scenarioQuestBranch: ScenarioQuestBranchNode,
	};

	const scenarioQuestBranches = $derived(
		Object.values($scenarioQuestBranchStore.data).filter(
			(b) => b.scenario_quest_id === scenarioQuestId
		)
	);

	let nodes = $state<Node[]>([]);
	let edges = $state<Edge[]>([]);

	// 선택된 노드 추적
	const selectedNode = $derived(flowNodes.current.find((n) => n.selected));
	const selectedScenarioQuestBranch = $derived(
		selectedNode ? scenarioQuestBranches.find((b) => b.id === selectedNode.id) : undefined
	);

	function onupdateScenarioQuestBranch(scenarioQuestBranch: ScenarioQuestBranch) {
		// 노드 레이블 업데이트
		const node = nodes.find((n) => n.id === scenarioQuestBranch.id);
		if (node && node.data) {
			const data = node.data as { label: string; scenarioQuestBranch: ScenarioQuestBranch };
			data.label = scenarioQuestBranch.title;
			data.scenarioQuestBranch.title = scenarioQuestBranch.title;
			data.scenarioQuestBranch.display_order_in_scenario_quest =
				scenarioQuestBranch.display_order_in_scenario_quest;
		}

		// 선택 해제
		flowNodes.update((ns) =>
			ns.map((n) => (n.id === scenarioQuestBranch.id ? { ...n, selected: false } : n))
		);
	}

	async function onconnect(connection: Connection) {
		try {
			// target이 연결되는 브랜치 (자식), source가 부모 브랜치
			const targetScenarioQuestBranch = scenarioQuestBranches.find(
				(b) => b.id === connection.target
			);
			if (!targetScenarioQuestBranch) return;

			await admin.updateScenarioQuestBranch(connection.target, {
				parent_scenario_quest_branch_id: connection.source,
			});

			// 로컬 데이터 업데이트
			targetScenarioQuestBranch.parent_scenario_quest_branch_id = connection.source;

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
			console.error('Failed to connect scenario quest branch:', error);
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
				await admin.updateScenarioQuestBranch(edge.target, {
					parent_scenario_quest_branch_id: null,
				});
			}

			// 노드 삭제 처리
			for (const node of nodesToDelete) {
				await admin.removeScenarioQuestBranch(node.id);
			}

			// 모든 업데이트 완료 후 노드/엣지 재생성
			skipConvertEffect = false;
			convertToNodesAndEdges(scenarioQuestBranches);
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
		if (!scenarioQuestId) return;

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
			// 새 브랜치 생성 (소스 노드를 부모로 설정)
			const newScenarioQuestBranch = await admin.createScenarioQuestBranch({
				scenario_quest_id: scenarioQuestId,
				parent_scenario_quest_branch_id: sourceNode.id,
			});

			// 모든 업데이트 완료 후 노드/엣지 재생성
			skipConvertEffect = false;
			convertToNodesAndEdges(scenarioQuestBranches);

			// 새 노드의 위치를 드롭 위치로 설정
			if (newScenarioQuestBranch) {
				nodes = nodes.map((n) => (n.id === newScenarioQuestBranch.id ? { ...n, position } : n));
				// 레이아웃 재적용 방지
				layoutApplied = true;
			}
		} catch (error) {
			skipConvertEffect = false;
			console.error('Failed to create scenario quest branch on edge drop:', error);
		}
	};

	async function convertToNodesAndEdges(scenarioQuestBranches: ScenarioQuestBranch[]) {
		const newNodes: Node[] = [];
		const newEdges: Edge[] = [];

		// display_order_in_scenario_quest로 정렬된 브랜치 사용
		const sortedScenarioQuestBranches = sort(
			scenarioQuestBranches,
			(b) => b.display_order_in_scenario_quest
		);

		// 트리 위치 계산
		const treeMap = toTreeMap(
			scenarioQuestBranches,
			'parent_scenario_quest_branch_id',
			'display_order_in_scenario_quest'
		);

		// 노드 생성
		sortedScenarioQuestBranches.forEach((scenarioQuestBranch) => {
			const treeNode = treeMap.get(scenarioQuestBranch.id);
			newNodes.push({
				id: scenarioQuestBranch.id,
				type: 'scenarioQuestBranch',
				data: {
					label: scenarioQuestBranch.title,
					scenarioQuestBranch,
					position: treeNode?.toString(),
				},
				position: { x: 0, y: 0 }, // elkjs가 계산할 예정
				deletable: true,
			});

			// 엣지 생성 (parent -> child)
			if (scenarioQuestBranch.parent_scenario_quest_branch_id) {
				newEdges.push({
					id: `${scenarioQuestBranch.parent_scenario_quest_branch_id}-${scenarioQuestBranch.id}`,
					source: scenarioQuestBranch.parent_scenario_quest_branch_id,
					target: scenarioQuestBranch.id,
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
		scenarioQuestBranches;

		if (skipConvertEffect) return;
		convertToNodesAndEdges(scenarioQuestBranches);
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

	{#if selectedScenarioQuestBranch}
		<ScenarioQuestBranchPanel
			scenarioQuestBranch={selectedScenarioQuestBranch}
			onupdate={onupdateScenarioQuestBranch}
		/>
	{:else}
		<ScenarioQuestPanel {onlayout} />
	{/if}
</SvelteFlow>
