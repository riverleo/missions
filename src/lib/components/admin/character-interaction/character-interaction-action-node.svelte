<script lang="ts">
	import type { CharacterInteractionAction } from '$lib/types';
	import { Handle, Position } from '@xyflow/svelte';
	import { IconCircleDashedNumber1 } from '@tabler/icons-svelte';

	interface Props {
		data: {
			action: CharacterInteractionAction;
			parentAction?: CharacterInteractionAction;
		};
		id: string;
		selected?: boolean;
	}

	const { data, id, selected = false }: Props = $props();
	const action = $derived(data.action);

	const bodyStateLabel = $derived(() => {
		const labels: Record<string, string> = {
			idle: '대기',
			walk: '걷기',
			run: '뛰기',
			jump: '점프',
			pick: '줍기',
		};
		return labels[action.character_body_state_type] ?? action.character_body_state_type;
	});

	const faceStateLabel = $derived(() => {
		const labels: Record<string, string> = {
			idle: '기본',
			happy: '행복',
			sad: '슬픔',
			angry: '화남',
		};
		return labels[action.character_face_state_type] ?? action.character_face_state_type;
	});

	const summary = $derived(() => {
		const duration = action.duration_ticks > 0 ? `${action.duration_ticks}틱 동안 ` : '';
		const face = `"${faceStateLabel()}" 표정으로 `;
		const body = `"${bodyStateLabel()}"`;

		return `${duration}${face}${body}`;
	});
</script>

<div class="min-w-44 px-3 py-2">
	{#if !action.root}
		<Handle
			type="target"
			position={Position.Left}
			id="target"
			style="background-color: var(--color-neutral-500)"
		/>
	{/if}

	<div class="flex flex-col">
		<div class="flex items-center gap-1 text-sm font-medium">
			{#if action.root}
				<IconCircleDashedNumber1 class="size-3.5" />
			{/if}
			{summary()}
		</div>
	</div>

	<Handle type="source" position={Position.Right} id="next" />
</div>
