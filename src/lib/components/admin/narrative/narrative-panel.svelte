<script lang="ts">
	import { Panel, useNodes } from '@xyflow/svelte';
	import type { Node, Edge } from '@xyflow/svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { ButtonGroup } from '$lib/components/ui/button-group';
	import { Tooltip, TooltipContent, TooltipTrigger } from '$lib/components/ui/tooltip';
	import { IconMessagePlus, IconDice, IconLayoutDistributeVertical } from '@tabler/icons-svelte';
	import { useNarrative } from '$lib/hooks/use-narrative.svelte';
	import { useDiceRoll } from '$lib/hooks/use-dice-roll.svelte';
	import { page } from '$app/state';
	import { applyElkLayout } from '$lib/utils/elk-layout';
	import {
		createDiceRollNodeId,
		createNarrativeNodeToDiceRollEdgeId,
		createNarrativeNodeChoiceToDiceRollEdgeId,
	} from '$lib/utils/flow-id';

	interface Props {
		onlayout?: (nodes: Node[], edges: Edge[]) => void;
	}

	let { onlayout }: Props = $props();

	const narrativeId = $derived(page.params.narrativeId);
	const { admin } = useNarrative();
	const { admin: diceRollAdmin } = useDiceRoll();
	const flowNodes = useNodes();

	let isCreatingNode = $state(false);
	let isCreatingDiceRoll = $state(false);
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

	async function onclickCreateDiceRoll() {
		if (isCreatingDiceRoll || !narrativeId) return;

		isCreatingDiceRoll = true;

		try {
			await diceRollAdmin.create({ narrative_id: narrativeId });
		} catch (error) {
			console.error('Failed to create dice roll:', error);
		} finally {
			isCreatingDiceRoll = false;
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
				// narrative_node → dice_roll 엣지
				if (node.type === 'narrativeNode') {
					const data = node.data as { narrativeNode: any };
					const narrativeNode = data.narrativeNode;

					if (narrativeNode.type === 'text' && narrativeNode.narrative_dice_roll_id) {
						// dice_roll 객체 찾기
						const targetDiceRollNode = nodes.find((n) => n.id.endsWith(narrativeNode.narrative_dice_roll_id));
						if (!targetDiceRollNode || targetDiceRollNode.type !== 'diceRoll') return;

						const diceRoll = (targetDiceRollNode.data as { diceRoll: any }).diceRoll;
						const targetId = createDiceRollNodeId(diceRoll);

						// target 노드가 실제로 존재하는지 확인
						if (nodeIds.has(targetId)) {
							edges.push({
								id: createNarrativeNodeToDiceRollEdgeId(narrativeNode, diceRoll),
								source: node.id,
								target: targetId,
								deletable: true,
							});
						}
					}

					if (narrativeNode.type === 'choice' && narrativeNode.narrative_node_choices) {
						narrativeNode.narrative_node_choices.forEach((narrativeNodeChoice: any) => {
							if (narrativeNodeChoice.narrative_dice_roll_id) {
								// dice_roll 객체 찾기
								const targetDiceRollNode = nodes.find((n) =>
									n.id.endsWith(narrativeNodeChoice.narrative_dice_roll_id)
								);
								if (!targetDiceRollNode || targetDiceRollNode.type !== 'diceRoll') return;

								const diceRoll = (targetDiceRollNode.data as { diceRoll: any }).diceRoll;
								const targetId = createDiceRollNodeId(diceRoll);

								// target 노드가 실제로 존재하는지 확인
								if (nodeIds.has(targetId)) {
									edges.push({
										id: createNarrativeNodeChoiceToDiceRollEdgeId(narrativeNodeChoice, diceRoll),
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

				// dice_roll → narrative_node 엣지 (success/failure)
				if (node.type === 'diceRoll') {
					const data = node.data as { diceRoll: any };
					const diceRoll = data.diceRoll;

					if (
						diceRoll.success_narrative_node_id &&
						nodeIds.has(diceRoll.success_narrative_node_id)
					) {
						edges.push({
							id: `${node.id}-success-${diceRoll.success_narrative_node_id}`,
							source: node.id,
							sourceHandle: 'success',
							target: diceRoll.success_narrative_node_id,
							deletable: true,
							style: 'stroke: #22c55e',
						});
					}

					if (
						diceRoll.failure_narrative_node_id &&
						nodeIds.has(diceRoll.failure_narrative_node_id)
					) {
						edges.push({
							id: `${node.id}-failure-${diceRoll.failure_narrative_node_id}`,
							source: node.id,
							sourceHandle: 'failure',
							target: diceRoll.failure_narrative_node_id,
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
						onclick={onclickCreateDiceRoll}
						disabled={isCreatingDiceRoll}
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
