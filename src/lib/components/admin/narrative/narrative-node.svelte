<script lang="ts">
	import type { NarrativeNode } from '$lib/types';
	import { Handle, Position } from '@xyflow/svelte';
	import { IconCircleDashedNumber1 } from '@tabler/icons-svelte';
	import { sort } from 'radash';
	import { Separator } from '$lib/components/ui/separator';

	interface Props {
		data: {
			narrativeNode: NarrativeNode;
		};
		id: string;
		selected?: boolean;
	}

	const { data, id, selected = false }: Props = $props();
	const narrativeNode = $derived(data.narrativeNode);

	// 선택지를 order_in_narrative_node로 정렬
	const narrativeNodeChoices = $derived(
		narrativeNode.narrative_node_choices
			? sort(narrativeNode.narrative_node_choices, (c) => c.order_in_narrative_node)
			: []
	);
</script>

<div
	class="min-w-[200px] rounded-md border-2 px-4 py-3 shadow-md transition-colors"
	class:border-gray-300={!selected}
	class:bg-white={!selected}
	class:dark:border-gray-600={!selected}
	class:dark:bg-gray-800={!selected}
	class:border-blue-500={selected}
	class:bg-blue-50={selected}
	class:dark:border-blue-400={selected}
	class:dark:bg-blue-900={selected}
	class:ring-2={selected}
	class:ring-blue-400={selected}
	class:dark:ring-blue-500={selected}
>
	<!-- 입력 핸들 (부모 노드 또는 dice_roll에서 연결) -->
	<!-- 시작 노드일 때는 입력 핸들 숨김 -->
	{#if !narrativeNode.root}
		<Handle type="target" position={Position.Left} />
	{/if}

	<div class="space-y-2">
		<div class="flex items-center gap-1.5 text-sm font-medium text-gray-900 dark:text-gray-100">
			{#if narrativeNode.root}
				<IconCircleDashedNumber1 class="h-4 w-4 text-blue-500 dark:text-blue-400" />
			{/if}
			<span>{narrativeNode.title || '(제목 없음)'}</span>
		</div>

		{#if narrativeNode.description}
			<div class="text-xs text-gray-600 dark:text-gray-400">
				{narrativeNode.description}
			</div>
		{/if}

		{#if narrativeNode.type === 'choice' && narrativeNodeChoices.length > 0}
			<Separator class="bg-white/10" />
			<div class="space-y-1 pt-2">
				{#each narrativeNodeChoices as choice}
					<div class="relative flex items-center text-xs text-gray-700 dark:text-gray-300">
						<span class="flex-1">{choice.title || '(선택지 없음)'}</span>
						<!-- 각 선택지마다 출력 핸들 -->
						<Handle
							type="source"
							position={Position.Right}
							id={choice.id}
							class="top-1/2! -right-4! -translate-y-1/2!"
						/>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- text 타입일 때만 출력 핸들 표시 -->
	{#if narrativeNode.type === 'text'}
		<Handle type="source" position={Position.Right} />
	{/if}
</div>
