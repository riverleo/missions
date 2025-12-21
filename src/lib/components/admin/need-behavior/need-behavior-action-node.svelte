<script lang="ts">
	import type { NeedBehaviorAction } from '$lib/types';
	import { Handle, Position } from '@xyflow/svelte';
	import { IconMapPin, IconClock, IconMoodHappy } from '@tabler/icons-svelte';

	interface Props {
		data: {
			action: NeedBehaviorAction;
		};
		id: string;
		selected?: boolean;
	}

	const { data, id, selected = false }: Props = $props();
	const action = $derived(data.action);

	const typeLabels: Record<string, { label: string; icon: typeof IconMapPin }> = {
		go_to: { label: '이동', icon: IconMapPin },
		wait: { label: '대기', icon: IconClock },
		state: { label: '상태', icon: IconMoodHappy },
	};

	const typeInfo = $derived(typeLabels[action.type] ?? { label: action.type, icon: IconClock });
</script>

<div class="relative min-w-44 rounded-md border bg-card px-3 py-2 shadow-sm">
	<Handle
		type="target"
		position={Position.Left}
		id="target"
		style="background-color: var(--color-neutral-500)"
	/>

	<div class="flex items-center gap-2">
		{#if action.type === 'go_to'}
			<IconMapPin class="size-4 text-muted-foreground" />
		{:else if action.type === 'wait'}
			<IconClock class="size-4 text-muted-foreground" />
		{:else}
			<IconMoodHappy class="size-4 text-muted-foreground" />
		{/if}
		<div class="flex flex-col">
			<div class="text-sm font-medium">
				{typeInfo.label}
			</div>
			{#if action.type === 'wait' && action.duration_per_second > 0}
				<div class="text-xs text-muted-foreground">
					{action.duration_per_second}초
				</div>
			{:else if action.type === 'state' && action.character_state_type}
				<div class="text-xs text-muted-foreground">
					{action.character_state_type}
				</div>
			{/if}
		</div>
	</div>

	<Handle
		type="source"
		position={Position.Right}
		id="success"
		style="background-color: var(--color-green-500); top: 30%"
	/>
	<Handle
		type="source"
		position={Position.Right}
		id="failure"
		style="background-color: var(--color-red-500); top: 70%"
	/>
</div>
