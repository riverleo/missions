<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuTrigger,
	} from '$lib/components/ui/dropdown-menu';
	import { IconArrowUp, IconArrowDown, IconTrash, IconDotsVertical } from '@tabler/icons-svelte';
	import type { BehaviorPriority } from '$lib/types';
	import {
		getNeedBehaviorPriorityLabel,
		getConditionBehaviorPriorityLabel,
	} from '$lib/utils/label';

	interface Props {
		priority: BehaviorPriority;
		isFirst: boolean;
		isLast: boolean;
		onmoveup: () => void;
		onmovedown: () => void;
		onremove: () => void;
	}

	let { priority, isFirst, isLast, onmoveup, onmovedown, onremove }: Props = $props();

	// behavior 타입 구분
	const behaviorType = $derived.by(() => {
		if (priority.need_behavior_id) return 'need';
		if (priority.condition_behavior_id) return 'condition';
		return null;
	});

	const behaviorTypeLabel = $derived.by(() => {
		const type = behaviorType;
		if (type === 'need') return '욕구';
		if (type === 'condition') return '컨디션';
		return null;
	});

	// behavior 정보 가져오기
	const behaviorLabel = $derived.by(() => {
		if (priority.need_behavior_id) {
			return getNeedBehaviorPriorityLabel(priority.need_behavior_id);
		} else if (priority.condition_behavior_id) {
			return getConditionBehaviorPriorityLabel(priority.condition_behavior_id);
		}

		return null;
	});
</script>

{#if behaviorLabel}
	<div
		class="group relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none"
	>
		<Badge variant="secondary" class="shrink-0 font-mono">
			{priority.priority}
		</Badge>
		{#if behaviorTypeLabel}
			<Badge variant="outline" class="shrink-0">
				{behaviorTypeLabel}
			</Badge>
		{/if}
		<span class="flex-1 truncate">
			{behaviorLabel}
		</span>
		<div class="ml-auto flex items-center gap-1">
			<Button variant="ghost" size="icon" class="size-6" onclick={onmoveup} disabled={isFirst}>
				<IconArrowUp class="size-4" />
			</Button>
			<Button variant="ghost" size="icon" class="size-6" onclick={onmovedown} disabled={isLast}>
				<IconArrowDown class="size-4" />
			</Button>
			<DropdownMenu>
				<DropdownMenuTrigger>
					{#snippet child({ props })}
						<Button {...props} variant="ghost" size="icon" class="size-6">
							<IconDotsVertical class="size-4" />
						</Button>
					{/snippet}
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuItem onclick={onremove}>
						<IconTrash class="mr-2 size-4" />
						제거
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	</div>
{/if}
