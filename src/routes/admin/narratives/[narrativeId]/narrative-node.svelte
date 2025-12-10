<script lang="ts">
	import type { NarrativeNode } from '$lib/types';
	import { Handle, Position } from '@xyflow/svelte';

	interface Props {
		data: {
			narrativeNode: NarrativeNode;
		};
		id: string;
	}

	const { data, id }: Props = $props();
	const narrativeNode = $derived(data.narrativeNode);
</script>

<div
	class="min-w-[200px] rounded-md border-2 border-gray-300 bg-white px-4 py-3 shadow-md dark:border-gray-600 dark:bg-gray-800"
>
	<!-- 입력 핸들 (부모 노드 또는 dice_roll에서 연결) -->
	<Handle type="target" position={Position.Left} />

	<div class="space-y-2">
		<div class="text-xs font-semibold text-gray-500 dark:text-gray-400">
			{narrativeNode.type === 'text' ? '텍스트' : '선택지'}
			{#if narrativeNode.root}
				<span class="ml-1 rounded bg-blue-100 px-1.5 py-0.5 text-xs dark:bg-blue-900">시작</span>
			{/if}
		</div>

		<div class="text-sm font-medium text-gray-900 dark:text-gray-100">
			{narrativeNode.title || '(제목 없음)'}
		</div>

		{#if narrativeNode.description}
			<div class="text-xs text-gray-600 dark:text-gray-400">
				{narrativeNode.description}
			</div>
		{/if}

		{#if narrativeNode.type === 'choice' && narrativeNode.narrative_node_choices}
			<div class="space-y-1 border-t pt-2">
				{#each narrativeNode.narrative_node_choices as choice}
					<div class="text-xs text-gray-700 dark:text-gray-300">
						• {choice.title || '(선택지 없음)'}
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- 출력 핸들 (dice_roll로 연결) -->
	<Handle type="source" position={Position.Right} />
</div>
