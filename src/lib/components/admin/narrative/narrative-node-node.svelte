<script lang="ts">
	import type { NarrativeNode } from '$lib/types';
	import { Handle, Position } from '@xyflow/svelte';
	import { IconCircleDashedNumber1 } from '@tabler/icons-svelte';
	import { sort } from 'radash';
	import { Separator } from '$lib/components/ui/separator';
	import { useNarrative } from '$lib/hooks/use-narrative';

	interface Props {
		data: {
			narrativeNode: NarrativeNode;
		};
		id: string;
		selected?: boolean;
	}

	const { data, id, selected = false }: Props = $props();
	const narrativeNode = $derived(data.narrativeNode);
	const { narrativeNodeChoiceStore } = useNarrative();

	// 선택지를 order_in_narrative_node로 정렬
	const narrativeNodeChoices = $derived(
		sort(
			Object.values($narrativeNodeChoiceStore.data ?? {}).filter(
				(c) => c.narrative_node_id === narrativeNode.id
			),
			(c) => c.order_in_narrative_node
		)
	);
</script>

<div class="w-48">
	<div class="relative space-y-1 px-3 py-2">
		{#if !narrativeNode.root}
			<Handle type="target" position={Position.Left} />
		{/if}

		<div
			class="flex items-center gap-1 text-sm font-medium text-white"
			class:text-neutral-500={!narrativeNode.title}
		>
			{#if narrativeNode.root}
				<IconCircleDashedNumber1 class="size-3.5" />
			{/if}
			<span
				class="flex-1 truncate text-sm font-medium"
				class:text-white={narrativeNode.title}
				class:text-neutral-500={!narrativeNode.title}
			>
				{narrativeNode.title || `제목없음 (${narrativeNode.id.split('-')[0]})`}
			</span>
		</div>

		{#if narrativeNode.description}
			<div class="truncate text-xs text-neutral-400">
				{narrativeNode.description}
			</div>
		{/if}
	</div>

	{#if narrativeNode.type === 'choice' && narrativeNodeChoices.length > 0}
		<Separator class="bg-neutral-700" />
		<div class="space-y-1">
			{#each narrativeNodeChoices as narrativeNodeChoice}
				<div
					class="relative flex items-center border-b border-dashed border-neutral-700 text-xs text-white last:border-b-0"
				>
					<span
						class="flex-1 truncate px-3 py-2"
						class:text-neutral-500={!narrativeNodeChoice.title}
					>
						{narrativeNodeChoice.title || '내용을 입력해 주세요'}
					</span>
					<Handle type="source" position={Position.Right} id={narrativeNodeChoice.id} />
				</div>
			{/each}
		</div>
	{/if}

	<!-- text 타입일 때만 출력 핸들 표시 -->
	{#if narrativeNode.type === 'text'}
		<Handle type="source" position={Position.Right} />
	{/if}
</div>
