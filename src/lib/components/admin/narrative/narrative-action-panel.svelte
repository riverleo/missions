<script lang="ts">
	import { Panel, useNodes } from '@xyflow/svelte';
	import type { Node, Edge } from '@xyflow/svelte';
	import { Button } from '$lib/components/ui/button';
	import { ButtonGroup } from '$lib/components/ui/button-group';
	import { Tooltip, TooltipContent, TooltipTrigger } from '$lib/components/ui/tooltip';
	import { IconPlus, IconDice, IconLayoutDistributeVertical } from '@tabler/icons-svelte';
	import { useNarrative } from '$lib/hooks/use-narrative';
	import { page } from '$app/state';
	import { applyElkLayout } from '$lib/utils/elk-layout';
	import type { ScenarioId, NarrativeId } from '$lib/types';
	import {
		createNarrativeNodeId,
		createNarrativeDiceRollNodeId,
		createNarrativeNodeToNarrativeDiceRollEdgeId,
		createNarrativeNodeChoiceToNarrativeDiceRollEdgeId,
		createNarrativeDiceRollToSuccessEdgeId,
		createNarrativeDiceRollToFailureEdgeId,
	} from '$lib/utils/flow-id';

	interface Props {
		onlayout?: (nodes: Node[], edges: Edge[]) => void;
	}

	let { onlayout }: Props = $props();

	const scenarioId = $derived(page.params.scenarioId as ScenarioId);
	const narrativeId = $derived(page.params.narrativeId as NarrativeId);
	const { admin } = useNarrative();
	const flowNodes = useNodes();

	let isCreatingNode = $state(false);
	let isCreatingNarrativeDiceRoll = $state(false);
	let isLayouting = $state(false);

	async function onclickCreateNode() {
		if (isCreatingNode || !narrativeId || !scenarioId) return;

		isCreatingNode = true;

		try {
			await admin.createNarrativeNode({
				narrative_id: narrativeId,
				scenario_id: scenarioId,
				type: 'text',
			});
		} catch (error) {
			console.error('Failed to create narrative node:', error);
		} finally {
			isCreatingNode = false;
		}
	}

	async function onclickCreateNarrativeDiceRoll() {
		if (isCreatingNarrativeDiceRoll || !narrativeId || !scenarioId) return;

		isCreatingNarrativeDiceRoll = true;

		try {
			await admin.createNarrativeDiceRoll({ narrative_id: narrativeId, scenario_id: scenarioId });
		} catch (error) {
			console.error('Failed to create narrative dice roll:', error);
		} finally {
			isCreatingNarrativeDiceRoll = false;
		}
	}

	async function onclickLayout() {
		if (isLayouting || !onlayout) return;

		isLayouting = true;

		try {
			const nodes = flowNodes.current;
			const edges: Edge[] = [];

			// 현재 노드들로부터 엣지 추출
			nodes.forEach((node) => {
				// narrative_node → narrative_dice_roll 엣지
				if (node.type === 'narrativeNode') {
					const data = node.data as { narrativeNode: any };
					const narrativeNode = data.narrativeNode;

					if (narrativeNode.type === 'text' && narrativeNode.narrative_dice_roll_id) {
						// narrative_dice_roll 노드 찾기
						const targetNode = nodes.find(
							(n) =>
								n.type === 'narrativeDiceRoll' &&
								(n.data as { narrativeDiceRoll: any }).narrativeDiceRoll.id ===
									narrativeNode.narrative_dice_roll_id
						);
						if (targetNode) {
							const narrativeDiceRoll = (targetNode.data as { narrativeDiceRoll: any })
								.narrativeDiceRoll;
							edges.push({
								id: createNarrativeNodeToNarrativeDiceRollEdgeId(narrativeNode, narrativeDiceRoll),
								source: node.id,
								target: createNarrativeDiceRollNodeId(narrativeDiceRoll),
								deletable: true,
							});
						}
					}

					if (narrativeNode.type === 'choice' && narrativeNode.narrative_node_choices) {
						narrativeNode.narrative_node_choices.forEach((narrativeNodeChoice: any) => {
							if (narrativeNodeChoice.narrative_dice_roll_id) {
								// narrative_dice_roll 노드 찾기
								const targetNode = nodes.find(
									(n) =>
										n.type === 'narrativeDiceRoll' &&
										(n.data as { narrativeDiceRoll: any }).narrativeDiceRoll.id ===
											narrativeNodeChoice.narrative_dice_roll_id
								);
								if (targetNode) {
									const narrativeDiceRoll = (targetNode.data as { narrativeDiceRoll: any })
										.narrativeDiceRoll;
									edges.push({
										id: createNarrativeNodeChoiceToNarrativeDiceRollEdgeId(
											narrativeNodeChoice,
											narrativeDiceRoll
										),
										source: node.id,
										sourceHandle: narrativeNodeChoice.id,
										target: createNarrativeDiceRollNodeId(narrativeDiceRoll),
										deletable: true,
									});
								}
							}
						});
					}
				}

				// narrative_dice_roll → narrative_node 엣지 (success/failure)
				if (node.type === 'narrativeDiceRoll') {
					const data = node.data as { narrativeDiceRoll: any };
					const narrativeDiceRoll = data.narrativeDiceRoll;

					if (narrativeDiceRoll.success_narrative_node_id) {
						// success_narrative_node를 찾아서 올바른 ID와 엣지 생성
						const successNode = nodes.find(
							(n) =>
								n.type === 'narrativeNode' &&
								(n.data as { narrativeNode: any }).narrativeNode.id ===
									narrativeDiceRoll.success_narrative_node_id
						);
						if (successNode) {
							const successNarrativeNode = (successNode.data as { narrativeNode: any })
								.narrativeNode;
							edges.push({
								id: createNarrativeDiceRollToSuccessEdgeId(narrativeDiceRoll, successNarrativeNode),
								source: node.id,
								sourceHandle: 'success',
								target: createNarrativeNodeId(successNarrativeNode),
								deletable: true,
								style: 'stroke: #22c55e',
							});
						}
					}

					if (narrativeDiceRoll.failure_narrative_node_id) {
						// failure_narrative_node를 찾아서 올바른 ID와 엣지 생성
						const failureNode = nodes.find(
							(n) =>
								n.type === 'narrativeNode' &&
								(n.data as { narrativeNode: any }).narrativeNode.id ===
									narrativeDiceRoll.failure_narrative_node_id
						);
						if (failureNode) {
							const failureNarrativeNode = (failureNode.data as { narrativeNode: any })
								.narrativeNode;
							edges.push({
								id: createNarrativeDiceRollToFailureEdgeId(narrativeDiceRoll, failureNarrativeNode),
								source: node.id,
								sourceHandle: 'failure',
								target: createNarrativeNodeId(failureNarrativeNode),
								deletable: true,
								style: 'stroke: #ef4444',
							});
						}
					}
				}
			});

			// ELK 레이아웃 계산
			const layoutedNodes = await applyElkLayout(nodes, edges);

			// 부모 컴포넌트에 정렬된 노드와 엣지 전달
			onlayout(layoutedNodes, edges);
		} catch (error) {
			console.error('Failed to layout:', error);
		} finally {
			isLayouting = false;
		}
	}
