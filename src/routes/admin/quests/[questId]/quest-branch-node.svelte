<script lang="ts">
	import type { QuestBranch } from '$lib/types';
	import { Handle, Position, useNodeConnections, useNodes } from '@xyflow/svelte';

	type Props = {
		data: {
			label: string;
			questBranch: QuestBranch;
		};
		id: string;
	};

	const { data, id }: Props = $props();

	// 좌측 핸들(target)의 연결 개수 체크
	const targetConnections = useNodeConnections({ handleType: 'target' });
	const isConnectable = $derived(targetConnections.current.length === 0);

	const questBranch = $derived(data.questBranch);

	// 현재 노드의 selected 상태 확인
	const flowNodes = useNodes();
	const selected = $derived(flowNodes.current.find((n) => n.id === id)?.selected ?? false);
</script>

<div
	class="relative min-w-[150px] rounded-md border-2 px-4 py-2 shadow-md transition-colors"
	class:border-blue-500={selected}
	class:border-gray-300={!selected}
	class:bg-blue-50={selected}
	class:bg-white={!selected}
	class:dark:border-blue-400={selected}
	class:dark:border-gray-600={!selected}
	class:dark:bg-blue-950={selected}
	class:dark:bg-gray-800={!selected}
>
	<!-- 좌측 Handle: parent 연결용 (target, 최대 1개 연결) -->
	<Handle type="target" position={Position.Left} {isConnectable} />

	<div class="text-sm font-medium text-gray-900 dark:text-gray-100">
		{questBranch.title || '(제목 없음)'}
	</div>

	<!-- 우측 Handle: children 연결용 (source) -->
	<Handle type="source" position={Position.Right} />
</div>
