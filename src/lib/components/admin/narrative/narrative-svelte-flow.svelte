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
	import { useDiceRoll } from '$lib/hooks/use-dice-roll.svelte';
	import NarrativeNode from './narrative-node.svelte';
	import DiceRollNode from './dice-roll-node.svelte';
	import NarrativePanel from './narrative-panel.svelte';
	import NarrativeNodePanel from './narrative-node-panel.svelte';
	import DiceRollPanel from './dice-roll-panel.svelte';
	import { applyElkLayout } from '$lib/utils/elk-layout';
	import {
		createNarrativeNodeId,
		parseNarrativeNodeId,
		createDiceRollNodeId,
		parseDiceRollNodeId,
		createNarrativeNodeToDiceRollEdgeId,
		createNarrativeNodeChoiceToDiceRollEdgeId,
		createDiceRollToSuccessEdgeId,
		createDiceRollToFailureEdgeId,
		parseNarrativeNodeToDiceRollEdgeId,
		parseNarrativeNodeChoiceToDiceRollEdgeId,
		parseDiceRollToSuccessEdgeId,
		parseDiceRollToFailureEdgeId,
		isNarrativeNodeToDiceRollEdge,
		isNarrativeNodeChoiceToDiceRollEdge,
		isDiceRollToSuccessEdge,
		isDiceRollToFailureEdge,
	} from '$lib/utils/flow-id';
	import type { NarrativeNode as NarrativeNodeType, DiceRoll } from '$lib/types';

	const narrativeId = $derived(page.params.narrativeId);
	const { store, admin } = useNarrative();
	const { store: diceRollStore, admin: diceRollAdmin } = useDiceRoll();
	const flowNodes = useNodes();

	const diceRolls = $derived($diceRollStore.data ?? []);
	const currentNarrative = $derived($store.data?.find((n) => n.id === narrativeId));
	const narrativeNodes = $derived(currentNarrative?.narrative_nodes ?? []);

	// 선택된 노드 추적
	const selectedNode = $derived(flowNodes.current.find((n) => n.selected));
	const selectedNarrativeNode = $derived(
		selectedNode?.type === 'narrativeNode'
			? narrativeNodes.find((n) => createNarrativeNodeId(n) === selectedNode.id)
			: undefined
	);
	const selectedDiceRoll = $derived(
		selectedNode?.type === 'diceRoll'
			? diceRolls.find((d) => createDiceRollNodeId(d) === selectedNode.id)
			: undefined
	);

	const nodeTypes = {
		narrativeNode: NarrativeNode,
		diceRoll: DiceRollNode,
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

		// dice_roll → dice_roll 연결 차단
		if (sourceNode.type === 'diceRoll' && targetNode.type === 'diceRoll') {
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
		// 단, diceRoll 타입의 target은 여러 연결을 받을 수 있음
		if (targetNode.type !== 'diceRoll') {
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

			// dice_roll → dice_roll 연결 차단
			if (sourceNode.type === 'diceRoll' && targetNode.type === 'diceRoll') {
				console.warn('주사위 굴림끼리는 연결할 수 없습니다.');
				return;
			}

			// 1. narrative_node → dice_roll 연결
			if (sourceNode.type === 'narrativeNode' && targetNode.type === 'diceRoll') {
				const narrativeNodeId = parseNarrativeNodeId(connection.source);
				const diceRollId = parseDiceRollNodeId(connection.target);
				const narrativeNode = sourceNode.data.narrativeNode as NarrativeNodeType;
				const diceRoll = targetNode.data.diceRoll as DiceRoll;

				// text 타입: narrative_node의 dice_roll_id 업데이트
				if (narrativeNode.type === 'text') {
					await admin.updateNode(narrativeNodeId, {
						dice_roll_id: diceRollId,
					});

					// 로컬 데이터 업데이트
					narrativeNode.dice_roll_id = diceRollId;

					// 엣지 추가
					edges = [
						...edges,
						{
							id: createNarrativeNodeToDiceRollEdgeId(narrativeNode, diceRoll),
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
						dice_roll_id: diceRollId,
					});

					// 로컬 데이터 업데이트
					const choice = narrativeNode.narrative_node_choices?.find((c) => c.id === choiceId);
					if (choice) {
						choice.dice_roll_id = diceRollId;

						// 엣지 추가
						edges = [
							...edges,
							{
								id: createNarrativeNodeChoiceToDiceRollEdgeId(choice, diceRoll),
								source: connection.source,
								sourceHandle: choiceId,
								target: connection.target,
								deletable: true,
							},
						];
					}
				}
			}
			// 2. dice_roll → narrative_node 연결 (success/failure)
			else if (sourceNode.type === 'diceRoll' && targetNode.type === 'narrativeNode') {
				const diceRollId = parseDiceRollNodeId(connection.source);
				const narrativeNodeId = parseNarrativeNodeId(connection.target);
				const diceRoll = sourceNode.data.diceRoll as DiceRoll;
				const narrativeNode = targetNode.data.narrativeNode as NarrativeNodeType;
				const handle = connection.sourceHandle;

				if (handle === 'success') {
					await diceRollAdmin.update(diceRollId, {
						success_narrative_node_id: narrativeNodeId,
					});

					// 로컬 데이터 업데이트
					diceRoll.success_narrative_node_id = narrativeNodeId;

					// 엣지 추가
					edges = [
						...edges,
						{
							id: createDiceRollToSuccessEdgeId(diceRoll, narrativeNode),
							source: connection.source,
							sourceHandle: 'success',
							target: connection.target,
							deletable: true,
							style: 'stroke: #22c55e',
						},
					];
				} else if (handle === 'failure') {
					await diceRollAdmin.update(diceRollId, {
						failure_narrative_node_id: narrativeNodeId,
					});

					// 로컬 데이터 업데이트
					diceRoll.failure_narrative_node_id = narrativeNodeId;

					// 엣지 추가
					edges = [
						...edges,
						{
							id: createDiceRollToFailureEdgeId(diceRoll, narrativeNode),
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
				// 1. narrative_node → dice_roll 엣지
				if (isNarrativeNodeToDiceRollEdge(edge.id)) {
					const { nodeId } = parseNarrativeNodeToDiceRollEdgeId(edge.id);
					await admin.updateNode(nodeId, { dice_roll_id: null });
				}
				// 2. narrative_node_choice → dice_roll 엣지
				else if (isNarrativeNodeChoiceToDiceRollEdge(edge.id)) {
					const { narrativeNodeChoiceId } = parseNarrativeNodeChoiceToDiceRollEdgeId(edge.id);
					await admin.updateChoice(narrativeNodeChoiceId, { dice_roll_id: null });
				}
				// 3. dice_roll → success 엣지
				else if (isDiceRollToSuccessEdge(edge.id)) {
					const { diceRollId } = parseDiceRollToSuccessEdgeId(edge.id);
					await diceRollAdmin.update(diceRollId, { success_narrative_node_id: null });
				}
				// 4. dice_roll → failure 엣지
				else if (isDiceRollToFailureEdge(edge.id)) {
					const { diceRollId } = parseDiceRollToFailureEdgeId(edge.id);
					await diceRollAdmin.update(diceRollId, { failure_narrative_node_id: null });
				}
			}

			// 노드 삭제 처리
			for (const node of nodesToDelete) {
				if (node.type === 'narrativeNode') {
					const narrativeNodeId = parseNarrativeNodeId(node.id);
					await admin.removeNode(narrativeNodeId);
				} else if (node.type === 'diceRoll') {
					const diceRollId = parseDiceRollNodeId(node.id);
					await diceRollAdmin.remove(diceRollId);
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

		// 2. 현재 내러티브와 연결된 dice_roll만 수집
		const connectedDiceRollIds = new Set<string>();
		narrativeNodes.forEach((narrativeNode) => {
			if (narrativeNode.type === 'text' && narrativeNode.dice_roll_id) {
				connectedDiceRollIds.add(narrativeNode.dice_roll_id);
			}
			if (narrativeNode.type === 'choice' && narrativeNode.narrative_node_choices) {
				narrativeNode.narrative_node_choices.forEach((choice) => {
					if (choice.dice_roll_id) {
						connectedDiceRollIds.add(choice.dice_roll_id);
					}
				});
			}
		});

		// dice_roll에서 참조하는 narrative_node_id도 포함
		diceRolls.forEach((diceRoll) => {
			const hasSuccessRef = diceRoll.success_narrative_node_id &&
				narrativeNodes.some((n) => n.id === diceRoll.success_narrative_node_id);
			const hasFailureRef = diceRoll.failure_narrative_node_id &&
				narrativeNodes.some((n) => n.id === diceRoll.failure_narrative_node_id);

			if (hasSuccessRef || hasFailureRef) {
				connectedDiceRollIds.add(diceRoll.id);
			}
		});

		// 연결된 dice_roll만 노드로 생성
		const connectedDiceRolls = diceRolls.filter((d) => connectedDiceRollIds.has(d.id));
		connectedDiceRolls.forEach((diceRollData) => {
			newNodes.push({
				id: createDiceRollNodeId(diceRollData),
				type: 'diceRoll',
				data: { diceRoll: diceRollData },
				position: { x: 0, y: 0 }, // elkjs가 계산할 예정
				width: 110,
				height: 100,
				deletable: true,
			});
		});

		// 3. 엣지 생성
		narrativeNodes.forEach((narrativeNode) => {
			// text 타입이고 dice_roll_id가 있으면 엣지 생성
			if (narrativeNode.type === 'text' && narrativeNode.dice_roll_id) {
				const diceRoll = connectedDiceRolls.find((d) => d.id === narrativeNode.dice_roll_id);
				if (!diceRoll) return;

				const narrativeNodeId = createNarrativeNodeId(narrativeNode);
				const diceRollNodeId = createDiceRollNodeId(diceRoll);
				newEdges.push({
					id: createNarrativeNodeToDiceRollEdgeId(narrativeNode, diceRoll),
					source: narrativeNodeId,
					target: diceRollNodeId,
					deletable: true,
				});
			}

			// choice 타입이면 각 narrativeNodeChoice의 dice_roll_id로 엣지 생성
			if (narrativeNode.type === 'choice' && narrativeNode.narrative_node_choices) {
				narrativeNode.narrative_node_choices.forEach((narrativeNodeChoice) => {
					if (narrativeNodeChoice.dice_roll_id) {
						const diceRoll = connectedDiceRolls.find((d) => d.id === narrativeNodeChoice.dice_roll_id);
						if (!diceRoll) return;

						const narrativeNodeId = createNarrativeNodeId(narrativeNode);
						const diceRollNodeId = createDiceRollNodeId(diceRoll);
						newEdges.push({
							id: createNarrativeNodeChoiceToDiceRollEdgeId(narrativeNodeChoice, diceRoll),
							source: narrativeNodeId,
							sourceHandle: narrativeNodeChoice.id,
							target: diceRollNodeId,
							deletable: true,
						});
					}
				});
			}
		});

		// 4. dice_roll의 success/failure 참조를 시각화 (연결된 dice_roll만)
		connectedDiceRolls.forEach((diceRollData) => {
			const diceRollNodeId = createDiceRollNodeId(diceRollData);

			if (diceRollData.success_narrative_node_id) {
				const successNode = narrativeNodes.find(
					(n) => n.id === diceRollData.success_narrative_node_id
				);
				if (!successNode) return;

				const successNodeId = createNarrativeNodeId(successNode);
				newEdges.push({
					id: createDiceRollToSuccessEdgeId(diceRollData, successNode),
					source: diceRollNodeId,
					sourceHandle: 'success',
					target: successNodeId,
					deletable: true,
					style: 'stroke: #22c55e',
				});
			}

			if (diceRollData.failure_narrative_node_id) {
				const failureNode = narrativeNodes.find(
					(n) => n.id === diceRollData.failure_narrative_node_id
				);
				if (!failureNode) return;

				const failureNodeId = createNarrativeNodeId(failureNode);
				newEdges.push({
					id: createDiceRollToFailureEdgeId(diceRollData, failureNode),
					source: diceRollNodeId,
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
			{:else if selectedDiceRoll}
				<DiceRollPanel diceRoll={selectedDiceRoll} />
			{:else}
				<NarrativePanel {onlayout} />
			{/if}
		</SvelteFlow>
	{/if}
</div>
