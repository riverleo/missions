<script lang="ts">
	import type { QuestBranch } from '$lib/types';
	import { Handle, Position, useNodeConnections } from '@xyflow/svelte';

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
</script>

<div class="flex items-center gap-1 justify-center px-3 py-2">
	<!-- 좌측 Handle: parent 연결용 (target, 최대 1개 연결) -->
	<Handle type="target" position={Position.Left} {isConnectable} />

	<div
		class="text-sm font-medium"
		class:text-white={questBranch.title}
		class:text-neutral-500={!questBranch.title}
	>
		{questBranch.title || '제목 없음'}
	</div>

	<!-- 우측 Handle: children 연결용 (source) -->
	<Handle type="source" position={Position.Right} />
</div>