</script>

<Panel position="bottom-center">
	<ButtonGroup>
		<Tooltip>
			<TooltipTrigger>
				{#snippet child({ props })}
					<Button
						{...props}
						onclick={onclickCreateNode}
						disabled={isCreatingNode}
						size="icon-lg"
						variant="outline"
					>
						<IconPlus />
					</Button>
				{/snippet}
			</TooltipTrigger>
			<TooltipContent>새로운 대화 생성</TooltipContent>
		</Tooltip>
		<Tooltip>
			<TooltipTrigger>
				{#snippet child({ props })}
					<Button
						{...props}
						onclick={onclickCreateNarrativeDiceRoll}
						disabled={isCreatingNarrativeDiceRoll}
						size="icon-lg"
						variant="outline"
					>
						<IconDice />
					</Button>
				{/snippet}
			</TooltipTrigger>
			<TooltipContent>새로운 주사위 굴림 생성</TooltipContent>
		</Tooltip>
		<Tooltip>
			<TooltipTrigger>
				{#snippet child({ props })}
					<Button
						{...props}
						onclick={onclickLayout}
						disabled={isLayouting}
						size="icon-lg"
						variant="outline"
					>
						<IconLayoutDistributeVertical />
					</Button>
				{/snippet}
			</TooltipTrigger>
			<TooltipContent>자동 정렬</TooltipContent>
		</Tooltip>
	</ButtonGroup>
</Panel>
