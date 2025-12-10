<script lang="ts">
	import type { DiceRoll } from '$lib/types';
	import { Handle, Position } from '@xyflow/svelte';

	interface Props {
		data: {
			diceRoll: DiceRoll;
		};
		id: string;
	}

	const { data, id }: Props = $props();
	const diceRoll = $derived(data.diceRoll);
</script>

<div
	class="min-w-[150px] rounded-md border-2 border-purple-300 bg-purple-50 px-4 py-3 shadow-md dark:border-purple-600 dark:bg-purple-950"
>
	<!-- 입력 핸들 (narrative_node에서 연결) -->
	<Handle type="target" position={Position.Left} />

	<div class="space-y-2">
		<div class="text-xs font-semibold text-purple-600 dark:text-purple-400">주사위 굴림</div>

		<div class="text-sm font-medium text-gray-900 dark:text-gray-100">
			DC {diceRoll.difficulty_class}
		</div>

		<div class="flex items-center gap-2 text-xs">
			<div class="flex items-center gap-1">
				<div class="h-2 w-2 rounded-full bg-green-500"></div>
				<span class="text-gray-600 dark:text-gray-400">성공</span>
			</div>
			<div class="flex items-center gap-1">
				<div class="h-2 w-2 rounded-full bg-red-500"></div>
				<span class="text-gray-600 dark:text-gray-400">실패</span>
			</div>
		</div>
	</div>

	<!-- 출력 핸들: 성공 (상단) -->
	<Handle
		type="source"
		position={Position.Right}
		id="success"
		style="top: 30%; background-color: #22c55e"
	/>

	<!-- 출력 핸들: 실패 (하단) -->
	<Handle
		type="source"
		position={Position.Right}
		id="failure"
		style="top: 70%; background-color: #ef4444"
	/>
</div>
