<script lang="ts">
	import '@xyflow/svelte/dist/style.css';
	import {
		SvelteFlow,
		Controls,
		Background,
		BackgroundVariant,
		MiniMap,
		useNodes,
	} from '@xyflow/svelte';
	import type { Node, Edge, Connection } from '@xyflow/svelte';
	import { mode } from 'mode-watcher';
	import { page } from '$app/state';
	import { useNarrative } from '$lib/hooks/use-narrative.svelte';
	import NarrativeNode from './narrative-node.svelte';
	import NarrativeDiceRollNode from './narrative-dice-roll-node.svelte';
	import NarrativePanel from './narrative-panel.svelte';
	import NarrativeNodePanel from './narrative-node-panel.svelte';
	import NarrativeDiceRollPanel from './narrative-dice-roll-panel.svelte';
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
	import type { NarrativeNode as NarrativeNodeType, NarrativeDiceRoll } from '$lib/types';

	const narrativeId = $derived(page.params.narrativeId);
	const { store, admin } = useNarrative();
	const flowNodes = useNodes();

	const currentNarrative = $derived($store.data?.find((n) => n.id === narrativeId));
	const narrativeNodes = $derived(currentNarrative?.narrative_nodes ?? []);
	const narrativeDiceRolls = $derived(currentNarrative?.narrative_dice_rolls ?? []);


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
		narrativeNode: NarrativeNode,
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
				const narrativeNode = sourceNode.data.narrativeNode as NarrativeNodeType;
				const narrativeDiceRoll = targetNode.data.narrativeDiceRoll as NarrativeDiceRoll;

				// text 타입: narrative_node의 narrative_dice_roll_id 업데이트
				if (narrativeNode.type === 'text') {
					await admin.updateNode(narrativeNodeId, {
						narrative_dice_roll_id: narrativeDiceRollId,
					});

					// 로컬 데이터 업데이트
					narrativeNode.narrative_dice_roll_id = narrativeDiceRollId;

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

					await admin.updateChoice(choiceId, {
						narrative_dice_roll_id: narrativeDiceRollId,
					});

					// 로컬 데이터 업데이트
					const choice = narrativeNode.narrative_node_choices?.find((c) => c.id === choiceId);
					if (choice) {
						choice.narrative_dice_roll_id = narrativeDiceRollId;

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
				const narrativeNode = targetNode.data.narrativeNode as NarrativeNodeType;
				const handle = connection.sourceHandle;

				if (handle === 'success') {
					await admin.updateNarrativeDiceRoll(narrativeDiceRollId, {
						success_narrative_node_id: narrativeNodeId,
					});

					// 로컬 데이터 업데이트
					narrativeDiceRoll.success_narrative_node_id = narrativeNodeId;

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
					await admin.updateNarrativeDiceRoll(narrativeDiceRollId, {
						failure_narrative_node_id: narrativeNodeId,
					});

					// 로컬 데이터 업데이트
					narrativeDiceRoll.failure_narrative_node_id = narrativeNodeId;

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
					await admin.updateNode(nodeId, { narrative_dice_roll_id: null });
				}
				// 2. narrative_node_choice → narrative_dice_roll 엣지
				else if (isNarrativeNodeChoiceToNarrativeDiceRollEdge(edge.id)) {
					const { narrativeNodeChoiceId } = parseNarrativeNodeChoiceToNarrativeDiceRollEdgeId(edge.id);
					await admin.updateChoice(narrativeNodeChoiceId, { narrative_dice_roll_id: null });
				}
				// 3. narrative_dice_roll → success 엣지
				else if (isNarrativeDiceRollToSuccessEdge(edge.id)) {
					const { narrativeDiceRollId } = parseNarrativeDiceRollToSuccessEdgeId(edge.id);
					await admin.updateNarrativeDiceRoll(narrativeDiceRollId, { success_narrative_node_id: null });
				}
				// 4. narrative_dice_roll → failure 엣지
				else if (isNarrativeDiceRollToFailureEdge(edge.id)) {
					const { narrativeDiceRollId } = parseNarrativeDiceRollToFailureEdgeId(edge.id);
					await admin.updateNarrativeDiceRoll(narrativeDiceRollId, { failure_narrative_node_id: null });
				}
			}

			// 노드 삭제 처리
			for (const node of nodesToDelete) {
				if (node.type === 'narrativeNode') {
					const narrativeNodeId = parseNarrativeNodeId(node.id);
					await admin.removeNode(narrativeNodeId);
				} else if (node.type === 'narrativeDiceRoll') {
					const narrativeDiceRollId = parseNarrativeDiceRollNodeId(node.id);
					await admin.removeNarrativeDiceRoll(narrativeDiceRollId);
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

	async function convertToNodesAndEdges() {
		const newNodes: Node[] = [];
		const newEdges: Edge[] = [];

		// 노드 타입별 고정 높이
		const NODE_HEIGHT = 180;

		// 1. narrative_node 노드 생성
		narrativeNodes.forEach((narrativeNode) => {
			newNodes.push({
				id: createNarrativeNodeId(narrativeNode),
				type: 'narrativeNode',
				data: { narrativeNode },
				position: { x: 0, y: 0 }, // elkjs가 계산할 예정
				width: 200,
				deletable: true,
			});
		});

		// 2. 현재 내러티브의 모든 narrative_dice_roll을 노드로 생성
		narrativeDiceRolls.forEach((narrativeDiceRollData) => {
			newNodes.push({
				id: createNarrativeDiceRollNodeId(narrativeDiceRollData),
				type: 'narrativeDiceRoll',
				data: { narrativeDiceRoll: narrativeDiceRollData },
				position: { x: 0, y: 0 }, // elkjs가 계산할 예정
				width: 110,
				height: 100,
				deletable: true,
			});
		});

		// 3. 엣지 생성
		narrativeNodes.forEach((narrativeNode) => {
			// text 타입이고 narrative_dice_roll_id가 있으면 엣지 생성
			if (narrativeNode.type === 'text' && narrativeNode.narrative_dice_roll_id) {
				const narrativeDiceRoll = narrativeDiceRolls.find((d) => d.id === narrativeNode.narrative_dice_roll_id);
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
			if (narrativeNode.type === 'choice' && narrativeNode.narrative_node_choices) {
				narrativeNode.narrative_node_choices.forEach((narrativeNodeChoice) => {
					if (narrativeNodeChoice.narrative_dice_roll_id) {
						const narrativeDiceRoll = narrativeDiceRolls.find((d) => d.id === narrativeNodeChoice.narrative_dice_roll_id);
						if (!narrativeDiceRoll) return;

						const narrativeNodeId = createNarrativeNodeId(narrativeNode);
						const narrativeDiceRollNodeId = createNarrativeDiceRollNodeId(narrativeDiceRoll);
						newEdges.push({
							id: createNarrativeNodeChoiceToNarrativeDiceRollEdgeId(narrativeNodeChoice, narrativeDiceRoll),
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
				const successNode = narrativeNodes.find(
					(n) => n.id === narrativeDiceRollData.success_narrative_node_id
				);
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
				const failureNode = narrativeNodes.find(
					(n) => n.id === narrativeDiceRollData.failure_narrative_node_id
				);
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

		// elkjs로 레이아웃 계산
		const layoutedNodes = await applyElkLayout(newNodes, newEdges);

		nodes = layoutedNodes;
		edges = newEdges;
	}

	$effect(() => {
		convertToNodesAndEdges();
	});
</script>

<div class="relative flex-1">
	{#if narrativeId}
		<SvelteFlow
			{nodes}
			{edges}
			{nodeTypes}
			{isValidConnection}
			colorMode={mode.current}
			{onconnect}
			{ondelete}
			fitView
		>
			<Controls />
			<Background variant={BackgroundVariant.Dots} />
			<MiniMap />

			{#if selectedNarrativeNode}
				<NarrativeNodePanel narrativeNode={selectedNarrativeNode} />
			{:else if selectedNarrativeDiceRoll}
				<NarrativeDiceRollPanel narrativeDiceRoll={selectedNarrativeDiceRoll} />
			{:else}
				<NarrativePanel {onlayout} />
			{/if}
		</SvelteFlow>
	{/if}
</div>
