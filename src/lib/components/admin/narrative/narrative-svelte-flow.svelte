<script lang="ts">
	import { useNarrative } from '$lib/hooks';
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
	import { untrack } from 'svelte';
	import NarrativeNodeNode from './narrative-node-node.svelte';
	import NarrativeDiceRollNode from './narrative-dice-roll-node.svelte';
	import NarrativeActionPanel from './narrative-action-panel.svelte';
	import NarrativeNodePanel from './narrative-node-panel.svelte';
	import NarrativeDiceRollNodePanel from './narrative-dice-roll-node-panel.svelte';
	import { applyElkLayout } from '$lib/utils/elk-layout';
	import {
		createNarrativeNodeId,
		parseNarrativeNodeId,
		createNarrativeDiceRollNodeId,
		parseNarrativeDiceRollNodeId,
		createNarrativeNodeToNarrativeDiceRollEdgeId,
		createNarrativeNodeChoiceToNarrativeDiceRollEdgeId,
		createNarrativeDiceRollToSuccessEdgeId,
		createNarrativeDiceRollToFailureEdgeId,
		parseNarrativeNodeToNarrativeDiceRollEdgeId,
		parseNarrativeNodeChoiceToNarrativeDiceRollEdgeId,
		parseNarrativeDiceRollToSuccessEdgeId,
		parseNarrativeDiceRollToFailureEdgeId,
		isNarrativeNodeToNarrativeDiceRollEdge,
		isNarrativeNodeChoiceToNarrativeDiceRollEdge,
		isNarrativeDiceRollToSuccessEdge,
		isNarrativeDiceRollToFailureEdge,
	} from '$lib/utils/flow-id';
	import type {
		NarrativeNode,
		NarrativeDiceRoll,
		NarrativeId,
		NarrativeNodeId,
		NarrativeDiceRollId,
		NarrativeNodeChoiceId,
		ScenarioId,
	} from '$lib/types';

	const scenarioId = $derived(page.params.scenarioId as ScenarioId);
	const narrativeId = $derived(page.params.narrativeId as NarrativeId);
	const { narrativeNodeStore, narrativeDiceRollStore, narrativeNodeChoiceStore, admin } =
		useNarrative();
	const flowNodes = useNodes();
	const nodesInitialized = useNodesInitialized();
	const { screenToFlowPosition } = useSvelteFlow();

	// 레이아웃 적용 여부 추적
	let layoutApplied = $state(false);
	// 노드 생성 중 effect 건너뛰기 플래그
	let skipConvertEffect = $state(false);

	// Record에서 현재 narrative의 데이터 필터링
	const narrativeNodes = $derived(
		Object.values($narrativeNodeStore.data).filter((n) => n.narrative_id === narrativeId)
	);
	const narrativeDiceRolls = $derived(
		Object.values($narrativeDiceRollStore.data).filter((d) => d.narrative_id === narrativeId)
	);

	// 선택된 노드 추적
	const selectedNode = $derived(flowNodes.current.find((n) => n.selected));
	const selectedNarrativeNode = $derived(
		selectedNode?.type === 'narrativeNode'
			? narrativeNodes.find((n) => createNarrativeNodeId(n) === selectedNode.id)
			: undefined
	);
	const selectedNarrativeDiceRoll = $derived(
		selectedNode?.type === 'narrativeDiceRoll'
			? narrativeDiceRolls.find((d) => createNarrativeDiceRollNodeId(d) === selectedNode.id)
			: undefined
	);

	const nodeTypes = {
		narrativeNode: NarrativeNodeNode,
		narrativeDiceRoll: NarrativeDiceRollNode,
	};

	let nodes = $state<Node[]>([]);
	let edges = $state<Edge[]>([]);

	function isValidConnection(connection: Connection | Edge) {
		const sourceNode = nodes.find((n) => n.id === connection.source);
		const targetNode = nodes.find((n) => n.id === connection.target);

		if (!sourceNode || !targetNode) return false;

		// narrative_node → narrative_node 연결 차단
		if (sourceNode.type === 'narrativeNode' && targetNode.type === 'narrativeNode') {
			return false;
		}

		// narrative_dice_roll → narrative_dice_roll 연결 차단
		if (sourceNode.type === 'narrativeDiceRoll' && targetNode.type === 'narrativeDiceRoll') {
			return false;
		}

		// source 노드의 해당 핸들에서 이미 나가는 엣지가 있는지 확인
		const existingSourceEdge = edges.find((edge) => {
			if (connection.sourceHandle) {
				// sourceHandle이 지정된 경우 (예: success, failure)
				return edge.source === connection.source && edge.sourceHandle === connection.sourceHandle;
			}
			// sourceHandle이 없는 경우 source만 확인
			return edge.source === connection.source && !edge.sourceHandle;
		});

		if (existingSourceEdge) {
			return false;
		}

		// target 노드의 해당 핸들에 이미 들어오는 엣지가 있는지 확인
		// 단, narrativeDiceRoll 타입의 target은 여러 연결을 받을 수 있음
		if (targetNode.type !== 'narrativeDiceRoll') {
			const existingTargetEdge = edges.find((edge) => {
				if (connection.targetHandle) {
					// targetHandle이 지정된 경우
					return edge.target === connection.target && edge.targetHandle === connection.targetHandle;
				}
				// targetHandle이 없는 경우 target만 확인
				return edge.target === connection.target && !edge.targetHandle;
			});

			if (existingTargetEdge) {
				return false;
			}
		}

		return true;
	}

	function onlayout(layoutedNodes: Node[], layoutedEdges: Edge[]) {
		nodes = layoutedNodes;
		edges = layoutedEdges;
	}

	async function onconnect(connection: Connection) {
		try {
			const sourceNode = nodes.find((n) => n.id === connection.source);
			const targetNode = nodes.find((n) => n.id === connection.target);

			if (!sourceNode || !targetNode) {
				console.warn('Source or target node not found');
				return;
			}

			// narrative_dice_roll → narrative_dice_roll 연결 차단
			if (sourceNode.type === 'narrativeDiceRoll' && targetNode.type === 'narrativeDiceRoll') {
				console.warn('주사위 굴림끼리는 연결할 수 없습니다.');
				return;
			}

			// 1. narrative_node → narrative_dice_roll 연결
			if (sourceNode.type === 'narrativeNode' && targetNode.type === 'narrativeDiceRoll') {
				const narrativeNodeId = parseNarrativeNodeId(connection.source);
				const narrativeDiceRollId = parseNarrativeDiceRollNodeId(connection.target);
				const narrativeNode = sourceNode.data.narrativeNode as NarrativeNode;
				const narrativeDiceRoll = targetNode.data.narrativeDiceRoll as NarrativeDiceRoll;

				// text 타입: narrative_node의 narrative_dice_roll_id 업데이트
				if (narrativeNode.type === 'text') {
					await admin.updateNarrativeNode(narrativeNodeId as NarrativeNodeId, {
						narrative_dice_roll_id: narrativeDiceRollId as NarrativeDiceRollId,
					});

					// 엣지 추가
					edges = [
						...edges,
						{
							id: createNarrativeNodeToNarrativeDiceRollEdgeId(narrativeNode, narrativeDiceRoll),
							source: connection.source,
							target: connection.target,
							deletable: true,
						},
					];
				}
				// choice 타입: sourceHandle로 어느 choice인지 확인
				else if (narrativeNode.type === 'choice') {
					const choiceId = connection.sourceHandle;
					if (!choiceId) return;

					await admin.updateNarrativeNodeChoice(choiceId as NarrativeNodeChoiceId, {
						narrative_dice_roll_id: narrativeDiceRollId as NarrativeDiceRollId,
					});

					const choice = $narrativeNodeChoiceStore.data?.[choiceId as NarrativeNodeChoiceId];
					if (choice) {
						// 엣지 추가
						edges = [
							...edges,
							{
								id: createNarrativeNodeChoiceToNarrativeDiceRollEdgeId(choice, narrativeDiceRoll),
								source: connection.source,
								sourceHandle: choiceId,
								target: connection.target,
								deletable: true,
							},
						];
					}
				}
			}
			// 2. narrative_dice_roll → narrative_node 연결 (success/failure)
			else if (sourceNode.type === 'narrativeDiceRoll' && targetNode.type === 'narrativeNode') {
				const narrativeDiceRollId = parseNarrativeDiceRollNodeId(connection.source);
				const narrativeNodeId = parseNarrativeNodeId(connection.target);
				const narrativeDiceRoll = sourceNode.data.narrativeDiceRoll as NarrativeDiceRoll;
				const narrativeNode = targetNode.data.narrativeNode as NarrativeNode;
				const handle = connection.sourceHandle;

				if (handle === 'success') {
					await admin.updateNarrativeDiceRoll(narrativeDiceRollId as NarrativeDiceRollId, {
						success_narrative_node_id: narrativeNodeId as NarrativeNodeId,
					});

					// 엣지 추가
					edges = [
						...edges,
						{
							id: createNarrativeDiceRollToSuccessEdgeId(narrativeDiceRoll, narrativeNode),
							source: connection.source,
							sourceHandle: 'success',
							target: connection.target,
							deletable: true,
							style: 'stroke: #22c55e',
						},
					];
				} else if (handle === 'failure') {
					await admin.updateNarrativeDiceRoll(narrativeDiceRollId as NarrativeDiceRollId, {
						failure_narrative_node_id: narrativeNodeId as NarrativeNodeId,
					});

					// 엣지 추가
					edges = [
						...edges,
						{
							id: createNarrativeDiceRollToFailureEdgeId(narrativeDiceRoll, narrativeNode),
							source: connection.source,
							sourceHandle: 'failure',
							target: connection.target,
							deletable: true,
							style: 'stroke: #ef4444',
						},
					];
				}
			}
		} catch (error) {
			console.error('Failed to connect:', error);
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
				// 1. narrative_node → narrative_dice_roll 엣지
				if (isNarrativeNodeToNarrativeDiceRollEdge(edge.id)) {
					const { nodeId } = parseNarrativeNodeToNarrativeDiceRollEdgeId(edge.id);
					await admin.updateNarrativeNode(nodeId as NarrativeNodeId, {
						narrative_dice_roll_id: null,
					});
				}
				// 2. narrative_node_choice → narrative_dice_roll 엣지
				else if (isNarrativeNodeChoiceToNarrativeDiceRollEdge(edge.id)) {
					const { narrativeNodeChoiceId } = parseNarrativeNodeChoiceToNarrativeDiceRollEdgeId(
						edge.id
					);
					await admin.updateNarrativeNodeChoice(narrativeNodeChoiceId as NarrativeNodeChoiceId, {
						narrative_dice_roll_id: null,
					});
				}
				// 3. narrative_dice_roll → success 엣지
				else if (isNarrativeDiceRollToSuccessEdge(edge.id)) {
					const { narrativeDiceRollId } = parseNarrativeDiceRollToSuccessEdgeId(edge.id);
					await admin.updateNarrativeDiceRoll(narrativeDiceRollId as NarrativeDiceRollId, {
						success_narrative_node_id: null,
					});
				}
				// 4. narrative_dice_roll → failure 엣지
				else if (isNarrativeDiceRollToFailureEdge(edge.id)) {
					const { narrativeDiceRollId } = parseNarrativeDiceRollToFailureEdgeId(edge.id);
					await admin.updateNarrativeDiceRoll(narrativeDiceRollId as NarrativeDiceRollId, {
						failure_narrative_node_id: null,
					});
				}
			}

			// 노드 삭제 처리
			for (const node of nodesToDelete) {
				if (node.type === 'narrativeNode') {
					const narrativeNodeId = parseNarrativeNodeId(node.id);
					await admin.removeNarrativeNode(narrativeNodeId as NarrativeNodeId);
				} else if (node.type === 'narrativeDiceRoll') {
					const narrativeDiceRollId = parseNarrativeDiceRollNodeId(node.id);
					await admin.removeNarrativeDiceRoll(narrativeDiceRollId as NarrativeDiceRollId);
				}
			}

			// 로컬 노드 제거
			nodes = nodes.filter((n) => !nodesToDelete.find((nd) => nd.id === n.id));

			// 로컬 엣지 제거
			edges = edges.filter(
				(e) =>
					!edgesToDelete.find((ed) => ed.id === e.id) &&
					!nodesToDelete.find((nd) => nd.id === e.source || nd.id === e.target)
			);
		} catch (error) {
			console.error('Failed to delete:', error);
		}
	}

	const onconnectend: OnConnectEnd = async (event, connectionState) => {
		// 유효한 연결이면 무시 (onconnect에서 처리)
		if (connectionState.isValid) return;
		if (!narrativeId || !scenarioId) return;

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
			let newNodeId: string | undefined;

			// narrativeNode에서 드래그 → narrativeDiceRoll 생성
			if (sourceNode.type === 'narrativeNode') {
				const narrativeNode = sourceNode.data.narrativeNode as NarrativeNode;
				const sourceHandle = connectionState.fromHandle?.id;

				// 새 주사위 굴림 생성
				const newDiceRoll = await admin.createNarrativeDiceRoll({
					narrative_id: narrativeId,
					scenario_id: scenarioId,
				});
				newNodeId = createNarrativeDiceRollNodeId(newDiceRoll);

				// text 타입: narrative_node의 narrative_dice_roll_id 업데이트
				if (narrativeNode.type === 'text') {
					await admin.updateNarrativeNode(narrativeNode.id, {
						narrative_dice_roll_id: newDiceRoll.id,
					});
				}
				// choice 타입: sourceHandle로 어느 choice인지 확인
				else if (narrativeNode.type === 'choice' && sourceHandle) {
					await admin.updateNarrativeNodeChoice(sourceHandle as NarrativeNodeChoiceId, {
						narrative_dice_roll_id: newDiceRoll.id,
					});
				}
			}
			// narrativeDiceRoll에서 드래그 → narrativeNode 생성
			else if (sourceNode.type === 'narrativeDiceRoll') {
				const narrativeDiceRoll = sourceNode.data.narrativeDiceRoll as NarrativeDiceRoll;
				const sourceHandle = connectionState.fromHandle?.id; // 'success' or 'failure'

				if (!sourceHandle || (sourceHandle !== 'success' && sourceHandle !== 'failure')) {
					skipConvertEffect = false;
					return;
				}

				// 새 노드 생성
				const newNarrativeNode = await admin.createNarrativeNode({
					narrative_id: narrativeId,
					scenario_id: scenarioId,
					type: 'text',
				});
				newNodeId = createNarrativeNodeId(newNarrativeNode);

				// 주사위 굴림의 success/failure 연결 업데이트
				if (sourceHandle === 'success') {
					await admin.updateNarrativeDiceRoll(narrativeDiceRoll.id, {
						success_narrative_node_id: newNarrativeNode.id,
					});
				} else {
					await admin.updateNarrativeDiceRoll(narrativeDiceRoll.id, {
						failure_narrative_node_id: newNarrativeNode.id,
					});
				}
			}

			// 모든 업데이트 완료 후 노드/엣지 재생성
			skipConvertEffect = false;
			convertToNodesAndEdges();

			// 새 노드의 위치를 드롭 위치로 설정
			if (newNodeId) {
				nodes = nodes.map((n) => (n.id === newNodeId ? { ...n, position } : n));
				// 레이아웃 재적용 방지
				layoutApplied = true;
			}
		} catch (error) {
			skipConvertEffect = false;
			console.error('Failed to create node on edge drop:', error);
		}
	};

	async function convertToNodesAndEdges() {
		// 현재 선택된 노드 ID들 저장 (untrack으로 의존성 추적 방지)
		const selectedNodeIds = new Set(
			untrack(() => flowNodes.current.filter((n) => n.selected).map((n) => n.id))
		);

		const newNodes: Node[] = [];
		const newEdges: Edge[] = [];

		// 1. narrative_node 노드 생성
		narrativeNodes.forEach((narrativeNode) => {
			const id = createNarrativeNodeId(narrativeNode);
			newNodes.push({
				id,
				type: 'narrativeNode',
				data: { narrativeNode },
				position: { x: 0, y: 0 }, // elkjs가 계산할 예정
				deletable: true,
				selected: selectedNodeIds.has(id),
			});
		});

		// 2. 현재 내러티브의 모든 narrative_dice_roll을 노드로 생성
		narrativeDiceRolls.forEach((narrativeDiceRollData) => {
			const id = createNarrativeDiceRollNodeId(narrativeDiceRollData);
			newNodes.push({
				id,
				type: 'narrativeDiceRoll',
				data: { narrativeDiceRoll: narrativeDiceRollData },
				position: { x: 0, y: 0 }, // elkjs가 계산할 예정
				deletable: true,
				selected: selectedNodeIds.has(id),
			});
		});

		// 3. 엣지 생성
		narrativeNodes.forEach((narrativeNode) => {
			// text 타입이고 narrative_dice_roll_id가 있으면 엣지 생성
			if (narrativeNode.type === 'text' && narrativeNode.narrative_dice_roll_id) {
				const narrativeDiceRoll =
					$narrativeDiceRollStore.data?.[narrativeNode.narrative_dice_roll_id];
				if (!narrativeDiceRoll) return;

				const narrativeNodeId = createNarrativeNodeId(narrativeNode);
				const narrativeDiceRollNodeId = createNarrativeDiceRollNodeId(narrativeDiceRoll);
				newEdges.push({
					id: createNarrativeNodeToNarrativeDiceRollEdgeId(narrativeNode, narrativeDiceRoll),
					source: narrativeNodeId,
					target: narrativeDiceRollNodeId,
					deletable: true,
				});
			}

			// choice 타입이면 각 narrativeNodeChoice의 narrative_dice_roll_id로 엣지 생성
			if (narrativeNode.type === 'choice') {
				const choices = Object.values($narrativeNodeChoiceStore.data).filter(
					(c) => c.narrative_node_id === narrativeNode.id
				);
				choices.forEach((narrativeNodeChoice) => {
					if (narrativeNodeChoice.narrative_dice_roll_id) {
						const narrativeDiceRoll =
							$narrativeDiceRollStore.data?.[narrativeNodeChoice.narrative_dice_roll_id];
						if (!narrativeDiceRoll) return;

						const narrativeNodeId = createNarrativeNodeId(narrativeNode);
						const narrativeDiceRollNodeId = createNarrativeDiceRollNodeId(narrativeDiceRoll);
						newEdges.push({
							id: createNarrativeNodeChoiceToNarrativeDiceRollEdgeId(
								narrativeNodeChoice,
								narrativeDiceRoll
							),
							source: narrativeNodeId,
							sourceHandle: narrativeNodeChoice.id,
							target: narrativeDiceRollNodeId,
							deletable: true,
						});
					}
				});
			}
		});

		// 4. narrative_dice_roll의 success/failure 참조를 시각화
		narrativeDiceRolls.forEach((narrativeDiceRollData) => {
			const narrativeDiceRollNodeId = createNarrativeDiceRollNodeId(narrativeDiceRollData);

			if (narrativeDiceRollData.success_narrative_node_id) {
				const successNode =
					$narrativeNodeStore.data?.[narrativeDiceRollData.success_narrative_node_id];
				if (!successNode) return;

				const successNodeId = createNarrativeNodeId(successNode);
				newEdges.push({
					id: createNarrativeDiceRollToSuccessEdgeId(narrativeDiceRollData, successNode),
					source: narrativeDiceRollNodeId,
					sourceHandle: 'success',
					target: successNodeId,
					deletable: true,
					style: 'stroke: #22c55e',
				});
			}

			if (narrativeDiceRollData.failure_narrative_node_id) {
				const failureNode =
					$narrativeNodeStore.data?.[narrativeDiceRollData.failure_narrative_node_id];
				if (!failureNode) return;

				const failureNodeId = createNarrativeNodeId(failureNode);
				newEdges.push({
					id: createNarrativeDiceRollToFailureEdgeId(narrativeDiceRollData, failureNode),
					source: narrativeDiceRollNodeId,
					sourceHandle: 'failure',
					target: failureNodeId,
					deletable: true,
					style: 'stroke: #ef4444',
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
		narrativeNodes;
		narrativeDiceRolls;
		$narrativeNodeChoiceStore.data;

		if (skipConvertEffect) return;
		convertToNodesAndEdges();
	});

	// 노드 측정 완료 후 레이아웃 적용
	$effect(() => {
		if (nodesInitialized.current && !layoutApplied && nodes.length > 0) {
			// flowNodes.current에서 measured 값을 가져와서 레이아웃 적용
			const nodesWithMeasured = flowNodes.current;
			applyElkLayout(nodesWithMeasured, edges).then((layoutedNodes) => {
				nodes = layoutedNodes;
				layoutApplied = true;
			});
		}
	});
</script>

{#if narrativeId}
	<SvelteFlow
		{nodes}
		{edges}
		{nodeTypes}
		{isValidConnection}
		colorMode={mode.current}
		{onconnect}
		{onconnectend}
		{ondelete}
		fitView
	>
		<Controls />
		<Background variant={BackgroundVariant.Dots} />
		<MiniMap />

		{#if selectedNarrativeNode}
			<NarrativeNodePanel narrativeNode={selectedNarrativeNode} />
		{:else if selectedNarrativeDiceRoll}
			<NarrativeDiceRollNodePanel narrativeDiceRoll={selectedNarrativeDiceRoll} />
		{:else}
			<NarrativeActionPanel {onlayout} />
		{/if}
	</SvelteFlow>
{/if}
