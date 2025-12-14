<script lang="ts">
	import { Panel, useNodes } from '@xyflow/svelte';
	import type { Node, Edge } from '@xyflow/svelte';
	import { Button } from '$lib/components/ui/button';
	import { ButtonGroup } from '$lib/components/ui/button-group';
	import { Tooltip, TooltipContent, TooltipTrigger } from '$lib/components/ui/tooltip';
	import { IconPlus, IconLayoutDistributeVertical } from '@tabler/icons-svelte';
	import { useScenarioQuest } from '$lib/hooks/use-scenario-quest';
	import { page } from '$app/state';
	import { applyElkLayout } from '$lib/utils/elk-layout';
	import type { ScenarioQuestBranch } from '$lib/types';

	interface Props {
		onlayout?: (nodes: Node[], edges: Edge[]) => void;
	}

	let { onlayout }: Props = $props();

	const { admin } = useScenarioQuest();
	const flowNodes = useNodes();
	const scenarioQuestId = $derived(page.params.scenarioQuestId);

	let isCreating = $state(false);
	let isLayouting = $state(false);

	function onclickCreateScenarioQuestBranch() {
		if (isCreating || !scenarioQuestId) return;

		isCreating = true;

		admin
			.createScenarioQuestBranch({
				scenario_quest_id: scenarioQuestId,
				title: '',
				display_order_in_scenario_quest: 0,
			})
			.catch((error: Error) => {
				console.error('Failed to create scenario quest branch:', error);
			})
			.finally(() => {
				isCreating = false;
			});
	}

	async function onclickLayout() {
		if (isLayouting || !onlayout) return;

		isLayouting = true;

		try {
			const nodes = flowNodes.current;
			const edges: Edge[] = [];

			// 현재 노드들로부터 엣지 추출
			nodes.forEach((node) => {
				const data = node.data as { scenarioQuestBranch: ScenarioQuestBranch };
				if (data.scenarioQuestBranch.parent_scenario_quest_branch_id) {
					edges.push({
						id: `${data.scenarioQuestBranch.parent_scenario_quest_branch_id}-${node.id}`,
						source: data.scenarioQuestBranch.parent_scenario_quest_branch_id,
						target: node.id,
						deletable: true,
					});
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
	<ButtonGroup>
		<Tooltip>
			<TooltipTrigger>
				{#snippet child({ props })}
					<Button
						{...props}
						onclick={onclickCreateScenarioQuestBranch}
						disabled={isCreating}
						size="icon"
						variant="outline"
					>
						<IconPlus class="h-4 w-4" />
					</Button>
				{/snippet}
			</TooltipTrigger>
			<TooltipContent>새로운 브랜치 생성</TooltipContent>
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
