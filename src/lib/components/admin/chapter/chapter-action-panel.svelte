<script lang="ts">
	import type { ScenarioId } from '$lib/types';
	import { page } from '$app/state';
	import { Panel, useNodes } from '@xyflow/svelte';
	import type { Node, Edge } from '@xyflow/svelte';
	import { Button } from '$lib/components/ui/button';
	import { ButtonGroup } from '$lib/components/ui/button-group';
	import { Tooltip, TooltipContent, TooltipTrigger } from '$lib/components/ui/tooltip';
	import { IconPlus, IconLayoutDistributeVertical } from '@tabler/icons-svelte';
	import { useChapter } from '$lib/hooks/use-chapter';
	import { applyElkLayout } from '$lib/utils/elk-layout';
	import type { Chapter } from '$lib/types';

	interface Props {
		onlayout?: (nodes: Node[], edges: Edge[]) => void;
	}

	let { onlayout }: Props = $props();

	const { admin } = useChapter();

	const scenarioId = $derived(page.params.scenarioId as ScenarioId);
	const flowNodes = useNodes();

	let isCreating = $state(false);
	let isLayouting = $state(false);

	function onclickCreateChapter() {
		if (isCreating) return;

		isCreating = true;

		admin
			.createChapter(scenarioId, { title: '' })
			.catch((error) => {
				console.error('Failed to create chapter:', error);
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
				const data = node.data as { chapter: Chapter };
				if (data.chapter.parent_chapter_id) {
					edges.push({
						id: `${data.chapter.parent_chapter_id}-${node.id}`,
						source: data.chapter.parent_chapter_id,
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

<Panel position="bottom-center">
	<ButtonGroup>
		<Tooltip>
			<TooltipTrigger>
				{#snippet child({ props })}
					<Button
						{...props}
						onclick={onclickCreateChapter}
						disabled={isCreating}
						size="icon-lg"
						variant="outline"
					>
						<IconPlus />
					</Button>
				{/snippet}
			</TooltipTrigger>
			<TooltipContent>새로운 챕터 생성</TooltipContent>
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
