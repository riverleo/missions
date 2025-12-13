<script lang="ts">
	import type { ScenarioChapter } from '$lib/types';
	import { Handle, Position, useNodeConnections } from '@xyflow/svelte';

	type Props = {
		data: {
			label: string;
			scenarioChapter: ScenarioChapter;
			position?: string;
		};
		id: string;
	};

	const { data, id }: Props = $props();

	// 좌측 핸들(target)의 연결 개수 체크
	const targetConnections = useNodeConnections({ handleType: 'target' });
	const isConnectable = $derived(targetConnections.current.length === 0);

	const scenarioChapter = $derived(data.scenarioChapter);
</script>

<div
	class="min-w-48 rounded-sm px-3 py-2"
	class:bg-neutral-300={scenarioChapter.status === 'published'}
>
	<!-- 좌측 Handle: parent 연결용 (target, 최대 1개 연결) -->
	<Handle type="target" position={Position.Left} {isConnectable} />

	<div class="flex flex-col gap-1">
		<div
			class="text-sm font-medium"
			class:text-neutral-900={scenarioChapter.status === 'published' && scenarioChapter.title}
			class:text-neutral-500={!scenarioChapter.title}
			class:text-white={scenarioChapter.status !== 'published' && scenarioChapter.title}
		>
			{scenarioChapter.title || `제목없음 (${scenarioChapter.id.split('-')[0]})`}
		</div>
		<span
			class="text-xs"
			class:text-neutral-600={scenarioChapter.status === 'published'}
			class:text-muted-foreground={scenarioChapter.status !== 'published'}
		>
			{#if data.position}{data.position} •{/if}
			{scenarioChapter.status === 'published' ? '공개됨' : '작업중'}
		</span>
	</div>

	<!-- 우측 Handle: children 연결용 (source) -->
	<Handle type="source" position={Position.Right} />
</div>
