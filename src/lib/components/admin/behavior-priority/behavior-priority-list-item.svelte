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
	import { useNeedBehavior } from '$lib/hooks/use-need-behavior';
	import { useConditionBehavior } from '$lib/hooks/use-condition-behavior';
	import { useItemBehavior } from '$lib/hooks/use-item-behavior';
	import { useNeed } from '$lib/hooks/use-need';
	import { useItem } from '$lib/hooks/use-item';
	import { useCharacter } from '$lib/hooks/use-character';
	import { useCondition } from '$lib/hooks/use-condition';
	import type { BehaviorPriority, CharacterId } from '$lib/types';
	import { getNeedBehaviorLabel, getItemBehaviorLabel } from '$lib/utils/state-label';

	interface Props {
		priority: BehaviorPriority;
		isFirst: boolean;
		isLast: boolean;
		onmoveup: () => void;
		onmovedown: () => void;
		onremove: () => void;
	}

	let { priority, isFirst, isLast, onmoveup, onmovedown, onremove }: Props = $props();

	const { needBehaviorStore } = useNeedBehavior();
	const { conditionBehaviorStore } = useConditionBehavior();
	const { itemBehaviorStore } = useItemBehavior();
	const { needStore } = useNeed();
	const { store: itemStore } = useItem();
	const { store: characterStore } = useCharacter();
	const { conditionStore } = useCondition();

	// behavior 타입 구분
	const behaviorType = $derived.by(() => {
		if (priority.need_behavior_id) return 'need';
		if (priority.condition_behavior_id) return 'condition';
		if (priority.item_behavior_id) return 'item';
		return null;
	});

	const behaviorTypeLabel = $derived.by(() => {
		const type = behaviorType;
		if (type === 'need') return '욕구';
		if (type === 'condition') return '컨디션';
		if (type === 'item') return '아이템';
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

			return getNeedBehaviorLabel({
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

			const parts = [];
			if (character) parts.push(character.name);
			if (condition) parts.push(`${condition.name} ${behavior.condition_threshold} 이하`);

			return {
				title: behavior.name,
				description: parts.join(' · '),
			};
		} else if (priority.item_behavior_id) {
			const behavior = $itemBehaviorStore.data[priority.item_behavior_id];
			if (!behavior) return null;

			const item = behavior.item_id ? $itemStore.data[behavior.item_id] : undefined;
			const character = behavior.character_id
				? $characterStore.data[behavior.character_id as CharacterId]
				: undefined;

			return getItemBehaviorLabel({
				behavior,
				itemName: item?.name,
				characterName: character?.name,
			});
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
		<span class="truncate">
			{behaviorInfo?.title}
		</span>
		<span class="truncate text-xs text-muted-foreground">
			{behaviorInfo?.description}
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
