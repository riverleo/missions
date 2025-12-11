<script lang="ts">
	import type { NarrativeDiceRoll } from '$lib/types';
	import { Handle, Position } from '@xyflow/svelte';

	interface Props {
		data: {
			diceRoll: NarrativeDiceRoll;
		};
		id: string;
		selected?: boolean;
	}

	const { data, id, selected = false }: Props = $props();
	const diceRoll = $derived(data.diceRoll);
</script>

<div
	class="h-[100px] w-[110px] rounded-md border-2 px-4 py-3 shadow-md transition-colors"
	class:border-purple-300={!selected}
	class:bg-purple-50={!selected}
	class:dark:border-purple-600={!selected}
	class:dark:bg-purple-950={!selected}
	class:border-purple-500={selected}
	class:bg-purple-100={selected}
	class:dark:border-purple-400={selected}
	class:dark:bg-purple-900={selected}
	class:ring-2={selected}
	class:ring-purple-400={selected}
	class:dark:ring-purple-500={selected}
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
