<script lang="ts">
	import type { NarrativeNodeChoice, BulkChanges } from '$lib/types';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { IconTrash, IconPlus, IconGripVertical } from '@tabler/icons-svelte';
	import { isEqual, sort, clone } from 'radash';
	import { dndzone } from 'svelte-dnd-action';
	import type { DndEvent } from 'svelte-dnd-action';

	interface Props {
		narrativeNodeId: string;
		narrativeNodeChoices: NarrativeNodeChoice[];
		onchange: (changes: BulkChanges<NarrativeNodeChoice>) => void;
	}

	let { narrativeNodeId, narrativeNodeChoices, onchange }: Props = $props();

	const TEMP_ID_PREFIX = 'temp-';

	let current = $state<NarrativeNodeChoice[]>(
		sort(clone(narrativeNodeChoices), (c) => c.order_in_narrative_node)
	);

	$effect(() => {
		current = sort(clone(narrativeNodeChoices), (c) => c.order_in_narrative_node);
	});

	// 변경사항 계산 및 콜백 호출
	function calculateAndNotifyChanges() {
		const originalMap = new Map(narrativeNodeChoices.map((c) => [c.id, c]));
		const currentIds = new Set(current.map((c) => c.id).filter(Boolean));

		// created: id가 임시 id인 항목들 (임시 id를 undefined로 변경)
		const created = current
			.filter((c) => c.id?.startsWith(TEMP_ID_PREFIX))
			.map((c) => ({
				...c,
				id: undefined,
			})) as Omit<NarrativeNodeChoice, 'id'>[];

		// updated: id 있고(임시 id 제외) 변경된 항목들
		const updated = current.filter((c) => {
			if (!c.id || c.id.startsWith(TEMP_ID_PREFIX)) return false;
			const original = originalMap.get(c.id);
			return original && !isEqual(c, original);
		});

		// deleted: original에는 있는데 current에 없는 id들
		const deleted = narrativeNodeChoices.filter((c) => !currentIds.has(c.id)).map((c) => c.id);

		// 부모에게 변경사항 전달 (plain object, $state 프록시 제거)
		onchange({
			origin: narrativeNodeChoices,
			current: [...current],
			created,
			updated,
			deleted,
		});
	}

	function onclickAddChoice(e: MouseEvent) {
		// id 없이 추가 = 새로 생성될 항목
		// svelte-dnd-action은 각 항목에 id가 필요하므로 임시 id 생성
		current.push({
			id: `${TEMP_ID_PREFIX}${Date.now()}-${Math.random()}`,
			narrative_node_id: narrativeNodeId,
			order_in_narrative_node: current.length,
		} as NarrativeNodeChoice);

		current = current;
		calculateAndNotifyChanges();
	}

	function onchangeChoiceTitle(index: number, newTitle: string) {
		current[index].title = newTitle;
		current = current;
		calculateAndNotifyChanges();
	}

	function onclickDeleteChoice(e: MouseEvent, index: number) {
		current.splice(index, 1);
		current = current;
		calculateAndNotifyChanges();
	}

	function handleDndConsider(e: CustomEvent<DndEvent<NarrativeNodeChoice>>) {
		current = e.detail.items;
	}

	function handleDndFinalize(e: CustomEvent<DndEvent<NarrativeNodeChoice>>) {
		// 순서 변경 시 order_in_narrative_node 업데이트
		current = e.detail.items.map((item, index) => ({
			...item,
			order_in_narrative_node: index,
		}));
		calculateAndNotifyChanges();
	}
</script>

<div class="space-y-3">
	<div class="flex items-center justify-between">
		<Label>선택지</Label>
		<Button type="button" size="sm" variant="ghost" onclick={onclickAddChoice}>
			<IconPlus class="h-4 w-4" />
		</Button>
	</div>

	<div
		class="space-y-2"
		use:dndzone={{ items: current, flipDurationMs: 200 }}
		onconsider={handleDndConsider}
		onfinalize={handleDndFinalize}
	>
		{#each current as choice, index (choice.id)}
			<div class="flex items-center gap-2">
				<button type="button" class="cursor-grab active:cursor-grabbing" aria-label="드래그">
					<IconGripVertical class="h-4 w-4 text-muted-foreground" />
				</button>
				<Input
					value={choice.title || ''}
					onchange={(e) => onchangeChoiceTitle(index, e.currentTarget.value)}
					class="flex-1"
					placeholder="선택지 이름"
				/>
				<Button
					type="button"
					size="sm"
					variant="ghost"
					onclick={(e) => onclickDeleteChoice(e, index)}
				>
					<IconTrash class="h-4 w-4 text-destructive" />
				</Button>
			</div>
		{/each}

		{#if current.length === 0}
			<p class="text-sm text-muted-foreground">선택지가 없습니다. 추가해주세요.</p>
		{/if}
	</div>
</div>
