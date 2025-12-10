<script lang="ts">
	import '@xyflow/svelte/dist/style.css';
	import { SvelteFlow, Controls, Background, BackgroundVariant, MiniMap } from '@xyflow/svelte';
	import type { Node, Edge, Connection } from '@xyflow/svelte';
	import { mode } from 'mode-watcher';
	import { page } from '$app/state';
	import { useNarrative } from '$lib/hooks/use-narrative.svelte';
	import { useDiceRoll } from '$lib/hooks/use-dice-roll.svelte';
	import NarrativeNode from './narrative-node.svelte';
	import DiceRollNode from './dice-roll-node.svelte';
	import NarrativePanel from './narrative-panel.svelte';
	import { applyElkLayout } from '$lib/utils/elk-layout';
	import type { NarrativeNode as NarrativeNodeType, DiceRoll } from '$lib/types';

	const narrativeId = $derived(page.params.narrativeId);
	const { store, admin } = useNarrative();
	const { store: diceRollStore, admin: diceRollAdmin } = useDiceRoll();

	const currentNarrative = $derived($store.data?.find((n) => n.id === narrativeId));
	const narrativeNodes = $derived(currentNarrative?.narrative_nodes ?? []);
	const allDiceRolls = $derived($diceRollStore.data ?? []);

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

			console.log('Connection attempt:', {
				source: connection.source,
				sourceType: sourceNode?.type,
				target: connection.target,
				targetType: targetNode?.type,
			});

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
				const diceRollId = connection.target.replace('dice-roll-', '');
				const narrativeNode = sourceNode.data.narrativeNode as NarrativeNodeType;

				// text 타입만 dice_roll_id를 가질 수 있음
				if (narrativeNode.type !== 'text') return;

				await admin.updateNode(connection.source, {
					dice_roll_id: diceRollId,
				});

				// 로컬 데이터 업데이트
				narrativeNode.dice_roll_id = diceRollId;

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
			}
			// 2. dice_roll → narrative_node 연결 (success/failure)
			else if (sourceNode.type === 'diceRoll' && targetNode.type === 'narrativeNode') {
				const diceRollId = connection.source.replace('dice-roll-', '');
				const handle = connection.sourceHandle;

				if (handle === 'success') {
					await diceRollAdmin.update(diceRollId, {
						success_narrative_node_id: connection.target,
					});

					// 로컬 데이터 업데이트
					const diceRoll = sourceNode.data.diceRoll as DiceRoll;
					diceRoll.success_narrative_node_id = connection.target;

					// 엣지 추가
					edges = [
						...edges,
						{
							id: `${connection.source}-success-${connection.target}`,
							source: connection.source,
							sourceHandle: 'success',
							target: connection.target,
							deletable: true,
							style: 'stroke: #22c55e',
						},
					];
				} else if (handle === 'failure') {
					await diceRollAdmin.update(diceRollId, {
						failure_narrative_node_id: connection.target,
					});

					// 로컬 데이터 업데이트
					const diceRoll = sourceNode.data.diceRoll as DiceRoll;
					diceRoll.failure_narrative_node_id = connection.target;

					// 엣지 추가
					edges = [
						...edges,
						{
							id: `${connection.source}-failure-${connection.target}`,
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
				// 1. narrative_node → dice_roll 엣지 (형식: ${nodeId}-dice-roll-${diceRollId})
				if (
					edge.id.includes('-dice-roll-') &&
					!edge.id.startsWith('choice-') &&
					!edge.id.startsWith('dice-roll-')
				) {
					const nodeId = edge.id.split('-dice-roll-')[0];
					await admin.updateNode(nodeId, { dice_roll_id: null }, true);
				}
				// 2. choice → dice_roll 엣지 (형식: choice-${choiceId}-dice-roll-${diceRollId})
				else if (edge.id.startsWith('choice-') && edge.id.includes('-dice-roll-')) {
					const choiceId = edge.id.split('-dice-roll-')[0].replace('choice-', '');
					await admin.updateChoice(choiceId, { dice_roll_id: null }, true);
				}
				// 3. dice_roll → success 엣지 (형식: dice-roll-${diceRollId}-success-${nodeId})
				else if (edge.id.includes('-success-')) {
					const diceRollId = edge.id.split('-success-')[0].replace('dice-roll-', '');
					await diceRollAdmin.update(diceRollId, { success_narrative_node_id: null });
				}
				// 4. dice_roll → failure 엣지 (형식: dice-roll-${diceRollId}-failure-${nodeId})
				else if (edge.id.includes('-failure-')) {
					const diceRollId = edge.id.split('-failure-')[0].replace('dice-roll-', '');
					await diceRollAdmin.update(diceRollId, { failure_narrative_node_id: null });
				}
			}

			// 노드 삭제 처리
			for (const node of nodesToDelete) {
				if (node.type === 'narrativeNode') {
					await admin.removeNode(node.id, false);
				} else if (node.type === 'diceRoll') {
					// dice_roll 노드의 실제 ID 추출 (형식: dice-roll-${id})
					const diceRollId = node.id.replace('dice-roll-', '');
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
				id: narrativeNode.id,
				type: 'narrativeNode',
				data: { narrativeNode },
				position: { x: 0, y: 0 }, // elkjs가 계산할 예정
				width: 200,
				deletable: true,
			});
		});

		// 2. dice_roll 노드 생성 (모든 dice_roll)
		allDiceRolls.forEach((diceRollData) => {
			newNodes.push({
				id: `dice-roll-${diceRollData.id}`,
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
				const diceRollId = `dice-roll-${narrativeNode.dice_roll_id}`;
				newEdges.push({
					id: `${narrativeNode.id}-${diceRollId}`,
					source: narrativeNode.id,
					target: diceRollId,
					deletable: true,
				});
			}

			// choice 타입이면 각 choice의 dice_roll_id로 엣지 생성
			if (narrativeNode.type === 'choice' && narrativeNode.narrative_node_choices) {
				narrativeNode.narrative_node_choices.forEach((choice) => {
					if (choice.dice_roll_id) {
						const diceRollId = `dice-roll-${choice.dice_roll_id}`;
						newEdges.push({
							id: `choice-${choice.id}-${diceRollId}`,
							source: narrativeNode.id,
							target: diceRollId,
							deletable: true,
						});
					}
				});
			}
		});

		// 4. dice_roll의 success/failure 참조를 시각화
		allDiceRolls.forEach((diceRollData) => {
			const diceRollId = `dice-roll-${diceRollData.id}`;

			if (diceRollData.success_narrative_node_id) {
				newEdges.push({
					id: `${diceRollId}-success-${diceRollData.success_narrative_node_id}`,
					source: diceRollId,
					sourceHandle: 'success',
					target: diceRollData.success_narrative_node_id,
					deletable: true,
					style: 'stroke: #22c55e',
				});
			}

			if (diceRollData.failure_narrative_node_id) {
				newEdges.push({
					id: `${diceRollId}-failure-${diceRollData.failure_narrative_node_id}`,
					source: diceRollId,
					sourceHandle: 'failure',
					target: diceRollData.failure_narrative_node_id,
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
			<NarrativePanel {onlayout} />
		</SvelteFlow>
	{/if}
</div>
