<script lang="ts">
	import { useBehavior, useBuilding, useCharacter } from '$lib/hooks';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuTrigger,
	} from '$lib/components/ui/dropdown-menu';
	import { IconArrowUp, IconArrowDown, IconTrash, IconDotsVertical } from '@tabler/icons-svelte';
	import type { BehaviorPriority, CharacterId } from '$lib/types';
	import {
		getNeedBehaviorString,
		getFallbackString,
		getUnnamedWithId,
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

	const { needBehaviorStore, conditionBehaviorStore } = useBehavior();
	const { needStore } = useCharacter();
	const { characterStore } = useCharacter();
	const { conditionStore } = useBuilding();

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
	const behaviorInfo = $derived.by(() => {
		if (priority.need_behavior_id) {
			const behavior = $needBehaviorStore.data[priority.need_behavior_id];
			if (!behavior) return null;

			const need = behavior.need_id ? $needStore.data[behavior.need_id] : undefined;
			const character = behavior.character_id
				? $characterStore.data[behavior.character_id as CharacterId]
				: undefined;

			return getNeedBehaviorString({
				behavior,
				needName: need?.name,
				characterName: character?.name,
			});
		} else if (priority.condition_behavior_id) {
			const behavior = $conditionBehaviorStore.data[priority.condition_behavior_id];
			if (!behavior) return null;

			const condition = behavior.condition_id
				? $conditionStore.data[behavior.condition_id]
				: undefined;
			const character = behavior.character_id
				? $characterStore.data[behavior.character_id as CharacterId]
				: undefined;

			const name = getUnnamedWithId(behavior.id);
			const char = character?.name ?? getFallbackString('allCharacters');
			const cond = condition?.name ?? '컨디션';
			return `${behavior.name || name} - ${char} (${cond} ${behavior.condition_threshold} 이하)`;
		}

		return null;
	});
</script>

{#if behaviorInfo}
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
			{behaviorInfo}
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
