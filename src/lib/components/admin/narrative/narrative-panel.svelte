<script lang="ts">
	import { Panel, useNodes } from '@xyflow/svelte';
	import type { Node, Edge } from '@xyflow/svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { ButtonGroup } from '$lib/components/ui/button-group';
	import { Tooltip, TooltipContent, TooltipTrigger } from '$lib/components/ui/tooltip';
	import { IconMessagePlus, IconDice, IconLayoutDistributeVertical } from '@tabler/icons-svelte';
	import { useNarrative } from '$lib/hooks/use-narrative.svelte';
	import { page } from '$app/state';
	import { applyElkLayout } from '$lib/utils/elk-layout';
	import {
		createNarrativeDiceRollNodeId,
		createNarrativeNodeToNarrativeDiceRollEdgeId,
		createNarrativeNodeChoiceToNarrativeDiceRollEdgeId,
	} from '$lib/utils/flow-id';

	interface Props {
		onlayout?: (nodes: Node[], edges: Edge[]) => void;
	}

	let { onlayout }: Props = $props();

	const narrativeId = $derived(page.params.narrativeId);
	const { admin } = useNarrative();
	const flowNodes = useNodes();

	let isCreatingNode = $state(false);
	let isCreatingNarrativeDiceRoll = $state(false);
	let isLayouting = $state(false);

	async function onclickCreateNode() {
		if (isCreatingNode || !narrativeId) return;

		isCreatingNode = true;

		try {
			await admin.createNode({ narrative_id: narrativeId, type: 'text' });
		} catch (error) {
			console.error('Failed to create narrative node:', error);
		} finally {
			isCreatingNode = false;
		}
	}

	async function onclickCreateNarrativeDiceRoll() {
		if (isCreatingNarrativeDiceRoll || !narrativeId) return;

		isCreatingNarrativeDiceRoll = true;

		try {
			await admin.createNarrativeDiceRoll({ narrative_id: narrativeId });
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

			// 노드 ID 집합 생성 (존재 여부 확인용)
			const nodeIds = new Set(nodes.map((n) => n.id));

			// 현재 노드들로부터 엣지 추출
			nodes.forEach((node) => {
				// narrative_node → narrative_dice_roll 엣지
				if (node.type === 'narrativeNode') {
					const data = node.data as { narrativeNode: any };
					const narrativeNode = data.narrativeNode;

					if (narrativeNode.type === 'text' && narrativeNode.narrative_dice_roll_id) {
						// narrative_dice_roll 객체 찾기
						const targetNarrativeDiceRollNode = nodes.find((n) => n.id.endsWith(narrativeNode.narrative_dice_roll_id));
						if (!targetNarrativeDiceRollNode || targetNarrativeDiceRollNode.type !== 'narrativeDiceRoll') return;

						const narrativeDiceRoll = (targetNarrativeDiceRollNode.data as { narrativeDiceRoll: any }).narrativeDiceRoll;
						const targetId = createNarrativeDiceRollNodeId(narrativeDiceRoll);

						// target 노드가 실제로 존재하는지 확인
						if (nodeIds.has(targetId)) {
							edges.push({
								id: createNarrativeNodeToNarrativeDiceRollEdgeId(narrativeNode, narrativeDiceRoll),
								source: node.id,
								target: targetId,
								deletable: true,
							});
						}
					}

					if (narrativeNode.type === 'choice' && narrativeNode.narrative_node_choices) {
						narrativeNode.narrative_node_choices.forEach((narrativeNodeChoice: any) => {
							if (narrativeNodeChoice.narrative_dice_roll_id) {
								// narrative_dice_roll 객체 찾기
								const targetNarrativeDiceRollNode = nodes.find((n) =>
									n.id.endsWith(narrativeNodeChoice.narrative_dice_roll_id)
								);
								if (!targetNarrativeDiceRollNode || targetNarrativeDiceRollNode.type !== 'narrativeDiceRoll') return;

								const narrativeDiceRoll = (targetNarrativeDiceRollNode.data as { narrativeDiceRoll: any }).narrativeDiceRoll;
								const targetId = createNarrativeDiceRollNodeId(narrativeDiceRoll);

								// target 노드가 실제로 존재하는지 확인
								if (nodeIds.has(targetId)) {
									edges.push({
										id: createNarrativeNodeChoiceToNarrativeDiceRollEdgeId(narrativeNodeChoice, narrativeDiceRoll),
										source: node.id,
										sourceHandle: narrativeNodeChoice.id,
										target: targetId,
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

					if (
						narrativeDiceRoll.success_narrative_node_id &&
						nodeIds.has(narrativeDiceRoll.success_narrative_node_id)
					) {
						edges.push({
							id: `${node.id}-success-${narrativeDiceRoll.success_narrative_node_id}`,
							source: node.id,
							sourceHandle: 'success',
							target: narrativeDiceRoll.success_narrative_node_id,
							deletable: true,
							style: 'stroke: #22c55e',
						});
					}

					if (
						narrativeDiceRoll.failure_narrative_node_id &&
						nodeIds.has(narrativeDiceRoll.failure_narrative_node_id)
					) {
						edges.push({
							id: `${node.id}-failure-${narrativeDiceRoll.failure_narrative_node_id}`,
							source: node.id,
							sourceHandle: 'failure',
							target: narrativeDiceRoll.failure_narrative_node_id,
							deletable: true,
							style: 'stroke: #ef4444',
						});
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

<Panel position="top-right">
	<ButtonGroup class="bg-background">
		<Tooltip>
			<TooltipTrigger>
				{#snippet child({ props })}
					<Button
						{...props}
						onclick={onclickCreateNode}
						disabled={isCreatingNode}
						size="icon"
						variant="outline"
					>
						<IconMessagePlus class="h-4 w-4" />
					</Button>
				{/snippet}
			</TooltipTrigger>
			<TooltipContent>대화 또는 효과 추가</TooltipContent>
		</Tooltip>
		<Tooltip>
			<TooltipTrigger>
				{#snippet child({ props })}
					<Button
						{...props}
						onclick={onclickCreateNarrativeDiceRoll}
						disabled={isCreatingNarrativeDiceRoll}
						size="icon"
						variant="outline"
					>
						<IconDice class="h-4 w-4" />
					</Button>
				{/snippet}
			</TooltipTrigger>
			<TooltipContent>주사위 굴림 추가</TooltipContent>
		</Tooltip>
		<Tooltip>
			<TooltipTrigger>
				{#snippet child({ props })}
					<Button
						{...props}
						onclick={onclickLayout}
						disabled={isLayouting}
						size="icon"
						variant="outline"
					>
						<IconLayoutDistributeVertical class="h-4 w-4" />
					</Button>
				{/snippet}
			</TooltipTrigger>
			<TooltipContent>자동 정렬</TooltipContent>
		</Tooltip>
	</ButtonGroup>
</Panel>
