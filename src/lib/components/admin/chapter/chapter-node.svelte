<script lang="ts">
	import type { Chapter } from '$lib/types';
	import { Handle, Position, useNodeConnections } from '@xyflow/svelte';
	import { getDisplayTitle } from '$lib/utils/state-label';

	type Props = {
		data: {
			label: string;
			chapter: Chapter;
			position?: string;
		};
		id: string;
	};

	const { data, id }: Props = $props();

	// 좌측 핸들(target)의 연결 개수 체크
	const targetConnections = useNodeConnections({ handleType: 'target' });
	const isConnectable = $derived(targetConnections.current.length === 0);

	const chapter = $derived(data.chapter);
</script>

<div class="min-w-48 rounded-sm px-3 py-2" class:bg-neutral-300={chapter.status === 'published'}>
	<!-- 좌측 Handle: parent 연결용 (target, 최대 1개 연결) -->
	<Handle type="target" position={Position.Left} {isConnectable} />

	<div class="flex flex-col gap-1">
		<div
			class="text-sm font-medium"
			class:text-neutral-900={chapter.status === 'published' && chapter.title}
			class:text-neutral-500={!chapter.title}
			class:text-white={chapter.status !== 'published' && chapter.title}
		>
			{getDisplayTitle(chapter.title, chapter.id)}
		</div>
		<span
			class="text-xs"
			class:text-neutral-600={chapter.status === 'published'}
			class:text-muted-foreground={chapter.status !== 'published'}
		>
			{#if data.position}챕터 {data.position} •{/if}
			{chapter.status === 'published' ? '공개됨' : '작업중'}
		</span>
	</div>

	<!-- 우측 Handle: children 연결용 (source) -->
	<Handle type="source" position={Position.Right} />
</div>
