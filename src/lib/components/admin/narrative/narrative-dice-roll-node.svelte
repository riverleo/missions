<script lang="ts">
	import type { NarrativeDiceRoll } from '$lib/types';
	import { Handle, Position } from '@xyflow/svelte';

	interface Props {
		data: {
			narrativeDiceRoll: NarrativeDiceRoll;
		};
		id: string;
		selected?: boolean;
	}

	const { data, id, selected = false }: Props = $props();
	const narrativeDiceRoll = $derived(data.narrativeDiceRoll);
</script>

<div class="h-12 w-12 bg-neutral-300 rounded-sm flex items-center justify-center text-2xl gap-1 text-neutral-900">
	<!-- 입력 핸들 (narrative_node에서 연결) -->
	<Handle type="target" position={Position.Left} />

	<span class="font-bold">{narrativeDiceRoll.difficulty_class}</span>

	<!-- 출력 핸들: 성공 (상단) -->
	{#if narrativeDiceRoll.success_action !== 'narrative_node_done'}
		<Handle
			type="source"
			position={Position.Right}
			id="success"
			style="top: 30%; background-color: var(--color-lime-400)"
		/>
	{/if}

	<!-- 출력 핸들: 실패 (하단) -->
	{#if narrativeDiceRoll.failure_action !== 'narrative_node_done' && narrativeDiceRoll.difficulty_class > 0}
		<Handle
			type="source"
			position={Position.Right}
			id="failure"
			style="top: 70%; background-color: var(--color-red-500)"
		/>
	{/if}
</div>
